from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from .serializers import (
    LoginSerializer, RegisterSerializer, UserSerializer,
    BotSerializer, TemplateSerializer, ConversationSerializer,
    MessageSerializer, DocumentSerializer, TelegramUserSerializer
)
from .models import Bot, Template, Conversation, Message, Document, TelegramUser


class BotViewSet(viewsets.ModelViewSet):
    """ViewSet for Bot CRUD operations"""
    serializer_class = BotSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter bots by user's organization"""
        user_profile = self.request.user.profile
        return Bot.objects.filter(
            organization=user_profile.organization
        ).order_by('-created_at')
    
    def perform_create(self, serializer):
        """Set organization from user profile"""
        user_profile = self.request.user.profile
        serializer.save(organization=user_profile.organization)


class TemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for Template CRUD operations"""
    serializer_class = TemplateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter templates by user's organization or public"""
        user_profile = self.request.user.profile
        return Template.objects.filter(
            organization=user_profile.organization
        ) | Template.objects.filter(is_public=True)
    
    def perform_create(self, serializer):
        """Set organization from user profile"""
        user_profile = self.request.user.profile
        serializer.save(organization=user_profile.organization)


class ConversationViewSet(viewsets.ModelViewSet):
    """ViewSet for Conversation CRUD operations"""
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter conversations by user's organization"""
        user_profile = self.request.user.profile
        queryset = Conversation.objects.filter(
            organization=user_profile.organization
        ).select_related('user').order_by('-started_at')
        
        # Filter by bot_id if provided
        bot_id = self.request.query_params.get('bot_id')
        if bot_id:
            queryset = queryset.filter(user__bot_id=bot_id)
        
        return queryset


class MessageViewSet(viewsets.ModelViewSet):
    """ViewSet for Message CRUD operations"""
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter messages by conversation"""
        conversation_id = self.request.query_params.get('conversation_id')
        queryset = Message.objects.all().order_by('created_at')
        
        if conversation_id:
            queryset = queryset.filter(conversation_id=conversation_id)
        
        return queryset


class DocumentViewSet(viewsets.ModelViewSet):
    """ViewSet for Document CRUD operations"""
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter documents by user's organization"""
        user_profile = self.request.user.profile
        queryset = Document.objects.filter(
            organization=user_profile.organization
        ).select_related('conversation').order_by('-created_at')
        
        # Filter by bot_id if provided
        bot_id = self.request.query_params.get('bot_id')
        if bot_id:
            queryset = queryset.filter(
                conversation__user__bot_id=bot_id
            )
        
        return queryset
    
    def perform_create(self, serializer):
        """Set organization from user profile"""
        user_profile = self.request.user.profile
        serializer.save(organization=user_profile.organization)


class TelegramUserViewSet(viewsets.ModelViewSet):
    """ViewSet for TelegramUser CRUD operations"""
    serializer_class = TelegramUserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter users by organization"""
        user_profile = self.request.user.profile
        return TelegramUser.objects.filter(
            organization=user_profile.organization
        ).order_by('-created_at')


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_view(request):
    """Get analytics data for dashboard"""
    from datetime import timedelta
    from django.utils import timezone
    
    user_profile = request.user.profile
    org = user_profile.organization
    
    # Get date range from query params
    days = int(request.GET.get('days', 7))
    start_date = timezone.now() - timedelta(days=days)
    
    # Get counts
    total_bots = Bot.objects.filter(organization=org).count()
    active_bots = Bot.objects.filter(
        organization=org, is_active=True
    ).count()
    
    total_templates = Template.objects.filter(organization=org).count()
    
    total_users = TelegramUser.objects.filter(organization=org).count()
    active_users = TelegramUser.objects.filter(
        organization=org, is_active=True
    ).count()
    
    total_conversations = Conversation.objects.filter(
        organization=org
    ).count()
    
    completed_conversations = Conversation.objects.filter(
        organization=org,
        status='completed'
    ).count()
    
    total_documents = Document.objects.filter(organization=org).count()
    
    # Recent activity
    recent_conversations = Conversation.objects.filter(
        organization=org,
        started_at__gte=start_date
    ).count()
    
    recent_documents = Document.objects.filter(
        organization=org,
        created_at__gte=start_date
    ).count()
    
    return Response({
        'overview': {
            'total_bots': total_bots,
            'active_bots': active_bots,
            'total_templates': total_templates,
            'total_users': total_users,
            'active_users': active_users,
            'total_conversations': total_conversations,
            'completed_conversations': completed_conversations,
            'total_documents': total_documents,
        },
        'recent_activity': {
            'conversations_last_7_days': recent_conversations,
            'documents_last_7_days': recent_documents,
        },
        'date_range': {
            'start_date': start_date.isoformat(),
            'end_date': timezone.now().isoformat(),
            'days': days,
        }
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Эндпоинт для логина"""
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    user = serializer.validated_data['user']
    token, created = Token.objects.get_or_create(user=user)
    
    return Response({
        'token': token.key,
        'user': UserSerializer(user).data
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """Эндпоинт для регистрации"""
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    user = serializer.save()
    token, created = Token.objects.get_or_create(user=user)
    
    return Response({
        'token': token.key,
        'user': UserSerializer(user).data
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """Эндпоинт для логаута"""
    request.user.auth_token.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    """Получение данных текущего пользователя"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)
