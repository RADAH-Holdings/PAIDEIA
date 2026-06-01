from django.urls import path

from accounts.admin_views import AdminUserDeactivateView, AdminUserListCreateView
from accounts.auth_views import (
    ChangePasswordView,
    MeView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    RefreshView,
)
from accounts.views import LoginView

urlpatterns = [
    path("auth/login", LoginView.as_view(), name="auth-login"),
    path("auth/refresh", RefreshView.as_view(), name="auth-refresh"),
    path("auth/change-password", ChangePasswordView.as_view(), name="auth-change-password"),
    path("auth/password-reset", PasswordResetRequestView.as_view(), name="auth-password-reset"),
    path(
        "auth/password-reset/confirm",
        PasswordResetConfirmView.as_view(),
        name="auth-password-reset-confirm",
    ),
    path("me", MeView.as_view(), name="me"),
    path("admin/users", AdminUserListCreateView.as_view(), name="admin-users"),
    path(
        "admin/users/<uuid:user_id>/deactivate",
        AdminUserDeactivateView.as_view(),
        name="admin-user-deactivate",
    ),
]
