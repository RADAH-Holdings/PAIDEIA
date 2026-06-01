from common.exceptions import error_envelope
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from accounts.models import User
from accounts.serializers import MeSerializer

LOGIN_ERROR_MESSAGE = "Email or password is incorrect."


class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        password = request.data.get("password") or ""

        if not email or not password:
            return error_envelope(
                code="unauthenticated",
                message=LOGIN_ERROR_MESSAGE,
                detail=None,
                http_status=status.HTTP_401_UNAUTHORIZED,
            )

        try:
            user = User.objects.select_related("school").get(email=email)
        except User.DoesNotExist:
            return error_envelope(
                code="unauthenticated",
                message=LOGIN_ERROR_MESSAGE,
                detail=None,
                http_status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.is_active or not user.check_password(password):
            return error_envelope(
                code="unauthenticated",
                message=LOGIN_ERROR_MESSAGE,
                detail=None,
                http_status=status.HTTP_401_UNAUTHORIZED,
            )

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "force_password_change": user.force_password_change,
            },
            status=status.HTTP_200_OK,
        )


class RefreshView(TokenRefreshView):
    permission_classes = [AllowAny]
    authentication_classes: list = []


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = User.objects.select_related("school").get(pk=request.user.pk)
        serializer = MeSerializer(user)
        return Response(serializer.data)
