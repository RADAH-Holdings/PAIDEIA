from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode

from accounts.emails import send_password_reset_email, send_welcome_email
from accounts.models import User
from accounts.passwords import generate_temp_password


def create_school_user(
    *,
    admin: User,
    name: str,
    email: str,
    role: str,
) -> tuple[User, str]:
    temp_password = generate_temp_password()
    user = User.objects.create_user(
        email=email,
        password=temp_password,
        name=name,
        role=role,
        school=admin.school,
        is_active=True,
        force_password_change=True,
    )
    send_welcome_email(to_email=user.email, name=user.name, temp_password=temp_password)
    return user, temp_password


def deactivate_user(*, admin: User, target: User) -> dict:
    target.is_active = False
    target.save(update_fields=["is_active", "updated_at"])
    affected_courses: list[dict] = []
    if target.role == User.Role.TEACHER:
        from courses.services import active_courses_for_teacher

        affected_courses = active_courses_for_teacher(target)
    return {
        "id": target.id,
        "is_active": target.is_active,
        "affected_courses": affected_courses,
    }


def build_password_reset_url(*, user: User, web_origin: str) -> str:
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    base = web_origin.rstrip("/")
    return f"{base}/reset-password?uid={uid}&token={token}"


def send_reset_email_for_user(*, user: User, web_origin: str) -> None:
    reset_url = build_password_reset_url(user=user, web_origin=web_origin)
    send_password_reset_email(to_email=user.email, reset_url=reset_url)


def user_from_reset_uid(uid: str) -> User | None:
    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        return User.objects.get(pk=user_id)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return None


def confirm_password_reset(*, uid: str, token: str, new_password: str) -> User | None:
    user = user_from_reset_uid(uid)
    if user is None or not default_token_generator.check_token(user, token):
        return None
    user.set_password(new_password)
    user.force_password_change = False
    user.save(update_fields=["password", "force_password_change", "updated_at"])
    return user
