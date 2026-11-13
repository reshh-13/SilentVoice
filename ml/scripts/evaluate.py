import os
import sys
import time
import json
import joblib
import numpy as np

from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix

def evaluate_models():
    dataset_dir = os.path.join("ml", "datasets", "aslnow")
    models_dir = os.path.join("ml", "models")
    eval_dir = os.path.join("ml", "evaluation")
    os.makedirs(eval_dir, exist_ok=True)

    print("=" * 60, flush=True)
    print("STEP 5: EVALUATING MODELS & CONFUSION MATRIX...", flush=True)
    print("=" * 60, flush=True)

    X_test = np.load(os.path.join(dataset_dir, "X_test.npy"))
    y_test = np.load(os.path.join(dataset_dir, "y_test.npy"))

    labels_path = os.path.join(models_dir, "labels.json")
    if os.path.exists(labels_path):
        with open(labels_path, "r") as f:
            labels = json.load(f)["classes"]
    else:
        alphabet_az = [chr(c) for c in range(ord('A'), ord('Z') + 1)]
        labels = alphabet_az

    rf_path = os.path.join(models_dir, "random_forest_model.joblib")
    mlp_path = os.path.join(models_dir, "mlp_model.joblib")

    rf_model = joblib.load(rf_path)
    mlp_model = joblib.load(mlp_path)

    # Evaluate Model A: Random Forest
    t0 = time.time()
    rf_preds = rf_model.predict(X_test)
    rf_latency = (time.time() - t0) / len(X_test) * 1000.0
    rf_acc = accuracy_score(y_test, rf_preds)
    rf_prec, rf_rec, rf_f1, _ = precision_recall_fscore_support(y_test, rf_preds, average='weighted')
    rf_size_kb = os.path.getsize(rf_path) / 1024.0

    # Evaluate Model B: MLP Neural Net
    t0 = time.time()
    mlp_preds = mlp_model.predict(X_test)
    mlp_latency = (time.time() - t0) / len(X_test) * 1000.0
    mlp_acc = accuracy_score(y_test, mlp_preds)
    mlp_prec, mlp_rec, mlp_f1, _ = precision_recall_fscore_support(y_test, mlp_preds, average='weighted')
    mlp_size_kb = os.path.getsize(mlp_path) / 1024.0

    print("Model Performance Summary:", flush=True)
    print(f"  Random Forest Accuracy: {rf_acc*100:.2f}% | F1: {rf_f1*100:.2f}% | Size: {rf_size_kb:.1f} KB | Latency: {rf_latency:.4f} ms", flush=True)
    print(f"  MLP Neural Net Accuracy: {mlp_acc*100:.2f}% | F1: {mlp_f1*100:.2f}% | Size: {mlp_size_kb:.1f} KB | Latency: {mlp_latency:.4f} ms", flush=True)

    winner_name = "Random Forest" if rf_acc >= mlp_acc else "MLP Neural Network"
    winner_preds = rf_preds if rf_acc >= mlp_acc else mlp_preds

    # Confusion matrix & confused letter pairs
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

    print("\nTop Confused Letter Pairs:", flush=True)
    for pair in confused_pairs[:5]:
        print(f"  True '{pair['true_class']}' misclassified as '{pair['predicted_class']}': {pair['count']} times", flush=True)

    eval_report = {
        "dataset": "sid220/asl-now-fingerspelling",
        "num_classes": len(labels),
        "classes": labels,
        "test_samples": len(X_test),
        "models": {
            "random_forest": {
                "accuracy": float(rf_acc),
                "precision": float(rf_prec),
                "recall": float(rf_rec),
                "f1_score": float(rf_f1),
                "latency_ms": float(rf_latency),
                "size_kb": float(rf_size_kb)
            },
            "mlp_neural_network": {
                "accuracy": float(mlp_acc),
                "precision": float(mlp_prec),
                "recall": float(mlp_rec),
                "f1_score": float(mlp_f1),
                "latency_ms": float(mlp_latency),
                "size_kb": float(mlp_size_kb)
            }
        },
        "winner": winner_name,
        "top_confused_pairs": confused_pairs[:10]
    }

    eval_json_path = os.path.join(eval_dir, "evaluation_results.json")
    with open(eval_json_path, "w", encoding="utf-8") as f:
        json.dump(eval_report, f, indent=2)

    print(f"\n[OK] Evaluation report saved to '{eval_json_path}'", flush=True)
    return eval_report

if __name__ == "__main__":
    evaluate_models()
