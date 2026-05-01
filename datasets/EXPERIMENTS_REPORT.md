# Biological alignment experiments (reproducible)

Sequences live under `datasets/` (`spike_*.fasta`, `insulin_*.fasta`).
Regenerate numerics with `python datasets/run_biological_experiments.py`.

## Parameters

- Linear gap for NW/SW (protein, BLOSUM62): **-10**
- Gotoh (Exp 3): **open −11**, **extend −1**

## Experiment 1 — Original vs Delta spike (NW)

- Score: **5888**
- Identity: **97.6617%** (similarity **97.6617%**)
- Substitutions vs Wuhan spike index (pairwise alignment): **11** AA substitutions (indel bases tracked separately in alignment gaps — see JSON).
- Sample substitution sites (1-based Wuhan index): p19 T→R; p95 T→X; p142 G→D; p156 E→X; p157 F→X; p158 R→X; p452 L→R; p478 T→K; p614 D→G; p681 P→R; p950 D→N

## Experiment 2 — Original vs Omicron spike (NW)

- Score: **5367**
- Identity: **93.1591%**
- Substitution rows vs Wuhan index: **34**
- Delta substitutions count was **11** → Omicron **>** Delta (34 vs 11).
- Sample Omicron substitutions: p68 I→V; p70 V→I; p95 T→I; p142 G→D; p211 N→I; p212 L→V; p213 V→P; p214 R→E; p339 G→D; p371 S→L; p373 S→P; p375 S→F; p417 K→N; p440 N→K; p446 G→S; p477 S→N; p478 T→K; p484 E→A

## Experiment 3 — Human vs mouse insulin (NW vs Gotoh)

| Metric | NW linear gap | Gotoh affine |
| --- | --- | --- |
| Score | 466 | 466.0 |
| Identity % | 81.8182 | 81.8182 |
| Gap % | 0.0 | 0.0 |
| Max contiguous identical run (aa) | 25 | 25 |

Affine gaps often consolidate scattered mismatch/noise into fewer long runs of gaps on divergent proteins; here NW and Gotoh scores coincide on these short insulin precursors — compare ribbon-style alignment in GenAlign or longer orthologs.

## Experiment 4 — Local motif on insulin (SW)

- Optimal local score: **466**
- Identity within local block: **81.6514%**

```text
human   MALWMRLLPLLALLALWGPDPAAAFVNQHLCGSHLVEALYLVCGERGFFYTPKTRREAEDLQVGQVELGGGPGAGSLQPLALEGSLQKRGIVEQCCTSICSLYQLENYC
mouse   MALWMRFLPLLALLFLWESHPTQAFVKQHLCGSHLVEALYLVCGERGFFYTPMSRREVEDPQVAQLELGGGPGAGDLQTLALEVAQQKRGIVDQCCTSICSLYQLENYC
```

Compare this block to textbook insulin **A-chain** / **B-chain** / conserved processing motifs.

*Note: rare `X` in spike translations reflects ambiguous codons in this automated CDS translation — cross-check published spike proteins if needed.*

## Figures (manual screenshots)

- Align tab → paste spike originals vs variants → NW protein scoring matches tables above.
- Paste UniProt insulin precursors → Gotoh vs NW toggle.
- Attach PNG exports named `exp1_delta.png`, `exp2_omicron.png`, `exp3_insulin.png`, `exp4_sw_insulin.png` beside this folder when assembling the course PDF.

---

*Machine-readable full payload:* `EXPERIMENT_RESULTS.json`