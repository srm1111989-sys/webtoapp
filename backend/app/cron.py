import logging
import asyncio
from datetime import datetime, timezone
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.database import async_session
from app.models.build import Build
from app.services.github_service import GitHubService

logger = logging.getLogger("webtoapp.cron")

async def process_pending_build():
    try:
        async with async_session() as db:
            # Pick 1 pending build
            result = await db.execute(
                select(Build)
                .where(Build.status == "pending")
                .order_by(Build.created_at.asc())
                .limit(1)
            )
            build = result.scalar_one_or_none()
            
            if not build:
                return

            # Mark as building so another worker doesn't pick it
            build.status = "building"
            build.started_at = datetime.now(timezone.utc)
            await db.commit()
            
            # Trigger Github pipeline
            try:
                github = GitHubService(platform=build.platform, account=1)
                variables = build.variables.copy() if build.variables else {}
                variables["_build_provider"] = "github"
                
                pipeline = github.trigger_pipeline(variables)
                
                build.pipeline_id = pipeline.get("id")
                build.variables = variables
                
                logger.info(f"GitHub workflow triggered for build {build.id} (platform={build.platform}, account=1)")
                
                await db.commit()
            except Exception as e:
                logger.warning(f"Failed to trigger GitHub 1 pipeline for build {build.id}: {e}")
                
                # Fallback to GitHub 2
                try:
                    github2 = GitHubService(platform=build.platform, account=2)
                    variables = build.variables.copy() if build.variables else {}
                    variables["_build_provider"] = "github2"
                    
                    pipeline = github2.trigger_pipeline(variables)
                    
                    build.pipeline_id = pipeline.get("id")
                    build.variables = variables
                    
                    logger.info(f"GitHub workflow triggered for build {build.id} (platform={build.platform}, account=2)")
                    
                    await db.commit()
                except Exception as e2:
                    build.status = "failed"
                    build.error_message = f"Failed to trigger GitHub pipelines: 1={str(e)}, 2={str(e2)}"
                    logger.error(f"Failed to trigger all GitHub pipelines for build {build.id}")
                    await db.commit()
                
    except Exception as e:
        logger.error(f"Error in process_pending_build: {e}")

scheduler = AsyncIOScheduler()
scheduler.add_job(process_pending_build, 'interval', minutes=1)

def start_scheduler():
    scheduler.start()
    logger.info("Started cron scheduler for pending builds")
