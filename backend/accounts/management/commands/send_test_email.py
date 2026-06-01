from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from accounts.emails import EmailDeliveryError, _send


class Command(BaseCommand):
    help = "Send a one-off test email (verifies ZeptoMail / EMAIL_BACKEND configuration)."

    def add_arguments(self, parser):
        parser.add_argument("to_email", help="Recipient email address")
        parser.add_argument(
            "--subject",
            default="Paideia test email",
            help="Email subject line",
        )

    def handle(self, *args, **options):
        to_email = options["to_email"].strip()
        if not to_email or "@" not in to_email:
            raise CommandError("Provide a valid recipient email address.")

        backend = getattr(settings, "EMAIL_BACKEND", "")
        from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "")
        self.stdout.write(f"EMAIL_BACKEND={backend}")
        self.stdout.write(f"DEFAULT_FROM_EMAIL={from_email}")
        if "console" in backend.lower():
            self.stdout.write(
                self.style.WARNING(
                    "ZEPTOMAIL_SEND_MAIL_TOKEN is unset — mail prints to server logs only."
                )
            )

        body = (
            "This is a test message from Paideia.\n\n"
            "If you received this, transactional email is configured correctly.\n"
        )
        try:
            _send(options["subject"], body, to_email)
        except EmailDeliveryError as exc:
            raise CommandError(str(exc)) from exc

        self.stdout.write(self.style.SUCCESS(f"Test email sent to {to_email}."))
