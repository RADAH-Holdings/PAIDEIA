"""Normalize Railway / dashboard env values (quotes, angle brackets)."""


def clean_env(value: str | None, *, default: str = "") -> str:
    """Strip whitespace and accidental quoting from env var values."""
    if not value:
        return default
    cleaned = value.strip()
    if cleaned.startswith("<") and cleaned.endswith(">"):
        cleaned = cleaned[1:-1].strip()
    while cleaned and cleaned[0] in "\"'":
        cleaned = cleaned[1:].strip()
    while cleaned and cleaned[-1] in "\"'":
        cleaned = cleaned[:-1].strip()
    return cleaned


def normalize_zeptomail_token(value: str | None) -> str:
    """Return a ZeptoMail Authorization header value (Zoho-enczapikey …)."""
    token = clean_env(value)
    if not token:
        return ""
    if token.lower().startswith("zoho-enczapikey"):
        return token
    return f"Zoho-enczapikey {token}"
