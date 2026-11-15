
from pathlib import Path

import numpy as np

from src.data_loader import (
    load_hyperspectral_data,
    normalize_cube,
    print_cube_summary,
    save_processed_cube
)

from src.dimensionality_reduction import (
    apply_pca,
    save_pca_result
)


def run_preprocessing(
    file_path=None,
    dataset_key=None,
    band_axis=-1,
    n_components=3,
    mock_data=False
):
    """
    Run the complete TerraSpectra preprocessing workflow.

    Steps:
    1. Load hyperspectral data.
    2. Validate and inspect the cube.
    3. Normalize spectral values.
    4. Apply PCA.
    5. Save normalized and PCA outputs.
    """

    print("\n====================================")
    print(" TERRASPECTRA PREPROCESSING PIPELINE")
    print("====================================")

    # Step 1: Load data
    if mock_data:

        print("\nGenerating mock hyperspectral data...")

        cube = np.random.default_rng(42).random(
            (100, 100, 220)
        ).astype(np.float32)

        metadata = {
            "format": "Mock hyperspectral data",
            "height": 100,
            "width": 100,
            "bands": 220
        }

    else:

        if file_path is None:
            raise ValueError(
                "Provide a file path or enable mock_data."
            )

        cube, metadata = load_hyperspectral_data(
            file_path,
            dataset_key,
            band_axis
        )

    print("\nSTEP 1: Data loading completed")

    # Step 2: Display data information
    print_cube_summary(cube, metadata)

    # Step 3: Normalize data
    print("\nSTEP 2: Normalizing hyperspectral data...")

    normalized_cube = normalize_cube(cube)

    print("Normalization completed.")

    normalized_path = save_processed_cube(
        normalized_cube,
        "normalized_cube.npy"
    )

    # Step 4: Apply PCA
    print("\nSTEP 3: Applying PCA...")

    reduced_cube, pca_model = apply_pca(
        normalized_cube,
        n_components=n_components
    )

    # Step 5: Save PCA result
    pca_path = save_pca_result(
        reduced_cube,
        "pca_result.npy"
    )

    # Step 6: Display final results
    print("\n========== FINAL RESULTS ==========")

    print("Original shape:", cube.shape)

    print("Normalized shape:", normalized_cube.shape)

    print("PCA shape:", reduced_cube.shape)

    print(
        "Explained variance:",
        round(
            np.sum(pca_model.explained_variance_ratio_) * 100,
            2
        ),
        "%"
    )

    print("Normalized file:", normalized_path)

    print("PCA file:", pca_path)

    print("\nPreprocessing pipeline completed!")

    return normalized_cube, reduced_cube, pca_model


if __name__ == "__main__":

    run_preprocessing(
        mock_data=True,
        n_components=3
    )
