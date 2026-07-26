## Server ↔ Local Sync Rule

**ALWAYS sync server-side changes back to local before finishing.**

If any file is edited directly on the server (157.90.228.171) — `.env`, config files, scripts, YAML, etc. — copy it back to the local repo and commit it. Never leave server state ahead of git.

Steps:
1. `scp root@157.90.228.171:/opt/webtoapp/<file> <local-path>`
2. Commit and push to GitLab so the next `deploy.sh` (which does `git pull`) doesn't revert the change.

This applies to ALL projects on that server (webtoapp, IndexFlow, etc.).

## Deployment gate (2026-07-27)
Before ANY deploy/release, walk `D:\Projects\.ai\DEPLOYMENT-CHECKLIST.md` — port-map lookup before probing (never assume ports), UI/endpoint parity in the same commit + route-exists tests, suite green (check the pytest summary, not exit code), manual smoke of the changed flow on the live artifact, telemetry on handled errors, version/KB consistency, live verify.
