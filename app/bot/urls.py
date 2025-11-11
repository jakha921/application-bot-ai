"""
Telegram Bot URLs
"""
from django.urls import path
from .views import TelegramWebhookView

app_name = 'bot'

urlpatterns = [
    path('webhook/', TelegramWebhookView.as_view(), name='webhook'),
]
