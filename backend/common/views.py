import asyncio

from django.http import JsonResponse


async def async_health(request):
    """T-W1-07: proves the ASGI stack runs async views without sync ORM calls."""

    await asyncio.sleep(0)
    return JsonResponse({"status": "ok", "async": True})
