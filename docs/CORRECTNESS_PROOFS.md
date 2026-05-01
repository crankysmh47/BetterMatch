# Correctness notes — NW DP and Hirschberg (course report section)

Formal arguments below match the implementation in `apps/api/app/algorithms/` (linear-gap NW, standard recurrence).

---

## 1. Optimal substructure (Needleman–Wunsch)

**Claim.** Let \(A=a_1\ldots a_m\), \(B=b_1\ldots b_n\). If global alignment \( \mathcal{A}^\star \) of \(A\) and \(B\) is optimal (maximum score under match/mismatch/gap scoring), then for every prefix pair \((i,j)\) with \(0\le i\le m\), \(0\le j\le n\), the restriction of \( \mathcal{A}^\star \) to aligning \(a_1\ldots a_i\) with \(b_1\ldots b_j\) is an optimal alignment of those prefixes.

**Contradiction sketch.** Suppose some restriction to \((i,j)\) were suboptimal: there exists an alignment \(\mathcal{A}'\) of \(a_1\ldots a_i\) with \(b_1\ldots b_j\) with strictly larger score than the prefix induced by \( \mathcal{A}^\star \). Concatenate \(\mathcal{A}'\) with the suffix alignment that \( \mathcal{A}^\star \) uses from \((i,j)\) onward (replacing the original prefix). Gap structure stays consistent at the splice because both pieces align disjoint stretches of \(A\) and \(B\) in order. The total score strictly increases, contradicting optimality of \( \mathcal{A}^\star \).

Hence optimal global alignments decompose into optimal alignments of prefixes; this justifies the NW DP state \(dp[i,j]\) as best score for prefixes \(a_{1..i}\), \(b_{1..j}\).

---

## 2. Inductive correctness of the NW recurrence

**Base.** \(dp[0,j]=j\cdot g\) and \(dp[i,0]=i\cdot g\) for linear gap \(g\) charge exactly \(j\) (resp. \(i\)) gaps with no matches — optimal for empty-vs-prefix cases.

**Step.** For \(i,j\ge 1\),

\[
dp[i,j]=\max\bigl(dp[i\!-\!1,j\!-\!1]+s(a_i,b_j),\; dp[i\!-\!1,j]+g,\; dp[i,j\!-\!1]+g\bigr)
\]

enumerates exactly the three ways the last column pair can end: diagonal (match/mismatch), deletion from \(B\) (gap in \(B\)), insertion into \(B\) (gap in \(A\)), with scores additive under linear gaps.

By induction on \(i+j\), assuming \(dp[i-1,j]\), \(dp[i,j-1]\), \(dp[i-1,j-1]\) store optimal prefix scores, each candidate extends an optimal shorter prefix by one feasible operation; maximality over the three possibilities yields the optimum for \((i,j)\).

---

## 3. Hirschberg vs NW optimal score

**Statement.** For fixed sequences and linear-gap NW scoring (same substitution function), Hirschberg’s algorithm returns an alignment whose **score equals** the NW optimum. Alignments need not be identical when ties exist.

**Outline.** Hirschberg recursively splits \(A\) at midpoint \(mid\), computes forward NW scores for \(a_{1..mid}\) vs all prefixes of \(B\) and backward scores for \(a_{mid+1..m}\) vs suffixes of \(B\), then chooses split column \(j^\star\) maximizing the sum of forward and backward optimal scores at that junction. Any global alignment induces some split column \(j\) where the optimal alignment crosses from the top half of \(A\) to the bottom half; its score is bounded by the forward score at \((mid,j)\) plus backward score from \((mid,j)\) to \((m,n)\). Maximizing over \(j\) therefore cannot exceed the global optimum. Conversely, concatenating optimal alignments on \(a_{1..mid}:b_{1..j^\star}\) and \(a_{mid+1..m}:b_{j^\star+1..n}\) achieves exactly that split score; recursion on strictly shorter subproblems terminates on bases solved by brute-force NW. Thus the constructed alignment attains the NW optimum score.

*(Full rigour expands the backward formulation as alignment of reversed suffixes; same logic applies when banded row scoring is used, provided row scoring matches NW inside the band.)*
