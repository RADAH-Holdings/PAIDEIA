from paideia.env import clean_env, normalize_zeptomail_token


def test_clean_env_strips_angle_brackets():
    assert clean_env("<secret-token>") == "secret-token"


def test_clean_env_strips_wrapping_quotes():
    assert clean_env('"https://app.example.com"') == "https://app.example.com"


def test_clean_env_strips_trailing_stray_quote():
    assert clean_env('https://app.example.com""') == "https://app.example.com"


def test_normalize_zeptomail_token_adds_prefix():
    assert normalize_zeptomail_token("abc123") == "Zoho-enczapikey abc123"


def test_normalize_zeptomail_token_preserves_existing_prefix():
    assert normalize_zeptomail_token("Zoho-enczapikey abc") == "Zoho-enczapikey abc"


def test_normalize_zeptomail_token_strips_brackets():
    assert normalize_zeptomail_token("<rawtoken>") == "Zoho-enczapikey rawtoken"
