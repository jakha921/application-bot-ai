from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from core.models import TelegramUser


class TelegramUserSerializer(serializers.ModelSerializer):
    """Сериализатор для Telegram пользователя"""
    
    class Meta:
        model = TelegramUser
        fields = [
            'id', 'telegram_id', 'username', 'first_name',
            'last_name', 'language_code', 'is_active',
            'organization', 'role', 'created_at'
        ]
        read_only_fields = ['id', 'telegram_id', 'created_at']


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

