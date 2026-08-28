import pandas as pd
from pathlib import Path

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report
)


# ============================================================
# M4 MODEL EVALUATION ENGINE
# ============================================================

print("\n" + "=" * 70)
print("M4 MODEL EVALUATION ENGINE")
print("=" * 70)


# ============================================================
# PATH CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent
OUTPUT_DIR = BASE_DIR / "output"

ML_RESULTS_FILE = OUTPUT_DIR / "ml_results.csv"
OUTPUT_FILE = OUTPUT_DIR / "model_evaluation_results.csv"


# ============================================================
# LOAD ML RESULTS
# ============================================================

try:
    data = pd.read_csv(ML_RESULTS_FILE)

    print("\nDATA LOADED SUCCESSFULLY")
    print(f"ML Results: {data.shape}")

except FileNotFoundError:
    print(f"\nERROR: File not found:")
    print(ML_RESULTS_FILE)
    raise SystemExit(1)


# ============================================================
# DISPLAY AVAILABLE COLUMNS
# ============================================================

print("\nAvailable Columns:")
print(list(data.columns))


# ============================================================
# CHECK REQUIRED COLUMNS
# ============================================================

GROUND_TRUTH_COLUMN = "is_attack"
PREDICTION_COLUMN = "ml_attack_prediction"

if GROUND_TRUTH_COLUMN not in data.columns:
    print(f"\nERROR: '{GROUND_TRUTH_COLUMN}' column not found.")
    raise SystemExit(1)

if PREDICTION_COLUMN not in data.columns:
    print(f"\nERROR: '{PREDICTION_COLUMN}' column not found.")
    raise SystemExit(1)


# ============================================================
# PREPARE DATA
# ============================================================

evaluation_data = data[
    [
        "event_id",
        "user_id",
        GROUND_TRUTH_COLUMN,
        PREDICTION_COLUMN,
        "ml_attack_probability",
        "ml_risk_level"
    ]
].copy()


print("\n" + "=" * 70)
print("EVALUATION DATA")
print("=" * 70)

print(f"\nTotal Events: {len(evaluation_data)}")

print("\nGround Truth Distribution:")
print(evaluation_data[GROUND_TRUTH_COLUMN].value_counts())

print("\nPrediction Distribution:")
print(evaluation_data[PREDICTION_COLUMN].value_counts())


# ============================================================
# EXTRACT TRUE AND PREDICTED VALUES
# ============================================================

y_true = evaluation_data[GROUND_TRUTH_COLUMN]
y_pred = evaluation_data[PREDICTION_COLUMN]


# ============================================================
# CALCULATE PERFORMANCE METRICS
# ============================================================

accuracy = accuracy_score(y_true, y_pred)

precision = precision_score(
    y_true,
    y_pred,
    zero_division=0
)

recall = recall_score(
    y_true,
    y_pred,
    zero_division=0
)

f1 = f1_score(
    y_true,
    y_pred,
    zero_division=0
)


# ============================================================
# DISPLAY MODEL PERFORMANCE
# ============================================================

print("\n" + "=" * 70)
print("MODEL PERFORMANCE METRICS")
print("=" * 70)

print(f"\nAccuracy  : {accuracy:.4f}")
print(f"Precision : {precision:.4f}")
print(f"Recall    : {recall:.4f}")
print(f"F1 Score  : {f1:.4f}")


# ============================================================
# CONFUSION MATRIX
# ============================================================

cm = confusion_matrix(
    y_true,
    y_pred,
    labels=[0, 1]
)

print("\n" + "=" * 70)
print("CONFUSION MATRIX")
print("=" * 70)

print("\n                 Predicted")
print("                 Normal  Attack")
print(f"Actual Normal     {cm[0][0]:<7} {cm[0][1]}")
print(f"Actual Attack     {cm[1][0]:<7} {cm[1][1]}")


# Extract values

tn = cm[0][0]
fp = cm[0][1]
fn = cm[1][0]
tp = cm[1][1]


print("\nDetailed Results:")

print(f"\nTrue Negatives  : {tn}")
print(f"False Positives : {fp}")
print(f"False Negatives : {fn}")
print(f"True Positives  : {tp}")


# ============================================================
# CLASSIFICATION REPORT
# ============================================================

print("\n" + "=" * 70)
print("CLASSIFICATION REPORT")
print("=" * 70)

print(
    classification_report(
        y_true,
        y_pred,
        labels=[0, 1],
        target_names=["Normal", "Attack"],
        zero_division=0
    )
)


# ============================================================
# ATTACK DETECTION SUMMARY
# ============================================================

total_events = len(evaluation_data)

actual_attacks = int(
    evaluation_data[GROUND_TRUTH_COLUMN].sum()
)

predicted_attacks = int(
    evaluation_data[PREDICTION_COLUMN].sum()
)

detected_attacks = tp
missed_attacks = fn
false_alarms = fp


print("\n" + "=" * 70)
print("ATTACK DETECTION SUMMARY")
print("=" * 70)

print(f"\nTotal Events       : {total_events}")
print(f"Actual Attacks     : {actual_attacks}")
print(f"Predicted Attacks  : {predicted_attacks}")

print(f"\nDetected Attacks   : {detected_attacks}")
print(f"Missed Attacks     : {missed_attacks}")
print(f"False Alarms       : {false_alarms}")


# ============================================================
# DETECTION RATE
# ============================================================

if actual_attacks > 0:

    detection_rate = (
        detected_attacks / actual_attacks
    ) * 100

else:
    detection_rate = 0


print(f"\nAttack Detection Rate: {detection_rate:.2f}%")


# ============================================================
# SAVE SUMMARY
# ============================================================

evaluation_summary = pd.DataFrame([
    {
        "total_events": total_events,
        "actual_attacks": actual_attacks,
        "predicted_attacks": predicted_attacks,

        "true_negatives": tn,
        "false_positives": fp,
        "false_negatives": fn,
        "true_positives": tp,

        "accuracy": round(accuracy, 4),
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1_score": round(f1, 4),

        "attack_detection_rate": round(
            detection_rate,
            2
        )
    }
])


evaluation_summary.to_csv(
    OUTPUT_FILE,
    index=False
)


# ============================================================
# COMPLETION MESSAGE
# ============================================================

print("\n" + "=" * 70)
print("M4 MODEL EVALUATION COMPLETED SUCCESSFULLY")
print("=" * 70)

print("\nResults saved to:")
print(OUTPUT_FILE)