from __future__ import annotations

from django import template

from django_spark_reload.inject import django_spark_reload_script

register = template.Library()
register.simple_tag(django_spark_reload_script)
