import logging
import httpx
from app.config import get_settings
from app.utils.storage import upload_file

settings = get_settings()
logger = logging.getLogger("webtoapp.github")


class GitHubService:
    """GitHub Actions fallback for when GitLab CI quota is exceeded."""

    def __init__(self, platform: str = "android", account: int = 1):
        if account == 2:
            self.token = settings.github_token_2
            self.repo = settings.github_repo_2
        else:
            self.token = settings.github_token
            self.repo = settings.github_repo  # e.g. "pallavimokashi94-sys/webtoapp"
            
        self.platform = platform
        if platform == "desktop":
            self.workflow_file = "build-desktop.yml"
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

    _ALLOWED_INPUTS_DESKTOP = {
        "APP_NAME", "APP_URL", "ORDER_ID", "PRIMARY_COLOR", "WINDOW_WIDTH",
        "WINDOW_HEIGHT", "MIN_WIDTH", "MIN_HEIGHT", "SHOW_TITLE_BAR",
        "SHOW_MENU_BAR", "ENABLE_SYSTEM_TRAY", "_build_provider", "START_MAXIMIZED",
        "START_FULLSCREEN", "ICON_URL", "SHOW_WATERMARK"
    }

    def trigger_pipeline(self, variables: dict) -> dict:
        """Trigger a GitHub Actions workflow dispatch with variables as inputs."""
        allowed_keys = self._ALLOWED_INPUTS_DESKTOP if self.platform == "desktop" else self._ALLOWED_INPUTS_ANDROID
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
        """Return True if this GitHub account has Actions minutes remaining."""
        try:
            username = self.repo.split("/")[0]
            with httpx.Client(timeout=10) as client:
                r = client.get(
                    f"https://api.github.com/users/{username}/settings/billing/actions",
                    headers=self.headers,
                )
            if r.status_code == 404:
                # Org accounts use a different endpoint — assume available
                return True
            if r.status_code != 200:
                logger.warning(f"GitHub quota check for '{username}' returned {r.status_code}, assuming available")
                return True
            data = r.json()
            used     = data.get("total_minutes_used", 0)
            included = data.get("included_minutes", 0)
            if included > 0 and used >= included:
                logger.info(f"GitHub quota exhausted for '{username}': {used}/{included} minutes used")
                return False
            logger.info(f"GitHub quota OK for '{username}': {used}/{included} minutes used")
            return True
        except Exception as e:
            logger.warning(f"GitHub quota check failed ({e}), assuming available")
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
                    # Download artifact zip
                    dl_response = await client.get(
                        artifact["archive_download_url"],
                        headers=self.headers,
                        follow_redirects=True,
                    )
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
