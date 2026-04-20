### Project Execution Plan: BetterMatch

This plan is structured for rapid, iterative development to ensure you hit both the algorithmic requirements for the course and the functional requirements of a web platform.

#### Phase 1: The Algorithmic Engine (Days 1-4)
Focus entirely on Python and the math. The goal is to get raw text sequences in and exact alignments out, verified against known biological benchmarks.
* [ ] Set up a modular Python repository.
* [ ] Implement Needleman-Wunsch and write unit tests using tiny synthetic sequences.
* [ ] Implement Smith-Waterman and write unit tests for local substring matches.
* [ ] Implement Hirschberg’s algorithm. Test it aggressively against Needleman-Wunsch to ensure the outputs match exactly, verifying the space optimization didn't break the alignment logic.
* [ ] Integrate BioPython strictly to parse raw `.fasta` files from the NCBI database into clean strings for your engine.

#### Phase 2: Empirical Benchmarking & Proofs (Days 5-7)
Nail down the academic DAA requirements before getting distracted by the UI. 
* [ ] Write a benchmarking script using the `time` and `tracemalloc` libraries.
* [ ] Run Needleman-Wunsch vs. Hirschberg's on increasingly larger sequences (e.g., 100bp, 1,000bp, 10,000bp).
* [ ] Generate data tables proving the $O(n)$ space efficiency of Hirschberg's against the $O(m \times n)$ explosion of standard NW. 
* [ ] Draft the formal optimal substructure correctness proofs required for the final report.

#### Phase 3: Backend API Architecture (Days 8-10)
Bridge the algorithmic engine to the web.
* [ ] Initialize a FastAPI project.
* [ ] Create REST endpoints for each algorithm (e.g., `/api/align/global`, `/api/align/local`, `/api/align/optimized`).
* [ ] Define strict JSON schemas for the request payloads (Sequence A, Sequence B, gap penalty, match score).
* [ ] Set up a lightweight PostgreSQL database to store historical alignments and execution metrics.

#### Phase 4: Frontend & Visualization (Days 11-16)
Build the "White-Box" educational interface that makes BetterMatch stand out.
* [ ] Set up a React frontend with a clean, clinical UI.
* [ ] Build the sequence input forms (allowing raw text paste or `.fasta` file uploads).
* [ ] **The DP Table Visualizer:** Use the Canvas API or a heavily optimized grid component to render the DP matrix. 
* [ ] Build an animation controller (Play, Pause, Step) that allows users to watch the matrix fill dynamically. *Note: Limit this visualizer to smaller sequences (e.g., < 50 length) to avoid freezing the browser thread.*
* [ ] Build the alignment output view, color-coding matches, mismatches, and gaps for easy readability.

#### Phase 5: Final Integration & Deployment (Days 17-21)
Lock down the application and prepare for the presentation.
* [ ] Connect the React frontend to the FastAPI backend.
* [ ] Test end-to-end flow with real biological data (e.g., comparing the original COVID-19 spike protein against the Omicron variant).
* [ ] Deploy the backend and database (e.g., Render, Railway, or a university server).
* [ ] Deploy the frontend (e.g., Vercel, Netlify).
* [ ] Finalize the project report, ensuring all architectural decisions, time/space complexity charts, and algorithmic proofs are clearly documented.


#### Algorithmic Requirements
* [ ] Scoring Matrix Parser:** Implement a parser to load and apply substitution matrices (like BLOSUM62 for proteins or simple match/mismatch/gap scores for nucleotides).
* [ ] Needleman-Wunsch (Global Alignment):**
    * [ ] $O(m \times n)$ 2D matrix initialization.
    * [ ] Cell scoring logic (max of diagonal, up, and left).
    * [ ] Standard traceback algorithm starting from the bottom-right cell.
* [ ] Smith-Waterman (Local Alignment):**
    * [ ] Modified matrix initialization (floor scores at 0).
    * [ ] Track the maximum score coordinates during the matrix fill phase to avoid a secondary search.
    * [ ] Traceback algorithm starting from the maximum score coordinate and terminating at the first 0.
* [ ] Hirschberg’s Algorithm (Space-Optimized Global Alignment):**
    * [ ] **Linear Space Scorer:** Implement the forward and reverse 1D array passes that only keep the current and previous rows in memory, dropping the space complexity to $O(n)$.
    * [ ] **Divide-and-Conquer Recursive Split:** Implement the logic to find the optimal midpoint, split the sequences, and recursively call the algorithm until base cases are met.
    * [ ] Sequence concatenation to rebuild the final alignment path.

---
