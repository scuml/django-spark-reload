from __future__ import annotations

from django.conf import settings
from django.templatetags.static import static
from django.urls import reverse
from django.utils.html import format_html


def django_hyper_reload_script(response) -> str:
    if not settings.DEBUG:
        return ""
    return format_html(
        (
            '<script src="{}"'
            + ' data-worker-script-path="{}"'
            + ' data-events-path="{}"'
            + ' data-status-code="{}"'
            + " defer></script>"
        ),
        static("hotwire_spark/hotwire_spark.js"),
        static("django-hyper-reload/reload-worker.js"),
        reverse("django_hyper_reload:events"),
        response.status_code,
    )
