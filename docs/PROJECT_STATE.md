# Project State & Architecture Map

This file contains durable operational knowledge for Claude, Codex, and Gemini. Use this to quickly recover context across sessions.

## 1. Production Access & Server
* **Server IP:** `157.90.228.171`
* **SSH User:** `root`
* **Application Path on Server:** `/opt/webtoapp`
* **Server Config Doc:** `D:\Projects\.ai\SERVER_CONFIG.md`

## 2. Deployment Workflow
* **Deployment Scripts:** `deploy.sh` (and `deploy-blog.sh` for blog).
* **Deployment Gate:** `D:\Projects\.ai\DEPLOYMENT-CHECKLIST.md` MUST be walked before any deploy.
* **Sync Rule:** Server changes must always be scp'd back to local and pushed to GitLab before finishing a task.

## 3. Integrations & Configurations
* **Email / SMTP:** We use Zoho Mail (`support@websitetoapp.app`). 
  * See `SMTP-CONFIGURATION-SUMMARY.md` for exact settings.
  * *Do not ask the user for email credentials. Our Zoho configuration is already fully set up and documented.*
* **Build Pipelines & Background Tasks:** See `D:\Projects\.ai\WEBTOAPP-BUILD-PIPELINES.md`.
* **Google OAuth / Firebase:** See `D:\Projects\ALI_GOOGLE_SIGNIN_INVESTIGATION.md` or recent implementation docs for the Native Google Sign-In Architecture (using AndroidX Credential Manager).
* **Environment Variables:** Handled via `.env` files on the production server (e.g., `/opt/webtoapp/backend/.env`). See `DOPPLER.md` for secret management.

## 4. Current Architectural Decisions
* Native Android authentication bypasses WebView OAuth hacks in favor of `CredentialManager` and `GoogleIdTokenCredential`.
* The server uses a Postgres DB (e.g., `webtoapp-db-1` Docker container).
* The web layer uses Next.js; backend uses Python (FastAPI/SQLAlchemy).

## 5. Important Directories & Files
* `D:\Projects\.ai\`: Contains deep context, session logs, task lists, and architectural decision records. Check this folder when you need historical context on a specific feature.
* `android-template/`: Contains the base Android source code for generated apps.
* `backend/`: FastAPI backend code.
* `frontend/`: Next.js web application.

*Note: Absence of a specific file in this summary does not mean it doesn't exist. Search the repository before concluding a configuration is missing.*
