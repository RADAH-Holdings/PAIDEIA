from django.urls import path

from courses.views import (
    SchoolStudentListView,
    AdminCourseReassignView,
    CourseActivateView,
    CourseArchiveView,
    CourseDetailView,
    CourseEnrollmentListCreateView,
    CourseListCreateView,
    EnrollmentUnenrollView,
    StudentMyCoursesView,
)

urlpatterns = [
    path("students", SchoolStudentListView.as_view(), name="school-students"),
    path("courses", CourseListCreateView.as_view(), name="courses-list-create"),
    path("courses/<uuid:course_id>", CourseDetailView.as_view(), name="courses-detail"),
    path(
        "courses/<uuid:course_id>/activate",
        CourseActivateView.as_view(),
        name="courses-activate",
    ),
    path(
        "courses/<uuid:course_id>/archive",
        CourseArchiveView.as_view(),
        name="courses-archive",
    ),
    path(
        "courses/<uuid:course_id>/enrollments",
        CourseEnrollmentListCreateView.as_view(),
        name="course-enrollments",
    ),
    path(
        "enrollments/<uuid:enrollment_id>",
        EnrollmentUnenrollView.as_view(),
        name="enrollment-unenroll",
    ),
    path(
        "admin/courses/<uuid:course_id>/reassign",
        AdminCourseReassignView.as_view(),
        name="admin-course-reassign",
    ),
    path(
        "students/me/courses",
        StudentMyCoursesView.as_view(),
        name="student-my-courses",
    ),
]
