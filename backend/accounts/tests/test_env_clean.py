from paideia.env import clean_env


def test_clean_env_strips_angle_brackets():
    assert clean_env("<token-value==>") == "token-value=="


def test_clean_env_strips_double_quotes():
    assert clean_env('"https://example.com"') == "https://example.com"
