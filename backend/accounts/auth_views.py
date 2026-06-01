import logging

from django.conf import settings

logger = logging.getLogger(__name__)
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenRefreshView

from accounts.force_password import ForcePasswordChangePermission
from accounts.models import User
from accounts.serializers import (
    ChangePasswordSerializer,
    MeSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
)
from accounts.services import confirm_password_reset, send_reset_email_for_user
from common.exceptions import error_envelope


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = request.user
        user.set_password(serializer.validated_data["new_password"])
        user.force_password_change = False
        user.save(update_fields=["password", "force_password_change", "updated_at"])
        return Response({"force_password_change": False}, status=status.HTTP_200_OK)


class MeView(APIView):
    permission_classes = [IsAuthenticated, ForcePasswordChangePermission]

    def get(self, request):
        user = User.objects.select_related("school").get(pk=request.user.pk)
        return Response(MeSerializer(user).data)


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        user = User.objects.filter(email=email, is_active=True).first()
        if user:
            web_origin = settings.PAIDEIA_WEB_ORIGIN
            if not web_origin:
                logger.warning("PAIDEIA_WEB_ORIGIN unset; skipping password-reset email")
            else:
                try:
                    send_reset_email_for_user(user=user, web_origin=web_origin)
                except Exception:
                    logger.exception("Failed to send password-reset email")
        return Response(
            {"message": "If an account exists for that email, a reset link has been sent."},
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        user = confirm_password_reset(
            uid=data["uid"],
            token=data["token"],
            new_password=data["new_password"],
        )
        if user is None:
            return error_envelope(
                code="invalid_request",
                message="Invalid or expired reset link.",
                detail=None,
                http_status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({"message": "Password updated."}, status=status.HTTP_200_OK)


class RefreshView(TokenRefreshView):
    permission_classes = [AllowAny]
    authentication_classes: list = []
