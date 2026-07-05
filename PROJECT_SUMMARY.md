# WebToApp

## Purpose
A SaaS platform that converts websites into native Android APKs and desktop applications, with user authentication (Google OAuth), subscription plans, payment processing (Stripe + Razorpay), and async build pipelines via Celery.

## Tech Stack
- Language: Python 3 (backend), TypeScript (frontend)
- Framework: FastAPI (backend), React 19 + Vite (frontend)
- Database: PostgreSQL 16, Redis 7 (caching + task queue)
- Build System: Docker Compose, Vite, Makefile
- Key Libraries: SQLAlchemy (async), Alembic (migrations), Celery (task queue), Stripe, Razorpay, Firebase Admin, boto3 (S3), React Query, Zustand, Tailwind CSS 4, Playwright (E2E)

## Important Files
| File | Purpose |
|------|---------|
| `docker-compose.yml` | Multi-service orchestration for local/dev use |
| `deploy.sh` | Production deployment script that syncs git, installs native deps, and restarts systemd services |
| `backend/app/main.py` | FastAPI application entry point |
| `backend/app/routers/` | API routes (auth, builds, orders, payments, plans, subscriptions, users, blog, seo) |
| `backend/app/tasks/` | Celery async tasks (APK/desktop builds) |
| `backend/app/config.py` | Application configuration |
| `backend/app/database.py` | Database connection and session management |
| `backend/requirements.txt` | Python dependencies |
| `frontend/package.json` | Frontend dependencies and scripts |
| `payment-proxy/` | Vercel-hosted Razorpay payment proxy |
| `Makefile` | Build and deployment shortcuts |

## Architecture Overview
FastAPI backend with async PostgreSQL access via SQLAlchemy. Celery workers are used for long-running APK/desktop build jobs. The React frontend communicates via Axios/React Query. Google OAuth handles authentication. Payments are processed through both Stripe and Razorpay (with a Vercel-based payment proxy for CORS). Nginx reverse-proxies the locally served frontend and backend. Blog and SEO content is also served.

## E2E / Integration Test Cases
| Test | Location | Status |
|------|----------|--------|
| Desktop Build E2E | `frontend/e2e/tests/desktop-build.spec.ts` | Playwright |
| Subscription Flow | `frontend/e2e/tests/subscription.spec.ts` | Playwright |
| Production E2E | `frontend/e2e/tests/production-e2e.spec.ts` | Playwright |
| Full E2E with APK | `frontend/e2e/tests/full-e2e-with-apk.spec.ts` | Playwright |
| Backend Unit Tests | `backend/tests/` | pytest |

## Deployment Steps
1. Run `./deploy.sh` which:
   - Fetches the latest `main` branch on the server and hard-resets the working tree to git
   - Downloads Doppler secrets into `backend/.env.native` and runtime env files
   - Refreshes the backend virtualenv and runs Alembic migrations
   - Rebuilds the frontend static bundle
   - Restarts `webtoapp-backend` and `webtoapp-frontend` systemd services
2. Frontend: http://157.90.228.171:3000
3. Backend API: http://157.90.228.171:8000
4. API Docs: http://157.90.228.171:8000/docs

## Current Version
- Version: 1.0.0
