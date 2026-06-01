from common.exceptions import error_envelope
from common.pagination import PaideiaPagination
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.force_password import ForcePasswordChangePermission
from accounts.models import User
from accounts.permissions import IsAdmin
from accounts.serializers import (
    AdminUserSerializer,
    CreateUserSerializer,
    DeactivateUserSerializer,
    ResendWelcomeSerializer,
)
from accounts.services import create_school_user, deactivate_user, resend_welcome_email


class AdminUserListCreateView(ListAPIView):
    permission_classes = [IsAuthenticated, ForcePasswordChangePermission, IsAdmin]
    serializer_class = AdminUserSerializer
    pagination_class = PaideiaPagination

    def get_queryset(self):
        qs = User.objects.filter(school_id=self.request.user.school_id).select_related("school")
        role = self.request.query_params.get("role")
        if role in {User.Role.ADMIN, User.Role.TEACHER, User.Role.STUDENT}:
            qs = qs.filter(role=role)
        status_filter = self.request.query_params.get("status")
        if status_filter == "active":
            qs = qs.filter(is_active=True)
        elif status_filter == "inactive":
            qs = qs.filter(is_active=False)
        return qs.order_by("name")

    def post(self, request):
        serializer = CreateUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        if User.objects.filter(email=data["email"]).exists():
            return error_envelope(
                code="invalid_request",
                message="A user with this email already exists.",
                detail={"email": data["email"]},
                http_status=status.HTTP_400_BAD_REQUEST,
            )
        user, _temp = create_school_user(
            admin=request.user,
            name=data["name"],
            email=data["email"],
            role=data["role"],
        )
        return Response(AdminUserSerializer(user).data, status=status.HTTP_201_CREATED)


class AdminUserDeactivateView(APIView):
    permission_classes = [IsAuthenticated, ForcePasswordChangePermission, IsAdmin]

    def patch(self, request, user_id):
        target = get_object_or_404(
            User.objects.filter(school_id=request.user.school_id),
            pk=user_id,
        )
        if target.pk == request.user.pk:
            return error_envelope(
                code="forbidden_action",
                message="You cannot deactivate your own account.",
                detail=None,
                http_status=status.HTTP_403_FORBIDDEN,
            )
        payload = deactivate_user(admin=request.user, target=target)
        return Response(DeactivateUserSerializer(payload).data, status=status.HTTP_200_OK)

class AdminUserResendWelcomeView(APIView):
    permission_classes = [IsAuthenticated, ForcePasswordChangePermission, IsAdmin]

    def post(self, request, user_id):
        target = get_object_or_404(
            User.objects.filter(school_id=request.user.school_id),
            pk=user_id,
        )
        if target.role not in {User.Role.TEACHER, User.Role.STUDENT}:
            return error_envelope(
                code="forbidden_action",
                message="Welcome email can only be resent for teachers and students.",
                detail=None,
                http_status=status.HTTP_403_FORBIDDEN,
            )
        if not target.is_active:
            return error_envelope(
                code="invalid_request",
                message="Reactivate the user before resending the welcome email.",
                detail=None,
                http_status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            resend_welcome_email(target=target)
        except Exception:
            return error_envelope(
                code="email_failed",
                message="Could not send the welcome email. Check mail configuration and try again.",
                detail=None,
                http_status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response(
            ResendWelcomeSerializer({"message": "Welcome email sent."}).data,
            status=status.HTTP_200_OK,
        )
