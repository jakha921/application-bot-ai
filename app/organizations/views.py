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
    
    def create(self, request, *args, **kwargs):
        """Создание нового API ключа с возвратом raw_key"""
        org_id = request.headers.get('X-Organization-ID')
        if not org_id:
            return Response(
                {'error': 'Organization ID required'},
                status=400
            )
        
        try:
            org = Organization.objects.get(id=org_id)
        except Organization.DoesNotExist:
            return Response(
                {'error': 'Organization not found'},
                status=404
            )
        
        # Создаем API ключ
        api_key, raw_key = APIKey.generate_key(
            organization=org,
            name=request.data.get('name'),
            permissions=request.data.get('permissions', {})
        )
        
        # Сериализуем с raw_key
        serializer = self.get_serializer(api_key)
        serializer._raw_key = raw_key
        
        return Response(serializer.data, status=201)
