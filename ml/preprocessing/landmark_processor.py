import numpy as np
import json
from typing import List, Union, Dict, Any

class LandmarkPreprocessor:
    """
    Standardized MediaPipe Hand Landmark Preprocessor.
    
    Transformation steps:
    1. Wrist Centering: Subtract wrist coordinate (landmark 0) from all 21 landmarks.
    2. Scale Normalization: Scale coordinates by dividing by the max Euclidean distance 
       of any landmark from the wrist (adds 1e-6 for stability).
    3. Flattening: Convert (21, 3) landmarks into a consistent 63-element 1D feature vector.
    
    This exact transformation can be identically reproduced in TypeScript for live browser inference.
    """
    
    def __init__(self, target_landmarks: int = 21, features_per_landmark: int = 3):
        self.target_landmarks = target_landmarks
        self.features_per_landmark = features_per_landmark
        self.expected_dim = target_landmarks * features_per_landmark

    def preprocess_landmarks(self, raw_landmarks: Union[List[float], np.ndarray]) -> np.ndarray:
        """
        Processes a raw input vector of 63 floats or shape (21, 3) or (63,).
        Returns a normalized 63-element 1D float32 numpy array.
        """
        arr = np.array(raw_landmarks, dtype=np.float32)
        
        # Handle flattened 63-element vector or (21, 3) shape
        if arr.shape == (63,):
            arr = arr.reshape((21, 3))
        elif arr.shape != (21, 3):
            raise ValueError(f"Invalid landmark shape {arr.shape}. Expected (21, 3) or (63,)")

        # Step 1: Wrist Centering (subtract wrist coordinate landmark 0)
        wrist = arr[0].copy()
        centered = arr - wrist

        # Step 2: Scale Normalization (max Euclidean distance from wrist)
        distances = np.linalg.norm(centered, axis=1)
        max_dist = np.max(distances)
        if max_dist < 1e-6:
            max_dist = 1.0

        normalized = centered / max_dist

        # Step 3: Flatten to 63-element vector
        return normalized.flatten()

    def get_metadata(self) -> Dict[str, Any]:
        """
        Returns JSON-serializable preprocessing metadata for deployment.
        """
        return {
            "version": "1.0",
            "centering_landmark_index": 0,
            "normalization_method": "max_euclidean_distance",
            "input_landmarks": 21,
            "coords_per_landmark": 3,
            "feature_vector_size": 63,
            "description": "Wrist-centered and max-distance scaled 3D hand coordinates."
        }

    def save_metadata(self, filepath: str):
        with open(filepath, "w") as f:
            json.dump(self.get_metadata(), f, indent=2)
