
import numpy as np
from sklearn.decomposition import PCA

from src.data_loader import validate_cube
from src.config import PROCESSED_DATA_DIR


def apply_pca(cube, n_components=3):
    """
    Reduce the spectral dimensions of a hyperspectral cube
    using Principal Component Analysis.

    Input shape:
        (height, width, bands)

    Output shape:
        (height, width, n_components)
    """

    # Validate input cube
    validate_cube(cube)

    if not np.all(np.isfinite(cube)):
        raise ValueError(
            "Input cube contains NaN or infinite values."
        )

    height, width, bands = cube.shape

    # Check the requested number of components
    if n_components <= 0 or n_components > min(
        height * width, bands
    ):
        raise ValueError(
            "Invalid number of PCA components."
        )

    print("\nStarting PCA dimensionality reduction...")

    print(f"Original spectral bands: {bands}")
    print(f"Requested components: {n_components}")

    # Convert 3D cube into a 2D pixel-feature matrix
    pixel_data = cube.reshape(
        height * width,
        bands
    )

    # Initialize PCA
    pca = PCA(
        n_components=n_components
    )

    # Apply PCA to the pixel data
    reduced_data = pca.fit_transform(
        pixel_data
    )

    # Convert back into a 3D image cube
    reduced_cube = reduced_data.reshape(
        height,
        width,
        n_components
    )

    # Calculate retained information
    explained_variance = np.sum(
        pca.explained_variance_ratio_
    ) * 100

    print("\nPCA completed successfully!")
    print(f"Original shape: {cube.shape}")
    print(f"Reduced shape: {reduced_cube.shape}")

    print(
        f"Explained variance retained: "
        f"{explained_variance:.2f}%"
    )

    return reduced_cube, pca


def save_pca_result(
    reduced_cube,
    file_name="pca_result.npy"
):
    """
    Save the PCA-reduced hyperspectral cube.
    """

    validate_cube(reduced_cube)

    output_path = (
        PROCESSED_DATA_DIR / file_name
    ).with_suffix(".npy")

    output_path.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    np.save(
        output_path,
        reduced_cube
    )

    print(f"\nPCA result saved at: {output_path}")

    return output_path
