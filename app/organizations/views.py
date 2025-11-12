from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Organization, Subscription, APIKey
from core.models import OrganizationInvite, UserProfile
from .serializers import (
    OrganizationSerializer,
    SubscriptionSerializer,
    APIKeySerializer
)
from .services.email_service import send_invitation_email


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
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Получение текущей организации пользователя"""
        org = Organization.objects.filter(
            user_profiles__user=request.user
        ).first()
        
        if not org:
            return Response(
                {'error': 'No organization found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(org)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def members(self, request):
        """Получение списка участников организации"""
        org = Organization.objects.filter(
            user_profiles__user=request.user
        ).first()
        
        if not org:
            return Response(
                {'error': 'No organization found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        members = org.user_profiles.select_related('user').all()
        data = [
            {
                'id': profile.id,
                'user': {
                    'id': profile.user.id,
                    'email': profile.user.email,
                    'username': profile.user.username,
                    'full_name': profile.user.get_full_name(),
                },
                'role': profile.role,
            }
            for profile in members
        ]
        
        return Response({'results': data})
    
    @action(detail=False, methods=['patch'], url_path='members/(?P<user_id>[^/.]+)')
    def update_member_role(self, request, user_id=None):
        """Обновление роли участника"""
        org = Organization.objects.filter(
            user_profiles__user=request.user,
            user_profiles__role__in=['owner', 'admin']
        ).first()
        
        if not org:
            return Response(
                {'error': 'Permission denied or no organization found'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            profile = UserProfile.objects.get(
                user_id=user_id,
                organization=org
            )
        except UserProfile.DoesNotExist:
            return Response(
                {'error': 'User not found in organization'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Нельзя изменить роль владельца
        if profile.role == 'owner':
            return Response(
                {'error': 'Cannot change owner role'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        new_role = request.data.get('role')
        if not new_role or new_role not in ['admin', 'member']:
            return Response(
                {'error': 'Valid role is required (admin or member)'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        profile.role = new_role
        profile.save()
        
        return Response({
            'id': profile.id,
            'user_id': profile.user.id,
            'role': profile.role,
        })
    
    @action(detail=False, methods=['delete'], url_path='members/(?P<user_id>[^/.]+)')
    def remove_member(self, request, user_id=None):
        """Удаление участника из организации"""
        org = Organization.objects.filter(
            user_profiles__user=request.user,
            user_profiles__role__in=['owner', 'admin']
        ).first()
        
        if not org:
            return Response(
                {'error': 'Permission denied or no organization found'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            profile = UserProfile.objects.get(
                user_id=user_id,
                organization=org
            )
        except UserProfile.DoesNotExist:
            return Response(
                {'error': 'User not found in organization'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Нельзя удалить владельца
        if profile.role == 'owner':
            return Response(
                {'error': 'Cannot remove owner'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        profile.delete()
        
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=False, methods=['post'])
    def invite(self, request):
        """Отправка приглашения в организацию"""
        org = Organization.objects.filter(
            user_profiles__user=request.user,
            user_profiles__role__in=['owner', 'admin']
        ).first()
        
        if not org:
            return Response(
                {'error': 'Permission denied or no organization found'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        email = request.data.get('email')
        role = request.data.get('role', 'member')
        
        if not email:
            return Response(
                {'error': 'Email is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Проверка, не состоит ли пользователь уже в организации
        existing_member = org.user_profiles.filter(
            user__email=email
        ).exists()
        
        if existing_member:
            return Response(
                {'error': 'User is already a member of this organization'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Создание приглашения
        invite = OrganizationInvite.objects.create(
            organization=org,
            email=email,
            role=role
        )
        
        # Отправка email
        try:
            send_invitation_email(invite)
        except Exception as e:
            return Response(
                {'error': f'Failed to send email: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        return Response({
            'id': invite.id,
            'email': invite.email,
            'role': invite.role,
            'expires_at': invite.expires_at,
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def invites(self, request):
        """Получение списка приглашений"""
        org = Organization.objects.filter(
            user_profiles__user=request.user
        ).first()
        
        if not org:
            return Response(
                {'error': 'No organization found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        invites = OrganizationInvite.objects.filter(
            organization=org
        ).order_by('-created_at')
        
        data = [
            {
                'id': invite.id,
                'email': invite.email,
                'role': invite.role,
                'is_accepted': invite.is_accepted,
                'expires_at': invite.expires_at,
            }
            for invite in invites
        ]
        
        return Response({'results': data})
    
    @action(
        detail=False,
        methods=['delete'],
        url_path='invites/(?P<invite_id>[^/.]+)'
    )
    def cancel_invite(self, request, invite_id=None):
        """Отмена приглашения"""
        org = Organization.objects.filter(
            user_profiles__user=request.user,
            user_profiles__role__in=['owner', 'admin']
        ).first()
        
        if not org:
            return Response(
                {'error': 'Permission denied or no organization found'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            invite = OrganizationInvite.objects.get(
                id=invite_id,
                organization=org
            )
        except OrganizationInvite.DoesNotExist:
            return Response(
                {'error': 'Invite not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        invite.delete()
        
        return Response(status=status.HTTP_204_NO_CONTENT)


class OrganizationInviteViewSet(viewsets.ViewSet):
    """ViewSet для управления приглашениями"""
    
    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def verify(self, request, pk=None):
        """Проверка действительности приглашения"""
        try:
            invite = OrganizationInvite.objects.get(token=pk)
            
            if invite.is_accepted:
                return Response({
                    'is_valid': False,
                    'message': 'Приглашение уже было принято'
                })
            
            if not invite.is_valid():
                return Response({
                    'is_valid': False,
                    'message': 'Срок действия приглашения истек'
                })
            
            return Response({
                'is_valid': True,
                'organization_name': invite.organization.name,
                'role': invite.role,
                'expires_at': invite.expires_at,
            })
            
        except OrganizationInvite.DoesNotExist:
            return Response({
                'is_valid': False,
                'message': 'Приглашение не найдено'
            }, status=404)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def accept(self, request, pk=None):
        """Принятие приглашения"""
        try:
            invite = OrganizationInvite.objects.get(token=pk)
            
            if invite.is_accepted:
                return Response({
                    'error': 'Приглашение уже было принято'
                }, status=400)
            
            if not invite.is_valid():
                return Response({
                    'error': 'Срок действия приглашения истек'
                }, status=400)
            
            # Проверка, что email пользователя совпадает
            if request.user.email != invite.email:
                return Response({
                    'error': 'Это приглашение предназначено для другого email'
                }, status=403)
            
            # Проверка, не состоит ли пользователь уже в организации
            existing_profile = UserProfile.objects.filter(
                user=request.user,
                organization=invite.organization
            ).exists()
            
            if existing_profile:
                return Response({
                    'error': 'Вы уже являетесь участником этой организации'
                }, status=400)
            
            # Создание профиля пользователя в организации
            UserProfile.objects.create(
                user=request.user,
                organization=invite.organization,
                role=invite.role
            )
            
            # Отметка приглашения как принятого
            invite.is_accepted = True
            invite.save()
            
            return Response({
                'message': 'Приглашение успешно принято',
                'organization': {
                    'id': invite.organization.id,
                    'name': invite.organization.name,
                },
                'role': invite.role,
            })
            
        except OrganizationInvite.DoesNotExist:
            return Response({
                'error': 'Приглашение не найдено'
            }, status=404)


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
