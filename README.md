# PS9: Privileged Access Misuse Detection

This project implements a behaviour-based detector for privileged access misuse and insider threats. It uses a deterministic synthetic dataset to establish user baselines, score deviations, and compare the results with hidden ground truth.

## Project Structure

- `generate_dataset.py` creates the synthetic users, events, context, and evaluation ground truth.
- `main.py` runs the M2 behaviour engine and writes the behavioural risk results.
- `main_old.py` contains the earlier context-aware and machine-learning pipeline.
- `output/` contains the generated input and result CSV files.

## Requirements

Python 3.10 or newer is recommended. Install the dependencies with:

```powershell
python -m pip install pandas numpy scikit-learn
```

## Run The Pipeline

From the project directory, generate the default dataset and run the behaviour engine:

```powershell
python generate_dataset.py
python main.py
```

The generator is deterministic by default. Its main options are:

```powershell
python generate_dataset.py --n-users 25 --n-baseline-days 5 --seed 42 --outdir output
```

Use `python generate_dataset.py --help` to see all options.

## Scenarios

The generated data contains three hand-authored event chains:

1. A normal user follows a regular login, file access, transaction, and logout flow. Risk should remain `LOW`.
2. An insider attack progresses from an unusual login through sensitive access, permission and beneficiary changes, a large transaction, and data export. Risk should progress from `LOW` to `MODERATE`, `HIGH`, and `CRITICAL`.
3. A similar unusual activity sequence occurs during an approved incident or maintenance window. Context should suppress the raw risk from `HIGH` to `MODERATE`.

## Output Files

- `users.csv`: user identities and behavioural baselines.
- `events.csv`: background activity and scenario events, without labels.
- `context.csv`: approved context windows used by the legacy pipeline.
- `ground_truth.csv`: evaluation-only attack labels, scenario IDs, and expected risk levels.
- `behavior_results.csv`: scores and risk levels produced by `main.py`.
- `results.csv` and `ml_results.csv`: outputs produced by `main_old.py` when that workflow is used.

Ground-truth columns are kept separate from `events.csv` so they do not leak into the scoring input.