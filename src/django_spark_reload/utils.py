import hashlib
from django.core.cache import cache

def has_file_changed(file_path: str) -> bool:
    """Return True if the file's MD5 hash has changed since the last check."""
    # Calculate current MD5 hash
    md5_hash = hashlib.md5()
    try:
        with open(file_path, 'rb') as f:
            for chunk in iter(lambda: f.read(65536), b''):
                md5_hash.update(chunk)
        current_md5 = md5_hash.hexdigest()
    except (FileNotFoundError, PermissionError):
        return False  # Treat errors as no change to avoid false positives

    # Get previous MD5 from Django cache
    cache_key = f"spark_md5:{file_path}"
    previous_md5 = cache.get(cache_key, "")

    # Update cache with current MD5, set to expire in 60 minutes (3600 seconds)
    cache.set(cache_key, current_md5, timeout=3600)

    # Return True if MD5 has changed or this is the first check
    return current_md5 != previous_md5
