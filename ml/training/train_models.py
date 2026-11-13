import os
import sys
import time
import json
import joblib
import numpy as np
import pandas as pd

# Add workspace root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from ml.preprocessing.landmark_processor import LandmarkPreprocessor

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix

def train_and_evaluate_all():
    dataset_dir = os.path.join("ml", "datasets", "aslnow")
    models_dir = os.path.join("ml", "models")
    eval_dir = os.path.join("ml", "evaluation")
    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(eval_dir, exist_ok=True)

    print("=" * 60, flush=True)
    print("1. LOADING & PREPROCESSING ASLNOW! DATASET FOR TRAINING...", flush=True)
    print("=" * 60, flush=True)

    parquet_path = os.path.join(dataset_dir, "raw_aslnow.parquet")
    csv_path = os.path.join(dataset_dir, "raw_aslnow.csv")
    
    if os.path.exists(parquet_path):
        df = pd.read_parquet(parquet_path)
    elif os.path.exists(csv_path):
        df = pd.read_csv(csv_path)
    else:
        from ml.scripts.download_and_audit_dataset import download_and_audit
        download_and_audit()
        df = pd.read_parquet(parquet_path)

    label_col = 'label' if 'label' in df.columns else 'clean_label'
    df['clean_label'] = df[label_col].astype(str).str.upper()
    labels = sorted(df['clean_label'].unique())
    label_to_idx = {lbl: idx for idx, lbl in enumerate(labels)}
    idx_to_label = {idx: lbl for idx, lbl in enumerate(labels)}

    print(f"Loaded {len(df)} samples across {len(labels)} classes: {labels}", flush=True)

    preprocessor = LandmarkPreprocessor()
    X_raw = []
    y_raw = []

    coord_cols = [f"{c}_{i}" for i in range(21) for c in ['x', 'y', 'z']]

    for idx, row in df.iterrows():
        try:
            raw_coords = row[coord_cols].values.astype(np.float32)
            processed_vector = preprocessor.preprocess_landmarks(raw_coords)
            X_raw.append(processed_vector)
            y_raw.append(label_to_idx[row['clean_label']])
        except Exception:
            continue

    X = np.array(X_raw, dtype=np.float32)
    y = np.array(y_raw, dtype=np.int64)

    print(f"Preprocessed Feature Matrix X shape: {X.shape}, Label Vector y shape: {y.shape}", flush=True)

    # 2. DATA SPLIT (STRATIFIED SPLIT: 80% Train+Val / 20% Test)
    print("\n" + "=" * 60, flush=True)
    print("2. STRATIFIED DATASET SPLIT (80% Train+Val / 20% Test)...", flush=True)
    print("=" * 60, flush=True)

    X_train_val, X_test, y_train_val, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    X_train, X_val, y_train, y_val = train_test_split(
        X_train_val, y_train_val, test_size=0.15, random_state=42, stratify=y_train_val
    )

    print(f"Train Set:      {len(X_train)} samples", flush=True)
    print(f"Validation Set: {len(X_val)} samples", flush=True)
    print(f"Test Set:       {len(X_test)} samples", flush=True)

    # 3. MODEL A: RANDOM FOREST CLASSIFIER
    print("\n" + "=" * 60, flush=True)
    print("3. TRAINING MODEL A: RANDOM FOREST CLASSIFIER...", flush=True)
    print("=" * 60, flush=True)

    rf_model = RandomForestClassifier(
        n_estimators=120,
        max_depth=20,
        random_state=42,
        n_jobs=-1
    )
    
    t0 = time.time()
    rf_model.fit(X_train, y_train)
    rf_train_time = time.time() - t0

    t0 = time.time()
    rf_y_pred_test = rf_model.predict(X_test)
    rf_infer_time = (time.time() - t0) / len(X_test) * 1000.0  # ms/sample

    rf_acc = accuracy_score(y_test, rf_y_pred_test)
    rf_prec, rf_rec, rf_f1, _ = precision_recall_fscore_support(y_test, rf_y_pred_test, average='weighted')

    rf_model_path = os.path.join(models_dir, "random_forest_model.joblib")
    joblib.dump(rf_model, rf_model_path)
    rf_size_kb = os.path.getsize(rf_model_path) / 1024.0

    print(f"Random Forest Test Accuracy:  {rf_acc * 100:.2f}%", flush=True)
    print(f"Random Forest Weighted F1:    {rf_f1 * 100:.2f}%", flush=True)
    print(f"Random Forest Infer Latency:  {rf_infer_time:.4f} ms/sample", flush=True)
    print(f"Random Forest Artifact Size:  {rf_size_kb:.2f} KB", flush=True)

    # 4. MODEL B: SMALL MLP NEURAL NETWORK
    print("\n" + "=" * 60, flush=True)
    print("4. TRAINING MODEL B: SMALL MLP NEURAL NETWORK...", flush=True)
    print("=" * 60, flush=True)

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
    mlp_train_time = time.time() - t0

    t0 = time.time()
    mlp_y_pred_test = mlp_model.predict(X_test)
    mlp_infer_time = (time.time() - t0) / len(X_test) * 1000.0

    mlp_acc = accuracy_score(y_test, mlp_y_pred_test)
    mlp_prec, mlp_rec, mlp_f1, _ = precision_recall_fscore_support(y_test, mlp_y_pred_test, average='weighted')

    mlp_model_path = os.path.join(models_dir, "mlp_model.joblib")
    joblib.dump(mlp_model, mlp_model_path)
    mlp_size_kb = os.path.getsize(mlp_model_path) / 1024.0

    print(f"MLP Neural Net Test Accuracy: {mlp_acc * 100:.2f}%", flush=True)
    print(f"MLP Neural Net Weighted F1:   {mlp_f1 * 100:.2f}%", flush=True)
    print(f"MLP Neural Net Infer Latency: {mlp_infer_time:.4f} ms/sample", flush=True)
    print(f"MLP Neural Net Artifact Size: {mlp_size_kb:.2f} KB", flush=True)

    # 5. PER-CLASS EVALUATION & CONFUSION MATRIX
    print("\n" + "=" * 60, flush=True)
    print("5. EVALUATING PER-CLASS ACCURACY & CONFUSED LETTERS...", flush=True)
    print("=" * 60, flush=True)

    winner_model_name = "MLP Neural Network" if mlp_acc >= rf_acc else "Random Forest"
    winner_preds = mlp_y_pred_test if mlp_acc >= rf_acc else rf_y_pred_test

    cm = confusion_matrix(y_test, winner_preds)
    
    confused_pairs = []
    for i in range(len(labels)):
        for j in range(len(labels)):
            if i != j and cm[i][j] > 0:
                confused_pairs.append({
                    "true_class": labels[i],
                    "predicted_class": labels[j],
                    "count": int(cm[i][j])
                })
    confused_pairs = sorted(confused_pairs, key=lambda x: x["count"], reverse=True)

    print("Top Confused Letter Pairs:", flush=True)
    for pair in confused_pairs[:5]:
        print(f"  True '{pair['true_class']}' misclassified as '{pair['predicted_class']}': {pair['count']} times", flush=True)

    eval_report = {
        "dataset": "sid220/asl-now-fingerspelling",
        "total_samples": len(X),
        "num_classes": len(labels),
        "classes": labels,
        "splits": {"train": len(X_train), "val": len(X_val), "test": len(X_test)},
        "models": {
            "random_forest": {
                "accuracy": float(rf_acc),
                "precision": float(rf_prec),
                "recall": float(rf_rec),
                "f1_score": float(rf_f1),
                "infer_time_ms": float(rf_infer_time),
                "size_kb": float(rf_size_kb)
            },
            "mlp_neural_network": {
                "accuracy": float(mlp_acc),
                "precision": float(mlp_prec),
                "recall": float(mlp_rec),
                "f1_score": float(mlp_f1),
                "infer_time_ms": float(mlp_infer_time),
                "size_kb": float(mlp_size_kb)
            }
        },
        "winner": winner_model_name,
        "top_confused_pairs": confused_pairs[:10]
    }

    eval_json_path = os.path.join(eval_dir, "evaluation_results.json")
    with open(eval_json_path, "w") as f:
        json.dump(eval_report, f, indent=2)

    labels_export_path = os.path.join(models_dir, "labels.json")
    with open(labels_export_path, "w") as f:
        json.dump({"classes": labels, "label_to_idx": label_to_idx, "idx_to_label": idx_to_label}, f, indent=2)

    preprocessor.save_metadata(os.path.join(models_dir, "preprocessing.json"))

    print(f"\n[OK] Training & evaluation complete. Evaluation report saved to '{eval_json_path}'", flush=True)
    return eval_report

if __name__ == "__main__":
    train_and_evaluate_all()
