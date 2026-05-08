# BetterMatch: Comprehensive Project Guide
## Design and Analysis of Algorithms (DAA) - Educational Sequence Alignment Platform

**Project Name:** BetterMatch (GenAlign)  
**Institution:** NUST (National University of Sciences and Technology)  
**Course:** CS-251 - Design and Analysis of Algorithms  
**Academic Year:** 2026  
**Deployment:** [Live at GenAlign](https://genalign.vercel.app/)

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [What is Sequence Alignment?](#what-is-sequence-alignment)
3. [Real-World Applications](#real-world-applications)
4. [Benefits to the World](#benefits-to-the-world)
5. [Project Architecture](#project-architecture)
6. [Algorithms Implemented](#algorithms-implemented)
7. [Technical Implementation](#technical-implementation)
8. [API Reference](#api-reference)
9. [Testing & Correctness](#testing--correctness)
10. [Performance Analysis](#performance-analysis)
11. [How to Run the Project](#how-to-run-the-project)

---

## Project Overview

### What is BetterMatch?

**BetterMatch** is an **educational "white-box" web application** for biological sequence alignment that provides complete transparency into how dynamic programming algorithms work. Unlike "black-box" tools that only show results, BetterMatch allows students and researchers to:

- **Visualize** the Dynamic Programming (DP) table cell-by-cell as it's being computed
- **Understand** the scoring mechanism and traceback process
- **Compare** different algorithms side-by-side
- **Benchmark** performance on various sequence lengths
- **Learn** by exploring real biological sequences and synthetic datasets

### Core Mission

To serve as an **open-window learning tool** for the Design and Analysis of Algorithms course, specifically focusing on:
- String matching and sequence comparison
- Dynamic Programming paradigm
- Algorithm complexity analysis (Time and Space)
- Practical implementation of theoretical concepts

---

## What is Sequence Alignment?

### The Problem

Given two sequences (DNA, RNA, or Protein):
```
Sequence A: ACGTACG
Sequence B: AGGTAC
```

**Question:** What is the best way to align these sequences to identify similarities, mutations, and evolutionary relationships?

**Alignment Example:**
```
A C G T A C G
A G - G T A -
```

### Why Alignment Matters

Sequence alignment is about finding the **optimal way to match** characters between two sequences by:
- **Matching** identical characters (score: +1)
- **Mismatching** different characters (score: -1)
- **Inserting gaps** to improve overall alignment (score: -2)

### Three Types of Alignment

1. **Global Alignment**: Align entire sequences from start to end
2. **Local Alignment**: Find best-matching subsequences within longer sequences
3. **Affine Gap Alignment**: Different penalties for opening vs. extending gaps

---

## Real-World Applications

### 1. **Bioinformatics & Genomics**
- **Gene Discovery**: Identify unknown genes by aligning against known sequences
- **Mutation Detection**: Find mutations causing genetic diseases
- **Evolutionary Biology**: Track evolutionary distances between species
- **Disease Research**: Compare cancer DNA vs. normal DNA
- Example: COVID-19 variant tracking (Delta, Omicron variants identified via spike protein alignment)

### 2. **Medical & Pharmaceutical Research**
- **Drug Discovery**: Compare target protein structures
- **Disease Diagnosis**: Match patient DNA against disease databases
- **Vaccine Development**: Design vaccines by aligning viral sequences
- **Personalized Medicine**: Genetic profiling for treatment recommendations

### 3. **Population & Evolutionary Studies**
- **Species Classification**: Determine genetic relationships between organisms
- **Migration Patterns**: Track human population movements via genetic markers
- **Phylogenetic Trees**: Build evolutionary family trees
- **Conservation Biology**: Assess genetic diversity in endangered species

### 4. **Forensics & Criminal Justice**
- **DNA Fingerprinting**: Match suspect DNA to crime scenes
- **Paternity Testing**: Establish biological relationships
- **Missing Person Cases**: Identify remains using partial DNA

### 5. **Agriculture**
- **Crop Improvement**: Identify beneficial genetic traits
- **Disease-Resistant Varieties**: Cross-breed crops with desired immunity genes
- **Livestock Selection**: Optimize breeding for desired traits

### 6. **Biotechnology**
- **Protein Engineering**: Design modified proteins with improved properties
- **Enzyme Design**: Create enzymes for industrial applications
- **Synthetic Biology**: Design artificial organisms

---

## Benefits to the World

### Immediate Medical Benefits
- ✅ **Faster Disease Diagnosis**: Reduce time from weeks to hours
- ✅ **Precision Treatment**: Tailor medicines based on individual genetics
- ✅ **Epidemic Response**: Quickly identify pandemic variants
- ✅ **Prevention**: Identify genetic risk factors early

### Long-Term Scientific Impact
- ✅ **Understanding Life**: Decode how evolution works at molecular level
- ✅ **Combating Aging**: Identify genes associated with longevity
- ✅ **Cancer Research**: Develop targeted cancer therapies
- ✅ **Regenerative Medicine**: Grow replacement organs

### Economic & Social Value
- ✅ **Reduced Healthcare Costs**: Early detection saves billions in treatment
- ✅ **Job Creation**: New careers in genomics and bioinformatics
- ✅ **Food Security**: Better crops feed growing population
- ✅ **Reduced Animal Suffering**: Fewer trial-and-error drug tests

### Educational Value
- ✅ **Computer Science**: Teaches fundamental DP algorithms
- ✅ **Problem-Solving**: Shows real-world algorithmic thinking
- ✅ **Interdisciplinary Learning**: Bridges CS, Biology, Medicine
- ✅ **Industry Relevance**: Direct path to biotech careers

---

## Project Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     BetterMatch Platform                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────┐    ┌──────────────────────┐   │
│  │   Next.js Web UI       │    │   FastAPI Backend    │   │
│  │   (apps/web)           │    │   (apps/api)         │   │
│  │                        │    │                      │   │
│  │ • Align page           │◄──►│ • NW algorithm       │   │
│  │ • Benchmark page       │    │ • SW algorithm       │   │
│  │ • History storage      │    │ • Hirschberg algo    │   │
│  │ • DP visualization     │    │ • Gotoh algorithm    │   │
│  │ • Scoring display      │    │ • Banded NW algo     │   │
│  │ • Algorithm selector   │    │ • Benchmark runs     │   │
│  └────────────────────────┘    │ • Matrix lookup      │   │
│                                │ • FASTA parsing      │   │
│                                └──────────────────────┘   │
│                                          ▲                │
│                                          │                │
│                       ┌──────────────────┴──────────────┐│
│                       │   Algorithms Module             ││
│                       │   (apps/api/app/algorithms)    ││
│                       │                                 ││
│                       │ • needleman_wunsch.py          ││
│                       │ • smith_waterman.py            ││
│                       │ • hirschberg.py                ││
│                       │ • gotoh.py                     ││
│                       │ • banded.py                    ││
│                       │ • scoring.py                   ││
│                       │ • scoring_matrices.py          ││
│                       │ • stats_utils.py               ││
│                       └─────────────────────────────────┘│
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

#### Frontend
- **Framework**: Next.js 16 (React with App Router)
- **Styling**: Tailwind CSS
- **State Management**: localStorage for alignment history
- **Visualization**: Interactive DP table visualization
- **Language**: TypeScript

#### Backend
- **Framework**: FastAPI (Python)
- **Server**: Uvicorn
- **Core Language**: Python 3.9+
- **Testing**: pytest with 90%+ code coverage
- **Performance Monitoring**: Memory and time tracking

#### Deployment
- **Frontend**: Vercel (serverless)
- **Backend**: Hugging Face Spaces (Docker container)
- **Local**: Docker Compose (web + API containers)

### Directory Structure

```
BetterMatch/
├── apps/
│   ├── api/                          # Python backend
│   │   ├── app/
│   │   │   ├── main.py              # FastAPI entry point
│   │   │   └── algorithms/          # All 5+ algorithm implementations
│   │   │       ├── needleman_wunsch.py
│   │   │       ├── smith_waterman.py
│   │   │       ├── hirschberg.py
│   │   │       ├── gotoh.py
│   │   │       ├── banded.py
│   │   │       ├── scoring.py       # Match/mismatch scoring
│   │   │       ├── scoring_matrices.py # BLOSUM/PAM matrices
│   │   │       └── stats_utils.py   # Statistics calculations
│   │   ├── tests/                   # Unit tests for each algorithm
│   │   ├── requirements.txt         # Python dependencies
│   │   └── Dockerfile
│   │
│   └── web/                          # Next.js frontend
│       ├── src/
│       │   ├── app/
│       │   │   ├── page.tsx         # Home page (hero + algorithm cards)
│       │   │   ├── align/           # Main alignment interface
│       │   │   ├── benchmark/       # Performance benchmarking
│       │   │   ├── algorithms/      # Algorithm explanation pages
│       │   │   └── history/         # Alignment history viewer
│       │   ├── components/          # React components
│       │   │   ├── align/           # Sequence input fields
│       │   │   └── ui/              # UI components
│       │   ├── lib/                 # Utility functions
│       │   │   ├── api.ts          # API communication
│       │   │   ├── history-local.ts # localStorage management
│       │   │   └── sequence-validation.ts
│       │   └── types/               # TypeScript types
│       ├── package.json
│       └── Dockerfile
│
├── datasets/                         # Biological & synthetic sequences
│   ├── *.fasta                       # Biological sequences
│   ├── synthetic/                    # Synthetically generated pairs
│   ├── fetch_biological.py           # Download from GenBank
│   ├── run_biological_experiments.py # Run benchmarks
│   └── generate_synthetic.py         # Create test pairs
│
├── docs/
│   ├── CORRECTNESS_PROOFS.md        # Mathematical proofs
│   ├── QA_CHECKLIST.md              # Testing checklist
│   └── spec/
│       └── genalign_full_spec.html  # Course specification
│
├── docker-compose.yml               # Local deployment config
└── README.md
```

---

## Algorithms Implemented

### 1. Needleman-Wunsch (Global Alignment)

#### Algorithm Overview
**Needleman-Wunsch** is the classic global alignment algorithm that guarantees an optimal alignment across the **entire length** of both sequences.

#### Mathematical Formulation
Given sequences A (length m) and B (length n), the recurrence relation is:

$$
DP[i][j] = \max\begin{cases}
DP[i-1][j-1] + S(A_i, B_j) & \text{(diagonal: match/mismatch)} \\
DP[i-1][j] + g & \text{(up: deletion from B)} \\
DP[i][j-1] + g & \text{(left: insertion to B)}
\end{cases}
$$

Where:
- $S(A_i, B_j)$ = substitution score (+1 for match, -1 for mismatch)
- $g$ = gap penalty (typically -2)

#### Complexity Analysis
- **Time Complexity**: $O(m \times n)$ - Must fill every cell in m×n matrix
- **Space Complexity**: $O(m \times n)$ - Full matrix stored for visualization and traceback
- **Why O(m×n)?** Each cell depends only on 3 previous cells; constant work per cell

#### Implementation Steps
```python
# 1. Initialize DP table and traceback pointer table
DP[0][j] = j * gap  # First row: all gaps
DP[i][0] = i * gap  # First column: all gaps

# 2. Fill the DP table (recurrence relation)
for i from 1 to m:
    for j from 1 to n:
        diagonal = DP[i-1][j-1] + S(A[i], B[j])
        deletion = DP[i-1][j] + gap
        insertion = DP[i][j-1] + gap
        DP[i][j] = max(diagonal, deletion, insertion)
        # Store which choice gave max for traceback

# 3. Traceback to construct alignment
Start at DP[m][n] and follow pointers backward:
- If diagonal: match/mismatch occurred
- If up: deletion from sequence B
- If left: insertion to sequence B
```

#### Example
```
Input: A = "ACGTACG", B = "AGGTAC"
Output:
A C G T A C G
A G - G T A -
Score: 2 (matches: AC_GTA, gap penalties: -2, -2 = 4-2=2)
```

#### Key Insights
✓ **Optimal Substructure**: Every optimal alignment contains optimal alignments of prefixes
✓ **Greedy Fails Here**: Cannot decide locally; must consider entire alignment
✓ **Why DP Works**: Reuse computations; DP[i][j] depends only on 3 already-computed values

---

### 2. Smith-Waterman (Local Alignment)

#### Algorithm Overview
**Smith-Waterman** finds the **highest-scoring local subsequence match**, not necessarily spanning entire sequences. Perfect for finding conserved domains in proteins.

#### Key Difference from NW
- **NW**: Align entire sequences (global)
- **SW**: Find best local match within sequences

#### Mathematical Formulation
$$
DP[i][j] = \max\begin{cases}
0 & \text{(start fresh alignment)} \\
DP[i-1][j-1] + S(A_i, B_j) & \text{(diagonal)} \\
DP[i-1][j] + g & \text{(deletion)} \\
DP[i][j-1] + g & \text{(insertion)}
\end{cases}
$$

**Critical Difference**: The "0" option means we can start a new alignment anywhere, not forced from (0,0)!

#### Why This Works
1. **Initialize all cells to 0** (not gap penalties)
2. **Track maximum score** and its position
3. **Traceback starts from max position** (not corner)
4. **Stop when reaching 0** (end of highest-scoring local region)

#### Example
```
Sequence A: AGGGGG (long with low match)
Sequence B: ACGAAA (short with match in middle)

Local match found: GGG in A matches GGA in B
SW ignores the A's on both sides that don't contribute
```

#### Complexity Analysis
- **Time**: $O(m \times n)$ - Same matrix fill as NW
- **Space**: $O(m \times n)$ - Full matrix stored, plus "active region" tracking

#### Applications
- Finding **functional domains** in proteins across species
- Detecting **hidden sequence similarities**
- **BLAST** search (standard in NCBI) uses SW principles

---

### 3. Hirschberg's Algorithm (Space-Optimized Global)

#### The Problem
NW requires $O(m \times n)$ space. For very long sequences (e.g., full human genome):
- Human genome: ~3 billion base pairs
- NW would need: $3 \times 10^9 \times 3 \times 10^9 = 9 \times 10^{18}$ cells
- **Impossible to store!**

#### Hirschberg's Solution
Use **divide-and-conquer** to:
- Maintain only 2 rows of DP table at a time: $O(\min(m,n))$ space
- Still achieve **same optimal score as NW**
- Trade memory for slightly more computation

#### Algorithm Breakdown

**Phase 1: Find Optimal Split**
```
1. Compute forward NW scores from (0,0) to (m/2, j for all j)
   - Stores: previous row and current row only
   
2. Compute backward NW scores from (m, n) back to (m/2, j)
   - Reverse both sequences
   - Stores: previous row and current row only
   
3. Find optimal split column: j* that maximizes
   forward_score[m/2][j*] + backward_score[m/2][j*]
```

**Phase 2: Recursive Divide-and-Conquer**
```
1. Recursively solve top-left subproblem:
   Align A[0:m/2] with B[0:j*]
   
2. Recursively solve bottom-right subproblem:
   Align A[m/2:m] with B[j*:n]
   
3. Concatenate results
```

#### Complexity Analysis
- **Time**: $O(m \times n)$ - Same work as NW overall
  - First split: $O(m \times n)$
  - Then 2 subproblems: $2 \times O(m/2 \times n/2)$ (recursion tree)
  - Total: $O(m \times n)$ via master theorem
  
- **Space**: $O(\min(m,n))$ - Only 2 rows needed at any time
  - Audacious improvement from $O(m \times n)$!

#### Why This Works Mathematically
1. **Any global alignment** crosses the midpoint at some column j
2. **Optimal split** has maximum forward + backward score
3. **Combining optimal halves** gives globally optimal alignment
4. **Proof by contradiction**: If result wasn't optimal, contradiction at split point

#### Trade-offs
- ✅ **Saves Memory**: From quadratic to linear space
- ✅ **Same Score**: Identical optimal score as NW
- ❌ **Slower**: More recursive calls, not faster in time
- ⚠️ **Complex Code**: Harder to implement and debug

#### When to Use
- Aligning very long sequences (long genomes)
- Memory is limited (embedded systems, mobile)
- Speed less critical than memory efficiency

---

### 4. Gotoh Algorithm (Affine Gap Penalties)

#### The Problem with Linear Gaps
**Linear gap model**: Every gap costs the same (-2)
```
This penalizes: AAAAAA--- equally to A-A-A-A---
              (one 3-gap cost: -6)    (three 1-gaps: -6)
But biologically different!
```

**Reality**: Opening a gap vs. extending it are different events:
- **Gap opening**: -2 (starts a deletion/insertion)
- **Gap extension**: -0.5 (continuing same deletion/insertion)

#### Affine Gap Penalty Principle
$$\text{Total gap cost} = \text{gap\_open} + k \times \text{gap\_extend}$$

For a gap of length k:
- **Linear**: $k \times (-2) = -2k$
- **Affine**: $-2 + (k-1) \times (-0.5) = -0.5k - 1.5$

#### Three DP Matrices
Gotoh uses **three state machines**:

**M[i][j]**: Score when alignment ends with **Match/Mismatch**
$$M[i][j] = \max(A_i, B_i, C_i) + S(A_i, B_j)$$
- Can come from previous M (starting new gap)
- Can come from Ix (closing horizontal gap)
- Can come from Iy (closing vertical gap)

**Ix[i][j]**: Score when alignment ends with **gap in B** (delete from B)
$$Ix[i][j] = \max\begin{cases}
M[i-1][j] - \text{gap\_open} & \text{(start new gap)} \\
Ix[i-1][j] - \text{gap\_extend} & \text{(extend gap)}
\end{cases}$$

**Iy[i][j]**: Score when alignment ends with **gap in A** (insert to B)
$$Iy[i][j] = \max\begin{cases}
M[i][j-1] - \text{gap\_open} & \text{(start new gap)} \\
Iy[i][j-1] - \text{gap\_extend} & \text{(extend gap)}
\end{cases}$$

#### Implementation Outline
```python
# Initialize three DP matrices
M, Ix, Iy = [NEG_INF matrices]
M[0][0] = 0

# Fill using three separate recurrences
for i in 1 to m:
    for j in 1 to n:
        # Each matrix computed independently
        M[i][j] = max(M[i-1][j-1], Ix[i-1][j-1], Iy[i-1][j-1]) + S(A[i], B[j])
        Ix[i][j] = max(M[i-1][j] - gap_open, Ix[i-1][j] - gap_extend)
        Iy[i][j] = max(M[i][j-1] - gap_open, Iy[i][j-1] - gap_extend)

# Final score: best of three end states
score = max(M[m][n], Ix[m][n], Iy[m][n])
```

#### Complexity Analysis
- **Time**: $O(m \times n)$ - Three separate DP matrices, still O(mn) total
- **Space**: $O(m \times n)$ - Stores three full matrices
- **Why 3 matrices?**: Must track which "state" we're in (M/Ix/Iy)

#### Biological Realism
Affine gaps are **much more realistic** for real sequence evolution:
- **Insertions/Deletions** often happen as blocks, not scattered
- **Extending** existing gap is cheaper than starting new gap
- **Standard in bioinformatics**: BLAST, FASTA use affine gaps

---

### 5. Banded Needleman-Wunsch (Constrained Global)

#### The Problem
NW is slow on very long similar sequences:
- Example: Two bacterial genomes, ~99% identical
- If sequences are ~4MB each: $4 \times 10^6 \times 4 \times 10^6 = 1.6 \times 10^{13}$ cells
- Impossible to compute!

#### Observation
For very similar sequences, the optimal alignment path stays **near the diagonal** of the DP table.

#### Banded Solution
Only compute cells where: $|i - j| \leq k$ (within distance k from diagonal)

```
Full matrix:          Banded (k=2):
    0 1 2 3 4 5           0 1 2 3 4 5
0 . . . . . .          0 X X . . . .
1 . . . . . .          1 X X X . . .
2 . . . . . .          2 . X X X . .
3 . . . . . .          3 . . X X X .
4 . . . . . .          4 . . . X X X
5 . . . . . .          5 . . . . X X
                    (X = computed, . = skipped)
```

#### Parameters
- **Bandwidth k**: Maximum distance from diagonal
- **Small k**: Fast but risky (may miss optimal path)
- **Large k**: Slower but safer
- **Typical**: k = 50-100

#### Algorithm
```python
# Only fill cells where |i - j| <= k
for i in 1 to m:
    j_start = max(1, i - k)
    j_end = min(n, i + k)
    for j in j_start to j_end:
        # Normal NW recurrence, but:
        # Skip cells outside band (treat as -infinity)
```

#### Complexity
- **Time**: $O(m \times n \times k) / k = O(m \times n)$ in general...
  - Actually: $O(m \times 2k)$ if band width limited
  - For fixed k: **O(m)** or **O(n)** instead of **O(mn)**!
  
- **Space**: $O(n \times k)$ - Only store banded cells

#### Risk & Fallback
- **Risk**: Band too narrow → final cell unreachable
- **Detection**: Check if DP[m][n] = -∞
- **Fallback**: Hirschberg uses this + falls back to full NW if needed

#### When to Use
- Known sequences are very similar
- Sequences are **extremely long**
- Can tolerate risk of band exceeded

#### BetterMatch Implementation
```python
# In main.py: Global alignment endpoint
if use_banded:
    result = banded.align(..., bandwidth=bandwidth)
    if result['band_exceeded']:
        # Fall back to full NW
        result = needleman_wunsch.align(...)
```

---

### Comparison Matrix

| Algorithm | Type | Time | Space | Use Case |
|-----------|------|------|-------|----------|
| **NW** | Global | O(m×n) | O(m×n) | Standard full alignment |
| **SW** | Local | O(m×n) | O(m×n) | Find conserved domains |
| **Hirschberg** | Global | O(m×n) | O(min(m,n)) | **Very long sequences** |
| **Gotoh** | Global + Affine | O(m×n) | O(3m×n) | Realistic evolutionary model |
| **Banded NW** | Global + Constrained | O(m×k) | O(n×k) | **Similar long sequences** |

---

## Technical Implementation

### Scoring System

#### DNA/RNA Scoring
```python
def get_score(seq_a_char, seq_b_char, match=1, mismatch=-1):
    if seq_a_char == seq_b_char:
        return match     # +1
    else:
        return mismatch  # -1
```

#### Special Case: Ambiguous Nucleotide 'N'
- 'N' represents unknown nucleotide
- Matches any nucleotide with score 0 (neutral)
- Prevents over-penalizing uncertain data

#### Protein Scoring: Substitution Matrices
For protein sequences, different amino acid changes have different evolutionary costs:

**BLOSUM62** (Blocks Substitution Matrix):
- Derived from ~2000 protein blocks
- Positive scores: Conservative substitutions (similar amino acids)
- Negative scores: Rare substitutions (very different amino acids)
- Example: W↔Y (aromatic pair) ≈ -2 (similar)
- Example: D↔K (acidic↔basic) ≈ -3 (very different)

**PAM250** (Point Accepted Mutations):
- Based on evolutionary model
- Older, less commonly used than BLOSUM
- Different evolutionary distance assumptions

#### Available Matrices in BetterMatch
- BLOSUM62 (most common)
- BLOSUM45 (more divergent sequences)
- BLOSUM80 (very similar sequences)
- PAM250

### Memory & Performance Tracking

```python
# Every alignment result includes:
{
    "score": 42,                    # DP final score
    "aligned_a": "ACGTACG",        # Aligned sequence A
    "aligned_b": "AGGTAC-",        # Aligned sequence B with gaps
    "operations": ["M", "X", "D", "M", "M", "M", "I"],  # Op codes
    "matches": 5,                   # Perfect matches
    "mismatches": 1,                # Substitutions
    "gaps": 1,                      # Gap positions
    "identity": 71.43,              # Percent identity
    "identity_pct": 71.43,          # Statistics
    "similarity_pct": 85.71,        # With conservative subs
    "gap_pct": 14.29,               # Percent of alignment
    "alignment_length": 7,          # Total alignment length
    "dp_table": [[...], ...],       # Full DP matrix
    "traceback_path": [{"i":0,"j":0}, ...],  # Path through matrix
    "seq_a_len": 7,                 # Original lengths
    "seq_b_len": 6,
    "elapsed_ms": 45,               # Execution time
    "peak_memory_kb": 2048          # Memory used
}
```

### Statistics Calculation

**Identity** = Exact matches / Total alignment length
$$\text{Identity} = \frac{\text{Matches}}{\text{Alignment Length}} \times 100$$

**Similarity** = Matches + Conservative substitutions / Total length
- For DNA: Usually same as identity
- For proteins: Includes biochemically similar amino acids

**Gap Percentage** = Gap positions / Total length

---

## API Reference

### Base URL
- **Local**: `http://localhost:8000/api`
- **Production**: `https://<space-name>.hf.space/api`

### Endpoints

#### POST `/api/align/global`
Global alignment using Needleman-Wunsch (with optional banded fallback)

**Request:**
```json
{
  "seq_a": "ACGTACG",
  "seq_b": "AGGTAC",
  "match": 1,
  "mismatch": -1,
  "gap": -2,
  "use_blosum62": false,
  "matrix_name": null,
  "banded": false,
  "bandwidth": 50
}
```

**Response:**
```json
{
  "algorithm": "needleman-wunsch",
  "score": 2,
  "aligned_a": "ACG-TACG",
  "aligned_b": "A-GGTAC-",
  "operations": ["M", "D", "M", "I", "M", "M", "M", "I"],
  "matches": 4,
  "mismatches": 2,
  "gaps": 2,
  "identity_pct": 50.0,
  "dp_table": [[0, -2, -4, ...], ...],
  "traceback_path": [{"i": 0, "j": 0}, {"i": 1, "j": 1}, ...],
  "seq_a_len": 7,
  "seq_b_len": 6
}
```

#### POST `/api/align/local`
Local alignment using Smith-Waterman

**Similar request/response format**
- Includes `max_pos`: [i, j] of highest local score
- Includes `dp_active_region`: boolean matrix showing non-zero cells

#### POST `/api/align/optimized`
Space-optimized global using Hirschberg

**Response** differs:
- No full `dp_table` (space-efficient!)
- Includes `recursion_tree`: call tree structure
- Same optimal `score` as NW

#### POST `/api/align/gotoh`
Global with affine gap penalties

**Request adds**:
```json
{
  "gap_open": -2.0,
  "gap_extend": -0.5
}
```

**Response includes**:
```json
{
  "M_matrix": [...],      // Match/mismatch state matrix
  "Ix_matrix": [...],     // Gap in B state matrix
  "Iy_matrix": [...],     // Gap in A state matrix
  "score": 15.5           // Float score for affine
}
```

#### POST `/api/align`
Unified endpoint (specify algorithm)

```json
{
  "seq_a": "ACGTACG",
  "seq_b": "AGGTAC",
  "algorithm": "global"    // "global" | "local" | "optimized" | "gotoh"
}
```

#### POST `/api/align/all`
Run all algorithms in parallel

Returns array with NW, SW, Hirschberg, Gotoh results.
Enforces length limits to prevent timeout.

#### POST `/api/parse/fasta`
Parse FASTA file (multipart upload)

**Response:**
```json
{
  "sequences": [
    {"id": "seq1", "description": "...", "sequence": "ACGTACG"},
    {"id": "seq2", "description": "...", "sequence": "AGGTAC"}
  ]
}
```

#### GET `/api/benchmark`
List available benchmark results

```json
{
  "benchmarks": [
    {
      "length_a": 100,
      "length_b": 100,
      "algorithm": "needleman-wunsch",
      "time_ms": 2.34,
      "memory_kb": 512
    },
    ...
  ]
}
```

#### POST `/api/benchmark/run-sync`
Run full benchmark suite synchronously (production-ready)

**Request:**
```json
{
  "dataset": "synthetic",  // "synthetic" | "biological"
  "max_length": 5000
}
```

**Response:** List of timing/memory results for all algorithms

#### GET `/api/matrices`
Metadata about available scoring matrices

```json
{
  "matrices": {
    "BLOSUM62": {
      "name": "BLOSUM62",
      "type": "protein",
      "description": "Blocks Substitution Matrix"
    },
    ...
  }
}
```

---

## Testing & Correctness

### Test Strategy
- **Unit Tests**: Each algorithm tested independently
- **Integration Tests**: End-to-end API tests
- **Coverage Target**: 90%+ code coverage
- **Test Framework**: pytest

### Test Files

**`test_nw.py`** - Needleman-Wunsch tests
- Empty sequences
- Single character
- Identical sequences
- Completely different sequences
- Known correct outputs (validated manually)

**`test_sw.py`** - Smith-Waterman tests
- Local alignment properties
- Max position tracking
- Active region correctness

**`test_hirschberg.py`** - Hirschberg tests
- Score equivalence to NW
- Recursion tree correctness
- Space complexity verification

**`test_gotoh.py`** - Gotoh algorithm tests
- Affine gap behavior
- Three-matrix consistency
- Score validity

**`test_banded.py`** - Banded NW tests
- Band constraint enforcement
- Fallback detection

**`test_scoring.py`** - Scoring function tests
- Match/mismatch scoring
- Matrix lookups
- Ambiguous nucleotide handling

**`test_api.py`** - API integration tests
- Endpoint responses
- FASTA parsing
- Benchmark runs

### Running Tests
```bash
cd apps/api
pip install -r requirements.txt
pytest -v --cov=algorithms --cov-fail-under=90
```

### Correctness Proofs

#### Needleman-Wunsch Correctness
**Theorem**: NW returns optimal global alignment.

**Proof Sketch**:
1. **Optimal Substructure**: Every optimal alignment contains optimal prefix alignments (proven by contradiction)
2. **Inductive Recurrence**: Base cases correct, and each induction step considers all three possibilities
3. **Traceback Correctness**: Following predecessors backward reconstructs optimal alignment

#### Hirschberg Score Equivalence
**Theorem**: Hirschberg score = NW score.

**Proof Sketch**:
1. Any global alignment crosses midpoint at some column j*
2. Optimal split maximizes: forward_score[mid][j*] + backward_score[mid][j*]
3. Concatenating optimal halves achieves this score
4. No alignment can exceed this (split point bottleneck)
5. Therefore Hirschberg score ≥ any alignment score ≥ NW score
6. Thus Hirschberg score = NW score

#### Smith-Waterman Correctness
**Theorem**: SW returns optimal local alignment.

**Proof**: Identical to NW, but with:
- Initialization: All cells start at 0 (not gap penalties)
- Traceback: Start from max cell (not corner)
- Termination: Stop when reaching 0

---

## Performance Analysis

### Complexity Summary

| Algorithm | Time | Space | Best For |
|-----------|------|-------|----------|
| NW | O(m×n) | O(m×n) | **Standard use** |
| SW | O(m×n) | O(m×n) | **Local matching** |
| Hirschberg | O(m×n) | O(min(m,n)) | **Long sequences** |
| Gotoh | O(m×n) | O(3m×n) | **Realistic scoring** |
| Banded NW | O(m×k) | O(n×k) | **Similar sequences** |

### Experimental Results

From `datasets/EXPERIMENT_RESULTS.json`:

```
Length: 100 bp
  NW:       2.3ms,   45KB
  SW:       2.1ms,   45KB
  Hirschberg: 2.8ms,   8KB  (3x less memory!)
  Gotoh:    4.2ms,  135KB  (3 matrices)

Length: 1,000 bp
  NW:      45ms,   450KB
  SW:      42ms,   450KB
  Hirschberg: 62ms,    8KB
  Gotoh:    95ms, 1.3MB

Length: 5,000 bp
  NW:     1200ms,  11MB
  SW:     1100ms,  11MB
  Hirschberg: 1600ms,  10KB
  Gotoh:    2400ms, 33MB
```

### Memory Profile

```
NW:        O(m×n) - For 5000×5000: ~100MB
SW:        O(m×n) - For 5000×5000: ~100MB
Hirschberg: O(n)   - For 5000×5000: ~20KB (!!)
Gotoh:     O(3m×n) - For 5000×5000: ~300MB
Banded NW: O(n×k)  - For 5000×5000, k=50: ~2MB
```

### Why Hirschberg is Slower
Despite using less memory, Hirschberg is slower because:
1. **Repeated computation**: Recalculates rows multiple times
2. **Cache unfriendly**: Different memory access patterns
3. **Recursion overhead**: Function call stack overhead
4. **Trade-off justified**: Memory savings often worth time cost

---

## How to Run the Project

### Prerequisites
- Docker & Docker Compose (recommended)
- OR Python 3.9+ & Node.js 18+ (local dev)
- Git

### Option 1: Docker Compose (Recommended)

#### Setup
```bash
git clone <repo-url>
cd BetterMatch
docker compose up --build
```

#### Access
- **Web UI**: http://localhost:3000
- **API**: http://localhost:8000/api
- **API Docs**: http://localhost:8000/docs (Swagger)

#### Environment Variables
- **Web** (`apps/web/.env.local`):
  ```
  NEXT_PUBLIC_API_URL=http://localhost:8000/api
  ```

- **API** (`apps/api/.env`):
  ```
  CORS_ORIGINS=http://localhost:3000
  ```

### Option 2: Local Development

#### API (Python)
```bash
cd apps/api
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
cd app
uvicorn main:app --reload --port 8000
```

#### Web (Node.js)
```bash
cd apps/web
npm install
cp .env.example .env.local
npm run dev
# Opens at http://localhost:3000
```

### Option 3: Production Deployment

#### Vercel (Frontend)
1. Create Vercel project pointing to `apps/web`
2. Set `NEXT_PUBLIC_API_URL=https://<your-space>.hf.space/api`
3. Deploy

#### Hugging Face Spaces (Backend)
1. Create new Space
2. Select Docker template
3. Upload repository
4. Set Dockerfile path to `hf-space/Dockerfile`
5. Set environment: `CORS_ORIGINS=https://your-app.vercel.app`

---

## Using the Web Application

### Home Page
- Overview of all 5 algorithms
- Complexity information
- Links to align, benchmark, history pages

### Align Page
1. **Enter sequences**: Paste DNA/RNA or protein sequences
2. **Choose algorithm**: Select NW, SW, Hirschberg, Gotoh, or "All"
3. **Set parameters**:
   - Match score (default: 1)
   - Mismatch score (default: -1)
   - Gap penalty (default: -2)
   - Scoring matrix (for proteins)
4. **Run alignment**: Click "Align"
5. **Visualize**:
   - DP table with colored cells
   - Traceback path highlighted
   - Operations listed (M/X/I/D)
   - Statistics displayed
6. **Export**: Download results or add to history

### Benchmark Page
1. Select dataset (synthetic or biological)
2. Set sequence lengths
3. Run benchmark across all algorithms
4. View:
   - Execution times
   - Memory usage
   - Throughput
   - Charts comparing performance

### History Page
- View all past alignments (stored in localStorage)
- Re-run previous alignments
- Compare results
- Clear history

### Algorithm Pages
- Detailed explanation of each algorithm
- Pseudocode
- Complexity analysis
- Real-world examples

---

## Project Statistics

- **Total Lines of Code**: ~3000
- **Python (Backend)**: ~1500 lines
- **TypeScript/JSX (Frontend)**: ~1500 lines
- **Test Coverage**: 90%+
- **Algorithms Implemented**: 5 major (+ variants)
- **Supported Scoring Matrices**: 4 (BLOSUM62/45/80, PAM250)
- **Test Cases**: 50+
- **Deployed Platforms**: Vercel, Hugging Face Spaces, Docker

---

## Educational Value

### For Students
- ✅ Understand DP paradigm through hands-on
- ✅ See real-world applications of algorithms
- ✅ Learn complexity analysis empirically
- ✅ Practice algorithm implementation
- ✅ Prepare for technical interviews

### For Instructors
- ✅ Engaging assignment/project baseline
- ✅ Interactive teaching tool
- ✅ Correctness proofs provided
- ✅ Extensible architecture
- ✅ Real datasets included

### For Industry
- ✅ Portfolio project demonstrating algorithms knowledge
- ✅ Full-stack development example (Python + TypeScript)
- ✅ DevOps experience (Docker, deployment)
- ✅ Software testing best practices

---

## Key Takeaways

### What Makes BetterMatch Special
1. **Educational Focus**: Designed to teach, not just compute
2. **White-Box Visualization**: See the algorithm in action
3. **Multiple Implementations**: Compare 5 different approaches
4. **Real Data**: Test on biological sequences
5. **Proven Correctness**: Mathematical proofs included
6. **Production Quality**: 90%+ test coverage, deployed at scale

### Algorithm Insights
- **NW**: Standard, reliable, memory-intensive
- **SW**: Finding hidden patterns locally
- **Hirschberg**: Space efficiency through divide-and-conquer
- **Gotoh**: Realistic biological modeling
- **Banded**: Specialization for similar sequences

### Engineering Principles
- **Trade-offs**: Speed vs. memory, correctness vs. optimization
- **Testing**: Comprehensive coverage ensures reliability
- **Scalability**: Can handle real bioinformatics workloads
- **Usability**: Beautiful UI makes complex algorithms accessible

---

## Future Enhancements

Possible extensions to BetterMatch:
- Multiple sequence alignment (MSA)
- BLAST-style database search
- Phylogenetic tree construction
- Codon usage analysis
- Secondary structure prediction
- Cloud-scale distributed alignment
- Machine learning integration

---

## Conclusion

**BetterMatch** is a comprehensive educational platform that bridges theoretical computer science and real-world bioinformatics. By implementing and visualizing five major sequence alignment algorithms, it demonstrates:

1. **Correctness**: Mathematical proofs ensure algorithms work as intended
2. **Efficiency**: Trade-offs between time and space explored empirically
3. **Scalability**: From toy examples to real genomic data
4. **Practicality**: Direct application in medical research and drug discovery

Whether you're a student learning algorithm design, a researcher validating implementations, or an engineer exploring bioinformatics, BetterMatch provides an interactive, transparent window into one of computer science's most impactful application domains.

---

## References

### Academic
- Needleman, S. B., & Wunsch, C. D. (1970). A general method applicable to the search for similarities in the amino acid sequence of two proteins.
- Smith, T. F., & Waterman, M. S. (1981). Identification of common molecular subsequences.
- Hirschberg, D. S. (1975). A linear space algorithm for computing maximal common subsequences.
- Gotoh, O. (1982). An improved algorithm for matching biological sequences.

### Online Resources
- NCBI BLAST: https://blast.ncbi.nlm.nih.gov
- ExPASy: https://www.expasy.org
- Rosalind: http://rosalind.info (bioinformatics problem sets)

### Course Materials
- Course Specification: See `docs/spec/genalign_full_spec.html`
- Correctness Proofs: See `docs/CORRECTNESS_PROOFS.md`
- QA Checklist: See `docs/QA_CHECKLIST.md`

---

**Last Updated**: May 8, 2026  
**Status**: Complete & Production-Ready  
**License**: Educational (NUST CS-251 DAA Course)
