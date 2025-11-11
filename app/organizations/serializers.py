from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Organization, Subscription, APIKey

User = get_user_model()


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = [
            'id', 'name', 'slug', 'plan', 'created_at', 'updated_at',
            'bots_count', 'documents_count', 'monthly_documents_count',
            'stripe_customer_id', 'stripe_subscription_id'
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']


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
    key = serializers.CharField(read_only=True)
    
    class Meta:
        model = APIKey
        fields = ['id', 'name', 'key', 'is_active', 'created_at', 'last_used_at']
        read_only_fields = ['id', 'key', 'created_at', 'last_used_at']
