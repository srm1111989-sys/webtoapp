import uuid
import logging
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.push_campaign import PushCampaign
from app.config import get_settings

settings = get_settings()
logger = logging.getLogger("webtoapp.push")


def get_firebase_app():
    """Initialize Firebase Admin SDK."""
    if not settings.firebase_credentials_json:
        return None

    import json
    import firebase_admin
    from firebase_admin import credentials

    if not firebase_admin._apps:
        cred_dict = json.loads(settings.firebase_credentials_json)
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred)

    return firebase_admin.get_app()


async def send_push_notification(campaign_id: uuid.UUID, db: AsyncSession) -> PushCampaign:
    """Send a push notification campaign via FCM."""
    result = await db.execute(select(PushCampaign).where(PushCampaign.id == campaign_id))
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise ValueError(f"Campaign {campaign_id} not found")

    app = get_firebase_app()
    if not app:
        campaign.status = "failed"
        campaign.sent_count = 0
        return campaign

    from firebase_admin import messaging

    notification = messaging.Notification(
        title=campaign.title,
        body=campaign.body,
        image=campaign.image_url,
    )

    data = campaign.data or {}
    sent = 0
    failed = 0

    try:
        if campaign.target_type == "all":
            message = messaging.Message(
                notification=notification,
                data={k: str(v) for k, v in data.items()},
                topic="all",
            )
            messaging.send(message)
            sent = 1

        elif campaign.target_type == "topic":
            message = messaging.Message(
                notification=notification,
                data={k: str(v) for k, v in data.items()},
                topic=campaign.target_value,
            )
            messaging.send(message)
            sent = 1

        elif campaign.target_type == "token":
            message = messaging.Message(
                notification=notification,
                data={k: str(v) for k, v in data.items()},
                token=campaign.target_value,
            )
            messaging.send(message)
            sent = 1

        campaign.status = "sent"
    except Exception as e:
        logger.error(f"Push notification failed for campaign {campaign_id}: {e}")
        campaign.status = "failed"
        failed = 1

    campaign.sent_count = sent
    campaign.failed_count = failed
    campaign.sent_at = datetime.now(timezone.utc)

    return campaign
