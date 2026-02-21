import logging
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
            self.project_id = settings.gitlab_desktop_project_id or settings.gitlab_project_id
        else:
            self.project_id = settings.gitlab_android_project_id or settings.gitlab_project_id
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
        """Download artifact from a pipeline job and upload to storage."""
        jobs = self.get_pipeline_jobs(pipeline_id)
        # Use just the filename for storage
        filename = artifact_path.rsplit("/", 1)[-1]

        for job in jobs:
            if job.get("artifacts_file"):
                try:
                    url = self._api_url(f"/jobs/{job['id']}/artifacts/{artifact_path}")
                    logger.info(f"Trying artifact download: job={job['id']} ({job.get('name')}), path={artifact_path}")
                    with httpx.Client(timeout=120) as client:
                        response = client.get(url, headers=self.headers)
                        if response.status_code == 200:
                            logger.info(f"Downloaded {artifact_path} ({len(response.content)} bytes) from job {job['id']}")
                            stored_url = await upload_file(
                                response.content, folder, filename, "application/octet-stream"
                            )
                            return stored_url
                        else:
                            logger.info(f"Artifact {artifact_path} not found in job {job['id']}: HTTP {response.status_code}")
                except Exception as e:
                    logger.warning(f"Failed to download {artifact_path} from job {job['id']}: {e}")

        logger.warning(f"Artifact {artifact_path} not found in any job for pipeline {pipeline_id}")
        return None

    def cancel_pipeline(self, pipeline_id: int) -> dict:
        """Cancel a running pipeline."""
        with httpx.Client(timeout=30) as client:
            response = client.post(
                self._api_url(f"/pipelines/{pipeline_id}/cancel"),
                headers=self.headers,
            )
            response.raise_for_status()
            return response.json()
