from rest_framework.permissions import BasePermission

from accounts.models import User


class IsAdmin(BasePermission):
    def has_permission(self, request, view) -> bool:
        user = request.user
        return bool(user and user.is_authenticated and user.role == User.Role.ADMIN)


class IsTeacher(BasePermission):
    def has_permission(self, request, view) -> bool:
        user = request.user
        return bool(user and user.is_authenticated and user.role == User.Role.TEACHER)


class IsSameSchool(BasePermission):
    """Object-level: resource school must match the user's school (AUTH-05)."""

    def has_object_permission(self, request, view, obj) -> bool:
        user = request.user
        if not user or not user.is_authenticated:
            return False
        school_id = getattr(obj, "school_id", None)
        if school_id is None and hasattr(obj, "school"):
            school_id = obj.school_id
        return school_id == user.school_id


class IsCourseOwnerOrAdmin(BasePermission):
    """course.teacher_id == user.id OR user is admin (exercised with fixture until W3)."""

    def has_object_permission(self, request, view, obj) -> bool:
        user = request.user
        if not user or not user.is_authenticated:
            return False
        school_id = getattr(obj, "school_id", None)
        if school_id is None and hasattr(obj, "school"):
            school_id = obj.school_id
        if school_id != user.school_id:
            return False
        if user.role == User.Role.ADMIN:
            return True
        teacher_id = getattr(obj, "teacher_id", None)
        return teacher_id is not None and teacher_id == user.id
