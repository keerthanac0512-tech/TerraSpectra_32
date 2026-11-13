
from pathlib import Path

# Project root directory
PROJECT_ROOT = Path(__file__).resolve().parent.parent

# Main data directory
DATA_DIR = PROJECT_ROOT / "data"

# Raw and processed data directories
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"

# Model and report directories
MODEL_DIR = PROJECT_ROOT / "models"
REPORT_DIR = PROJECT_ROOT / "reports"

# Supported hyperspectral file formats
SUPPORTED_FORMATS = [
    ".tif",
    ".tiff",
    ".h5",
    ".hdf5"
]

# Image processing configuration
NORMALIZATION_METHOD = "min_max"

# Project information
PROJECT_NAME = "TerraSpectra"
PROJECT_VERSION = "0.1.0"
