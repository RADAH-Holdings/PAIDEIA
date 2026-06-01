from django.db import transaction
from django.db.models import Count, Q, QuerySet

from accounts.models import User
from courses.models import Course, Enrollment


def course_has_active_sessions(course: Course) -> bool:
    try:
        from sessions.models import Session
    except ImportError:
        return False
    return Session.objects.filter(
        enrollment__course_id=course.id,
        status=Session.Status.COMPLETE,
    ).exists()


def courses_queryset_for_user(user: User) -> QuerySet[Course]:
    qs = (
        Course.objects.filter(school_id=user.school_id)
        .select_related("teacher", "school")
        .annotate(
            enrolled_count=Count(
                "enrollments",
                filter=Q(enrollments__status=Enrollment.Status.ACTIVE),
            )
        )
        .order_by("-updated_at")
    )
    if user.role == User.Role.TEACHER:
        return qs.filter(teacher_id=user.id)
    if user.role == User.Role.ADMIN:
        return qs
    return Course.objects.none()


def get_course_for_user(*, user: User, course_id) -> Course | None:
    return courses_queryset_for_user(user).filter(pk=course_id).first()


def active_courses_for_teacher(teacher: User) -> list[dict]:
    rows = (
        Course.objects.filter(
            school_id=teacher.school_id,
            teacher_id=teacher.id,
            status=Course.Status.ACTIVE,
        )
        .annotate(
            enrolled_count=Count(
                "enrollments",
                filter=Q(enrollments__status=Enrollment.Status.ACTIVE),
            )
        )
        .order_by("title")
    )
    return [
        {"id": course.id, "title": course.title, "enrolled_count": course.enrolled_count}
        for course in rows
    ]


@transaction.atomic
def enroll_students(*, course: Course, student_ids: list) -> dict[str, int]:
    enrolled = 0
    reactivated = 0
    already_enrolled = 0

    students = {
        str(u.id): u
        for u in User.objects.filter(
            pk__in=student_ids,
            school_id=course.school_id,
            role=User.Role.STUDENT,
            is_active=True,
        )
    }

    for student_id in student_ids:
        sid = str(student_id)
        student = students.get(sid)
        if student is None:
            continue

        enrollment, created = Enrollment.objects.get_or_create(
            course=course,
            student=student,
            defaults={"status": Enrollment.Status.ACTIVE},
        )
        if created:
            enrolled += 1
        elif enrollment.status == Enrollment.Status.ACTIVE:
            already_enrolled += 1
        else:
            enrollment.status = Enrollment.Status.ACTIVE
            enrollment.save(update_fields=["status"])
            reactivated += 1

    return {
        "enrolled": enrolled,
        "reactivated": reactivated,
        "already_enrolled": already_enrolled,
    }
