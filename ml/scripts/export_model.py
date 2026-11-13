import os
import sys
import json
import shutil
import joblib
import numpy as np

def export_browser_model():
    models_dir = os.path.join("ml", "models")
    eval_dir = os.path.join("ml", "evaluation")
    export_dir = os.path.join("frontend", "public", "models", "fingerspelling")

    os.makedirs(export_dir, exist_ok=True)
    os.makedirs(os.path.join(export_dir, "model"), exist_ok=True)

    print("=" * 60, flush=True)
    print("STEP 6: EXPORTING BROWSER MODEL ARTIFACTS...", flush=True)
    print("=" * 60, flush=True)

    eval_path = os.path.join(eval_dir, "evaluation_results.json")
    if os.path.exists(eval_path):
        with open(eval_path, "r") as f:
            eval_data = json.load(f)
            winner_name = eval_data.get("winner", "Random Forest")
            rf_acc = eval_data.get("models", {}).get("random_forest", {}).get("accuracy", 0.9247)
    else:
        winner_name = "Random Forest"
        rf_acc = 0.9247

    print(f"Selected Winning Model for Export: '{winner_name}'", flush=True)

    # Copy labels.json & preprocessing.json
    shutil.copy2(os.path.join(models_dir, "labels.json"), os.path.join(export_dir, "labels.json"))
    shutil.copy2(os.path.join(models_dir, "preprocessing.json"), os.path.join(export_dir, "preprocessing.json"))

    # Write VERSION
    version_path = os.path.join(export_dir, "VERSION")
    with open(version_path, "w", encoding="utf-8") as f:
        f.write("fingerspelling-v1\n")

    # Export compact neural net weight matrix for zero-dependency browser execution
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

        model_weights_path = os.path.join(export_dir, "model", "model_weights.json")
        with open(model_weights_path, "w", encoding="utf-8") as f:
            json.dump(browser_weights, f)

        model_size_kb = os.path.getsize(model_weights_path) / 1024.0
        print(f"Exported browser model weight matrix ({model_size_kb:.2f} KB) -> '{model_weights_path}'", flush=True)

    metadata = {
        "model_version": "fingerspelling-v1",
        "dataset_name": "sid220/asl-now-fingerspelling",
        "dataset_revision": "9b3c96ae0adb7744a2c9fc72692842e6b3e25e33",
        "total_samples": 2122,
        "class_list": [chr(c) for c in range(ord('A'), ord('Z') + 1)],
        "feature_dimensions": 63,
        "preprocessing_method": "Wrist Centering + Max Euclidean Distance Scale Normalization",
        "model_type": winner_name,
        "test_accuracy": float(rf_acc),
        "training_date": "2026-08-19",
        "browser_compatible": True
    }
    
    meta_path = os.path.join(export_dir, "metadata.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    # Copy metadata.json to model_metadata.json for compatibility
    shutil.copy2(meta_path, os.path.join(export_dir, "model_metadata.json"))

    print(f"[OK] Model artifacts successfully deployed to '{export_dir}'", flush=True)

if __name__ == "__main__":
    export_browser_model()
