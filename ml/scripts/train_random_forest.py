import os
import time
import joblib
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier

def train_rf():
    dataset_dir = os.path.join("ml", "datasets", "aslnow")
    models_dir = os.path.join("ml", "models")
    os.makedirs(models_dir, exist_ok=True)

    print("=" * 60, flush=True)
    print("STEP 4A: TRAINING MODEL A — RANDOM FOREST CLASSIFIER...", flush=True)
    print("=" * 60, flush=True)

    X = np.load(os.path.join(dataset_dir, "X.npy"))
    y = np.load(os.path.join(dataset_dir, "y.npy"))

    X_train_val, X_test, y_train_val, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    X_train, X_val, y_train, y_val = train_test_split(
        X_train_val, y_train_val, test_size=0.15, random_state=42, stratify=y_train_val
    )

    rf_model = RandomForestClassifier(
        n_estimators=120,
        max_depth=20,
        random_state=42,
        n_jobs=-1
    )

    t0 = time.time()
    rf_model.fit(X_train, y_train)
    duration = time.time() - t0

    rf_path = os.path.join(models_dir, "random_forest_model.joblib")
    joblib.dump(rf_model, rf_path)

    print(f"[OK] Random Forest trained in {duration:.2f}s -> Saved to '{rf_path}'", flush=True)
    return rf_model

if __name__ == "__main__":
    train_rf()
