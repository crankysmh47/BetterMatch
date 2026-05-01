"""Run biological alignment experiments (GenAlign algorithms package).

Reads FASTAs produced by fetch_biological.py; writes EXPERIMENT_RESULTS.json and EXPERIMENTS_REPORT.md.

Usage (repo root, BioPython + PYTHONPATH):

    pip install -r apps/api/requirements.txt
    python datasets/run_biological_experiments.py
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[1]
_ALG_ROOT = _REPO_ROOT / "apps" / "api"
sys.path.insert(0, str(_ALG_ROOT))

from app.algorithms import gotoh, needleman_wunsch, smith_waterman  # noqa: E402
from app.algorithms.scoring_matrices import BLOSUM62  # noqa: E402


def read_fasta(path: Path) -> tuple[str, str]:
    lines = path.read_text(encoding="utf-8").strip().splitlines()
    hdr = lines[0][1:].strip() if lines else ""
    seq = "".join(lines[1:]).strip().upper().replace(" ", "")
    return hdr, seq


def mismatched_substitutions(seq_a: str, seq_b: str, aligned_a: str, aligned_b: str) -> list[dict]:
    """1-based reference positions on seq_a where residues substitute."""
    ia = ib = 0
    subs: list[dict] = []
    for ca, cb in zip(aligned_a, aligned_b):
        cu = ca.upper()
        cv = cb.upper()
        if cu != "-" and cv != "-":
            ia += 1
            ib += 1
            if cu != cv:
                subs.append({"ref_pos_wuhan_aa": ia, "wuhan_aa": cu, "variant_aa": cv})
        elif cu == "-" and cv != "-":
            ib += 1  # insertion in variant vs reference
        elif cv == "-" and cu != "-":
            ia += 1  # deletion in variant vs reference
    assert ia == len(seq_a) and ib == len(seq_b), (ia, len(seq_a), ib, len(seq_b))
    return subs


def subs_preview_lines(subs: list[dict], limit: int = 25) -> str:
    parts = [f"p{s['ref_pos_wuhan_aa']} {s['wuhan_aa']}→{s['variant_aa']}" for s in subs[:limit]]
    return "; ".join(parts)


def max_identity_segment_length(aligned_a: str, aligned_b: str) -> int:
    best = cur = 0
    for ca, cb in zip(aligned_a, aligned_b):
        if ca != "-" and cb != "-" and ca.upper() == cb.upper():
            cur += 1
            best = max(best, cur)
        else:
            cur = 0
    return best


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--datasets-dir", type=Path, default=Path(__file__).resolve().parent)
    args = p.parse_args()
    ds = args.datasets_dir

    paths = {
        "original": ds / "spike_original.fasta",
        "delta": ds / "spike_delta.fasta",
        "omicron": ds / "spike_omicron.fasta",
        "ins_human": ds / "insulin_human.fasta",
        "ins_mouse": ds / "insulin_mouse.fasta",
    }
    missing = [str(k) for k, v in paths.items() if not v.is_file()]
    if missing:
        raise SystemExit(f"Missing FASTA files ({missing}). Run fetch_biological.py first.")

    hdr_o, spike_orig = read_fasta(paths["original"])
    _, spike_delta = read_fasta(paths["delta"])
    _, spike_omi = read_fasta(paths["omicron"])
    _, ins_h = read_fasta(paths["ins_human"])
    _, ins_m = read_fasta(paths["ins_mouse"])

    nw_aa_gap = -10

    exp1 = needleman_wunsch.align(
        spike_orig,
        spike_delta,
        match=1,
        mismatch=-1,
        gap=nw_aa_gap,
        matrix=BLOSUM62,
    )
    subs1 = mismatched_substitutions(spike_orig, spike_delta, exp1["aligned_a"], exp1["aligned_b"])

    exp2 = needleman_wunsch.align(
        spike_orig,
        spike_omi,
        match=1,
        mismatch=-1,
        gap=nw_aa_gap,
        matrix=BLOSUM62,
    )
    subs2 = mismatched_substitutions(spike_orig, spike_omi, exp2["aligned_a"], exp2["aligned_b"])

    exp3_nw = needleman_wunsch.align(
        ins_h,
        ins_m,
        match=1,
        mismatch=-1,
        gap=nw_aa_gap,
        matrix=BLOSUM62,
    )
    exp3_go = gotoh.align(
        ins_h,
        ins_m,
        match=1,
        mismatch=-1,
        gap_open=-11.0,
        gap_extend=-1.0,
        matrix=BLOSUM62,
    )

    exp4 = smith_waterman.align(
        ins_h,
        ins_m,
        match=1,
        mismatch=-1,
        gap=nw_aa_gap,
        matrix=BLOSUM62,
    )

    results = {
        "parameters": {
            "nw_sw_gap_linear_protein": nw_aa_gap,
            "gotoh_gap_open": -11,
            "gotoh_gap_extend": -1,
            "substitution_matrix": "BLOSUM62",
        },
        "experiment1_original_vs_delta": {
            "algorithm": "Needleman-Wunsch",
            "score": exp1["score"],
            "identity_pct": exp1["identity_pct"],
            "similarity_pct": exp1["similarity_pct"],
            "gap_pct": exp1["gap_pct"],
            "substitutions_vs_original_positions": subs1[:200],
            "substitutions_vs_original_positions_truncated_after": 200 if len(subs1) > 200 else None,
            "substitution_count": len(subs1),
            "indel_related_gap_symbols_in_alignment": exp1["gaps"],
        },
        "experiment2_original_vs_omicron": {
            "algorithm": "Needleman-Wunsch",
            "score": exp2["score"],
            "identity_pct": exp2["identity_pct"],
            "similarity_pct": exp2["similarity_pct"],
            "gap_pct": exp2["gap_pct"],
            "substitution_count": len(subs2),
            "substitutions_vs_original_positions": subs2[:200],
            "substitutions_vs_original_positions_truncated_after": 200 if len(subs2) > 200 else None,
            "comparison": {
                "delta_substitutions_vs_original_aa_positions": len(subs1),
                "omicron_substitutions_vs_original_aa_positions": len(subs2),
                "omicron_has_more_substitutions_than_delta": len(subs2) > len(subs1),
            },
        },
        "experiment3_insulin_nw_vs_gotoh": {
            "nw": {
                "score": exp3_nw["score"],
                "identity_pct": exp3_nw["identity_pct"],
                "gap_pct": exp3_nw["gap_pct"],
                "max_contiguous_identity_run_aa": max_identity_segment_length(
                    exp3_nw["aligned_a"],
                    exp3_nw["aligned_b"],
                ),
            },
            "gotoh": {
                "score": exp3_go["score"],
                "identity_pct": exp3_go["identity_pct"],
                "gap_pct": exp3_go["gap_pct"],
                "max_contiguous_identity_run_aa": max_identity_segment_length(
                    exp3_go["aligned_a"],
                    exp3_go["aligned_b"],
                ),
            },
        },
        "experiment4_insulin_smith_waterman": {
            "score": exp4["score"],
            "identity_pct": exp4["identity_pct"],
            "aligned_human_fragment": exp4["aligned_a"],
            "aligned_mouse_fragment": exp4["aligned_b"],
            "interpretation_hint": (
                "Inspect contiguous conserved motif vs textbook insulin A/B chains / signal+B+C+A topology "
                "(sequences here are UniProt precursors ~110 aa)."
            ),
        },
        "dataset_notes": {"reference_header_original_spike": hdr_o[:160]},
    }

    json_path = ds / "EXPERIMENT_RESULTS.json"
    json_path.write_text(json.dumps(results, indent=2), encoding="utf-8")

    md_lines = [
        "# Biological alignment experiments (reproducible)",
        "",
        "Sequences live under `datasets/` (`spike_*.fasta`, `insulin_*.fasta`).",
        "Regenerate numerics with `python datasets/run_biological_experiments.py`.",
        "",
        "## Parameters",
        "",
        f"- Linear gap for NW/SW (protein, BLOSUM62): **{nw_aa_gap}**",
        "- Gotoh (Exp 3): **open −11**, **extend −1**",
        "",
        "## Experiment 1 — Original vs Delta spike (NW)",
        "",
        f"- Score: **{exp1['score']}**",
        f"- Identity: **{exp1['identity_pct']}%** (similarity **{exp1['similarity_pct']}%**)",
        f"- Substitutions vs Wuhan spike index (pairwise alignment): **{len(subs1)}** AA substitutions (indel bases tracked separately in alignment gaps — see JSON).",
        f"- Sample substitution sites (1-based Wuhan index): {subs_preview_lines(subs1, 25)}",
        "",
        "## Experiment 2 — Original vs Omicron spike (NW)",
        "",
        f"- Score: **{exp2['score']}**",
        f"- Identity: **{exp2['identity_pct']}%**",
        f"- Substitution rows vs Wuhan index: **{len(subs2)}**",
        f"- Delta substitutions count was **{len(subs1)}** → Omicron **{'>' if len(subs2) > len(subs1) else '≤'}** Delta ({len(subs2)} vs {len(subs1)}).",
        f"- Sample Omicron substitutions: {subs_preview_lines(subs2, 18)}",
        "",
        "## Experiment 3 — Human vs mouse insulin (NW vs Gotoh)",
        "",
        "| Metric | NW linear gap | Gotoh affine |",
        "| --- | --- | --- |",
        f"| Score | {exp3_nw['score']} | {exp3_go['score']} |",
        f"| Identity % | {exp3_nw['identity_pct']} | {exp3_go['identity_pct']} |",
        f"| Gap % | {exp3_nw['gap_pct']} | {exp3_go['gap_pct']} |",
        f"| Max contiguous identical run (aa) | {results['experiment3_insulin_nw_vs_gotoh']['nw']['max_contiguous_identity_run_aa']} | "
        f"{results['experiment3_insulin_nw_vs_gotoh']['gotoh']['max_contiguous_identity_run_aa']} |",
        "",
        "Affine gaps often consolidate scattered mismatch/noise into fewer long runs of gaps on divergent proteins; here NW and Gotoh scores coincide on these short insulin precursors — compare ribbon-style alignment in GenAlign or longer orthologs.",
        "",
        "## Experiment 4 — Local motif on insulin (SW)",
        "",
        f"- Optimal local score: **{exp4['score']}**",
        f"- Identity within local block: **{exp4['identity_pct']}%**",
        "",
        "```text",
        f"human   {exp4['aligned_a']}",
        f"mouse   {exp4['aligned_b']}",
        "```",
        "",
        "Compare this block to textbook insulin **A-chain** / **B-chain** / conserved processing motifs.",
        "",
        "*Note: rare `X` in spike translations reflects ambiguous codons in this automated CDS translation — cross-check published spike proteins if needed.*",
        "",
        "## Figures (manual screenshots)",
        "",
        "- Align tab → paste spike originals vs variants → NW protein scoring matches tables above.",
        "- Paste UniProt insulin precursors → Gotoh vs NW toggle.",
        "- Attach PNG exports named `exp1_delta.png`, `exp2_omicron.png`, `exp3_insulin.png`, `exp4_sw_insulin.png` beside this folder when assembling the course PDF.",
        "",
        "---",
        "",
        f"*Machine-readable full payload:* `{json_path.name}`",
    ]
    report_path = ds / "EXPERIMENTS_REPORT.md"
    report_path.write_text("\n".join(md_lines), encoding="utf-8")

    print(f"Wrote {json_path}")
    print(f"Wrote {report_path}")


if __name__ == "__main__":
    main()
