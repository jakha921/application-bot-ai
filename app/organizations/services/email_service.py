"""
Email service for sending organization invitations.
"""
from django.core.mail import send_mail
from django.conf import settings
from django.utils.html import strip_tags


def send_invitation_email(invite):
    """
    Send an invitation email to a user.
    
    Args:
        invite: OrganizationInvite instance
    """
    # Build the invitation accept URL
    accept_url = f"{settings.FRONTEND_URL}/invite/accept/{invite.token}"
    
    # Format expiration date
    expires_formatted = invite.expires_at.strftime('%d.%m.%Y %H:%M')
    
    # Email subject
    subject = f'Приглашение в организацию {invite.organization.name}'
    
    html_message = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2563eb;">Приглашение в организацию</h2>
                
                <p>Здравствуйте!</p>
                
                <p>Вы получили приглашение присоединиться к организации 
                <strong>{invite.organization.name}</strong> в качестве 
                <strong>{invite.get_role_display()}</strong>.</p>
                
                <div style="margin: 30px 0;">
                    <a href="{accept_url}" 
                       style="background-color: #2563eb; 
                              color: white; 
                              padding: 12px 24px; 
                              text-decoration: none; 
                              border-radius: 6px;
                              display: inline-block;">
                        Принять приглашение
                    </a>
                </div>
                
                <p style="color: #6b7280; font-size: 14px;">
                    Или скопируйте эту ссылку в браузер:<br>
                    <a href="{accept_url}" style="color: #2563eb;">
                        {accept_url}
                    </a>
                </p>
                
                <p style="color: #6b7280; font-size: 14px;">
                    Приглашение действительно до {expires_formatted}
                </p>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; 
                           margin: 30px 0;">
                
                <p style="color: #9ca3af; font-size: 12px;">
                    Если вы не ожидали этого письма, просто проигнорируйте его.
                </p>
            </div>
        </body>
    </html>
    """
    
    plain_message = strip_tags(html_message)
    
    # Send email
    send_mail(
        subject=subject,
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[invite.email],
        html_message=html_message,
        fail_silently=False,
    )
