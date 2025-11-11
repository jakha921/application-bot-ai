from django.urls import path
from .views import login_view, register_view, logout_view, me_view

urlpatterns = [
    path('auth/login/', login_view, name='login'),
    path('auth/register/', register_view, name='register'),
    path('auth/logout/', logout_view, name='logout'),
    path('auth/me/', me_view, name='me'),
]
