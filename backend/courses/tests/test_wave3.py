import re

import pytest
from django.core import mail
from django.test import override_settings
from rest_framework.test import APIClient

from accounts.models import School, User
from courses.models import Course, Enrollment

pytestmark = pytest.mark.django_db

COURSES_URL = "/api/v1/courses"
ADMIN_USERS_URL = "/api/v1/admin/users"
LOGIN_URL = "/api/v1/auth/login"
CHANGE_PASSWORD_URL = "/api/v1/auth/change-password"


def brief_payload(**overrides):
    data = {
        "title": "Biology — Year 10",
        "subject": "Biology",
        "target_level": "Year 10 / Age 14-15",
        "learning_outcomes": "x" * 100,
        "topic_sequence": "y" * 80,
        "exam_context": "",
        "special_instructions": "",
        "approximate_lessons": 40,
    }
    data.update(overrides)
    return data


@pytest.fixture
def school():
    return School.objects.create(name="Wave3 School")


@pytest.fixture
def admin(school):
    return User.objects.create_user(
        email="admin@w3.edu",
        password="pass",
        name="Admin",
        role=User.Role.ADMIN,
        school=school,
        force_password_change=False,
    )


@pytest.fixture
def teacher_a(school):
    return User.objects.create_user(
        email="teacher-a@w3.edu",
        password="pass",
        name="Teacher A",
        role=User.Role.TEACHER,
        school=school,
        force_password_change=False,
    )


@pytest.fixture
def teacher_b(school):
    return User.objects.create_user(
        email="teacher-b@w3.edu",
        password="pass",
        name="Teacher B",
        role=User.Role.TEACHER,
        school=school,
        force_password_change=False,
    )


@pytest.fixture
def student(school):
    return User.objects.create_user(
        email="student@w3.edu",
        password="pass",
        name="Student",
        role=User.Role.STUDENT,
        school=school,
        force_password_change=False,
    )


@pytest.fixture
def api_client():
    return APIClient()


def auth(client, user):
    client.force_authenticate(user=user)


def test_t_w3_01_course_created_draft_teacher_immutable(api_client, teacher_a, teacher_b):
    auth(api_client, teacher_a)
    create = api_client.post(
        COURSES_URL,
        {**brief_payload(), "teacher_id": str(teacher_b.id)},
        format="json",
    )
    assert create.status_code == 403

    create = api_client.post(COURSES_URL, brief_payload(title="Bio"), format="json")
    assert create.status_code == 201
    assert create.json()["status"] == "draft"
    assert create.json()["teacher"]["id"] == str(teacher_a.id)

    course = Course.objects.get(pk=create.json()["id"])
    assert course.teacher_id == teacher_a.id


def test_t_w3_02_activate_validation_and_success(api_client, teacher_a):
    auth(api_client, teacher_a)
    create = api_client.post(
        COURSES_URL,
        brief_payload(
            learning_outcomes="short",
            topic_sequence="tiny",
            title="AB",
        ),
        format="json",
    )
    course_id = create.json()["id"]
    fail = api_client.post(f"{COURSES_URL}/{course_id}/activate", format="json")
    assert fail.status_code == 422
    assert "learning_outcomes" in fail.json()["error"]["detail"]

    patch = api_client.patch(
        f"{COURSES_URL}/{course_id}",
        brief_payload(title="Biology — Year 10"),
        format="json",
    )
    assert patch.status_code == 200
    ok = api_client.post(f"{COURSES_URL}/{course_id}/activate", format="json")
    assert ok.status_code == 200
    assert ok.json()["status"] == "active"


def test_t_w3_03_edit_active_course_has_active_sessions_flag(api_client, teacher_a, monkeypatch):
    auth(api_client, teacher_a)
    create = api_client.post(COURSES_URL, brief_payload(), format="json")
    course_id = create.json()["id"]
    api_client.post(f"{COURSES_URL}/{course_id}/activate", format="json")

    monkeypatch.setattr(
        "courses.views.course_has_active_sessions",
        lambda _course: True,
    )
    patch = api_client.patch(
        f"{COURSES_URL}/{course_id}",
        {"title": "Biology — Year 10 (revised)"},
        format="json",
    )
    assert patch.status_code == 200
    assert patch.json()["has_active_sessions"] is True


def test_t_w3_04_enroll_reactivate_no_duplicate(api_client, teacher_a, student):
    auth(api_client, teacher_a)
    course_id = api_client.post(COURSES_URL, brief_payload(), format="json").json()["id"]
    api_client.post(f"{COURSES_URL}/{course_id}/activate", format="json")

    body = {"student_ids": [str(student.id)]}
    first = api_client.post(
        f"{COURSES_URL}/{course_id}/enrollments", body, format="json"
    )
    assert first.status_code == 201
    assert first.json()["enrolled"] == 1
    assert Enrollment.objects.filter(course_id=course_id).count() == 1

    second = api_client.post(
        f"{COURSES_URL}/{course_id}/enrollments", body, format="json"
    )
    assert second.json()["already_enrolled"] == 1

    enrollment = Enrollment.objects.get(course_id=course_id, student=student)
    enrollment.status = Enrollment.Status.UNENROLLED
    enrollment.save(update_fields=["status"])

    third = api_client.post(
        f"{COURSES_URL}/{course_id}/enrollments", body, format="json"
    )
    assert third.json()["reactivated"] == 1
    assert Enrollment.objects.filter(course_id=course_id).count() == 1
    enrollment.refresh_from_db()
    assert enrollment.status == Enrollment.Status.ACTIVE


def test_t_w3_05_unenroll_soft_delete(api_client, teacher_a, student):
    auth(api_client, teacher_a)
    course_id = api_client.post(COURSES_URL, brief_payload(), format="json").json()["id"]
    api_client.post(f"{COURSES_URL}/{course_id}/activate", format="json")
    api_client.post(
        f"{COURSES_URL}/{course_id}/enrollments",
        {"student_ids": [str(student.id)]},
        format="json",
    )
    enrollment = Enrollment.objects.get(course_id=course_id, student=student)
    delete = api_client.delete(f"/api/v1/enrollments/{enrollment.id}")
    assert delete.status_code == 204
    enrollment.refresh_from_db()
    assert enrollment.status == Enrollment.Status.UNENROLLED


def test_t_w3_06_teacher_other_course_returns_404(api_client, teacher_a, teacher_b):
    auth(api_client, teacher_a)
    course_id = api_client.post(COURSES_URL, brief_payload(), format="json").json()["id"]

    auth(api_client, teacher_b)
    response = api_client.get(f"{COURSES_URL}/{course_id}")
    assert response.status_code == 404


def test_t_w3_07_reassign_changes_teacher_access(api_client, admin, teacher_a, teacher_b):
    auth(api_client, teacher_a)
    course_id = api_client.post(COURSES_URL, brief_payload(), format="json").json()["id"]
    api_client.post(f"{COURSES_URL}/{course_id}/activate", format="json")

    auth(api_client, admin)
    reassign = api_client.post(
        f"/api/v1/admin/courses/{course_id}/reassign",
        {"new_teacher_id": str(teacher_b.id)},
        format="json",
    )
    assert reassign.status_code == 200
    assert reassign.json()["teacher"]["id"] == str(teacher_b.id)

    auth(api_client, teacher_a)
    assert api_client.get(f"{COURSES_URL}/{course_id}").status_code == 404

    auth(api_client, teacher_b)
    assert api_client.get(f"{COURSES_URL}/{course_id}").status_code == 200


def test_t_w3_08_deactivate_teacher_returns_affected_courses(
    api_client, admin, teacher_a, student
):
    auth(api_client, teacher_a)
    course_id = api_client.post(COURSES_URL, brief_payload(), format="json").json()["id"]
    api_client.post(f"{COURSES_URL}/{course_id}/activate", format="json")
    api_client.post(
        f"{COURSES_URL}/{course_id}/enrollments",
        {"student_ids": [str(student.id)]},
        format="json",
    )

    auth(api_client, admin)
    deactivate = api_client.patch(
        f"{ADMIN_USERS_URL}/{teacher_a.id}/deactivate",
        format="json",
    )
    assert deactivate.status_code == 200
    affected = deactivate.json()["affected_courses"]
    assert len(affected) == 1
    assert affected[0]["title"] == "Biology — Year 10"
    assert affected[0]["enrolled_count"] == 1

    course = Course.objects.get(pk=course_id)
    assert course.status == Course.Status.ACTIVE
    assert course.teacher_id == teacher_a.id


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
def test_seam_w3_admin_create_teacher_enroll_reassign(
    api_client, admin, school, teacher_b, student
):
    auth(api_client, admin)
    create_teacher = api_client.post(
        ADMIN_USERS_URL,
        {"name": "Seam Teacher", "email": "seam-teacher@w3.edu", "role": "teacher"},
        format="json",
    )
    assert create_teacher.status_code == 201
    temp_password = re.search(
        r"Temporary password: (\S+)", mail.outbox[-1].body
    ).group(1)

    create_student = api_client.post(
        ADMIN_USERS_URL,
        {"name": "Seam Student", "email": "seam-student@w3.edu", "role": "student"},
        format="json",
    )
    assert create_student.status_code == 201
    student_id = create_student.json()["id"]

    api_client.logout()
    login = api_client.post(
        LOGIN_URL,
        {"email": "seam-teacher@w3.edu", "password": temp_password},
        format="json",
    )
    assert login.status_code == 200
    token = login.json()["access"]
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    api_client.post(
        CHANGE_PASSWORD_URL,
        {"new_password": "seam-teacher-final"},
        format="json",
    )

    course = api_client.post(COURSES_URL, brief_payload(), format="json")
    assert course.status_code == 201
    course_id = course.json()["id"]
    api_client.post(f"{COURSES_URL}/{course_id}/activate", format="json")
    enroll = api_client.post(
        f"{COURSES_URL}/{course_id}/enrollments",
        {"student_ids": [student_id]},
        format="json",
    )
    assert enroll.status_code == 201

    auth(api_client, admin)
    seam_teacher = User.objects.get(email="seam-teacher@w3.edu")
    api_client.patch(f"{ADMIN_USERS_URL}/{seam_teacher.id}/deactivate", format="json")
    reassign = api_client.post(
        f"/api/v1/admin/courses/{course_id}/reassign",
        {"new_teacher_id": str(teacher_b.id)},
        format="json",
    )
    assert reassign.status_code == 200

    auth(api_client, teacher_b)
    roster = api_client.get(f"{COURSES_URL}/{course_id}/enrollments")
    assert roster.status_code == 200
    assert len(roster.json()["results"]) == 1
