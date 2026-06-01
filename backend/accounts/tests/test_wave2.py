import re

import pytest
from django.core import mail
from django.test import override_settings
from rest_framework.test import APIClient

from accounts.models import School, User
from accounts.permissions import IsAdmin, IsCourseOwnerOrAdmin, IsSameSchool, IsTeacher

pytestmark = pytest.mark.django_db

ADMIN_USERS_URL = "/api/v1/admin/users"
CHANGE_PASSWORD_URL = "/api/v1/auth/change-password"
LOGIN_URL = "/api/v1/auth/login"
ME_URL = "/api/v1/me"


class FakeCourse:
    def __init__(self, *, teacher_id, school_id):
        self.teacher_id = teacher_id
        self.school_id = school_id


@pytest.fixture
def school_a():
    return School.objects.create(name="School A")


@pytest.fixture
def school_b():
    return School.objects.create(name="School B")


@pytest.fixture
def admin_a(school_a):
    return User.objects.create_user(
        email="admin@a.edu",
        password="admin-pass",
        name="Admin A",
        role=User.Role.ADMIN,
        school=school_a,
        force_password_change=False,
    )


@pytest.fixture
def teacher_a(school_a):
    return User.objects.create_user(
        email="teacher@a.edu",
        password="temp-pass",
        name="Teacher A",
        role=User.Role.TEACHER,
        school=school_a,
        force_password_change=True,
    )


@pytest.fixture
def teacher_b(school_b):
    return User.objects.create_user(
        email="teacher@b.edu",
        password="pass",
        name="Teacher B",
        role=User.Role.TEACHER,
        school=school_b,
        force_password_change=False,
    )


@pytest.fixture
def student_a(school_a):
    return User.objects.create_user(
        email="student@a.edu",
        password="pass",
        name="Student A",
        role=User.Role.STUDENT,
        school=school_a,
        force_password_change=False,
    )


@pytest.fixture
def api_client():
    return APIClient()


def _request(user):
    class Req:
        pass

    req = Req()
    req.user = user
    return req


def test_t_w2_01_role_permissions(admin_a, teacher_a, student_a):
    assert IsAdmin().has_permission(_request(admin_a), None) is True
    assert IsAdmin().has_permission(_request(teacher_a), None) is False
    assert IsTeacher().has_permission(_request(teacher_a), None) is True
    assert IsTeacher().has_permission(_request(student_a), None) is False


def test_t_w2_02_is_same_school_denies_cross_school(admin_a, teacher_b):
    perm = IsSameSchool()
    assert perm.has_object_permission(_request(admin_a), None, teacher_b) is False
    assert perm.has_object_permission(_request(teacher_b), None, teacher_b) is True


def test_t_w2_03_is_course_owner_or_admin(admin_a, teacher_a, teacher_b, school_a):
    course = FakeCourse(teacher_id=teacher_a.id, school_id=school_a.id)
    perm = IsCourseOwnerOrAdmin()
    assert perm.has_object_permission(_request(teacher_a), None, course) is True
    assert perm.has_object_permission(_request(admin_a), None, course) is True
    assert perm.has_object_permission(_request(teacher_b), None, course) is False


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
def test_t_w2_04_create_user_hashes_temp_password(api_client, admin_a):
    api_client.force_authenticate(user=admin_a)
    response = api_client.post(
        ADMIN_USERS_URL,
        {"name": "New Teacher", "email": "new@a.edu", "role": "teacher"},
        format="json",
    )
    assert response.status_code == 201
    user = User.objects.get(email="new@a.edu")
    assert user.school_id == admin_a.school_id
    assert user.role == User.Role.TEACHER
    assert user.force_password_change is True
    assert user.password != ""
    assert user.check_password("x") is False
    assert len(mail.outbox) == 1


def test_t_w2_05_force_password_change_guard(api_client, teacher_a):
    api_client.force_authenticate(user=teacher_a)
    blocked = api_client.get(ME_URL)
    assert blocked.status_code == 403
    assert blocked.json()["error"]["code"] == "password_change_required"

    changed = api_client.post(
        CHANGE_PASSWORD_URL,
        {"new_password": "new-secure-pass-99"},
        format="json",
    )
    assert changed.status_code == 200
    teacher_a.refresh_from_db()
    assert teacher_a.force_password_change is False
    assert teacher_a.check_password("new-secure-pass-99")

    me = api_client.get(ME_URL)
    assert me.status_code == 200


def test_t_w2_06_deactivate_blocks_login(api_client, admin_a, teacher_a):
    api_client.force_authenticate(user=admin_a)
    url = f"{ADMIN_USERS_URL}/{teacher_a.id}/deactivate"
    response = api_client.patch(url, format="json")
    assert response.status_code == 200
    assert response.json()["is_active"] is False
    teacher_a.refresh_from_db()
    assert teacher_a.is_active is False

    login = api_client.post(
        LOGIN_URL,
        {"email": teacher_a.email, "password": "temp-pass"},
        format="json",
    )
    assert login.status_code == 401


def test_t_w2_07_admin_users_scoped_to_school(api_client, admin_a, school_b):
    User.objects.create_user(
        email="other@b.edu",
        password="pass",
        name="Other",
        role=User.Role.STUDENT,
        school=school_b,
        force_password_change=False,
    )
    api_client.force_authenticate(user=admin_a)
    response = api_client.get(ADMIN_USERS_URL)
    assert response.status_code == 200
    emails = {row["email"] for row in response.json()["results"]}
    assert "other@b.edu" not in emails
    assert admin_a.email in emails


def test_t_w2_08_non_admin_forbidden(api_client, teacher_a):
    api_client.force_authenticate(user=teacher_a)
    response = api_client.get(ADMIN_USERS_URL)
    assert response.status_code == 403


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
def test_seam_w2_admin_create_teacher_login_and_change_password(api_client, admin_a):
    api_client.force_authenticate(user=admin_a)
    create = api_client.post(
        ADMIN_USERS_URL,
        {"name": "Seam Teacher", "email": "seam@a.edu", "role": "teacher"},
        format="json",
    )
    assert create.status_code == 201
    body = mail.outbox[0].body
    assert "seam@a.edu" in body
    match = re.search(r"Temporary password: (\S+)", body)
    assert match is not None
    temp_password = match.group(1)

    api_client.logout()
    login = api_client.post(
        LOGIN_URL,
        {"email": "seam@a.edu", "password": temp_password},
        format="json",
    )
    assert login.status_code == 200
    assert login.json()["force_password_change"] is True

    token = login.json()["access"]
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    blocked = api_client.get(ME_URL)
    assert blocked.status_code == 403

    change = api_client.post(
        CHANGE_PASSWORD_URL,
        {"new_password": "seam-final-pass-99"},
        format="json",
    )
    assert change.status_code == 200

    me = api_client.get(ME_URL)
    assert me.status_code == 200
    assert me.json()["role"] == "teacher"
    assert me.json()["email"] == "seam@a.edu"
