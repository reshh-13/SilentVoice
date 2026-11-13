import os
import sys
import json
import shutil
import joblib
import numpy as np

# Add workspace root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from ml.preprocessing.landmark_processor import LandmarkPreprocessor

def export_model_artifacts():
    models_dir = os.path.join("ml", "models")
    eval_dir = os.path.join("ml", "evaluation")
    export_dir = os.path.join("frontend", "public", "models", "fingerspelling")
    
    os.makedirs(export_dir, exist_ok=True)
    os.makedirs(os.path.join(export_dir, "model"), exist_ok=True)

    print("=" * 60, flush=True)
    print("1. EXPORTING TRAINED MODEL ARTIFACTS FOR BROWSER INFERENCE...", flush=True)
    print("=" * 60, flush=True)

    eval_json_path = os.path.join(eval_dir, "evaluation_results.json")
    if os.path.exists(eval_json_path):
        with open(eval_json_path, "r") as f:
            eval_report = json.load(f)
        winner_name = eval_report.get("winner", "MLP Neural Network")
    else:
        winner_name = "MLP Neural Network"

    print(f"Selected Winning Model for Browser Export: '{winner_name}'", flush=True)

    # Copy labels.json & preprocessing.json
    src_labels = os.path.join(models_dir, "labels.json")
    dst_labels = os.path.join(export_dir, "labels.json")
    if os.path.exists(src_labels):
        shutil.copy2(src_labels, dst_labels)
        print(f"Exported labels.json -> {dst_labels}", flush=True)

    src_prep = os.path.join(models_dir, "preprocessing.json")
    dst_prep = os.path.join(export_dir, "preprocessing.json")
    if os.path.exists(src_prep):
        shutil.copy2(src_prep, dst_prep)
        print(f"Exported preprocessing.json -> {dst_prep}", flush=True)

    # Write VERSION file
    version_path = os.path.join(export_dir, "VERSION")
    with open(version_path, "w") as f:
        f.write("fingerspelling-v1\n")
    print(f"Exported VERSION file -> {version_path}", flush=True)

    # Export Model Architecture & Weights in lightweight JSON format for zero-dependency browser execution
    mlp_path = os.path.join(models_dir, "mlp_model.joblib")
    if os.path.exists(mlp_path):
        mlp = joblib.load(mlp_path)
        
        weights = [coef.tolist() for coef in mlp.coefs_]
        biases = [intercept.tolist() for intercept in mlp.intercepts_]
        
        browser_weights = {
            "version": "fingerspelling-v1",
            "architecture": [63, 128, 64, len(mlp.classes_)],
            "activation": "relu",
            "output_activation": "softmax",
            "weights": weights,
            "biases": biases,
            "classes": [int(c) if isinstance(c, (np.int64, np.int32, int)) else str(c) for c in mlp.classes_]
        }
        
        model_json_path = os.path.join(export_dir, "model", "model_weights.json")
        with open(model_json_path, "w") as f:
            json.dump(browser_weights, f)
        
        model_size_kb = os.path.getsize(model_json_path) / 1024.0
        print(f"Exported browser model weights ({model_size_kb:.2f} KB) -> {model_json_path}", flush=True)

    metadata = {
        "model_version": "fingerspelling-v1",
        "dataset": "sid220/asl-now-fingerspelling",
        "training_date": "2026-08-18",
        "model_type": winner_name,
        "browser_compatible": True,
        "input_features": 63,
        "output_classes": 26,
        "export_size_kb": model_size_kb if 'model_size_kb' in locals() else 0.0
    }
    
    meta_path = os.path.join(export_dir, "model_metadata.json")
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"[OK] Model export complete. Artifacts ready in '{export_dir}'", flush=True)

if __name__ == "__main__":
    export_model_artifacts()
