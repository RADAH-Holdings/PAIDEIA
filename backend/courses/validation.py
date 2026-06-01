ACTIVATE_MIN_LENGTHS: dict[str, int] = {
    "title": 3,
    "subject": 2,
    "target_level": 5,
    "learning_outcomes": 100,
    "topic_sequence": 80,
}

APPROXIMATE_LESSONS_MIN = 10
APPROXIMATE_LESSONS_MAX = 120


def activation_field_errors(course) -> dict[str, str]:
    errors: dict[str, str] = {}
    for field, minimum in ACTIVATE_MIN_LENGTHS.items():
        value = (getattr(course, field, None) or "").strip()
        if len(value) < minimum:
            errors[field] = (
                f"Add at least {minimum} characters before activating this course."
            )
    lessons = getattr(course, "approximate_lessons", None)
    if lessons is None or lessons < APPROXIMATE_LESSONS_MIN or lessons > APPROXIMATE_LESSONS_MAX:
        errors["approximate_lessons"] = (
            f"Choose a lesson count between {APPROXIMATE_LESSONS_MIN} and "
            f"{APPROXIMATE_LESSONS_MAX}."
        )
    return errors
