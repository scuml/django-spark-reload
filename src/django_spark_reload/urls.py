from __future__ import annotations

from django.urls import path

from django_spark_reload import views

app_name = "django_spark_reload"

urlpatterns = [
    path("events/", views.events, name="events"),
]
