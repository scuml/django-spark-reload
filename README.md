# django-spark-reload
#### Automatically reload your browser in development...even faster than before.
Django Spark Reload is a drop-in upgrade to Adam Johnson's excellent [Django Browser Reload](https://github.com/adamchainz/django-browser-reload).  It makes the django templating developer experience smoother by morphing the DOM tree instead of relying on full-page reloads.  This speeds cycle time, helping the developer see their changes much faster.


#### Implementation Details
Updates are broken down into 4 types.

* **Template Update** trigger a morphing reload.
* **CSS Update** reload the stylesheet only.
* **Stimulus Components** Javascript, if detected as a stimulus controller will reload and reconnect the controller.  Controllers must be correctly broken down with disconnect() for this to function properly.
* **Python/View or other JS Update** trigger a full-page reload.  This behavior remains the same as django-browser-reload.

## Requirements
Python 3.9 to 3.13 supported.

Django 4.2 to 5.2 supported.


## For webpackers:
SPARK_WEBPACK_MODE = True

Webpack will mark a significant number of files as changed all at once.  This overwhelms the browser reloader.

To get around this Django Spark Reload does two things:

  1) If more than 3 files are changed at once, a full-page reload is triggered.
  2) If SPARK_WEBPACK_MODE is set to True, the reloader will determine which files to reload by checking the md5.  MD5 results are stored in django's cache for an hour so they can be accessed across server reloads.

SPARK_WEBPACK_MODE

---

## Special Thanks

Adam Johnson for Django Browser Reload
@adamchainz

Jorge Manrubia for Hotwire Spark
@jorgemanrubia
https://x.com/jorgemanru

Carson Gross for Idiomorph
@1cg
https://x.com/htmx_org
