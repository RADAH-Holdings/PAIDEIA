from common.exceptions import error_envelope
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.force_password import ForcePasswordChangePermission
from accounts.models import User
from accounts.permissions import IsAdmin, IsCourseOwnerOrAdmin, IsSameSchool
from courses.models import Course, Enrollment
from courses.serializers import (
    CourseCreateSerializer,
    CourseSerializer,
    CourseUpdateSerializer,
    EnrollStudentsResultSerializer,
    EnrollStudentsSerializer,
    UserSummarySerializer, EnrollmentRosterSerializer,
    ReassignCourseSerializer,
    StudentCourseSerializer,
)
from courses.services import (
    course_has_active_sessions,
    courses_queryset_for_user,
    enroll_students,
    get_course_for_user,
)
from courses.validation import activation_field_errors


class CourseListCreateView(APIView):
    permission_classes = [IsAuthenticated, ForcePasswordChangePermission]

    def get(self, request):
        if request.user.role not in {User.Role.TEACHER, User.Role.ADMIN}:
            return error_envelope(
                code="forbidden",
                message="You do not have permission to perform this action.",
                detail=None,
                http_status=status.HTTP_403_FORBIDDEN,
            )
        courses = courses_queryset_for_user(request.user)
        return Response({"results": CourseSerializer(courses, many=True).data})

    def post(self, request):
        if request.user.role != User.Role.TEACHER:
            return error_envelope(
                code="forbidden",
                message="Only teachers can create courses.",
                detail=None,
                http_status=status.HTTP_403_FORBIDDEN,
            )
        if "teacher_id" in request.data or "teacher" in request.data:
            return error_envelope(
                code="forbidden",
                message="You cannot assign a different teacher when creating a course.",
                detail={"teacher_id": "immutable"},
                http_status=status.HTTP_403_FORBIDDEN,
            )
        serializer = CourseCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        course = Course.objects.create(
            school=request.user.school,
            teacher=request.user,
            status=Course.Status.DRAFT,
            **serializer.validated_data,
        )
        course = courses_queryset_for_user(request.user).get(pk=course.pk)
        return Response(CourseSerializer(course).data, status=status.HTTP_201_CREATED)


class CourseDetailView(APIView):
    permission_classes = [
        IsAuthenticated,
        ForcePasswordChangePermission,
        IsCourseOwnerOrAdmin,
        IsSameSchool,
    ]

    def _course_or_404(self, request, course_id):
        course = get_course_for_user(user=request.user, course_id=course_id)
        if course is None:
            return None
        self.check_object_permissions(request, course)
        return course

    def get(self, request, course_id):
        course = self._course_or_404(request, course_id)
        if course is None:
            return error_envelope(
                code="not_found",
                message="Not found.",
                detail=None,
                http_status=status.HTTP_404_NOT_FOUND,
            )
        return Response(CourseSerializer(course).data)

    def patch(self, request, course_id):
        if "teacher_id" in request.data or "teacher" in request.data:
            return error_envelope(
                code="forbidden",
                message="Only an admin can reassign a course to another teacher.",
                detail={"teacher_id": "immutable"},
                http_status=status.HTTP_403_FORBIDDEN,
            )
        if "status" in request.data:
            return error_envelope(
                code="forbidden",
                message="Use activate or archive endpoints to change course status.",
                detail={"status": "immutable"},
                http_status=status.HTTP_403_FORBIDDEN,
            )
        course = self._course_or_404(request, course_id)
        if course is None:
            return error_envelope(
                code="not_found",
                message="Not found.",
                detail=None,
                http_status=status.HTTP_404_NOT_FOUND,
            )
        serializer = CourseUpdateSerializer(course, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        course = courses_queryset_for_user(request.user).get(pk=course.pk)
        payload = CourseSerializer(course).data
        payload["has_active_sessions"] = course_has_active_sessions(course)
        return Response(payload)


class CourseActivateView(APIView):
    permission_classes = [
        IsAuthenticated,
        ForcePasswordChangePermission,
        IsCourseOwnerOrAdmin,
        IsSameSchool,
    ]

    def post(self, request, course_id):
        course = get_course_for_user(user=request.user, course_id=course_id)
        if course is None:
            return error_envelope(
                code="not_found",
                message="Not found.",
                detail=None,
                http_status=status.HTTP_404_NOT_FOUND,
            )
        self.check_object_permissions(request, course)
        if course.status != Course.Status.DRAFT:
            return error_envelope(
                code="invalid_request",
                message="Only draft courses can be activated.",
                detail=None,
                http_status=status.HTTP_400_BAD_REQUEST,
            )
        errors = activation_field_errors(course)
        if errors:
            return error_envelope(
                code="validation_error",
                message="Complete the required brief fields before activating.",
                detail=errors,
                http_status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )
        course.status = Course.Status.ACTIVE
        course.save(update_fields=["status", "updated_at"])
        course = courses_queryset_for_user(request.user).get(pk=course.pk)
        return Response(CourseSerializer(course).data)


class CourseArchiveView(APIView):
    permission_classes = [
        IsAuthenticated,
        ForcePasswordChangePermission,
        IsCourseOwnerOrAdmin,
        IsSameSchool,
    ]

    def post(self, request, course_id):
        course = get_course_for_user(user=request.user, course_id=course_id)
        if course is None:
            return error_envelope(
                code="not_found",
                message="Not found.",
                detail=None,
                http_status=status.HTTP_404_NOT_FOUND,
            )
        self.check_object_permissions(request, course)
        if course.status != Course.Status.ACTIVE:
            return error_envelope(
                code="invalid_request",
                message="Only active courses can be archived.",
                detail=None,
                http_status=status.HTTP_400_BAD_REQUEST,
            )
        course.status = Course.Status.ARCHIVED
        course.save(update_fields=["status", "updated_at"])
        course = courses_queryset_for_user(request.user).get(pk=course.pk)
        return Response(CourseSerializer(course).data)


class CourseEnrollmentListCreateView(APIView):
    permission_classes = [
        IsAuthenticated,
        ForcePasswordChangePermission,
        IsCourseOwnerOrAdmin,
        IsSameSchool,
    ]

    def get(self, request, course_id):
        course = get_course_for_user(user=request.user, course_id=course_id)
        if course is None:
            return error_envelope(
                code="not_found",
                message="Not found.",
                detail=None,
                http_status=status.HTTP_404_NOT_FOUND,
            )
        self.check_object_permissions(request, course)
        enrollments = (
            Enrollment.objects.filter(
                course=course,
                status=Enrollment.Status.ACTIVE,
            )
            .select_related("student")
            .order_by("student__name")
        )
        return Response(
            {"results": EnrollmentRosterSerializer(enrollments, many=True).data}
        )

    def post(self, request, course_id):
        course = get_course_for_user(user=request.user, course_id=course_id)
        if course is None:
            return error_envelope(
                code="not_found",
                message="Not found.",
                detail=None,
                http_status=status.HTTP_404_NOT_FOUND,
            )
        self.check_object_permissions(request, course)
        if course.status != Course.Status.ACTIVE:
            return error_envelope(
                code="invalid_request",
                message="Only active courses accept enrollments.",
                detail=None,
                http_status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = EnrollStudentsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = enroll_students(
            course=course,
            student_ids=serializer.validated_data["student_ids"],
        )
        return Response(
            EnrollStudentsResultSerializer(result).data,
            status=status.HTTP_201_CREATED,
        )


class EnrollmentUnenrollView(APIView):
    permission_classes = [
        IsAuthenticated,
        ForcePasswordChangePermission,
        IsCourseOwnerOrAdmin,
        IsSameSchool,
    ]

    def delete(self, request, enrollment_id):
        enrollment = get_object_or_404(
            Enrollment.objects.select_related("course", "course__school"),
            pk=enrollment_id,
        )
        if enrollment.course.school_id != request.user.school_id:
            return error_envelope(
                code="not_found",
                message="Not found.",
                detail=None,
                http_status=status.HTTP_404_NOT_FOUND,
            )
        if request.user.role == User.Role.TEACHER:
            if enrollment.course.teacher_id != request.user.id:
                return error_envelope(
                    code="not_found",
                    message="Not found.",
                    detail=None,
                    http_status=status.HTTP_404_NOT_FOUND,
                )
        self.check_object_permissions(request, enrollment.course)
        enrollment.status = Enrollment.Status.UNENROLLED
        enrollment.save(update_fields=["status"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminCourseReassignView(APIView):
    permission_classes = [IsAuthenticated, ForcePasswordChangePermission, IsAdmin]

    def post(self, request, course_id):
        course = get_object_or_404(
            Course.objects.filter(school_id=request.user.school_id),
            pk=course_id,
        )
        serializer = ReassignCourseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_teacher = get_object_or_404(
            User.objects.filter(
                school_id=request.user.school_id,
                role=User.Role.TEACHER,
                is_active=True,
            ),
            pk=serializer.validated_data["new_teacher_id"],
        )
        course.teacher = new_teacher
        course.save(update_fields=["teacher", "updated_at"])
        course = courses_queryset_for_user(request.user).get(pk=course.pk)
        return Response(CourseSerializer(course).data)


class StudentMyCoursesView(APIView):
    permission_classes = [IsAuthenticated, ForcePasswordChangePermission]

    def get(self, request):
        if request.user.role != User.Role.STUDENT:
            return error_envelope(
                code="forbidden",
                message="You do not have permission to perform this action.",
                detail=None,
                http_status=status.HTTP_403_FORBIDDEN,
            )
        enrollments = (
            Enrollment.objects.filter(
                student=request.user,
                status=Enrollment.Status.ACTIVE,
                course__status=Course.Status.ACTIVE,
            )
            .select_related("course")
            .order_by("course__title")
        )
        rows = [
            {
                "id": enrollment.course_id,
                "title": enrollment.course.title,
                "subject": enrollment.course.subject,
                "sessions_completed": 0,
                "last_session_at": enrollment.last_session_at,
            }
            for enrollment in enrollments
        ]
        return Response({"results": StudentCourseSerializer(rows, many=True).data})

class SchoolStudentListView(APIView):
    """Active students in the school — for enrollment pickers (ENROL-01)."""

    permission_classes = [IsAuthenticated, ForcePasswordChangePermission]

    def get(self, request):
        if request.user.role not in {User.Role.TEACHER, User.Role.ADMIN}:
            return error_envelope(
                code="forbidden",
                message="You do not have permission to perform this action.",
                detail=None,
                http_status=status.HTTP_403_FORBIDDEN,
            )
        students = User.objects.filter(
            school_id=request.user.school_id,
            role=User.Role.STUDENT,
            is_active=True,
        ).order_by("name")

        return Response(
            {
                "results": UserSummarySerializer(students, many=True).data,
            }
        )
