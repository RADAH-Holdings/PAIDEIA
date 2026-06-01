import os

from django.core.management.base import BaseCommand

from accounts.models import School, User


class Command(BaseCommand):
    help = "Create a demo school and admin user for staging / local login."

    def handle(self, *args, **options):
        school_name = os.environ.get("SEED_SCHOOL_NAME", "Paideia Demo School")
        email = os.environ.get("SEED_ADMIN_EMAIL", "admin@paideia.local")
        password = os.environ.get("SEED_ADMIN_PASSWORD", "changeme-admin")
        name = os.environ.get("SEED_ADMIN_NAME", "Demo Admin")

        school, created = School.objects.get_or_create(name=school_name)
        if created:
            self.stdout.write(self.style.SUCCESS(f"Created school: {school.name}"))
        else:
            self.stdout.write(f"Using existing school: {school.name}")

        user, user_created = User.objects.get_or_create(
            email=email.lower(),
            defaults={
                "school": school,
                "name": name,
                "role": User.Role.ADMIN,
                "is_active": True,
                "force_password_change": True,
            },
        )
        if user_created:
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Created admin user: {email}"))
        else:
            user.set_password(password)
            user.school = school
            user.is_active = True
            user.save(update_fields=["password", "school", "is_active", "updated_at"])
            self.stdout.write(self.style.WARNING(f"Reset password for existing admin: {email}"))
