from django.urls import path, include
from rest_framework.routers import DefaultRouter
from organizations.views import (
    OrganizationViewSet,
    SubscriptionViewSet,
    APIKeyViewSet
)
from core.views import (
    login_view, register_view, logout_view, me_view, analytics_view,
    BotViewSet, TemplateViewSet, ConversationViewSet,
    MessageViewSet, DocumentViewSet, TelegramUserViewSet
)

# DRF Router для ViewSets
router = DefaultRouter()
router.register(r'organizations', OrganizationViewSet, basename='organization')
router.register(r'subscriptions', SubscriptionViewSet, basename='subscription')
router.register(r'api-keys', APIKeyViewSet, basename='apikey')

# Core ViewSets
router.register(r'bots', BotViewSet, basename='bot')
router.register(r'templates', TemplateViewSet, basename='template')
router.register(r'conversations', ConversationViewSet, basename='conversation')
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'documents', DocumentViewSet, basename='document')
router.register(r'users', TelegramUserViewSet, basename='user')

urlpatterns = [
    # Auth endpoints
    path('auth/login/', login_view, name='login'),
    path('auth/register/', register_view, name='register'),
    path('auth/logout/', logout_view, name='logout'),
    path('auth/me/', me_view, name='me'),
    
    # Analytics endpoint
    path('analytics/', analytics_view, name='analytics'),
    
    # DRF router endpoints
    path('', include(router.urls)),
]
