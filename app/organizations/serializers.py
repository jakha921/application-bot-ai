from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Organization, Subscription, APIKey

User = get_user_model()


class OrganizationSerializer(serializers.ModelSerializer):
    # Вычисляемые поля
    bots_count = serializers.SerializerMethodField()
    documents_count = serializers.SerializerMethodField()
    monthly_documents_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Organization
        fields = [
            'id', 'name', 'slug', 'plan', 'created_at', 'updated_at',
            'bots_count', 'documents_count', 'monthly_documents_count',
            'stripe_customer_id', 'stripe_subscription_id'
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']
    
    def get_bots_count(self, obj):
        """Возвращает количество ботов"""
        return getattr(obj, 'bots_count', 0)
    
    def get_documents_count(self, obj):
        """Возвращает общее количество документов"""
        return getattr(obj, 'documents_count', 0)
    
    def get_monthly_documents_count(self, obj):
        """Возвращает количество документов за месяц"""
        return getattr(obj, 'monthly_documents_count', 0)


class SubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscription
        fields = [
            'id', 'organization', 'plan', 'stripe_subscription_id',
            'status', 'current_period_start', 'current_period_end',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class APIKeySerializer(serializers.ModelSerializer):
    key = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = APIKey
        fields = [
            'id', 'name', 'prefix', 'key', 'permissions',
            'is_active', 'created_at', 'last_used_at'
        ]
        read_only_fields = ['id', 'prefix', 'created_at', 'last_used_at']
    
    def get_key(self, obj):
        """Показываем полный ключ только при создании"""
        if hasattr(self, '_raw_key'):
            return self._raw_key
        return f"{obj.prefix}***"  # Скрываем ключ после создания
