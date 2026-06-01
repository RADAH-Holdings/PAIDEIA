from rest_framework import serializers

from accounts.models import School, User


class SchoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = ("id", "name")


class MeSerializer(serializers.ModelSerializer):
    school = SchoolSerializer(read_only=True)

    class Meta:
        model = User
        fields = ("id", "name", "email", "role", "school", "is_active")


class ChangePasswordSerializer(serializers.Serializer):
    new_password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_new_password(self, value: str) -> str:
        user = self.context["request"].user
        from accounts.passwords import validate_new_password

        validate_new_password(value, user=user)
        return value


class CreateUserSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=200)
    email = serializers.EmailField(max_length=320)
    role = serializers.ChoiceField(choices=[User.Role.TEACHER, User.Role.STUDENT])

    def validate_email(self, value: str) -> str:
        return value.strip().lower()


class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "name", "email", "role", "is_active")


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value: str) -> str:
        return value.strip().lower()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_new_password(self, value: str) -> str:
        user = self.context.get("user")
        if user is None:
            return value
        from accounts.passwords import validate_new_password

        validate_new_password(value, user=user)
        return value


class AffectedCourseSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    title = serializers.CharField()
    enrolled_count = serializers.IntegerField()


class DeactivateUserSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    is_active = serializers.BooleanField()
    affected_courses = AffectedCourseSerializer(many=True)


class ResendWelcomeSerializer(serializers.Serializer):
    message = serializers.CharField()
