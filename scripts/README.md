# Offline Scripts

These scripts are separate from the live Flask inference path.

- `generate_data.py`: creates deterministic CSV datasets and evaluation labels.
- `behavior_batch.py`: runs the batch behavior analysis and writes `output/behavior_results.csv`.
- `legacy_pipeline.py`: preserves the earlier context/ML experiment and writes legacy output files.

The generator uses only the Python standard library. Install `scripts/requirements.txt` before running either batch analysis script. Run them from the repository root so their `output/` paths resolve correctly:

```powershell
python scripts/generate_data.py
python scripts/behavior_batch.py
```

Ground truth may be used by offline evaluation scripts only. The Flask API reads runtime CSVs from `output/` and does not import these scripts.
