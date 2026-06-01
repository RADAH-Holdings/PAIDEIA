from rest_framework import serializers

from accounts.models import User
from courses.models import Course, Enrollment
from courses.services import course_has_active_sessions
from courses.validation import APPROXIMATE_LESSONS_MAX, APPROXIMATE_LESSONS_MIN

_COURSE_UPDATE_FIELDS = (
    "title",
    "subject",
    "target_level",
    "learning_outcomes",
    "topic_sequence",
    "exam_context",
    "special_instructions",
    "approximate_lessons",
)


class UserSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "name")


class CourseSerializer(serializers.ModelSerializer):
    teacher = UserSummarySerializer(read_only=True, allow_null=True)
    has_active_sessions = serializers.SerializerMethodField()
    enrolled_count = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = Course
        fields = (
            "id",
            "title",
            "subject",
            "target_level",
            "learning_outcomes",
            "topic_sequence",
            "exam_context",
            "special_instructions",
            "approximate_lessons",
            "status",
            "teacher",
            "has_active_sessions",
            "enrolled_count",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "status", "teacher", "created_at", "updated_at")

    def get_has_active_sessions(self, obj: Course) -> bool:
        return course_has_active_sessions(obj)


class CourseCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = _COURSE_UPDATE_FIELDS

    def validate_approximate_lessons(self, value: int) -> int:
        if value < APPROXIMATE_LESSONS_MIN or value > APPROXIMATE_LESSONS_MAX:
            raise serializers.ValidationError(
                f"Must be between {APPROXIMATE_LESSONS_MIN} and {APPROXIMATE_LESSONS_MAX}."
            )
        return value


class CourseUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = _COURSE_UPDATE_FIELDS
        extra_kwargs = {field: {"required": False} for field in _COURSE_UPDATE_FIELDS}

    def validate_approximate_lessons(self, value: int) -> int:
        if value < APPROXIMATE_LESSONS_MIN or value > APPROXIMATE_LESSONS_MAX:
            raise serializers.ValidationError(
                f"Must be between {APPROXIMATE_LESSONS_MIN} and {APPROXIMATE_LESSONS_MAX}."
            )
        return value


class EnrollStudentsSerializer(serializers.Serializer):
    student_ids = serializers.ListField(
        child=serializers.UUIDField(),
        allow_empty=False,
    )


class EnrollStudentsResultSerializer(serializers.Serializer):
    enrolled = serializers.IntegerField()
    reactivated = serializers.IntegerField()
    already_enrolled = serializers.IntegerField()


class ReassignCourseSerializer(serializers.Serializer):
    new_teacher_id = serializers.UUIDField()


class EnrollmentRosterSerializer(serializers.ModelSerializer):
    student = UserSummarySerializer()
    sessions_completed = serializers.SerializerMethodField()

    class Meta:
        model = Enrollment
        fields = (
            "id",
            "student",
            "status",
            "sessions_completed",
            "enrolled_at",
            "last_session_at",
        )

    def get_sessions_completed(self, obj: Enrollment) -> int:
        return 0


class StudentCourseSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    title = serializers.CharField()
    subject = serializers.CharField()
    sessions_completed = serializers.IntegerField()
    last_session_at = serializers.DateTimeField(allow_null=True)
