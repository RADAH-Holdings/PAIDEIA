import secrets
import string

from django.contrib.auth.password_validation import validate_password
from rest_framework.exceptions import APIException

CHANGE_PASSWORD_PATH = "/api/v1/auth/change-password"
REFRESH_PATH = "/api/v1/auth/refresh"


class PasswordChangeRequired(APIException):
    status_code = 403
    default_detail = "You must change your password before continuing."
    default_code = "password_change_required"


def generate_temp_password(length: int = 16) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def validate_new_password(password: str, *, user) -> None:
    validate_password(password, user=user)
