import os
import time
import joblib
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPClassifier

def train_mlp_model():
    dataset_dir = os.path.join("ml", "datasets", "aslnow")
    models_dir = os.path.join("ml", "models")
    os.makedirs(models_dir, exist_ok=True)

    print("=" * 60, flush=True)
    print("STEP 4B: TRAINING MODEL B — SMALL MLP NEURAL NETWORK...", flush=True)
    print("=" * 60, flush=True)

    X = np.load(os.path.join(dataset_dir, "X.npy"))
    y = np.load(os.path.join(dataset_dir, "y.npy"))

    X_train_val, X_test, y_train_val, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    X_train, X_val, y_train, y_val = train_test_split(
        X_train_val, y_train_val, test_size=0.15, random_state=42, stratify=y_train_val
    )

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
    duration = time.time() - t0

    mlp_path = os.path.join(models_dir, "mlp_model.joblib")
    joblib.dump(mlp_model, mlp_path)

    print(f"[OK] MLP Neural Net trained in {duration:.2f}s -> Saved to '{mlp_path}'", flush=True)
    return mlp_model

if __name__ == "__main__":
    train_mlp_model()
