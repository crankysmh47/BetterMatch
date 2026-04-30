### Project Execution Plan: BetterMatch

#### Phase 1: The Algorithmic Engine
Focus entirely on Python and the math. The goal is to get raw text sequences in and exact alignments out, verified against known biological benchmarks.
* [x] Set up a modular Python repository.
* [x] Implement Needleman-Wunsch and write unit tests using tiny synthetic sequences.
* [x] Implement Smith-Waterman and write unit tests for local substring matches.
* [x] Implement Hirschberg’s algorithm. Test it aggressively against Needleman-Wunsch to ensure the outputs match exactly, verifying the space optimization didn't break the alignment logic.
* [x] Integrate BioPython strictly to parse raw `.fasta` files from the NCBI database into clean strings for your engine.

#### Phase 2: Empirical Benchmarking & Proofs
Nail down the academic DAA requirements before getting distracted by the UI. 
* [x] Write a benchmarking script using the `time` and `tracemalloc` libraries.
* [x] Run Needleman-Wunsch vs. Hirschberg's on increasingly larger sequences (e.g., 100bp, 1,000bp, 10,000bp).
* [x] Generate data tables proving the $O(n)$ space efficiency of Hirschberg's against the $O(m \times n)$ explosion of standard NW. 
* [ ] Draft the formal optimal substructure correctness proofs required for the final report.

#### Phase 3: Backend API Architecture
Bridge the algorithmic engine to the web.
* [x] Initialize a FastAPI project.
* [x] Create REST endpoints for each algorithm (e.g., `/api/align/global`, `/api/align/local`, `/api/align/optimized`).
* [x] Define strict JSON schemas for the request payloads (Sequence A, Sequence B, gap penalty, match score).
* [x] Set up a lightweight PostgreSQL database to store historical alignments and execution metrics.

#### Phase 4: Frontend & Visualization
Build the "White-Box" educational interface that makes BetterMatch stand out.
* [x] Set up a React frontend with a clean, clinical UI.
* [x] Build the sequence input forms (allowing raw text paste or `.fasta` file uploads).
* [x] **The DP Table Visualizer:** Use the Canvas API or a heavily optimized grid component to render the DP matrix. 
* [x] Build an animation controller (Play, Pause, Step) that allows users to watch the matrix fill dynamically. *Note: Limit this visualizer to smaller sequences (e.g., < 50 length) to avoid freezing the browser thread.*
* [x] Build the alignment output view, color-coding matches, mismatches, and gaps for easy readability.

#### Phase 5: Final Integration & Deployment
Lock down the application and prepare for the presentation.
* [/] Connect the React frontend to the FastAPI backend.
* [ ] Test end-to-end flow with real biological data (e.g., comparing the original COVID-19 spike protein against the Omicron variant).
* [ ] Deploy the backend and database (e.g., Render, Railway, or a university server).
* [ ] Deploy the frontend (e.g., Vercel, Netlify).
* [ ] Finalize the project report, ensuring all architectural decisions, time/space complexity charts, and algorithmic proofs are clearly documented.


#### Algorithmic Requirements
* [x] Scoring Matrix Parser:** Implement a parser to load and apply substitution matrices (like BLOSUM62 for proteins or simple match/mismatch/gap scores for nucleotides).
* [x] Needleman-Wunsch (Global Alignment):**
    * [x] $O(m \times n)$ 2D matrix initialization.
    * [x] Cell scoring logic (max of diagonal, up, and left).
    * [x] Standard traceback algorithm starting from the bottom-right cell.
* [x] Smith-Waterman (Local Alignment):**
    * [x] Modified matrix initialization (floor scores at 0).
    * [x] Track the maximum score coordinates during the matrix fill phase to avoid a secondary search.
    * [x] Traceback algorithm starting from the maximum score coordinate and terminating at the first 0.
* [x] Hirschberg’s Algorithm (Space-Optimized Global Alignment):**
    * [x] **Linear Space Scorer:** Implement the forward and reverse 1D array passes that only keep the current and previous rows in memory, dropping the space complexity to $O(n)$.
    * [x] **Divide-and-Conquer Recursive Split:** Implement the logic to find the optimal midpoint, split the sequences, and recursively call the algorithm until base cases are met.
    * [x] Sequence concatenation to rebuild the final alignment path.

---
