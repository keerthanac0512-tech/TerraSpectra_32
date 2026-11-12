
from src.config import (
    PROJECT_NAME,
    PROJECT_VERSION,
    RAW_DATA_DIR,
    PROCESSED_DATA_DIR,
    MODEL_DIR,
    REPORT_DIR
)


def initialize_project():

    directories = [
        RAW_DATA_DIR,
        PROCESSED_DATA_DIR,
        MODEL_DIR,
        REPORT_DIR
    ]

    for directory in directories:
        directory.mkdir(parents=True, exist_ok=True)

    print(f"\n{PROJECT_NAME} v{PROJECT_VERSION}")
    print("Project initialized successfully!")

    print("\nProject directories:")
    for directory in directories:
        print(f"- {directory}")


if __name__ == "__main__":
    initialize_project()
