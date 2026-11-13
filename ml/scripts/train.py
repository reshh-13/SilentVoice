import os
import sys
import time
import joblib
import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.neural_network import MLPClassifier

def train_models():
    dataset_dir = os.path.join("ml", "datasets", "aslnow")
    models_dir = os.path.join("ml", "models")
    os.makedirs(models_dir, exist_ok=True)

    print("=" * 60, flush=True)
    print("STEP 4: TRAINING BASELINE MODELS (RANDOM FOREST & MLP)...", flush=True)
    print("=" * 60, flush=True)

    x_path = os.path.join(dataset_dir, "X.npy")
    y_path = os.path.join(dataset_dir, "y.npy")

    if not (os.path.exists(x_path) and os.path.exists(y_path)):
        from ml.scripts.preprocess_dataset import preprocess_dataset
        X, y = preprocess_dataset()
    else:
        X = np.load(x_path)
        y = np.load(y_path)

    # Stratified Split (80% Train+Val / 20% Test, then 85% Train / 15% Val)
    X_train_val, X_test, y_train_val, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    X_train, X_val, y_train, y_val = train_test_split(
        X_train_val, y_train_val, test_size=0.15, random_state=42, stratify=y_train_val
    )

    print(f"Dataset Splits: Train={len(X_train)}, Val={len(X_val)}, Test={len(X_test)}", flush=True)

    # Save splits for evaluation step
    np.save(os.path.join(dataset_dir, "X_test.npy"), X_test)
    np.save(os.path.join(dataset_dir, "y_test.npy"), y_test)

    # Train Model A: Random Forest Classifier
    print("Training Model A: Random Forest Classifier...", flush=True)
    rf_model = RandomForestClassifier(
        n_estimators=120,
        max_depth=20,
        random_state=42,
        n_jobs=-1
    )
    t0 = time.time()
    rf_model.fit(X_train, y_train)
    rf_time = time.time() - t0
    
    rf_path = os.path.join(models_dir, "random_forest_model.joblib")
    joblib.dump(rf_model, rf_path)
    print(f"[OK] Random Forest trained in {rf_time:.2f}s -> Saved to '{rf_path}'", flush=True)

    # Train Model B: Small MLP Neural Network
    print("Training Model B: Small MLP Neural Network...", flush=True)
    mlp_model = MLPClassifier(
        hidden_layer_sizes=(128, 64),
        activation='relu',
        solver='adam',
        max_iter=350,
        random_state=42,
        early_stopping=True,
        n_iter_no_change=15
    )
    t0 = time.time()
    mlp_model.fit(X_train, y_train)
    mlp_time = time.time() - t0

    mlp_path = os.path.join(models_dir, "mlp_model.joblib")
    joblib.dump(mlp_model, mlp_path)
    print(f"[OK] MLP Neural Net trained in {mlp_time:.2f}s -> Saved to '{mlp_path}'", flush=True)

    return rf_model, mlp_model

if __name__ == "__main__":
    train_models()
