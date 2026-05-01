"""Fetch spike CDS from GenBank and insulin FASTAs from UniProt into datasets/.

Requires BioPython (see apps/api/requirements.txt).

Usage (repo root):

    pip install -r apps/api/requirements.txt
    python datasets/fetch_biological.py

Set ENTREZ_EMAIL for polite NCBI API access (optional but recommended).
"""

from __future__ import annotations

import argparse
import os
from pathlib import Path
from urllib.request import Request, urlopen

from Bio import Entrez, SeqIO
from Bio.Seq import Seq
from io import StringIO

SPIKE_REGION_START = 21563
SPIKE_REGION_STOP = 25384

ACCESSIONS = {
    "spike_original": ("MN908947.3", "SARS-CoV-2 Wuhan-Hu-1 spike CDS MN908947.3:{START}-{STOP} translated"),
    "spike_delta": ("OK091006.1", "Delta B.1.617.2 genome spike CDS same coordinates translated"),
    "spike_omicron": ("OL672836.1", "Omicron B.1.1.529 genome spike CDS same coordinates translated"),
}

INSULIN_URLS = {
    "insulin_human": ("https://rest.uniprot.org/uniprotkb/P01308.fasta", "Homo sapiens insulin P01308"),
    "insulin_mouse": ("https://rest.uniprot.org/uniprotkb/P01326.fasta", "Mus musculus insulin P01326"),
}


def _configure_entrez() -> None:
    Entrez.email = os.environ.get("ENTREZ_EMAIL", "bettermatch-genalign@local.invalid")


def fetch_translate_spike(accession: str, header_suffix: str) -> str:
    _configure_entrez()
    handle = Entrez.efetch(
        db="nucleotide",
        id=accession,
        rettype="fasta",
        retmode="text",
        seq_start=SPIKE_REGION_START,
        seq_stop=SPIKE_REGION_STOP,
    )
    text = handle.read()
    handle.close()
    record = list(SeqIO.parse(StringIO(text), "fasta"))[0]
    nuc = record.seq
    if len(nuc) % 3 != 0:
        raise ValueError(f"{accession}: CDS length {len(nuc)} is not a multiple of 3")
    aa = str(nuc.translate(table=1, to_stop=False)).rstrip("*")
    hdr = f">{accession}_spike_S_prot|{header_suffix}"
    return f"{hdr}\n{aa}\n"


def fetch_http_fasta(url: str, header_hint: str) -> str:
    req = Request(url, headers={"User-Agent": "BetterMatch/1.0 (course project)"})
    with urlopen(req, timeout=120) as resp:
        body = resp.read().decode("utf-8")
    lines = body.strip().splitlines()
    if not lines or not lines[0].startswith(">"):
        raise ValueError(f"Unexpected FASTA from {url}")
    merged_header = lines[0][1:].strip().replace(" ", "_") + f"|{header_hint}"
    seq = "".join(l.strip() for l in lines[1:])
    return f">{merged_header}\n{seq}\n"


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--out", type=Path, default=None, help="defaults to datasets/")
    args = p.parse_args()
    base = args.out or Path(__file__).resolve().parent
    base.mkdir(parents=True, exist_ok=True)

    for stem, (acc, desc) in ACCESSIONS.items():
        text = fetch_translate_spike(acc, desc.format(START=SPIKE_REGION_START, STOP=SPIKE_REGION_STOP))
        path = base / f"{stem}.fasta"
        path.write_text(text, encoding="utf-8")
        aa = "".join(text.splitlines()[1:]).strip()
        print(f"Wrote {path} ({len(aa)} aa)")

    for stem, (url, hint) in INSULIN_URLS.items():
        text = fetch_http_fasta(url, hint)
        path = base / f"{stem}.fasta"
        path.write_text(text, encoding="utf-8")
        seq_lines = "".join(text.splitlines()[1:])
        print(f"Wrote {path} ({len(seq_lines)} residues)")


if __name__ == "__main__":
    main()
