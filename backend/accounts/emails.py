import logging

from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


def send_welcome_email(*, to_email: str, name: str, temp_password: str) -> None:
    subject = "Your Paideia account"
    body = (
        f"Hello {name},\n\n"
        "An administrator created your Paideia account. Sign in with:\n\n"
        f"  Email: {to_email}\n"
        f"  Temporary password: {temp_password}\n\n"
        "You will be asked to set a new password on first sign-in.\n"
    )
    _send(subject, body, to_email)


def send_password_reset_email(*, to_email: str, reset_url: str) -> None:
    subject = "Reset your Paideia password"
    body = (
        "You requested a password reset for your Paideia account.\n\n"
        f"Open this link to choose a new password:\n{reset_url}\n\n"
        "If you did not request this, you can ignore this email.\n"
    )
    _send(subject, body, to_email)


def _send(subject: str, body: str, to_email: str) -> None:
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@paideia.local")
    try:
        send_mail(subject, body, from_email, [to_email], fail_silently=False)
    except Exception:
        logger.exception("Failed to send email to %s", to_email)
        raise
