# Doppler Setup

`webtoapp` production secrets should come from Doppler at deploy time. Do not keep live values in tracked `.env` files.

Expected server token file:

- `/root/.doppler/webtoapp-prd.token`

Expected Doppler target:

- project: `webtoapp`
- config: `prd`

`deploy.sh` downloads secrets into a temporary env file, copies them to `.env.runtime` and `backend/.env.native`, then restarts the native systemd services.

Gemini should be configured with `GEMINI_API_KEY` in Doppler. `GOOGLE_SERVICE_ACCOUNT_JSON` remains a fallback for older deployments, but the code now prefers the API key first.
