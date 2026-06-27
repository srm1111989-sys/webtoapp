# Doppler Setup

`webtoapp` production secrets should come from Doppler at deploy time. Do not keep live values in tracked `.env` files.

Expected server token file:

- `/root/.doppler/webtoapp-prd.token`

Expected Doppler target:

- project: `webtoapp`
- config: `prd`

`deploy.sh` downloads secrets into a temporary env file, copies them to `.env.runtime` files used by Docker Compose, and removes those runtime files on exit.
