import os
import sys
import numpy as np
import pandas as pd

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from ml.preprocessing.landmark_processor import LandmarkPreprocessor

def preprocess_dataset():
    dataset_dir = os.path.join("ml", "datasets", "aslnow")
    parquet_path = os.path.join(dataset_dir, "raw_aslnow.parquet")

    print("=" * 60, flush=True)
    print("STEP 3: PREPROCESSING LANDMARK FEATURES...", flush=True)
    print("=" * 60, flush=True)

    if not os.path.exists(parquet_path):
        from ml.scripts.download_dataset import download_aslnow_dataset
        download_aslnow_dataset()

    df = pd.read_parquet(parquet_path)
    labels = sorted(df["label"].unique())
    label_to_idx = {lbl: idx for idx, lbl in enumerate(labels)}

    preprocessor = LandmarkPreprocessor()
    coord_cols = [f"{c}_{i}" for i in range(21) for c in ['x', 'y', 'z']]

    X_raw = []
    y_raw = []

    for idx, row in df.iterrows():
        try:
            raw_coords = row[coord_cols].values.astype(np.float32)
            processed_vector = preprocessor.preprocess_landmarks(raw_coords)
            X_raw.append(processed_vector)
            y_raw.append(label_to_idx[row["label"]])
        except Exception:
            continue

    X = np.array(X_raw, dtype=np.float32)
    y = np.array(y_raw, dtype=np.int64)

    x_path = os.path.join(dataset_dir, "X.npy")
    y_path = os.path.join(dataset_dir, "y.npy")
    
    np.save(x_path, X)
    np.save(y_path, y)

    print(f"Preprocessed Feature Matrix X shape: {X.shape}", flush=True)
    print(f"Label Vector y shape:             {y.shape}", flush=True)
    print(f"[OK] Preprocessed data saved to '{x_path}' and '{y_path}'", flush=True)
    return X, y

if __name__ == "__main__":
    preprocess_dataset()
