"""
Telegram Bot initialization and configuration
"""
from aiogram import Bot, Dispatcher
from aiogram.fsm.storage.redis import RedisStorage
from django.conf import settings
import redis.asyncio as redis
import logging

logger = logging.getLogger(__name__)

# Initialize bot
bot = Bot(token=settings.TELEGRAM_BOT_TOKEN)

# Initialize Redis storage for FSM
redis_client = redis.Redis(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    db=settings.REDIS_DB
)
storage = RedisStorage(redis_client)

# Initialize dispatcher
dp = Dispatcher(storage=storage)

logger.info("Bot and dispatcher initialized")
