from unittest.mock import patch

import pytest

from accounts.emails import EmailDeliveryError, _send


@pytest.mark.django_db
def test_send_raises_when_backend_reports_zero_sent(settings):
    settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
    with patch("accounts.emails.send_mail", return_value=0):
        with pytest.raises(EmailDeliveryError):
            _send("Subject", "Body", "user@example.com")
