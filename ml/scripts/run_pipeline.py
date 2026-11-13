import os
import sys

# Add workspace root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from ml.scripts.download_dataset import download_aslnow_dataset
from ml.scripts.inspect_dataset import inspect_dataset
from ml.scripts.validate_dataset import validate_dataset
from ml.scripts.preprocess_dataset import preprocess_dataset
from ml.scripts.train_random_forest import train_rf
from ml.scripts.train_mlp import train_mlp_model
from ml.scripts.evaluate import evaluate_models
from ml.scripts.export_model import export_browser_model
from ml.scripts.verify_inference import verify_browser_inference

def run_full_pipeline():
    print("\n" + "=" * 60, flush=True)
    print("STARTING COMPLETE PHASE 4B-1 ML TRAINING PIPELINE", flush=True)
    print("=" * 60 + "\n", flush=True)

    # Step 1: Download Dataset
    download_aslnow_dataset()

    # Step 2: Inspect Dataset
    inspect_dataset()

    # Step 2B: Validate Dataset
    validate_dataset()

    # Step 3: Preprocess Landmark Features
    preprocess_dataset()

    # Step 4A: Train Random Forest Classifier
    train_rf()

    # Step 4B: Train MLP Neural Network
    train_mlp_model()

    # Step 5: Evaluate Models & Confusion Matrix
    evaluate_models()

    # Step 6: Export Browser Model Artifacts
    export_browser_model()

    # Step 7: Verify Browser Inference
    verify_browser_inference()

    print("\n" + "=" * 60, flush=True)
    print("PHASE 4B-1 ML PIPELINE EXECUTED & VERIFIED SUCCESSFULLY!", flush=True)
    print("=" * 60 + "\n", flush=True)

if __name__ == "__main__":
    run_full_pipeline()
