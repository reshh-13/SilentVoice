import os
import sys
import json
import numpy as np
import pandas as pd
from huggingface_hub import snapshot_download

def download_aslnow_dataset():
    dataset_dir = os.path.join("ml", "datasets", "aslnow")
    os.makedirs(dataset_dir, exist_ok=True)
    parquet_path = os.path.join(dataset_dir, "raw_aslnow.parquet")

    print("=" * 60, flush=True)
    print("STEP 1: DOWNLOADING ASLNOW! DATASET FROM HUGGINGFACE...", flush=True)
    print("=" * 60, flush=True)

    repo_id = "sid220/asl-now-fingerspelling"
    print(f"Fetching dataset repository snapshot: '{repo_id}'...", flush=True)
    repo_local_dir = snapshot_download(repo_id=repo_id, repo_type="dataset")
    print(f"Snapshot downloaded to: {repo_local_dir}", flush=True)

    parsed_samples = []
    invalid_count = 0

    print("Parsing local landmark JSON files...", flush=True)
    for root, _, files in os.walk(repo_local_dir):
        for fname in files:
            if fname.endswith(".json") and not fname.startswith("."):
                file_path = os.path.join(root, fname)
                rel_path = os.path.relpath(file_path, repo_local_dir)
                
                parts = rel_path.replace("\\", "/").split("/")
                letter = parts[0].upper() if len(parts) >= 2 else fname.split("_")[0].upper()

                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        data = json.load(f)

                    if isinstance(data, list) and len(data) == 21:
                        raw_63 = []
                        for pt in data:
                            raw_63.extend([float(pt.get("x", 0.0)), float(pt.get("y", 0.0)), float(pt.get("z", 0.0))])
                        
                        parsed_samples.append({
                            "filename": rel_path,
                            "label": letter,
                            "landmarks": raw_63
                        })
                    else:
                        invalid_count += 1
                except Exception:
                    invalid_count += 1

    records = []
    for item in parsed_samples:
        rec = {"filename": item["filename"], "label": item["label"]}
        for i in range(21):
            rec[f"x_{i}"] = item["landmarks"][i * 3]
            rec[f"y_{i}"] = item["landmarks"][i * 3 + 1]
            rec[f"z_{i}"] = item["landmarks"][i * 3 + 2]
        records.append(rec)

    df = pd.DataFrame(records)
    df.to_parquet(parquet_path, index=False)
    print(f"[OK] Download complete. Processed {len(df)} samples saved to '{parquet_path}'", flush=True)
    return parquet_path

if __name__ == "__main__":
    download_aslnow_dataset()
