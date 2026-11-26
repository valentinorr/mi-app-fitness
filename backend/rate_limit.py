"""Rate limiter configuration."""

import os
from typing import Callable
from functools import wraps
import inspect
from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

# Solo crear rate limiter real si NO estamos en modo testing
TESTING = os.getenv("TESTING", "").lower() in ("1", "true", "yes")

if not TESTING:
    # Rate limiter real: 5 requests per minute per IP
    limiter = Limiter(key_func=get_remote_address)
else:
    # Dummy limiter para tests: funciona como decorador (@limiter.limit)
    class DummyLimiter:
        def limit(self, *args, **kwargs):
            """Decorador que no hace rate limiting. Soporta funciones sync y async."""
            def decorator(func: Callable) -> Callable:
                if inspect.iscoroutinefunction(func):
                    @wraps(func)
                    async def async_wrapper(*a, **kw):
                        return await func(*a, **kw)
                    return async_wrapper
                else:
                    @wraps(func)
                    def sync_wrapper(*a, **kw):
                        return func(*a, **kw)
                    return sync_wrapper
            return decorator
    limiter = DummyLimiter()