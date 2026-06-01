import os

# Hermetic tests: never hit a developer's remote database from the environment.
os.environ["PAIDEIA_TEST_DB"] = "1"
