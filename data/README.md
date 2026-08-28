# Data

`data/` is the source dataset snapshot. `output/` is the generated runtime/demo dataset consumed by the Flask loader.

## Runtime Inputs

- `users.csv`: identity and baseline fields.
- `events.csv`: telemetry events without labels.
- `context.csv`: approved context windows.

## Evaluation Only

- `ground_truth.csv`: attack labels and expected categories. It must not be loaded by live inference.

## Offline Artifact

- `behavior_results.csv`: batch behavior-engine output for analysis; it is not the Flask runtime source.

The dataset contains legitimate empty conditional identifiers, such as no beneficiary on a login. These values should not be replaced with fabricated identifiers.
