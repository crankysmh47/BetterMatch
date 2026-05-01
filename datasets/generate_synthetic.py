"""Generate synthetic DNA pairs for benchmarking (near-identical with ~1% mutation)."""

from __future__ import annotations

import argparse
import random
from pathlib import Path


def random_dna(n: int, rng: random.Random) -> str:
    return "".join(rng.choice("ACGT") for _ in range(n))


def mutate(ref: str, rate: float, rng: random.Random) -> str:
    out = []
    for c in ref:
        if rng.random() < rate:
            choices = [b for b in "ACGT" if b != c]
            out.append(rng.choice(choices))
        else:
            out.append(c)
    return "".join(out)


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--out", default="synthetic", help="output folder name under datasets/")
    p.add_argument("--seed", type=int, default=1)
    args = p.parse_args()
    rng = random.Random(args.seed)
    root = Path(__file__).resolve().parent / args.out
    root.mkdir(parents=True, exist_ok=True)
    for ln in [100, 500, 1000, 2000, 5000, 10000]:
        a = random_dna(ln, rng)
        b = mutate(a, 0.01, rng)
        (root / f"pair_{ln}_a.fasta").write_text(f">syn_{ln}_a\n{a}\n", encoding="utf-8")
        (root / f"pair_{ln}_b.fasta").write_text(f">syn_{ln}_b\n{b}\n", encoding="utf-8")
    print(f"Wrote synthetic FASTA pairs to {root}")


if __name__ == "__main__":
    main()
