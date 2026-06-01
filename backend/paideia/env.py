"""Normalize Railway / dashboard env values (quotes, angle brackets)."""


def clean_env(value: str | None, *, default: str = "") -> str:
    """Strip whitespace and accidental quoting from env var values."""
    if not value:
        return default
    cleaned = value.strip()
    if cleaned.startswith("<") and cleaned.endswith(">"):
        cleaned = cleaned[1:-1].strip()
    return cleaned.strip('"').strip("'")
