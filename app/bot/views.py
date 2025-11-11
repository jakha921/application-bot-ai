"""
Django views for Telegram webhook
"""
from django.http import JsonResponse
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from aiogram.types import Update
import json
import logging

from .bot import dp, bot

logger = logging.getLogger('bot')


@method_decorator(csrf_exempt, name='dispatch')
class TelegramWebhookView(View):
    """Handle Telegram webhook updates"""
    
    async def post(self, request):
        """Process incoming webhook update"""
        try:
            # Parse update
            update_data = json.loads(request.body.decode('utf-8'))
            update = Update(**update_data)
            
            # Process update
            await dp.feed_update(bot, update)
            
            return JsonResponse({'ok': True})
            
        except Exception as e:
            logger.error(f"Webhook error: {e}", exc_info=True)
            return JsonResponse({'ok': False, 'error': str(e)}, status=500)
