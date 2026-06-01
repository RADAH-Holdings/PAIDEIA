import uuid

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db import models


class School(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "schools"

    def __str__(self) -> str:
        return self.name


class UserManager(BaseUserManager):
    def create_user(self, email: str, password: str | None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email: str, password: str | None, **extra_fields):
        extra_fields.setdefault("role", User.Role.ADMIN)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("force_password_change", False)
        if extra_fields.get("role") != User.Role.ADMIN:
            raise ValueError("Superuser must have role admin")
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser):
    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        TEACHER = "teacher", "Teacher"
        STUDENT = "student", "Student"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    school = models.ForeignKey(School, on_delete=models.PROTECT, related_name="users")
    force_password_change = models.BooleanField(default=True)
    name = models.CharField(max_length=200)
    email = models.EmailField(max_length=320, unique=True)
    role = models.CharField(max_length=20, choices=Role.choices)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS: list[str] = ["name"]

    class Meta:
        db_table = "users"
        indexes = [
            models.Index(fields=["school"], name="ix_users_school"),
            models.Index(fields=["email"], name="ix_users_email"),
            models.Index(fields=["school", "role"], name="ix_users_school_role"),
        ]

    def __str__(self) -> str:
        return self.email
