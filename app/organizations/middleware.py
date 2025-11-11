"""
Multi-tenant middleware
Adds organization context to all requests
"""
from django.utils.functional import SimpleLazyObject
from .models import Organization


def get_organization_from_request(request):
    """
    Extract organization from request
    Priority: Header > Subdomain > User's default org
    """
    # 1. Check X-Organization-ID header (for API calls)
    org_id = request.headers.get('X-Organization-ID')
    if org_id:
        try:
            return Organization.objects.get(id=org_id)
        except Organization.DoesNotExist:
            pass
    
    # 2. Check subdomain (e.g., company.saas.com)
    host = request.get_host().split(':')[0]
    parts = host.split('.')
    if len(parts) > 2:  # Has subdomain
        subdomain = parts[0]
        if subdomain not in ['www', 'api', 'admin']:
            try:
                return Organization.objects.get(slug=subdomain)
            except Organization.DoesNotExist:
                pass
    
    # 3. Get from authenticated user's current organization
    if hasattr(request, 'user') and request.user.is_authenticated:
        if hasattr(request.user, 'current_organization'):
            return request.user.current_organization
        
        # Get user's first organization
        if hasattr(request.user, 'telegram_user'):
            return request.user.telegram_user.organization
    
    return None


class TenantMiddleware:
    """
    Middleware to add organization context to requests
    Enables multi-tenant data isolation
    """
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Add organization to request
        request.organization = SimpleLazyObject(
            lambda: get_organization_from_request(request)
        )
        
        response = self.get_response(request)
        return response


class TenantQuerySetMixin:
    """
    Mixin for models to automatically filter by organization
    Usage:
        class MyModel(TenantQuerySetMixin, models.Model):
            organization = models.ForeignKey(Organization, ...)
    """
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Get organization from thread-local or request context
        organization = getattr(self.request, 'organization', None)
        
        if organization and hasattr(self.model, 'organization'):
            queryset = queryset.filter(organization=organization)
        
        return queryset
