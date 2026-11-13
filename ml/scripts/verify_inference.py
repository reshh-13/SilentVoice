import os
import sys
import json
import numpy as np

# Add workspace root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from ml.preprocessing.landmark_processor import LandmarkPreprocessor

def softmax(x):
    e_x = np.exp(x - np.max(x))
    return e_x / e_x.sum(axis=0)

def relu(x):
    return np.maximum(0, x)

def verify_browser_inference():
    export_dir = os.path.join("frontend", "public", "models", "fingerspelling")
    model_json_path = os.path.join(export_dir, "model", "model_weights.json")
    labels_json_path = os.path.join(export_dir, "labels.json")

    print("=" * 60, flush=True)
    print("VERIFYING EXPORTED BROWSER INFERENCE PIPELINE...", flush=True)
    print("=" * 60, flush=True)

    if not os.path.exists(model_json_path):
        raise FileNotFoundError(f"Exported model weights file not found: {model_json_path}")

    with open(model_json_path, "r") as f:
        model_data = json.load(f)

    with open(labels_json_path, "r") as f:
        labels_data = json.load(f)

    labels = labels_data.get("classes", [])
    weights = [np.array(w, dtype=np.float32) for w in model_data["weights"]]
    biases = [np.array(b, dtype=np.float32) for b in model_data["biases"]]

    print(f"Loaded browser model weights with architecture: {model_data['architecture']}", flush=True)
    print(f"Loaded {len(labels)} class labels: {labels}", flush=True)

    # Generate a sample 21 landmark MediaPipe vector
    preprocessor = LandmarkPreprocessor()
    dummy_raw_landmarks = np.random.uniform(0.1, 0.9, (21, 3)).astype(np.float32)
    preprocessed_vector = preprocessor.preprocess_landmarks(dummy_raw_landmarks)

    print(f"Sample raw input shape: {dummy_raw_landmarks.shape}", flush=True)
    print(f"Preprocessed 63-element feature vector (first 5 elements): {preprocessed_vector[:5]}", flush=True)

    # Run forward pass (simulating browser JavaScript matrix multiplication)
    a = preprocessed_vector
    for i in range(len(weights) - 1):
        z = np.dot(a, weights[i]) + biases[i]
        a = relu(z)

    logits = np.dot(a, weights[-1]) + biases[-1]
    probs = softmax(logits)

    predicted_idx = int(np.argmax(probs))
    predicted_label = labels[predicted_idx] if predicted_idx < len(labels) else str(predicted_idx)
    predicted_conf = float(probs[predicted_idx]) * 100.0

    print("\nForward Pass Inference Result:", flush=True)
    print(f"  Predicted Label:      '{predicted_label}'", flush=True)
    print(f"  Confidence:           {predicted_conf:.2f}%", flush=True)
    print(f"  Top 3 Class Probabilities:", flush=True)
    top3_indices = np.argsort(probs)[::-1][:3]
    for idx in top3_indices:
        lbl = labels[idx] if idx < len(labels) else str(idx)
        print(f"    - Class '{lbl}': {probs[idx]*100:.2f}%", flush=True)

    print("\n[OK] Verification successful! Exported model artifacts execute clean inference.", flush=True)

if __name__ == "__main__":
    verify_browser_inference()
