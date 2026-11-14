
import numpy as np

from src.dimensionality_reduction import (
    apply_pca,
    save_pca_result
)


# Generate mock hyperspectral data
# 100 pixels x 100 pixels x 220 bands

mock_cube = np.random.rand(
    100,
    100,
    220
).astype(np.float32)

print("Original hyperspectral cube:")
print(mock_cube.shape)


# Apply PCA
reduced_cube, pca_model = apply_pca(
    mock_cube,
    n_components=3
)


# Save PCA output
save_pca_result(
    reduced_cube
)


# Display final information
print("\n========== PCA SUMMARY ==========")

print("Original bands:", mock_cube.shape[2])

print("Reduced bands:", reduced_cube.shape[2])

print(
    "Explained variance:",
    pca_model.explained_variance_ratio_
)

print("\nPCA testing completed!")
