from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Organization, Subscription, APIKey
from .serializers import (
    OrganizationSerializer,
    SubscriptionSerializer,
    APIKeySerializer
)


class OrganizationViewSet(viewsets.ModelViewSet):
    """ViewSet для управления организациями"""
    serializer_class = OrganizationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Возвращает только организации текущего пользователя"""
        return Organization.objects.filter(
            user_profiles__user=self.request.user
        ).distinct()
    
    @action(detail=True, methods=['post'])
    def switch(self, request, pk=None):
        """Переключение активной организации"""
        org = self.get_object()
        # Сохраняем ID организации в сессии/токене
        return Response({
            'id': org.id,
            'name': org.name,
            'plan': org.plan
        })
    
    @action(detail=True, methods=['get'])
    def usage(self, request, pk=None):
        """Получение статистики использования"""
        org = self.get_object()
        return Response({
            'bots_count': org.bots_count,
            'documents_count': org.documents_count,
            'monthly_documents_count': org.monthly_documents_count,
            'bots_limit': org.get_bots_limit(),
            'monthly_documents_limit': org.get_monthly_documents_limit()
        })


class SubscriptionViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet для просмотра подписок"""
    serializer_class = SubscriptionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Возвращает подписки организаций пользователя"""
        return Subscription.objects.filter(
            organization__user_profiles__user=self.request.user
        ).distinct()


class APIKeyViewSet(viewsets.ModelViewSet):
    """ViewSet для управления API ключами"""
    serializer_class = APIKeySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Возвращает ключи текущей организации"""
        org_id = self.request.headers.get('X-Organization-ID')
        if org_id:
            return APIKey.objects.filter(organization_id=org_id)
        return APIKey.objects.none()
    
    def perform_create(self, serializer):
        """Создание нового API ключа"""
        org_id = self.request.headers.get('X-Organization-ID')
        if not org_id:
            raise ValueError("Organization ID required")
        
        org = Organization.objects.get(id=org_id)
        key = APIKey.generate_key()
        serializer.save(organization=org, key=key)
