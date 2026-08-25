import logging
import httpx
from app.config import get_settings
from app.utils.storage import upload_file

settings = get_settings()
logger = logging.getLogger("webtoapp.github")


class GitHubService:
    """GitHub Actions build provider. Quota detection handles personal PAT 403/410 responses."""

    def __init__(self, platform: str = "android", account: int = 1):
        if account == 4:
            self.token = (settings.github_token_4 or "").strip()
            self.repo = (settings.github_repo_4 or "").strip()
        elif account == 3:
            self.token = (settings.github_token_3 or "").strip()
            self.repo = (settings.github_repo_3 or "").strip()
        elif account == 2:
            self.token = (settings.github_token_2 or "").strip()
            self.repo = (settings.github_repo_2 or "").strip()
        else:
            self.token = (settings.github_token or "").strip()
            self.repo = (settings.github_repo or "").strip()  # e.g. "pallavimokashi94-sys/webtoapp"
            
        self.platform = platform
        if platform == "desktop":
            self.workflow_file = "build-desktop.yml"
        elif platform == "ios":
            self.workflow_file = "build-ios.yml"
        else:
            self.workflow_file = "build-android.yml"
        self.headers = {
            "Authorization": f"token {self.token}",
            "Accept": "application/vnd.github.v3+json",
        }

    def _api_url(self, path: str) -> str:
        return f"https://api.github.com/repos/{self.repo}{path}"

    _ALLOWED_INPUTS_ANDROID = {
        "APP_NAME", "APP_URL", "APP_HOST", "PRIMARY_COLOR", "SECONDARY_COLOR",
        "STATUS_BAR_COLOR", "PACKAGE_NAME", "ORDER_ID", "ICON_URL", "SPLASH_URL",
        "FEATURES_JSON", "NAVIGATION_ITEMS", "FIREBASE_ENABLED", "_build_provider",
        "FIREBASE_CONFIG", "ADMOB_ENABLED", "ADMOB_CONFIG", "TRIAL_DAYS",
        "PURCHASE_URL", "BUILD_AAB",
        "CUSTOM_KEYSTORE_URL", "CUSTOM_KEYSTORE_PASSWORD", "CUSTOM_KEYSTORE_ALIAS", "CUSTOM_KEYSTORE_PRIVATE_PASSWORD",
        "VERSION_CODE"
    }

    _ALLOWED_INPUTS_IOS = {
        "APP_NAME", "APP_URL", "APP_HOST", "PACKAGE_NAME", "ORDER_ID",
        "PRIMARY_COLOR", "STATUS_BAR_COLOR", "ICON_URL", "FEATURES_JSON",
        "VERSION_CODE", "_build_provider",
    }

    _ALLOWED_INPUTS_DESKTOP = {
        "APP_NAME", "APP_URL", "ORDER_ID", "PRIMARY_COLOR", "WINDOW_WIDTH",
        "WINDOW_HEIGHT", "MIN_WIDTH", "MIN_HEIGHT", "SHOW_TITLE_BAR",
        "SHOW_MENU_BAR", "ENABLE_SYSTEM_TRAY", "_build_provider", "START_MAXIMIZED",
        "START_FULLSCREEN", "ICON_URL", "SHOW_WATERMARK"
    }

    def trigger_pipeline(self, variables: dict) -> dict:
        """Trigger a GitHub Actions workflow dispatch with variables as inputs."""
        if self.platform == "desktop":
            allowed_keys = self._ALLOWED_INPUTS_DESKTOP
        elif self.platform == "ios":
            allowed_keys = self._ALLOWED_INPUTS_IOS
        else:
            allowed_keys = self._ALLOWED_INPUTS_ANDROID
        filtered_inputs = {k: str(v) for k, v in variables.items() if k in allowed_keys}

        with httpx.Client(timeout=30) as client:
            response = client.post(
                self._api_url(f"/actions/workflows/{self.workflow_file}/dispatches"),
                headers=self.headers,
                json={
                    "ref": "main",
                    "inputs": filtered_inputs,
                },
            )
            response.raise_for_status()
            logger.info(f"GitHub workflow triggered: {self.workflow_file}")

            # GitHub doesn't return run ID immediately, need to poll
            # Get the latest run for this workflow
            import time
            time.sleep(3)
            runs = client.get(
                self._api_url(f"/actions/workflows/{self.workflow_file}/runs?per_page=1"),
                headers=self.headers,
            )
            runs.raise_for_status()
            run_data = runs.json().get("workflow_runs", [{}])[0]
            return {"id": run_data.get("id"), "status": "running", "web_url": run_data.get("html_url", "")}

    def get_pipeline(self, run_id: int) -> dict:
        """Get workflow run status."""
        with httpx.Client(timeout=30) as client:
            response = client.get(
                self._api_url(f"/actions/runs/{run_id}"),
                headers=self.headers,
            )
            response.raise_for_status()
            data = response.json()
            # Map GitHub status to our internal status
            status_map = {
                "queued": "pending",
                "in_progress": "running",
                "completed": "success" if data.get("conclusion") == "success" else "failed",
            }
            return {
                "id": data["id"],
                "status": status_map.get(data["status"], data["status"]),
                "conclusion": data.get("conclusion"),
            }

    def get_pipeline_jobs(self, run_id: int) -> list:
        """Get jobs for a workflow run."""
        with httpx.Client(timeout=30) as client:
            response = client.get(
                self._api_url(f"/actions/runs/{run_id}/jobs"),
                headers=self.headers,
            )
            response.raise_for_status()
            return response.json().get("jobs", [])

    def has_quota(self) -> bool:
        """Return True if this GitHub account can run AND finish a build.

        Checks two independent quotas:
        1. Actions minutes (billing API).
        2. Artifact STORAGE — 2026-07-18 incident: builds compiled fine but
           died at Upload with "Artifact storage quota has been hit", and the
           dispatcher never cascaded because triggering had succeeded. A
           storage-full account is effectively out of quota.
        """
        try:
            username = self.repo.split("/")[0]
            with httpx.Client(timeout=10) as client:
                r = client.get(
                    f"https://api.github.com/users/{username}/settings/billing/actions",
                    headers=self.headers,
                )
            if r.status_code == 200:
                data = r.json()
                used     = data.get("total_minutes_used", 0)
                included = data.get("included_minutes", 0)
                if included > 0 and used >= included:
                    logger.info(f"GitHub quota exhausted for '{username}': {used}/{included} minutes used")
                    return False
                logger.info(f"GitHub quota OK for '{username}': {used}/{included} minutes used")
            elif r.status_code in (403, 410):
                # 403 = personal PAT can't access billing; 410 = endpoint moved
                # (GitHub sunset the direct billing endpoint for personal accounts).
                # Detect quota exhaustion indirectly from workflow run history.
                logger.info(f"GitHub billing API {r.status_code} for '{username}' — using indirect detection")
                return self._has_quota_indirect(username)
            elif r.status_code == 404:
                # Org account — org billing endpoint differs; fall through to
                # artifact-storage check.
                logger.info(f"GitHub billing API 404 for '{username}' — org account, falling through")
            else:
                logger.warning(f"GitHub quota check for '{username}' returned {r.status_code}, assuming minutes available")
        except Exception as e:
            logger.warning(f"GitHub minutes check failed ({e}), assuming available")

        # Artifact storage: free tier allows ~500MB; GitHub keeps serving the
        # stale "quota hit" flag for 6-12h after cleanup, so use a conservative
        # threshold to route builds to the other account meanwhile.
        try:
            with httpx.Client(timeout=10) as client:
                r = client.get(
                    self._api_url("/actions/artifacts?per_page=100"),
                    headers=self.headers,
                )
            if r.status_code == 200:
                d = r.json()
                mb = sum(a.get("size_in_bytes", 0) for a in d.get("artifacts", [])) / 1e6
                if mb >= 400:
                    logger.info(f"GitHub artifact storage near quota for '{self.repo}': {mb:.0f}MB — treating as no quota")
                    return False
            elif r.status_code in (403, 404):
                # Can't list artifacts — likely Actions not available on this
                # account/repo combination.
                logger.info(f"GitHub artifacts endpoint {r.status_code} for '{self.repo}' — Actions may be unavailable")
                return False
        except Exception as e:
            logger.warning(f"GitHub artifact storage check failed ({e}), assuming available")

        return True

    def _has_quota_indirect(self, username: str) -> bool:
        """For personal accounts where the billing API returns 403, detect
        quota exhaustion by listing recent workflow runs. If the last few
        runs all completed with 0 steps (runner never allocated), the
        account has exhausted its Actions minutes."""
        try:
            with httpx.Client(timeout=10) as client:
                r = client.get(
                    f"https://api.github.com/repos/{self.repo}/actions/runs?per_page=5",
                    headers=self.headers,
                )
            if r.status_code != 200:
                logger.info(f"GitHub workflow_runs returned {r.status_code} — assuming no quota")
                return False
            runs = r.json().get("workflow_runs", [])
            if not runs:
                logger.info(f"No workflow runs found for '{self.repo}' — assuming no quota")
                return False

            # Check the most recent completed runs.
            # If any of the recent completed runs succeeded, the account clearly has quota!
            completed_runs = [run for run in runs if run.get("status") == "completed"]
            if completed_runs:
                if any(run.get("conclusion") == "success" for run in completed_runs[:3]):
                    logger.info(f"GitHub account '{username}' ({self.repo}) has recent successful run — quota available")
                    return True
                
                # If the latest completed run failed, check if it was a 0-step pre-execution failure
                latest = completed_runs[0]
                latest_run_id = latest.get("id")
                if latest_run_id and latest.get("conclusion") == "failure":
                    try:
                        jr = client.get(
                            f"https://api.github.com/repos/{self.repo}/actions/runs/{latest_run_id}/jobs?per_page=1",
                            headers=self.headers,
                        )
                        if jr.status_code == 200:
                            jobs = jr.json().get("jobs", [])
                            if jobs and len(jobs[0].get("steps", [])) == 0:
                                logger.warning(
                                    f"GitHub account '{username}' ({self.repo}) latest run {latest_run_id} failed with 0 steps — out of quota"
                                )
                                return False
                    except Exception:
                        pass

            # Fallback: check if any recent run actually executed steps (not empty)
            has_real_run = False
            for run in runs:
                run_id = run.get("id")
                if not run_id:
                    continue
                try:
                    jr = client.get(
                        f"https://api.github.com/repos/{self.repo}/actions/runs/{run_id}/jobs?per_page=1",
                        headers=self.headers,
                    )
                    if jr.status_code == 200:
                        jobs = jr.json().get("jobs", [])
                        if jobs and len(jobs[0].get("steps", [])) > 0:
                            has_real_run = True
                            break
                except Exception:
                    pass

            if not has_real_run:
                logger.warning(
                    f"GitHub account '{username}' has no recent runs with steps — "
                    f"likely out of Actions minutes (all {len(runs)} recent runs empty)"
                )
                return False

            logger.info(f"GitHub account '{username}' has recent runs with steps — assuming quota available")
            return True
        except Exception as e:
            logger.warning(f"GitHub indirect quota check failed ({e}), assuming available")
            return True

    def get_job_log(self, job_id: int) -> str:
        """Get logs for a specific job."""
        with httpx.Client(timeout=30) as client:
            response = client.get(
                self._api_url(f"/actions/jobs/{job_id}/logs"),
                headers=self.headers,
                follow_redirects=True,
            )
            response.raise_for_status()
            return response.text

    async def download_artifact(self, run_id: int, artifact_name: str, dest_dir: str) -> str:
        """Download artifact from a workflow run."""
        async with httpx.AsyncClient(timeout=60) as client:
            # List artifacts
            response = await client.get(
                self._api_url(f"/actions/runs/{run_id}/artifacts"),
                headers=self.headers,
            )
            response.raise_for_status()
            artifacts = response.json().get("artifacts", [])

            for artifact in artifacts:
                if artifact_name in artifact["name"]:
                    # Get redirect URL without forwarding Authorization header to Azure Blob Storage
                    init_res = await client.get(
                        artifact["archive_download_url"],
                        headers=self.headers,
                        follow_redirects=False,
                    )
                    redirect_url = init_res.headers.get("location")
                    if redirect_url:
                        dl_response = await client.get(redirect_url, follow_redirects=True)
                    else:
                        dl_response = init_res
                    dl_response.raise_for_status()

                    # Save and extract
                    import tempfile
                    import zipfile
                    import os
                    with tempfile.NamedTemporaryFile(suffix=".zip", delete=False) as f:
                        f.write(dl_response.content)
                        zip_path = f.name

                    os.makedirs(dest_dir, exist_ok=True)
                    with zipfile.ZipFile(zip_path) as zf:
                        zf.extractall(dest_dir)
                    os.unlink(zip_path)

                    # Find the extracted file and upload it
                    for root, dirs, files in os.walk(dest_dir):
                        for file in files:
                            filepath = os.path.join(root, file)
                            with open(filepath, "rb") as fh:
                                file_bytes = fh.read()
                            ext = file.rsplit(".", 1)[-1] if "." in file else "bin"
                            content_type = "application/vnd.android.package-archive" if ext == "apk" else "application/octet-stream"
                            url = await upload_file(file_bytes, dest_dir, file, content_type)
                            os.unlink(filepath)
                            return url

            logger.warning(f"Artifact '{artifact_name}' not found in run {run_id}")
            return ""

    async def delete_run_artifacts(self, run_id: int) -> int:
        """Delete all of a run's artifacts from GitHub to free the account's
        ~500 MB artifact storage. MUST be called only AFTER the artifacts are
        downloaded to our server, so builds never fail at Upload on a full acct."""
        deleted = 0
        try:
            async with httpx.AsyncClient(timeout=60) as client:
                r = await client.get(self._api_url(f"/actions/runs/{run_id}/artifacts"), headers=self.headers)
                r.raise_for_status()
                for a in r.json().get("artifacts", []):
                    try:
                        d = await client.delete(self._api_url(f"/actions/artifacts/{a['id']}"), headers=self.headers)
                        if d.status_code in (200, 204):
                            deleted += 1
                    except Exception:
                        pass
        except Exception as e:
            logger.warning(f"Could not list/delete artifacts for run {run_id} on {self.repo}: {e}")
        if deleted:
            logger.info(f"Deleted {deleted} GitHub artifact(s) for run {run_id} on {self.repo} (freed storage)")
        return deleted

    async def cleanup_old_artifacts(self) -> int:
        """Free artifact storage by deleting the oldest ~50% of artifacts when
        the account is near quota. This keeps the ~500 MB budget alive so new
        builds can upload their APK/AAB without hitting the quota cap.

        Returns the number of artifacts deleted (0 if storage was fine)."""
        ARTIFACT_LIMIT_MB = 400   # warn threshold (free tier ~500 MB)
        TARGET_FREE_MB = 250      # aim to leave this much free after cleanup
        MAX_PAGES = 10            # cap API pages to avoid runaway loops

        total_mb = 0
        artifacts = []
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                page = 1
                while page <= MAX_PAGES:
                    r = await client.get(
                        self._api_url(f"/actions/artifacts?per_page=100&page={page}"),
                        headers=self.headers,
                    )
                    if r.status_code != 200:
                        break
                    page_artifacts = r.json().get("artifacts", [])
                    if not page_artifacts:
                        break
                    for a in page_artifacts:
                        total_mb += a.get("size_in_bytes", 0) / 1e6
                        artifacts.append(a)
                    if len(page_artifacts) < 100:
                        break
                    page += 1
        except Exception as e:
            logger.warning(f"Artifact storage check failed for {self.repo}: {e}")
            return 0

        if total_mb < ARTIFACT_LIMIT_MB:
            logger.debug(f"Artifact storage OK for {self.repo}: {total_mb:.0f} MB / ~500 MB")
            return 0

        logger.warning(
            f"Artifact storage HIGH for {self.repo}: {total_mb:.0f} MB used — "
            f"deleting oldest artifacts to free ~{TARGET_FREE_MB} MB"
        )

        # Sort oldest first, delete enough to get under target
        artifacts.sort(key=lambda a: a.get("created_at", ""))
        to_delete = max(1, len(artifacts) // 2)  # delete oldest 50 %
        deleted = 0
        try:
            async with httpx.AsyncClient(timeout=60) as client:
                for a in artifacts[:to_delete]:
                    try:
                        d = await client.delete(
                            self._api_url(f"/actions/artifacts/{a['id']}"),
                            headers=self.headers,
                        )
                        if d.status_code in (200, 204):
                            total_mb -= a.get("size_in_bytes", 0) / 1e6
                            deleted += 1
                        if total_mb < ARTIFACT_LIMIT_MB - TARGET_FREE_MB:
                            break
                    except Exception:
                        pass
        except Exception as e:
            logger.error(f"Artifact cleanup failed for {self.repo}: {e}")

        logger.info(
            f"Artifact cleanup for {self.repo}: deleted {deleted} artifacts, "
            f"~{total_mb:.0f} MB remaining"
        )
        return deleted
