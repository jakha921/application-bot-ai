from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from core.models import (
    TelegramUser, Conversation, Message, Bot, KnowledgeBaseFile
)


class BotSerializer(serializers.ModelSerializer):
    """Serializer for Bot model"""
    created_by_email = serializers.EmailField(
        source='created_by.email',
        read_only=True
    )
    created_by_name = serializers.SerializerMethodField()
    assigned_user_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=User.objects.all(),
        source='assigned_users',
        required=False
    )
    assigned_users_list = serializers.SerializerMethodField()
    
    class Meta:
        model = Bot
        fields = [
            'id', 'name', 'description', 'telegram_token',
            'system_prompt', 'bot_type', 'is_active',
            'created_by', 'created_by_email', 'created_by_name',
            'assigned_user_ids', 'assigned_users_list',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'created_by', 'created_by_email', 'created_by_name',
            'assigned_users_list', 'created_at', 'updated_at'
        ]
    
    def get_created_by_name(self, obj):
        """Get creator's full name"""
        if obj.created_by:
            full_name = (
                f"{obj.created_by.first_name} "
                f"{obj.created_by.last_name}"
            ).strip()
            return full_name or obj.created_by.email
        return None
    
    def get_assigned_users_list(self, obj):
        """Get list of assigned users with details"""
        return [
            {
                'id': user.id,
                'email': user.email,
                'name': f"{user.first_name} {user.last_name}".strip() or user.email
            }
            for user in obj.assigned_users.all()
        ]
    
    def create(self, validated_data):
        """Set created_by to current user"""
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            validated_data['created_by'] = request.user
        return super().create(validated_data)
    
    def validate_telegram_token(self, value):
        """Validate Telegram token format"""
        import re
        pattern = r'^\d+:[A-Za-z0-9_-]+$'
        if not re.match(pattern, value):
            raise serializers.ValidationError(
                "Invalid Telegram token format. "
                "Must be like: 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
            )
        return value


class KnowledgeBaseFileSerializer(serializers.ModelSerializer):
    """Serializer for KnowledgeBaseFile model"""
    bot_name = serializers.CharField(source='bot.name', read_only=True)
    
    class Meta:
        model = KnowledgeBaseFile
        fields = [
            'id', 'bot', 'bot_name', 'name', 'file',
            'content', 'file_type', 'status', 'file_size',
            'processing_error', 'created_at', 'updated_at',
            'processed_at'
        ]
        read_only_fields = [
            'id', 'bot_name', 'file_size', 'processing_error',
            'status', 'created_at', 'updated_at', 'processed_at'
        ]
    
    def validate(self, attrs):
        """Validate that either file or content is provided"""
        file_type = attrs.get('file_type')
        file = attrs.get('file')
        content = attrs.get('content')
        
        if file_type in ['pdf', 'docx'] and not file:
            raise serializers.ValidationError(
                "File is required for PDF/DOCX file types"
            )
        
        if file_type == 'text' and not content:
            raise serializers.ValidationError(
                "Content is required for text file type"
            )
        
        return attrs
    
    def create(self, validated_data):
        """Create knowledge file and trigger async processing"""
        from core.services.document_processor import process_knowledge_file
        
        # Create the instance
        instance = super().create(validated_data)
        
        # Process all file types to extract text and generate embeddings
        if instance.file_type == 'text':
            # Text files don't need extraction, but need embeddings
            instance.status = 'ready'
            instance.save()
            # Trigger processing for embeddings generation
            try:
                process_knowledge_file(instance)
            except Exception:
                # Error already logged and saved by process_knowledge_file
                pass
        elif instance.file_type in ['pdf', 'docx']:
            # Set status to processing
            instance.status = 'processing'
            instance.save()
            
            # Process file synchronously (can be async with Celery later)
            try:
                process_knowledge_file(instance)
            except Exception:
                # Error already logged and saved by process_knowledge_file
                pass
        
        return instance


class ConversationSerializer(serializers.ModelSerializer):
    """Serializer for Conversation model"""
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    
    class Meta:
        model = Conversation
        fields = [
            'id', 'user', 'user_name', 'status',
            'started_at', 'completed_at'
        ]
        read_only_fields = ['id', 'user_name', 'started_at', 'completed_at']


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for Message model"""
    
    class Meta:
        model = Message
        fields = [
            'id', 'conversation', 'role', 'message_type',
            'content', 'voice_file_id', 'transcription', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class TelegramUserSerializer(serializers.ModelSerializer):
    """Сериализатор для Telegram пользователя"""
    full_name = serializers.CharField(read_only=True)
    
    class Meta:
        model = TelegramUser
        fields = [
            'id', 'telegram_id', 'username', 'first_name',
            'last_name', 'full_name', 'language_code', 'is_active',
            'is_blocked', 'role', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'telegram_id', 'full_name',
            'created_at', 'updated_at'
        ]


class UserSerializer(serializers.ModelSerializer):
    """Сериализатор для Django User"""
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']


class LoginSerializer(serializers.Serializer):
    """Сериализатор для логина"""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        user = authenticate(
            username=data.get('email'),
            password=data.get('password')
        )
        if not user:
            raise serializers.ValidationError("Invalid credentials")
        
        data['user'] = user
        return data


class RegisterSerializer(serializers.Serializer):
    """Сериализатор для регистрации"""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150, required=False)
    organization_name = serializers.CharField(max_length=255)
    
    def validate_email(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("User with this email exists")
        return value
    
    def create(self, validated_data):
        from organizations.models import Organization
        from core.models import UserProfile
        
        # Создаем организацию
        org_name = validated_data.pop('organization_name')
        org = Organization.objects.create(name=org_name)
        
        # Создаем пользователя Django
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data.get('last_name', ''),
        )
        
        # Создаем профиль пользователя
        UserProfile.objects.create(
            user=user,
            organization=org,
            role='owner'
        )
        
        return user

