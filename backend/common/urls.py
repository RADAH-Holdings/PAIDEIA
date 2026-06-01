from django.urls import path

from common.views import async_health

urlpatterns = [
    path("health/async", async_health, name="async-health"),
]
