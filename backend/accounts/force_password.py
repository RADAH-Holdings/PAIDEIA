from rest_framework.permissions import BasePermission

from accounts.passwords import CHANGE_PASSWORD_PATH, REFRESH_PATH, PasswordChangeRequired


class ForcePasswordChangePermission(BasePermission):
    """ACC-02: block all authenticated routes except password change (+ refresh)."""

    ALLOWED_PATHS = frozenset({CHANGE_PASSWORD_PATH, REFRESH_PATH})

    def has_permission(self, request, view) -> bool:
        user = request.user
        if not user or not user.is_authenticated:
            return True
        if not getattr(user, "force_password_change", False):
            return True
        if request.path in self.ALLOWED_PATHS:
            return True
        raise PasswordChangeRequired()
