from __future__ import annotations

from django.apps import AppConfig


class DjangoBrowserReloadAppConfig(AppConfig):
    name = "django_spark_reload"
    verbose_name = "django-spark-reload"

    def ready(self) -> None:
        # Ensure signal always connected
        from django_spark_reload import views  # noqa
