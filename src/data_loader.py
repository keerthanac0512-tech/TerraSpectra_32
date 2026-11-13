
from pathlib import Path

import numpy as np
import rasterio
import h5py

from src.config import (
    SUPPORTED_FORMATS,
    NORMALIZATION_METHOD,
    RAW_DATA_DIR,
    PROCESSED_DATA_DIR
)


def validate_file(file_path):
    """
    Validate file existence and supported format.
    """

    path = Path(file_path)

    if not path.exists():
        raise FileNotFoundError(
            f"File not found: {path}"
        )

    if path.suffix.lower() not in SUPPORTED_FORMATS:
        raise ValueError(
            f"Unsupported file format: {path.suffix}"
        )

    return path


def validate_cube(cube):
    """
    Validate the structure of a hyperspectral cube.
    Expected shape: (height, width, bands).
    """

    if not isinstance(cube, np.ndarray):
        raise TypeError(
            "Hyperspectral data must be a NumPy array."
        )

    if cube.ndim != 3:
        raise ValueError(
            "Hyperspectral cube must have 3 dimensions."
        )

    if any(dimension == 0 for dimension in cube.shape):
        raise ValueError(
            "Hyperspectral cube contains an empty dimension."
        )

    if not np.issubdtype(cube.dtype, np.number):
        raise TypeError(
            "Hyperspectral cube must contain numeric values."
        )

    return True


def load_geotiff(file_path):
    """
    Load a GeoTIFF hyperspectral image using Rasterio.
    Convert bands-first format to height-width-bands.
    """

    path = validate_file(file_path)

    with rasterio.open(path) as dataset:

        cube = dataset.read()

        cube = np.transpose(
            cube,
            (1, 2, 0)
        )

        metadata = {
            "height": dataset.height,
            "width": dataset.width,
            "bands": dataset.count,
            "crs": str(dataset.crs),
            "transform": dataset.transform,
            "driver": dataset.driver,
            "dtype": str(cube.dtype)
        }

    validate_cube(cube)

    return cube, metadata


def load_hdf5(file_path, dataset_key, band_axis=-1):
    """
    Load a hyperspectral cube from an HDF5 file.

    dataset_key identifies the required dataset
    inside the HDF5 file.
    """

    path = validate_file(file_path)

    with h5py.File(path, "r") as file:

        if dataset_key not in file:
            raise KeyError(
                f"Dataset '{dataset_key}' not found in HDF5 file."
            )

        cube = file[dataset_key][:]

    if cube.ndim != 3:
        raise ValueError(
            "HDF5 hyperspectral data must have 3 dimensions."
        )

    cube = np.moveaxis(
        cube,
        band_axis,
        -1
    )

    validate_cube(cube)

    metadata = {
        "height": cube.shape[0],
        "width": cube.shape[1],
        "bands": cube.shape[2],
        "format": "HDF5",
        "dataset_key": dataset_key,
        "dtype": str(cube.dtype)
    }

    return cube, metadata


def load_hyperspectral_data(
    file_path,
    dataset_key=None,
    band_axis=-1
):
    """
    Automatically select the loader
    based on the input file extension.
    """

    path = validate_file(file_path)

    extension = path.suffix.lower()

    if extension in [".tif", ".tiff"]:

        return load_geotiff(path)

    elif extension in [".h5", ".hdf5"]:

        if dataset_key is None:
            raise ValueError(
                "dataset_key is required for HDF5 files."
            )

        return load_hdf5(
            path,
            dataset_key,
            band_axis
        )

    raise ValueError(
        "Unsupported hyperspectral file format."
    )


def normalize_cube(cube):
    """
    Normalize each spectral band using min-max scaling.
    """

    validate_cube(cube)

    if not np.all(np.isfinite(cube)):
        raise ValueError(
            "Cube contains NaN or infinite values. "
            "Clean invalid pixels before normalization."
        )

    if NORMALIZATION_METHOD != "min_max":
        raise ValueError(
            f"Unsupported normalization method: "
            f"{NORMALIZATION_METHOD}"
        )

    cube = cube.astype(np.float32)

    band_min = np.min(
        cube,
        axis=(0, 1),
        keepdims=True
    )

    band_max = np.max(
        cube,
        axis=(0, 1),
        keepdims=True
    )

    band_range = band_max - band_min

    band_range[band_range == 0] = 1.0

    normalized_cube = (
        cube - band_min
    ) / band_range

    return normalized_cube


def save_processed_cube(cube, file_name):
    """
    Save the processed cube in NumPy format.
    """

    validate_cube(cube)

    output_path = (
        PROCESSED_DATA_DIR / file_name
    ).with_suffix(".npy")

    output_path.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    np.save(output_path, cube)

    return output_path


def print_cube_summary(cube, metadata):
    """
    Display hyperspectral cube information.
    """

    validate_cube(cube)

    print("\n========== HYPERSPECTRAL DATA ==========")

    print(f"Height          : {cube.shape[0]}")
    print(f"Width           : {cube.shape[1]}")
    print(f"Spectral Bands  : {cube.shape[2]}")
    print(f"Data Type       : {cube.dtype}")

    print("\nMetadata:")

    for key, value in metadata.items():
        print(f"{key}: {value}")

    print("========================================")


def process_hyperspectral_file(
    file_path,
    dataset_key=None,
    band_axis=-1,
    output_name="processed_cube.npy"
):
    """
    Complete loading, validation, normalization
    and saving workflow.
    """

    cube, metadata = load_hyperspectral_data(
        file_path,
        dataset_key,
        band_axis
    )

    print_cube_summary(cube, metadata)

    normalized_cube = normalize_cube(cube)

    output_path = save_processed_cube(
        normalized_cube,
        output_name
    )

    print("\nProcessing completed successfully!")
    print(f"Saved processed cube: {output_path}")

    return normalized_cube, metadata
