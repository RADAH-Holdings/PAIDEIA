import pytest
from django.db import IntegrityError, transaction
from django.test import AsyncClient
from rest_framework.test import APIClient

from accounts.models import School, User

pytestmark = pytest.mark.django_db

LOGIN_URL = "/api/v1/auth/login"
REFRESH_URL = "/api/v1/auth/refresh"
ME_URL = "/api/v1/me"
ASYNC_HEALTH_URL = "/api/v1/health/async"


@pytest.fixture
def school():
    return School.objects.create(name="Test School")


@pytest.fixture
def active_user(school):
    user = User.objects.create_user(
        email="teacher@school.edu",
        password="secure-pass-123",
        name="Test Teacher",
        role=User.Role.TEACHER,
        school=school,
        force_password_change=True,
        is_active=True,
    )
    return user


@pytest.fixture
def api_client():
    return APIClient()


def test_t_w1_01_user_model_email_unique_and_password_hashed(school):
    User.objects.create_user(
        email="first@school.edu",
        password="secret",
        name="First",
        role=User.Role.STUDENT,
        school=school,
    )
    with transaction.atomic():
        with pytest.raises(IntegrityError):
            User.objects.create_user(
                email="first@school.edu",
                password="other",
                name="Duplicate",
                role=User.Role.STUDENT,
                school=school,
            )

    user = User.objects.create_user(
        email="second@school.edu",
        password="plain-text",
        name="Second",
        role=User.Role.STUDENT,
        school=school,
    )
    assert user.force_password_change is True
    assert user.password != "plain-text"
    assert user.check_password("plain-text")


def test_t_w1_02_login_success(api_client, active_user):
    response = api_client.post(
        LOGIN_URL,
        {"email": active_user.email, "password": "secure-pass-123"},
        format="json",
    )
    assert response.status_code == 200
    data = response.json()
    assert "access" in data
    assert "refresh" in data
    assert data["force_password_change"] is True


def test_t_w1_03_login_wrong_password_generic_401(api_client, active_user):
    response = api_client.post(
        LOGIN_URL,
        {"email": active_user.email, "password": "wrong"},
        format="json",
    )
    assert response.status_code == 401
    body = response.json()
    assert body["error"]["message"] == "Email or password is incorrect."
    assert "access" not in body


def test_t_w1_04_login_inactive_user_401(api_client, school):
    user = User.objects.create_user(
        email="inactive@school.edu",
        password="secure-pass-123",
        name="Inactive",
        role=User.Role.STUDENT,
        school=school,
        is_active=False,
    )
    response = api_client.post(
        LOGIN_URL,
        {"email": user.email, "password": "secure-pass-123"},
        format="json",
    )
    assert response.status_code == 401
    assert response.json()["error"]["message"] == "Email or password is incorrect."


def test_t_w1_05_refresh_valid_and_invalid(api_client, active_user):
    login = api_client.post(
        LOGIN_URL,
        {"email": active_user.email, "password": "secure-pass-123"},
        format="json",
    )
    refresh = login.json()["refresh"]

    ok = api_client.post(REFRESH_URL, {"refresh": refresh}, format="json")
    assert ok.status_code == 200
    assert "access" in ok.json()

    bad = api_client.post(REFRESH_URL, {"refresh": "not-a-token"}, format="json")
    assert bad.status_code == 401


def test_t_w1_06_me_shape_and_unauthenticated(api_client, active_user, school):
    login = api_client.post(
        LOGIN_URL,
        {"email": active_user.email, "password": "secure-pass-123"},
        format="json",
    )
    access = login.json()["access"]

    unauth = api_client.get(ME_URL)
    assert unauth.status_code == 401

    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
    me = api_client.get(ME_URL)
    assert me.status_code == 200
    data = me.json()
    assert set(data.keys()) == {"id", "name", "email", "role", "school", "is_active"}
    assert data["email"] == active_user.email
    assert data["name"] == active_user.name
    assert data["role"] == "teacher"
    assert data["is_active"] is True
    assert set(data["school"].keys()) == {"id", "name"}
    assert data["school"]["name"] == school.name


@pytest.mark.asyncio
async def test_t_w1_07_async_health():
    client = AsyncClient()
    response = await client.get(ASYNC_HEALTH_URL)
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["async"] is True
