"""
Django management command to set Telegram webhook
"""
from django.core.management.base import BaseCommand
from django.conf import settings
import asyncio

from bot.bot import bot


class Command(BaseCommand):
    help = 'Set Telegram webhook'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--url',
            type=str,
            help='Webhook URL (default from settings.TELEGRAM_WEBHOOK_URL)'
        )
    
    def handle(self, *args, **options):
        """Set webhook"""
        webhook_url = options['url'] or settings.TELEGRAM_WEBHOOK_URL
        
        if not webhook_url:
            self.stdout.write(
                self.style.ERROR(
                    '❌ Webhook URL not provided. '
                    'Set TELEGRAM_WEBHOOK_URL in .env or use --url'
                )
            )
            return
        
        asyncio.run(self.set_webhook(webhook_url))
    
    async def set_webhook(self, url):
        """Set webhook"""
        try:
            await bot.set_webhook(url)
            
            webhook_info = await bot.get_webhook_info()
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'✅ Webhook set successfully!\n'
                    f'URL: {webhook_info.url}\n'
                    f'Pending updates: {webhook_info.pending_update_count}'
                )
            )
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Error: {e}'))
        
        finally:
            await bot.session.close()
