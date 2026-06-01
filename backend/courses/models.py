import uuid

from django.db import models

from accounts.models import School, User


class Course(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        ACTIVE = "active", "Active"
        ARCHIVED = "archived", "Archived"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    school = models.ForeignKey(School, on_delete=models.PROTECT, related_name="courses")
    teacher = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="courses_taught",
    )
    title = models.CharField(max_length=200)
    subject = models.CharField(max_length=100)
    target_level = models.CharField(max_length=100)
    learning_outcomes = models.TextField()
    topic_sequence = models.TextField()
    exam_context = models.TextField(blank=True, default="")
    special_instructions = models.TextField(blank=True, default="")
    approximate_lessons = models.IntegerField(default=40)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "courses"
        indexes = [
            models.Index(fields=["teacher"], name="ix_courses_teacher"),
            models.Index(fields=["school", "status"], name="ix_courses_school_stat"),
        ]

    def __str__(self) -> str:
        return self.title


class Enrollment(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        UNENROLLED = "unenrolled", "Unenrolled"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(
        Course,
        on_delete=models.RESTRICT,
        related_name="enrollments",
    )
    student = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="enrollments",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
    )
    last_session_at = models.DateTimeField(null=True, blank=True)
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "enrollments"
        constraints = [
            models.UniqueConstraint(
                fields=["course", "student"],
                name="ux_enroll_course_stu",
            ),
        ]
        indexes = [
            models.Index(fields=["student", "status"], name="ix_enroll_student"),
            models.Index(fields=["course", "status"], name="ix_enroll_course"),
        ]

    def __str__(self) -> str:
        return f"{self.student_id} → {self.course_id}"
