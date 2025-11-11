from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from core.models import (
    TelegramUser, Conversation, Message, Document, Bot, Template
)


class BotSerializer(serializers.ModelSerializer):
    """Serializer for Bot model"""
    
    class Meta:
        model = Bot
        fields = [
            'id', 'name', 'description', 'telegram_token',
            'is_active', 'total_conversations', 'total_documents',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'total_conversations', 'total_documents',
            'created_at', 'updated_at'
        ]
    
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


class TemplateSerializer(serializers.ModelSerializer):
    """Serializer for Template model"""
    
    class Meta:
        model = Template
        fields = [
            'id', 'name', 'description', 'content',
            'category', 'is_public', 'usage_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'usage_count', 'created_at', 'updated_at']
    
    def validate_content(self, value):
        """Validate content length"""
        if len(value) < 10:
            raise serializers.ValidationError(
                "Content must be at least 10 characters"
            )
        if len(value) > 10000:
            raise serializers.ValidationError(
                "Content must not exceed 10000 characters"
            )
        return value


class ConversationSerializer(serializers.ModelSerializer):
    """Serializer for Conversation model"""
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    
    class Meta:
        model = Conversation
        fields = [
            'id', 'user', 'user_name', 'status',
            'document_type', 'is_document_ready',
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


class DocumentSerializer(serializers.ModelSerializer):
    """Serializer for Document model"""
    conversation_id = serializers.IntegerField(source='conversation.id', read_only=True)
    
    class Meta:
        model = Document
        fields = [
            'id', 'conversation', 'conversation_id',
            'filename', 'file', 'document_text', 'created_at'
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

