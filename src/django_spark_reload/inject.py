from __future__ import annotations

from django.conf import settings
from django.templatetags.static import static
from django.urls import reverse
from django.utils.html import format_html


def django_spark_reload_script() -> str:
    if not settings.DEBUG:
        return ""
    return format_html(
        (
            '<script src="{}"'
            + ' data-worker-script-path="{}"'
            + ' data-events-path="{}"'
            + " defer></script>"
        ),
        static("hotwire_spark/hotwire_spark.js"),
        static("django-spark-reload/reload-worker.js"),
        reverse("django_spark_reload:events"),
    )
