import os
from datetime import timedelta
from pathlib import Path

import dj_database_url
from dotenv import load_dotenv

from paideia.env import clean_env

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ["DJANGO_SECRET_KEY"]
DEBUG = os.environ.get("DJANGO_DEBUG", "false").lower() in ("1", "true", "yes")
ALLOWED_HOSTS = [
    host.strip()
    for host in os.environ.get("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
    if host.strip()
]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "rest_framework_simplejwt",
    "accounts",
    "courses",
    "common",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "paideia.urls"
WSGI_APPLICATION = "paideia.wsgi.application"
ASGI_APPLICATION = "paideia.asgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

if os.environ.get("PAIDEIA_TEST_DB"):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / ".test-db.sqlite3",
        }
    }
else:
    DATABASES = {
        "default": dj_database_url.config(
            default="sqlite:///db.sqlite3",
            conn_max_age=600,
            conn_health_checks=True,
        )
    }

AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("CORS_ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
]
CORS_ALLOW_CREDENTIALS = True

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
        "accounts.force_password.ForcePasswordChangePermission",
    ),
    "DEFAULT_PAGINATION_CLASS": "common.pagination.PaideiaPagination",
    "EXCEPTION_HANDLER": "common.exceptions.api_exception_handler",
    "UNAUTHENTICATED_USER": None,
}

_zeptomail_token = clean_env(os.environ.get("ZEPTOMAIL_SEND_MAIL_TOKEN"))
if _zeptomail_token:
    EMAIL_BACKEND = (
        "zoho_zeptomail.backend.zeptomail_backend.ZohoZeptoMailEmailBackend"
    )
    ZOHO_ZEPTOMAIL_API_KEY_TOKEN = _zeptomail_token
    ZOHO_ZEPTOMAIL_HOSTED_REGION = clean_env(
        os.environ.get("ZEPTOMAIL_HOSTED_REGION"),
        default="zeptomail.zoho.com",
    ) or "zeptomail.zoho.com"
    DEFAULT_FROM_EMAIL = clean_env(
        os.environ.get("ZEPTOMAIL_FROM_EMAIL"),
        default=clean_env(os.environ.get("DEFAULT_FROM_EMAIL"), default="noreply@paideia.local"),
    )
else:
    EMAIL_BACKEND = os.environ.get(
        "EMAIL_BACKEND",
        "django.core.mail.backends.console.EmailBackend",
    )
    DEFAULT_FROM_EMAIL = clean_env(
        os.environ.get("DEFAULT_FROM_EMAIL"),
        default="noreply@paideia.local",
    )

PAIDEIA_WEB_ORIGIN = clean_env(os.environ.get("PAIDEIA_WEB_ORIGIN"))

# Railway often defines JWT_SIGNING_KEY with no value — treat blank as unset.
_jwt_signing_key = (os.environ.get("JWT_SIGNING_KEY") or "").strip() or SECRET_KEY
_access_minutes = int(os.environ.get("JWT_ACCESS_LIFETIME", "30"))
_refresh_days = int(os.environ.get("JWT_REFRESH_LIFETIME", "7"))

SIMPLE_JWT = {
    "SIGNING_KEY": _jwt_signing_key,
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=_access_minutes),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=_refresh_days),
    "ROTATE_REFRESH_TOKENS": False,
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
}

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "root": {"handlers": ["console"], "level": os.environ.get("LOG_LEVEL", "INFO")},
}
