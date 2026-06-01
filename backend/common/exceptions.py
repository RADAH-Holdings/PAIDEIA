from rest_framework.exceptions import APIException
from rest_framework.response import Response
from rest_framework.views import exception_handler


def error_envelope(*, code: str, message: str, detail=None, http_status: int = 400) -> Response:
    return Response(
        {"error": {"code": code, "message": message, "detail": detail}},
        status=http_status,
    )


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return None

    if isinstance(exc, APIException):
        code = getattr(exc, "default_code", "error")
        if isinstance(code, str):
            code = code.replace(" ", "_")
        detail = exc.detail
        if isinstance(detail, list):
            message = str(detail[0]) if detail else str(exc)
        elif isinstance(detail, dict):
            message = next(iter(detail.values()))[0] if detail else str(exc)  # type: ignore[index]
            if isinstance(message, list):
                message = message[0]
            message = str(message)
        else:
            message = str(detail)

        return error_envelope(
            code=code,
            message=message,
            detail=detail if isinstance(detail, (dict, list)) else None,
            http_status=response.status_code,
        )

    return response
