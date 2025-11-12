from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from django.db.models import Q
from .serializers import (
    LoginSerializer, RegisterSerializer, UserSerializer,
    BotSerializer, KnowledgeBaseFileSerializer, ConversationSerializer,
    MessageSerializer, TelegramUserSerializer, TemplateSerializer
)
from .models import (
    Bot, KnowledgeBaseFile, Conversation, Message,
    TelegramUser, Template
)


class BotViewSet(viewsets.ModelViewSet):
    """ViewSet for Bot CRUD operations"""
    serializer_class = BotSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter bots by user's organization and assigned users"""
        user_profile = self.request.user.profile
        user = self.request.user
        
        # Return bots that user created OR is assigned to
        return Bot.objects.filter(
            organization=user_profile.organization
        ).filter(
            Q(created_by=user) | Q(assigned_users=user)
        ).distinct().order_by('-created_at')
    
    def perform_create(self, serializer):
        """Set organization and creator from user profile"""
        user_profile = self.request.user.profile
        serializer.save(
            organization=user_profile.organization,
            created_by=self.request.user
        )
    
    @action(
        detail=True,
        methods=['post'],
        url_path='improve-prompt'
    )
    def improve_prompt(self, request, pk=None):
        """Improve bot system prompt using AI"""
        bot = self.get_object()
        current_prompt = request.data.get('prompt', bot.system_prompt or '')
        
        if not current_prompt:
            return Response(
                {'error': 'Prompt is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user has permission to edit this bot
        if (bot.created_by != request.user and
                request.user not in bot.assigned_users.all() and
                not request.user.profile.has_permission('manage_bots')):
            return Response(
                {'error': 'You do not have permission to edit this bot'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            from django.conf import settings
            import openai
            
            # Use OpenAI to improve prompt
            openai.api_key = settings.OPENAI_API_KEY
            
            improvement_prompt = f"""You are an expert at writing system prompts for AI chatbots.
Your task is to improve the following system prompt to make it more clear, effective, and professional.

Current prompt:
{current_prompt}

Please provide an improved version that:
1. Is clear and concise
2. Sets proper context and role for the AI
3. Defines expected behavior and limitations
4. Uses professional language
5. Maintains the original intent but enhances structure

Return ONLY the improved prompt text, without any explanations or meta-commentary."""

            response = openai.chat.completions.create(
                model='gpt-4o-mini',
                messages=[
                    {'role': 'user', 'content': improvement_prompt}
                ],
                temperature=0.7,
                max_tokens=1000,
            )
            
            improved_prompt = response.choices[0].message.content.strip()
            
            return Response({
                'original_prompt': current_prompt,
                'improved_prompt': improved_prompt,
            })
            
        except Exception as e:
            return Response(
                {'error': f'Failed to improve prompt: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(
        detail=True,
        methods=['post'],
        url_path='assign-users'
    )
    def assign_users(self, request, pk=None):
        """Assign users to bot"""
        bot = self.get_object()
        user_ids = request.data.get('user_ids', [])
        
        # Check if current user is creator or admin
        if (bot.created_by != request.user and
                not request.user.profile.has_permission('manage_bots')):
            return Response(
                {'error': 'Only creator or admin can assign users'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get users from organization
        from django.contrib.auth.models import User
        users = User.objects.filter(
            id__in=user_ids,
            profile__organization=request.user.profile.organization
        )
        
        # Set assigned users
        bot.assigned_users.set(users)
        
        serializer = self.get_serializer(bot)
        return Response(serializer.data)
    
    @action(
        detail=True,
        methods=['get'],
        url_path='available-users'
    )
    def available_users(self, request, pk=None):
        """Get list of users that can be assigned to bot"""
        from django.contrib.auth.models import User
        
        users = User.objects.filter(
            profile__organization=request.user.profile.organization
        ).exclude(
            id=request.user.id  # Exclude current user
        ).values('id', 'email', 'first_name', 'last_name')
        
        return Response({
            'users': [
                {
                    'id': u['id'],
                    'email': u['email'],
                    'name': f"{u['first_name']} {u['last_name']}".strip()
                           or u['email']
                }
                for u in users
            ]
        })


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


class TemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for Template CRUD operations"""
    serializer_class = TemplateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter templates by user's organization"""
        user_profile = self.request.user.profile
        return Template.objects.filter(
            organization=user_profile.organization
        ).order_by('-created_at')
    
    def perform_create(self, serializer):
        """Set organization from user profile"""
        user_profile = self.request.user.profile
        serializer.save(organization=user_profile.organization)


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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def semantic_search_view(request):
    """Semantic search across knowledge base using RAG"""
    from core.services.embeddings_service import semantic_search
    
    query = request.data.get('query', '')
    bot_id = request.data.get('bot_id')
    top_k = int(request.data.get('top_k', 3))
    min_similarity = float(request.data.get('min_similarity', 0.7))
    
    if not query:
        return Response(
            {'error': 'Query is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not bot_id:
        return Response(
            {'error': 'bot_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Verify bot belongs to user's organization
    user_profile = request.user.profile
    try:
        Bot.objects.get(
            id=bot_id,
            organization=user_profile.organization
        )
    except Bot.DoesNotExist:
        return Response(
            {'error': 'Bot not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Perform semantic search
    results = semantic_search(
        query=query,
        bot_id=bot_id,
        top_k=top_k,
        min_similarity=min_similarity
    )
    
    return Response({
        'query': query,
        'results': results,
        'count': len(results)
    })
