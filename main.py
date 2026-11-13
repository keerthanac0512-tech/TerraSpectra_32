
from src.config import (
    PROJECT_NAME,
    PROJECT_VERSION,
    RAW_DATA_DIR,
    PROCESSED_DATA_DIR,
    MODEL_DIR,
    REPORT_DIR
)


def initialize_project():
    """
    Create the required project directories
    if they do not already exist.
    """

    directories = [
        RAW_DATA_DIR,
        PROCESSED_DATA_DIR,
        MODEL_DIR,
        REPORT_DIR
    ]

    print(f"\nInitializing {PROJECT_NAME}...")
    print(f"Version: {PROJECT_VERSION}")

    for directory in directories:
        directory.mkdir(
            parents=True,
            exist_ok=True
        )
        print(f"Created/verified: {directory}")

    print("\nProject initialized successfully!")


def display_project_info():
    """
    Display basic TerraSpectra project information.
    """

    print("\n========== PROJECT INFORMATION ==========")
    print(f"Project Name    : {PROJECT_NAME}")
    print(f"Project Version : {PROJECT_VERSION}")
    print(f"Raw Data        : {RAW_DATA_DIR}")
    print(f"Processed Data  : {PROCESSED_DATA_DIR}")
    print(f"Models          : {MODEL_DIR}")
    print(f"Reports         : {REPORT_DIR}")
    print("=========================================")


def main():
    initialize_project()
    display_project_info()


if __name__ == "__main__":
    main()
