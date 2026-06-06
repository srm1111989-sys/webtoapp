-- Migration: Update free plan descriptions from 7-day to 3-day trial
-- Run: docker exec webtoapp-db-1 psql -U webtoapp -d webtoapp -f /migrations/001_update_free_plan_trial_days.sql

UPDATE plans
SET description = 'Build up to 5 apps with watermark & 3-day trial'
WHERE slug IN ('android-free', 'desktop-free')
  AND description LIKE '%7-day trial%';
