# Claude Operating Rules & Project Context

## Core Rule: Persistent Memory
**This is an EXISTING production project.**
Absence of information from your current conversation context **DOES NOT** mean absence from the project.
This repository serves as your persistent external memory.

Before asking the user for information (e.g., credentials, server details, how things are deployed, previous tasks), you MUST:
1. Search the repository (`CLAUDE.md`, `.md` docs, `D:\Projects\.ai\`, config files).
2. Determine if the access method or configuration is already established.
3. If conversation compaction has occurred, reconstruct what was done from repository state, git diff/status, generated files, logs, and scripts. Do not deny that a task happened or restart from zero.

## Context Recovery & Search-Before-Question
"Can I discover this by searching the repo?" -> **If yes, search first.**
Only ask the user when the required information truly cannot be inferred or retrieved from the repository or production server.

## Project State & Routing
For durable operational knowledge, integrations, deployment workflows, and credentials locations, read:
-> docs/PROJECT_STATE.md

## Server <-> Local Sync Rule
**ALWAYS sync server-side changes back to local before finishing.**
If any file is edited directly on the server (157.90.228.171) — `.env`, config files, scripts, YAML, etc. — copy it back to the local repo and commit it. Never leave server state ahead of git.

Steps:
1. `scp root@157.90.228.171:/opt/webtoapp/<file> <local-path>`
2. Commit and push to GitLab so the next `deploy.sh` (which does `git pull`) doesn't revert the change.

This applies to ALL projects on that server (webtoapp, IndexFlow, etc.).

## Deployment gate (2026-07-27)
Before ANY deploy/release, walk `D:\Projects\.ai\DEPLOYMENT-CHECKLIST.md` — port-map lookup before probing (never assume ports), UI/endpoint parity in the same commit + route-exists tests, suite green (check the pytest summary, not exit code), manual smoke of the changed flow on the live artifact, telemetry on handled errors, version/KB consistency, live verify.
