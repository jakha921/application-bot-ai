from django.urls import path, include
from rest_framework.routers import DefaultRouter
from organizations.views import (
    OrganizationViewSet,
    SubscriptionViewSet,
    APIKeyViewSet
)
from core.views import login_view, register_view, logout_view, me_view

# DRF Router для ViewSets
router = DefaultRouter()
router.register(r'organizations', OrganizationViewSet, basename='organization')
router.register(r'subscriptions', SubscriptionViewSet, basename='subscription')
router.register(r'api-keys', APIKeyViewSet, basename='apikey')

urlpatterns = [
    # Auth endpoints
    path('auth/login/', login_view, name='login'),
    path('auth/register/', register_view, name='register'),
    path('auth/logout/', logout_view, name='logout'),
    path('auth/me/', me_view, name='me'),
    
    # DRF router endpoints
    path('', include(router.urls)),
]
