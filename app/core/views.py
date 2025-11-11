from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from .serializers import (
    LoginSerializer, RegisterSerializer, UserSerializer,
    BotSerializer, KnowledgeBaseFileSerializer, ConversationSerializer,
    MessageSerializer, TelegramUserSerializer
)
from .models import Bot, KnowledgeBaseFile, Conversation, Message, TelegramUser


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


class KnowledgeBaseFileViewSet(viewsets.ModelViewSet):
    """ViewSet for KnowledgeBaseFile CRUD operations"""
    serializer_class = KnowledgeBaseFileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter knowledge files by user's organization bots"""
        user_profile = self.request.user.profile
        return KnowledgeBaseFile.objects.filter(
            bot__organization=user_profile.organization
        ).select_related('bot').order_by('-created_at')
    
    def perform_create(self, serializer):
        """Ensure bot belongs to user's organization"""
        user_profile = self.request.user.profile
        bot = serializer.validated_data.get('bot')
        if bot.organization != user_profile.organization:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied(
                "You can only add files to bots in your organization"
            )
        serializer.save()


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
    
    total_knowledge_files = KnowledgeBaseFile.objects.filter(
        bot__organization=org
    ).count()
    
    ready_knowledge_files = KnowledgeBaseFile.objects.filter(
        bot__organization=org, status='ready'
    ).count()
    
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
    
    # Recent activity
    recent_conversations = Conversation.objects.filter(
        organization=org,
        started_at__gte=start_date
    ).count()
    
    total_messages = Message.objects.filter(
        conversation__organization=org
    ).count()
    
    return Response({
        'overview': {
            'total_bots': total_bots,
            'active_bots': active_bots,
            'total_knowledge_files': total_knowledge_files,
            'ready_knowledge_files': ready_knowledge_files,
            'total_users': total_users,
            'active_users': active_users,
            'total_conversations': total_conversations,
            'completed_conversations': completed_conversations,
            'total_messages': total_messages,
        },
        'recent_activity': {
            'conversations_last_7_days': recent_conversations,
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
