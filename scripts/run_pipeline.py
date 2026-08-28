import subprocess
import sys
from pathlib import Path


print("\n" + "=" * 70)
print("CSI SECURITY DETECTION PIPELINE")
print("=" * 70)


BASE_DIR = Path(__file__).resolve().parent


def run_module(filename, module_name):

    print("\n" + "=" * 70)
    print(f"RUNNING {module_name}")
    print("=" * 70)

    file_path = BASE_DIR / filename

    try:
        result = subprocess.run(
            [sys.executable, str(file_path)],
            check=True
        )

        print(f"\n{module_name} COMPLETED SUCCESSFULLY")

    except subprocess.CalledProcessError:

        print(f"\nERROR: {module_name} FAILED")
        sys.exit(1)


# ============================================================
# M2 - BEHAVIOUR BASELINE ENGINE
# ============================================================

run_module(
    "behavior_baseline.py",
    "M2 BEHAVIOUR BASELINE ENGINE"
)


# ============================================================
# M3 - MACHINE LEARNING DETECTION
# ============================================================

run_module(
    "ml_detection.py",
    "M3 MACHINE LEARNING DETECTION ENGINE"
)


# ============================================================
# M4 - MODEL EVALUATION
# ============================================================

run_module(
    "model_evaluation.py",
    "M4 MODEL EVALUATION ENGINE"
)


# ============================================================
# M5 - FINAL DETECTION & RISK FUSION
# ============================================================

run_module(
    "final_detection.py",
    "M5 FINAL DETECTION & RISK FUSION ENGINE"
)


print("\n" + "=" * 70)
print("FULL SECURITY DETECTION PIPELINE COMPLETED SUCCESSFULLY")
print("=" * 70)

print("\nFinal results available at:")
print("output/final_detection_results.csv")