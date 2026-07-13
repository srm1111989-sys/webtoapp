import fnmatch
import io
import logging
import zipfile
import httpx
from app.config import get_settings
from app.utils.storage import upload_file

settings = get_settings()
logger = logging.getLogger("webtoapp.gitlab")


class GitLabService:
    def __init__(self, platform: str = "android"):
        self.base_url = settings.gitlab_url
        self.token = settings.gitlab_token
        if platform == "desktop":
            self.project_id = settings.gitlab_desktop_project_id.strip() or settings.gitlab_project_id.strip()
        else:
            self.project_id = settings.gitlab_android_project_id.strip() or settings.gitlab_project_id.strip()
        if not self.project_id:
            raise ValueError(f"GitLab project ID not configured for platform '{platform}'. Set GITLAB_{'DESKTOP' if platform == 'desktop' else 'ANDROID'}_PROJECT_ID or GITLAB_PROJECT_ID in .env")
        self.headers = {"PRIVATE-TOKEN": self.token}

    def _api_url(self, path: str) -> str:
        return f"{self.base_url}/api/v4/projects/{self.project_id}{path}"

    def trigger_pipeline(self, variables: dict) -> dict:
        """Trigger a new pipeline with variables."""
        pipeline_vars = [
            {"key": k, "value": str(v), "variable_type": "env_var"}
            for k, v in variables.items()
        ]

        with httpx.Client(timeout=30) as client:
            response = client.post(
                self._api_url("/pipeline"),
                headers=self.headers,
                json={"ref": "main", "variables": pipeline_vars},
            )
            response.raise_for_status()
            data = response.json()
            logger.info(f"Pipeline triggered: {data.get('id')}")
            return data

    def get_pipeline(self, pipeline_id: int) -> dict:
        """Get pipeline status."""
        with httpx.Client(timeout=30) as client:
            response = client.get(
                self._api_url(f"/pipelines/{pipeline_id}"),
                headers=self.headers,
            )
            response.raise_for_status()
            return response.json()

    def get_pipeline_jobs(self, pipeline_id: int) -> list:
        """Get jobs for a pipeline."""
        with httpx.Client(timeout=30) as client:
            response = client.get(
                self._api_url(f"/pipelines/{pipeline_id}/jobs"),
                headers=self.headers,
            )
            response.raise_for_status()
            return response.json()

    def get_job_log(self, job_id: int) -> str:
        """Get job log output."""
        with httpx.Client(timeout=30) as client:
            response = client.get(
                self._api_url(f"/jobs/{job_id}/trace"),
                headers=self.headers,
            )
            response.raise_for_status()
            return response.text

    async def download_artifact(self, pipeline_id: int, artifact_path: str, folder: str) -> str | None:
        """Download artifact from a pipeline job and upload to storage.

        Supports two modes:
          - literal path: 'app/build/outputs/apk/release/app-release.apk' — direct fetch
          - glob path:    'dist/*.exe' — downloads full job artifacts.zip and extracts first match
        """
        jobs = self.get_pipeline_jobs(pipeline_id)
        is_glob = any(c in artifact_path for c in "*?[")
        filename = artifact_path.rsplit("/", 1)[-1]

        for job in jobs:
            if not job.get("artifacts_file"):
                continue
            try:
                if is_glob:
                    # Download full artifacts.zip, extract files matching the glob
                    zip_url = self._api_url(f"/jobs/{job['id']}/artifacts")
                    logger.info(f"Downloading job artifacts.zip: job={job['id']} ({job.get('name')}) for glob {artifact_path}")
                    with httpx.Client(timeout=300) as client:
                        response = client.get(zip_url, headers=self.headers)
                    if response.status_code != 200:
                        logger.info(f"Job {job['id']} artifacts unavailable: HTTP {response.status_code}")
                        continue
                    try:
                        zf = zipfile.ZipFile(io.BytesIO(response.content))
                    except zipfile.BadZipFile:
                        logger.warning(f"Job {job['id']} artifacts.zip is not a valid zip")
                        continue
                    matches = [n for n in zf.namelist() if fnmatch.fnmatch(n, artifact_path) or fnmatch.fnmatch(n.split("/")[-1], artifact_path.split("/")[-1])]
                    if not matches:
                        logger.info(f"No files match {artifact_path} in job {job['id']} ({len(zf.namelist())} entries)")
                        continue
                    matched = matches[0]
                    data = zf.read(matched)
                    out_filename = matched.rsplit("/", 1)[-1]
                    logger.info(f"Extracted {matched} ({len(data)} bytes) from job {job['id']}")
                    return await upload_file(data, folder, out_filename, "application/octet-stream")

                # Literal path
                url = self._api_url(f"/jobs/{job['id']}/artifacts/{artifact_path}")
                logger.info(f"Trying artifact download: job={job['id']} ({job.get('name')}), path={artifact_path}")
                with httpx.Client(timeout=120) as client:
                    response = client.get(url, headers=self.headers)
                    if response.status_code == 200:
                        logger.info(f"Downloaded {artifact_path} ({len(response.content)} bytes) from job {job['id']}")
                        return await upload_file(
                            response.content, folder, filename, "application/octet-stream"
                        )
                    else:
                        logger.info(f"Artifact {artifact_path} not found in job {job['id']}: HTTP {response.status_code}")
            except Exception as e:
                logger.warning(f"Failed to download {artifact_path} from job {job['id']}: {e}")

        logger.warning(f"Artifact {artifact_path} not found in any job for pipeline {pipeline_id}")
        return None

    def has_quota(self) -> bool:
        """Return True if this GitLab namespace has shared-runner compute minutes remaining."""
        try:
            # Get the namespace path from the project
            with httpx.Client(timeout=10) as client:
                proj = client.get(self._api_url(""), headers=self.headers)
                proj.raise_for_status()
                ns_path = proj.json().get("namespace", {}).get("path", "")
            if not ns_path:
                return True
            with httpx.Client(timeout=10) as client:
                r = client.get(f"{self.base_url}/api/v4/namespaces/{ns_path}", headers=self.headers)
                r.raise_for_status()
                data = r.json()
            limit = (data.get("shared_runners_minutes_limit") or 0) + (data.get("extra_shared_runners_minutes_limit") or 0)
            used  = data.get("minutes_last_year") or 0
            if limit > 0:
                if used >= limit:
                    logger.info(f"GitLab quota exhausted: {used}/{limit} minutes used for namespace '{ns_path}'")
                    return False
                logger.info(f"GitLab quota OK: {used}/{limit} minutes used for namespace '{ns_path}'")
                return True

            # If limit is 0/None (common for personal namespaces on GitLab.com REST API),
            # check the latest pipeline to see if it failed due to exhausted quota in the current month.
            logger.info(f"GitLab namespace limit is {limit}. Falling back to checking recent pipeline statuses.")
            # Quota is namespace-wide; a single project's latest pipeline can be a
            # stale success while the namespace is actually exhausted. Check the
            # last few failed pipelines this month for ci_quota_exceeded.
            with httpx.Client(timeout=10) as client:
                pr = client.get(self._api_url("/pipelines?per_page=5&status=failed"), headers=self.headers)
                pr.raise_for_status()
                pipelines = pr.json()

            from datetime import datetime, timezone
            now_utc = datetime.now(timezone.utc)
            for p in pipelines:
                created_at_str = p.get("created_at")
                if not created_at_str:
                    continue
                created_dt = datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))
                if created_dt.year != now_utc.year or created_dt.month != now_utc.month:
                    continue
                if self.pipeline_quota_exceeded(p["id"]):
                    logger.info(f"GitLab quota exhausted: pipeline {p['id']} failed with ci_quota_exceeded")
                    return False

            logger.info(f"GitLab quota OK: No recent failed pipelines with ci_quota_exceeded in current month")
            return True
        except Exception as e:
            logger.warning(f"GitLab quota check failed ({e}), assuming available")
            return True

    def pipeline_quota_exceeded(self, pipeline_id: int) -> bool:
        """True if any job in this pipeline failed with ci_quota_exceeded."""
        try:
            with httpx.Client(timeout=10) as client:
                jr = client.get(self._api_url(f"/pipelines/{pipeline_id}/jobs"), headers=self.headers)
                jr.raise_for_status()
                return any(j.get("failure_reason") == "ci_quota_exceeded" for j in jr.json())
        except Exception:
            return False

    def cancel_pipeline(self, pipeline_id: int) -> dict:
        """Cancel a running pipeline."""
        with httpx.Client(timeout=30) as client:
            response = client.post(
                self._api_url(f"/pipelines/{pipeline_id}/cancel"),
                headers=self.headers,
            )
            response.raise_for_status()
            return response.json()
