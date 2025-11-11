"""
Django management command to run Telegram bot in polling mode
"""
from django.core.management.base import BaseCommand
from django.conf import settings
import asyncio
import logging

from bot.bot import bot, dp
from bot.handlers import router

logger = logging.getLogger('bot')


class Command(BaseCommand):
    help = 'Run Telegram bot in polling mode'
    
    def handle(self, *args, **options):
        """Run bot"""
        self.stdout.write(self.style.SUCCESS('Starting Telegram bot...'))
        
        # Register handlers
        dp.include_router(router)
        
        # Run bot
        asyncio.run(self.run_bot())
    
    async def run_bot(self):
        """Main bot loop"""
        try:
            # Delete webhook if set
            await bot.delete_webhook(drop_pending_updates=True)
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'✅ Bot started in polling mode\n'
                    f'Bot username: {(await bot.me()).username}'
                )
            )
            
            # Start polling
            await dp.start_polling(bot)
            
        except Exception as e:
            logger.error(f"Bot error: {e}", exc_info=True)
            self.stdout.write(self.style.ERROR(f'❌ Error: {e}'))
        
        finally:
            await bot.session.close()
