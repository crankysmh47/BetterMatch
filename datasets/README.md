# `datasets/`

| Asset | Notes |
| --- | --- |
| `fetch_biological.py` | Spike CDS from GenBank (21563–25384 translated) + UniProt insulin FASTAs. Requires BioPython. |
| `run_biological_experiments.py` | Runs NW / Gotoh / SW on bundled FASTAs → `EXPERIMENT_RESULTS.json`, `EXPERIMENTS_REPORT.md`. |
| `generate_synthetic.py` | Paired synthetic DNA FASTAs under `synthetic/`. |
| `*.fasta` | Committed biological sequences after fetch. |

```bash
pip install -r apps/api/requirements.txt
python datasets/fetch_biological.py
python datasets/run_biological_experiments.py
```
