'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useToastStore } from '@/lib/toast-store';
import type { AlignResult, AllResults, Algorithm, AlignRequest } from '@/types/alignment';
import AlignmentOutput from '@/components/ui/AlignmentOutput';
import DPCanvasVisualizer from '@/components/ui/DPCanvasVisualizer';
import HirschbergTree from '@/components/ui/HirschbergTree';
import AlignHistoryDrawer, { type HistoryRestorePayload } from '@/components/ui/AlignHistoryDrawer';
import SequenceField from '@/components/align/SequenceField';
import { canonicalSequenceLetters, hasInvalidLetters } from '@/lib/sequence-validation';
import { matrixPreviewGrid, type MatrixName } from '@/lib/matrix-preview';

type CoreAlgo = Exclude<Algorithm, 'all'>;

const CORE_ALGOS: {
  value: CoreAlgo;
  title: string;
  typeBadge: string;
  time: string;
  space: string;
  summary: string;
  useCase: string;
  ascii: string;
}[] = [
  {
    value: 'global',
    title: 'Needleman–Wunsch',
    typeBadge: 'Global',
    time: 'O(m×n)',
    space: 'O(m×n)',
    summary: 'Classic global pairwise alignment; fills full DP table.',
    useCase: 'Similar-length sequences; need optimal alignment end-to-end.',
    ascii: 'seqA ────────\nseqB ────────\n     ↑ full grid',
  },
  {
    value: 'local',
    title: 'Smith–Waterman',
    typeBadge: 'Local',
    time: 'O(m×n)',
    space: 'O(m×n)',
    summary: 'Best-scoring local segment; starts/stops anywhere.',
    useCase: 'Motifs, repeats, or partial homology.',
    ascii: 'seqA    [best]\nseqB    [best]\n       ↑ island',
  },
  {
    value: 'optimized',
    title: "Hirschberg's",
    typeBadge: 'Global',
    time: 'O(m×n)',
    space: 'O(min(m,n))',
    summary: 'Divide-and-conquer global alignment; linear auxiliary space.',
    useCase: 'Large sequences when memory matters.',
    ascii: '    /\n   /\n  split … merge\n',
  },
  {
    value: 'gotoh',
    title: 'Gotoh',
    typeBadge: 'Affine',
    time: 'O(m×n)',
    space: 'O(m×n)',
    summary: 'Affine gap costs via three DP layers (M, Ix, Iy).',
    useCase: 'Long indels cheaper than many tiny gaps.',
    ascii: 'open ███ … extend ░░',
  },
];

const EXAMPLES = [
  { label: 'Simple DNA', a: 'AGCTGAC', b: 'AGCGAC' },
  {
    label: 'COVID vs Omicron (spike excerpt)',
    a: 'MFVFLVLLPLVSSQCVNLTTRTQLPPAYTNSFTRGVYYPDKVFRSSVLHSTQDLFLPFFSNVTWFHAIHVSGTNGTKRFDNPVLPFNDGVYFASTEKSNIIRGWIFGTTLDSKTQSLLIVNNATNVVIKVCEFQFCNDPFLGVYYHKNNKSWMESEFRVYSSANNCTFEYVSQPFLMDLEGKQGNFKNLREFVFKNIDGYFKIYSKHTPINLVRDLPQGFSALEPLVDLPIGINITRFQTLLALHRSYLTPGDSSSGWTAGAAAYYVGYLQPRTFLLKYNENGTITDAVDCALDPLSETKCTLKSFTVEKGIYQTSNFRVQPTESIVRFPNITNLCPFGEVFNATRFASVYAWNRKRISNCVADYSVLYNSASFSTFKCYGVSPTKLNDLCFTNVYADSFVIRGDEVRQIAPGQTGKIADYNYKLPDDFTGCVIAWNSNNLDSKVGGNYNYLYRLFRKSNLKPFERDISTEIYQAGSTPCNGVEGFNCYFPLQSYGFQPTNGVGYQPYRVVVLSFELLHAPATVCGPKKSTNLVKNKCVNFNFNGLTGTGVLTESNKKFLPFQQFGRDIADTTDAVRDPQTLEILDITPCSFGGVSVITPGTNTSNQVAVLYQDVNCTEVPVAIHADQLTPTWRVYSTGSNVFQTRAGCLIGAEHVNNSYECDIPIGAGICASYQTQTNSPRRARSVASQSIIAYTMSLGAENSVAYSNNSIAIPTNFTISVTTEILPVSMTKTSVDCTMYICGDSTECSNLLLQYGSFCTQLNRALTGIAVEQDKNTQEVFAQVKQIYKTPPIKDFGGFNFSQILPDPSKPSKRSFIEDLLFNKVTLADAGFIKQYGDCLGDIAARDLICAQKFNGLTVLPPLLTDEMIAQYTSALLAGTITSGWTFGAGAALQIPFAMQMAYRFNGIGVTQNVLYENQKLIANQFNSAIGKIQDSLSSTASALGKLQDVVNQNAQALNTLVKQLSSNFGAISSVLNDILSRLDKVEAEVQIDRLITGRLQSLQTYVTQQLIRAAEIRASANLAATKMSECVLGQSKRVDFCGKGYHLMSFPQSAPHGVVFLHVTYVPAQEKNFTTAPAICHDGKAHFPREGVFVSNGTHWFVTQRNFYEPQIITTDNTFVSGNCDVVIGIVNNTVYDPLQPELDSFKEELDKYFKNHTSPDVDLGDISGINASVVNIQKEIDRLNEVAKNLNESLIDLQELGKYEQYIKWPWYIWLGFIAGLIAIVMVTIMLCCMTSCCSCLKGCCSCGSCCKFDEDDSEPVLKGVKLHYT',
    b: 'MFVFLVLLPLVSSQCVNLITRTQLPPAYTNSFTRGVYYPDKVFRSSVLHSTQDLFLPFFSNVTWFHAIHVSGTNGTKRFDNPVLPFNDGVYFASTEKSNIIRGWIFGTTLDSKTQSLLIVNNATNVVIKVCEFQFCNDPFLGVYYHKNNKSWMESEFRVYSSANNCTFEYVSQPFLMDLEGKQGNFKNLREFVFKNIDGYFKIYSKHTPINLVRDLPQGFSALEPLVDLPIGINITRFQTLLALHRSYLTPGDSSSGWTAGAAAYYVGYLQPRTFLLKYNENGTITDAVDCALDPLSETKCTLKSFTVEKGIYQTSNFRVQPTESIVRFPNITNLCPFGEVFNATRFASVYAWNRKRISNCVADYSVLYNSASFSTFKCYGVSPTKLNDLCFTNVYADSFVIRGDEVRQIAPGQTGKIADYNYKLPDDFTGCVIAWNSNNLDSKVGGNYNYLYRLFRKSNLKPFERDISTEIYQAGSTPCNGVEGFNCYFPLQSYGFQPTNGVGYQPYRVVVLSFELLHAPATVCGPKKSTNLVKNKCVNFNFNGLTGTGVLTESNKKFLPFQQFGRDIADTTDAVRDPQTLEILDITPCSFGGVSVITPGTNTSNQVAVLYQDVNCTEVPVAIHADQLTPTWRVYSTGSNVFQTRAGCLIGAEHVNNSYECDIPIGAGICASYQTQTNSPRRARSVASQSIIAYTMSLGAENSVAYSNNSIAIPTNFTISVTTEILPVSMTKTSVDCTMYICGDSTECSNLLLQYGSFCTQLNRALTGIAVEQDKNTQEVFAQVKQIYKTPPIKDFGGFNFSQILPDPSKPSKRSFIEDLLFNKVTLADAGFIKQYGDCLGDIAARDLICAQKFNGLTVLPPLLTDEMIAQYTSALLAGTITSGWTFGAGAALQIPFAMQMAYRFNGIGVTQNVLYENQKLIANQFNSAIGKIQDSLSSTASALGKLQDVVNQNAQALNTLVKQLSSNFGAISSVLNDILSRLDKVEAEVQIDRLITGRLQSLQTYVTQQLIRAAEIRASANLAATKMSECVLGQSKRVDFCGKGYHLMSFPQSAPHGVVFLHVTYVPAQEKNFTTAPAICHDGKAHFPREGVFVSNGTHWFVTQRNFYEPQIITTDNTFVSGNCDVVIGIVNNTVYDPLQPELDSFKEELDKYFKNHTSPDVDLGDISGINASVVNIQKEIDRLNEVAKNLNESLIDLQELGKYEQYIKWPWYIWLGFIAGLIAIVMVTIMLCCMTSCCSCLKGCCSCGSCCKFDEDDSEPVLKGVKLHYT',
  },
];

function ParamSlider(props: {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const { label, min, max, step = 1, value, onChange, disabled } = props;
  return (
    <label className={`space-y-1 block ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      <div className="flex justify-between gap-2 text-xs">
        <span className="text-[var(--text-muted)]">{label}</span>
        <span className="font-mono text-[var(--text-primary)] tabular-nums">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full accent-[var(--accent-teal)] bg-[var(--bg-deep)] appearance-none cursor-pointer disabled:cursor-not-allowed [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--accent-teal)]"
      />
    </label>
  );
}

export default function AlignPage() {
  const toast = useToastStore((s) => s.push);
  const [seqA, setSeqA] = useState('AGCTGAC');
  const [seqB, setSeqB] = useState('AGCGAC');
  const [algo, setAlgo] = useState<Algorithm>('global');
  const [match, setMatch] = useState(2);
  const [mismatch, setMismatch] = useState(-1);
  const [gap, setGap] = useState(-1);
  const [mode, setMode] = useState<'dna' | 'protein'>('dna');
  const [matrixName, setMatrixName] = useState<MatrixName>('BLOSUM62');
  const [gapOpen, setGapOpen] = useState(-2);
  const [gapExtend, setGapExtend] = useState(-0.5);
  const [banded, setBanded] = useState(false);
  const [bandwidth, setBandwidth] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AlignResult | null>(null);
  const [allResults, setAllResults] = useState<AllResults | null>(null);
  const [showDPTable, setShowDPTable] = useState(true);
  const [gotohTab, setGotohTab] = useState<'M' | 'Ix' | 'Iy'>('M');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [colourA, setColourA] = useState(true);
  const [colourB, setColourB] = useState(true);
  const [fastaBusy, setFastaBusy] = useState<'a' | 'b' | null>(null);
  const [swapFlash, setSwapFlash] = useState(false);
  const [vizSeqA, setVizSeqA] = useState('');
  const [vizSeqB, setVizSeqB] = useState('');
  const [nwBaselineKb, setNwBaselineKb] = useState<number | null>(null);
  const [seqHiA, setSeqHiA] = useState<number | null>(null);
  const [seqHiB, setSeqHiB] = useState<number | null>(null);

  const canonA = canonicalSequenceLetters(seqA);
  const canonB = canonicalSequenceLetters(seqB);
  const invalidA = hasInvalidLetters(seqA, mode);
  const invalidB = hasInvalidLetters(seqB, mode);
  const submitBlocked =
    loading || !canonA.length || !canonB.length || invalidA || invalidB || (banded && bandwidth < 1);

  const restoreFromHistory = useCallback((p: HistoryRestorePayload) => {
    setSeqA(p.seqA);
    setSeqB(p.seqB);
    setAlgo(p.algo);
    setMatch(p.match);
    setMismatch(p.mismatch);
    setGap(p.gap);
    setMode(p.mode);
    setMatrixName(p.matrixName);
    setGapOpen(p.gapOpen);
    setGapExtend(p.gapExtend);
    setBanded(p.banded);
    setBandwidth(p.bandwidth);
    setResult(null);
    setAllResults(null);
    setError(null);
    setShowDPTable(true);
    setVizSeqA('');
    setVizSeqB('');
  }, []);

  const handleFastaUpload = async (which: 'a' | 'b', setter: (v: string) => void, file: File) => {
    setFastaBusy(which);
    try {
      const parsed = await api.parseFasta(file, mode);
      const seqs = parsed.sequences ?? [];
      if (!seqs.length) {
        toast({ type: 'error', title: 'FASTA parse failed', detail: 'No sequences found in file.' });
        return;
      }
      setter(seqs[0].sequence ?? '');
      const warn = parsed.warning ? ` ${parsed.warning}` : '';
      toast({ type: 'success', title: 'FASTA loaded', detail: `${seqs[0].id}.${warn}` });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      toast({ type: 'error', title: 'FASTA parse failed', detail: msg });
    } finally {
      setFastaBusy(null);
    }
  };

  const swapSequences = () => {
    setSwapFlash(true);
    const nextA = seqB;
    const nextB = seqA;
    const nextCa = colourB;
    const nextCb = colourA;
    window.setTimeout(() => {
      setSeqA(nextA);
      setSeqB(nextB);
      setColourA(nextCa);
      setColourB(nextCb);
    }, 100);
    window.setTimeout(() => setSwapFlash(false), 220);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setAllResults(null);
    setLoading(true);
    try {
      const algoKey =
        algo === 'global' ? 'nw' :
        algo === 'local' ? 'sw' :
        algo === 'optimized' ? 'hirschberg' :
        algo === 'gotoh' ? 'gotoh' : 'nw';

      const body: AlignRequest = {
        seq_a: canonA,
        seq_b: canonB,
        algorithm: algoKey,
        match,
        mismatch,
        gap,
        use_blosum62: mode === 'protein',
        mode,
        matrix_name: mode === 'protein' ? matrixName : undefined,
        gap_open: gapOpen,
        gap_extend: gapExtend,
        banded: banded && (algo === 'global' || algo === 'optimized' || algo === 'all'),
        bandwidth,
      };

      if (algo === 'all') {
        const data = await api.alignAll(body);
        setAllResults(data);
        setVizSeqA(body.seq_a);
        setVizSeqB(body.seq_b);
        setNwBaselineKb(data.needleman_wunsch.peak_memory_kb);
        api.saveAlignmentRun(body, seqA, seqB, data.needleman_wunsch);
      } else {
        let data: AlignResult;
        if (algo === 'global') data = await api.alignGlobal(body);
        else if (algo === 'local') data = await api.alignLocal(body);
        else if (algo === 'gotoh') data = await api.alignGotoh(body);
        else data = await api.alignOptimized(body);
        setResult(data);
        if (algo === 'global') setNwBaselineKb(data.peak_memory_kb);
        setVizSeqA(body.seq_a);
        setVizSeqB(body.seq_b);
        api.saveAlignmentRun(body, seqA, seqB, data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const gotohMatrix =
    gotohTab === 'M' ? result?.M_matrix :
    gotohTab === 'Ix' ? result?.Ix_matrix :
    result?.Iy_matrix;

  const visualTable: (number | null)[][] | null =
    (result?.dp_table as (number | null)[][] | null | undefined) ??
    (result?.algorithm === 'gotoh' ? (gotohMatrix as (number | null)[][] | null | undefined) : null) ??
    null;

  const displayTable =
    visualTable?.map((row) =>
      row.map((v: number | null) => (typeof v === 'number' && v <= -(10 ** 14) ? null : v)),
    ) ?? null;

  const canVisualize =
    !!displayTable && vizSeqA.length <= 50 && vizSeqB.length <= 50 && algo !== 'all';

  const linearGapVisible = algo !== 'gotoh';
  const affineVisible = algo === 'gotoh';
  const bandedVisible = algo === 'global' || algo === 'optimized' || algo === 'all';

  const preview = matrixPreviewGrid(matrixName);

  return (
    <div className="space-y-8">
      <AlignHistoryDrawer open={historyOpen} onClose={() => setHistoryOpen(false)} onRestore={restoreFromHistory} />

      <div className="genalign-enter-panel-1 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] font-[var(--font-display)] italic tracking-tight">
            Sequence Alignment
          </h1>
          <p className="text-[var(--text-muted)] mt-1 text-sm">Configure sequences and algorithms, then review results and the DP view.</p>
        </div>
        <button
          type="button"
          onClick={() => setHistoryOpen(true)}
          className="text-sm px-4 py-2 rounded-xl border border-[var(--border-dim)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:border-[var(--accent-teal)]/40 duration-150"
        >
          History
        </button>
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,40%)_minmax(0,60%)] lg:gap-10 lg:items-start space-y-10 lg:space-y-0">
        {/* LEFT */}
        <div className="space-y-8 min-w-0">
          <form onSubmit={handleSubmit} className="genalign-enter-panel-2 space-y-8">
            <div className="space-y-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--accent-teal)]">Sequences</p>
              <div className="flex gap-2 flex-wrap items-center">
                <span className="text-[10px] font-mono uppercase tracking-wide text-[var(--text-muted)]">Examples</span>
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex.label}
                    type="button"
                    onClick={() => {
                      setSeqA(ex.a);
                      setSeqB(ex.b);
                    }}
                    className="text-[10px] px-2 py-1 rounded-md bg-[var(--bg-card)] hover:bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-dim)] duration-150"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>

              <div
                className={`grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-start transition-all duration-200 ease-out ${
                  swapFlash ? 'opacity-75 scale-[0.992]' : ''
                }`}
              >
                <SequenceField
                  label="Sequence A"
                  seqId="A"
                  value={seqA}
                  onChange={setSeqA}
                  mode={mode}
                  colourHighlight={colourA}
                  onToggleColour={() => setColourA((c) => !c)}
                  fastaBusy={fastaBusy === 'a'}
                  onPickFasta={(f) => void handleFastaUpload('a', setSeqA, f)}
                  highlightFocusIndex={seqHiA}
                />
                <div className="flex md:flex-col items-center justify-center gap-2 md:pt-28">
                  <button
                    type="button"
                    onClick={swapSequences}
                    className="rounded-xl border border-[var(--border-dim)] bg-[var(--bg-card)] px-3 py-2 text-[var(--accent-teal)] hover:border-[var(--accent-teal)]/45 duration-150 font-mono text-lg leading-none"
                    aria-label="Swap sequences"
                    title="Swap A and B"
                  >
                    ↕
                  </button>
                </div>
                <SequenceField
                  label="Sequence B"
                  seqId="B"
                  value={seqB}
                  onChange={setSeqB}
                  mode={mode}
                  colourHighlight={colourB}
                  onToggleColour={() => setColourB((c) => !c)}
                  fastaBusy={fastaBusy === 'b'}
                  onPickFasta={(f) => void handleFastaUpload('b', setSeqB, f)}
                  highlightFocusIndex={seqHiB}
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <span className="font-mono text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Mode</span>
                <button
                  type="button"
                  onClick={() => setMode('dna')}
                  className={`text-xs px-3 py-1.5 rounded-lg border duration-150 ${
                    mode === 'dna'
                      ? 'border-[var(--accent-teal)]/50 bg-[var(--accent-teal)]/15 text-[var(--accent-teal)]'
                      : 'border-[var(--border-dim)] text-[var(--text-muted)] hover:border-[var(--accent-teal)]/25'
                  }`}
                >
                  DNA
                </button>
                <button
                  type="button"
                  onClick={() => setMode('protein')}
                  className={`text-xs px-3 py-1.5 rounded-lg border duration-150 ${
                    mode === 'protein'
                      ? 'border-[var(--accent-teal)]/50 bg-[var(--accent-teal)]/15 text-[var(--accent-teal)]'
                      : 'border-[var(--border-dim)] text-[var(--text-muted)] hover:border-[var(--accent-teal)]/25'
                  }`}
                >
                  Protein
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--accent-teal)]">Algorithm</p>

              <div className="grid grid-cols-2 gap-3">
                {CORE_ALGOS.map((opt) => (
                  <div key={opt.value} className="relative group">
                    <label
                      className={`flex flex-col rounded-xl border p-4 cursor-pointer transition-all duration-150 min-h-[140px] ${
                        algo === opt.value
                          ? 'border-[var(--accent-teal)] shadow-[0_0_14px_rgba(27,255,184,0.22)] bg-[var(--accent-teal)]/8'
                          : 'border-[var(--border-dim)] bg-[var(--bg-card)] hover:border-[var(--accent-teal)]/35'
                      }`}
                    >
                      <input
                        type="radio"
                        name="algo"
                        value={opt.value}
                        checked={algo === opt.value}
                        className="sr-only"
                        onChange={() => setAlgo(opt.value)}
                      />
                      <span className="font-[var(--font-display)] italic text-base text-[var(--text-primary)] leading-snug">
                        {opt.title}
                      </span>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-md bg-[var(--bg-deep)] border border-[var(--border-dim)] text-[var(--text-muted)]">
                          {opt.typeBadge}
                        </span>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-[var(--bg-deep)] border border-[var(--border-dim)] text-[var(--accent-teal)]">
                          {opt.time}
                        </span>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-[var(--bg-deep)] border border-[var(--border-dim)] text-[var(--text-muted)]">
                          {opt.space}
                        </span>
                      </div>
                    </label>
                    <div className="pointer-events-none absolute left-0 bottom-full mb-2 w-[220px] max-w-[85vw] z-40 rounded-xl border border-[var(--border-dim)] bg-[var(--bg-deep)]/98 backdrop-blur-sm p-3 text-[10px] text-[var(--text-muted)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-150 shadow-xl">
                      <p className="text-[var(--text-primary)] font-medium mb-1">{opt.summary}</p>
                      <p className="mb-2">{opt.useCase}</p>
                      <pre className="font-mono text-[9px] text-[var(--accent-teal)]/90 whitespace-pre-wrap leading-tight bg-[var(--bg-card)] rounded-lg p-2 border border-[var(--border-dim)]">
                        {opt.ascii}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>

              <label
                className={`flex rounded-xl border p-4 cursor-pointer transition-all duration-150 ${
                  algo === 'all'
                    ? 'border-[var(--accent-teal)] shadow-[0_0_14px_rgba(27,255,184,0.22)] bg-[var(--accent-teal)]/8'
                    : 'border-[var(--border-dim)] bg-[var(--bg-card)] hover:border-[var(--accent-teal)]/35'
                }`}
              >
                <input
                  type="radio"
                  name="algo"
                  value="all"
                  checked={algo === 'all'}
                  className="sr-only"
                  onChange={() => setAlgo('all')}
                />
                <div>
                  <span className="font-[var(--font-display)] italic text-base text-[var(--text-primary)]">Compare all</span>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Runs NW, SW, and Hirschberg side by side (≤2000 bp).</p>
                </div>
              </label>
            </div>

            <div className="rounded-2xl border border-[var(--border-dim)] bg-[var(--bg-card)]/80 p-5 space-y-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--accent-teal)]">Scoring parameters</p>

              <div className="grid gap-4 sm:grid-cols-2">
                <ParamSlider label="Match reward" min={0} max={10} value={match} onChange={setMatch} />
                <ParamSlider label="Mismatch penalty" min={-10} max={0} value={mismatch} onChange={setMismatch} />
                {linearGapVisible && (
                  <div className="sm:col-span-2">
                    <ParamSlider label="Gap penalty (linear)" min={-10} max={0} value={gap} onChange={setGap} />
                  </div>
                )}
                {affineVisible && (
                  <>
                    <ParamSlider label="Gap open" min={-20} max={0} step={0.5} value={gapOpen} onChange={setGapOpen} />
                    <ParamSlider label="Gap extend" min={-10} max={0} step={0.5} value={gapExtend} onChange={setGapExtend} />
                  </>
                )}
              </div>

              {mode === 'protein' && (
                <div className="relative group space-y-2">
                  <span className="text-xs text-[var(--text-muted)]">Substitution matrix</span>
                  <select
                    value={matrixName}
                    onChange={(e) => setMatrixName(e.target.value as MatrixName)}
                    className="w-full rounded-xl bg-[var(--bg-deep)] border border-[var(--border-dim)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-teal)] font-mono"
                  >
                    {(['BLOSUM62', 'BLOSUM45', 'BLOSUM80', 'PAM250'] as const).map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute left-0 top-full mt-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-150 rounded-xl border border-[var(--border-dim)] bg-[var(--bg-deep)] p-3 shadow-xl">
                    <p className="text-[10px] font-mono uppercase tracking-wide text-[var(--text-muted)] mb-2">
                      Corner 6×6 ({preview.labels.join(' ')})
                    </p>
                    <table className="border-collapse font-mono text-[10px]">
                      <thead>
                        <tr>
                          <th className="p-1" />
                          {preview.labels.map((c) => (
                            <th key={c} className="p-1 text-[var(--accent-teal)]">
                              {c}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.grid.map((row, i) => (
                          <tr key={i}>
                            <td className="p-1 text-[var(--accent-teal)]">{preview.labels[i]}</td>
                            {row.map((cell, j) => (
                              <td key={j} className="p-1 text-center border border-[var(--border-dim)] text-[var(--text-primary)]">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-4 pt-1 border-t border-[var(--border-dim)]">
                {bandedVisible && (
                  <>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={banded}
                        onChange={(e) => setBanded(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded border-[var(--border-dim)] accent-[var(--accent-teal)]"
                      />
                      <span className="text-sm text-[var(--text-muted)]">
                        Use banded DP (faster for similar sequences). NW uses a banded grid; Hirschberg uses banded forward/backward row scoring and falls back to full rows if the score would disagree with global NW.
                      </span>
                    </label>
                    {banded && (
                      <div className="sm:max-w-xs">
                        <ParamSlider label="Bandwidth k" min={1} max={500} value={bandwidth} onChange={setBandwidth} />
                      </div>
                    )}
                  </>
                )}

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showDPTable}
                    onChange={(e) => setShowDPTable(e.target.checked)}
                    className="w-4 h-4 rounded border-[var(--border-dim)] accent-[var(--accent-teal)]"
                  />
                  <span className="text-sm text-[var(--text-muted)]">Show DP matrix visualiser</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitBlocked}
              className="w-full min-h-[48px] rounded-xl bg-gradient-to-r from-[var(--accent-green)] to-[var(--accent-teal)] text-[var(--bg-deep)] font-semibold shadow-lg shadow-[var(--accent-teal)]/15 hover:brightness-105 duration-150 disabled:opacity-45 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="inline-block size-5 border-2 border-[var(--bg-deep)]/25 border-t-[var(--bg-deep)] rounded-full animate-spin" />
                  Aligning…
                </>
              ) : (
                <>
                  <span aria-hidden>▶</span>
                  Run Alignment
                </>
              )}
            </button>
          </form>
        </div>

        {/* RIGHT */}
        <div className="space-y-6 min-w-0 genalign-enter-panel-3">
          {!result && !allResults && !error && (
            <div className="rounded-2xl border border-dashed border-[var(--border-dim)] bg-[var(--bg-card)]/40 p-10 text-center text-[var(--text-muted)] text-sm">
              Results and DP visualisation appear here after you run an alignment.
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-[color:var(--accent-coral)]/35 bg-[color:var(--accent-coral)]/10 px-4 py-3 text-[color:var(--accent-coral)] text-sm">
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-[var(--border-dim)] bg-[var(--bg-card)]/90 p-6">
                <AlignmentOutput
                  result={result}
                  colourDnaBases={mode === 'dna'}
                  baselineMemoryKb={result.algorithm === 'hirschberg' ? nwBaselineKb : null}
                  originalSeqA={vizSeqA}
                  originalSeqB={vizSeqB}
                  onHighlightSeq={(p) => {
                    if (!p) {
                      setSeqHiA(null);
                      setSeqHiB(null);
                      return;
                    }
                    if (p.seq === 'a') {
                      setSeqHiA(p.index);
                      setSeqHiB(null);
                    } else {
                      setSeqHiB(p.index);
                      setSeqHiA(null);
                    }
                  }}
                />
              </div>

              {canVisualize && showDPTable && (
                <div className="rounded-2xl border border-[var(--border-dim)] bg-[var(--bg-card)]/90 p-6 space-y-4">
                  <h3 className="font-bold text-[var(--text-primary)] font-[var(--font-display)] italic">DP matrix</h3>
                  <DPCanvasVisualizer
                    dpTable={displayTable!}
                    seqA={vizSeqA}
                    seqB={vizSeqB}
                    maxPos={result.max_pos ?? null}
                    algorithm={result.algorithm}
                    predecessor={result.predecessor ?? null}
                    tracebackPath={result.traceback_path ?? null}
                    dpActiveRegion={result.dp_active_region ?? null}
                    match={match}
                    mismatch={mismatch}
                    gap={result.algorithm === 'gotoh' ? gapOpen : gap}
                    gapExtend={gapExtend}
                    gotohLayers={
                      result.algorithm === 'gotoh' &&
                      result.M_matrix &&
                      result.Ix_matrix &&
                      result.Iy_matrix
                        ? {
                            M: result.M_matrix.map((row) =>
                              row.map((v: number | null) =>
                                typeof v === 'number' && v <= -(10 ** 14) ? null : v,
                              ),
                            ),
                            Ix: result.Ix_matrix.map((row) =>
                              row.map((v: number | null) =>
                                typeof v === 'number' && v <= -(10 ** 14) ? null : v,
                              ),
                            ),
                            Iy: result.Iy_matrix.map((row) =>
                              row.map((v: number | null) =>
                                typeof v === 'number' && v <= -(10 ** 14) ? null : v,
                              ),
                            ),
                          }
                        : undefined
                    }
                    gotohTab={gotohTab}
                    onGotohTabChange={result.algorithm === 'gotoh' ? setGotohTab : undefined}
                  />
                </div>
              )}

              {result?.algorithm === 'hirschberg' && result.recursion_tree && (
                <HirschbergTree tree={result.recursion_tree as never} seqA={vizSeqA} seqB={vizSeqB} />
              )}
            </div>
          )}

          {allResults && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-[var(--text-primary)] font-[var(--font-display)] italic">Algorithm comparison</h2>
              <div className="overflow-x-auto rounded-xl border border-[var(--border-dim)]">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border-dim)] bg-[var(--bg-card)]">
                      <th className="text-left py-3 px-4 text-[var(--text-muted)] font-medium font-mono text-[10px] uppercase">Algorithm</th>
                      <th className="text-right py-3 px-4 text-[var(--text-muted)] font-medium font-mono text-[10px] uppercase">Score</th>
                      <th className="text-right py-3 px-4 text-[var(--text-muted)] font-medium font-mono text-[10px] uppercase">Identity</th>
                      <th className="text-right py-3 px-4 text-[var(--text-muted)] font-medium font-mono text-[10px] uppercase">Time (ms)</th>
                      <th className="text-right py-3 px-4 text-[var(--text-muted)] font-medium font-mono text-[10px] uppercase">Memory (KB)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(allResults).map(([key, r]) => (
                      <tr key={key} className="border-b border-[var(--border-dim)] hover:bg-[var(--bg-card)]/60">
                        <td className="py-3 px-4 font-medium text-[var(--text-primary)] capitalize">{key.replace(/_/g, ' ')}</td>
                        <td className="py-3 px-4 text-right text-[var(--accent-teal)] font-mono">{r.score}</td>
                        <td className="py-3 px-4 text-right text-[var(--accent-green)]">{r.identity}%</td>
                        <td className="py-3 px-4 text-right text-[var(--text-muted)] font-mono">{r.elapsed_ms}</td>
                        <td className="py-3 px-4 text-right text-[var(--text-muted)] font-mono">{r.peak_memory_kb}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {Object.entries(allResults).map(([key, r]) => (
                <div key={key} className="rounded-2xl border border-[var(--border-dim)] bg-[var(--bg-card)]/90 p-6">
                  <AlignmentOutput
                    result={r}
                    colourDnaBases={mode === 'dna'}
                    baselineMemoryKb={
                      key === 'hirschberg' ? allResults!.needleman_wunsch.peak_memory_kb : null
                    }
                    originalSeqA={vizSeqA}
                    originalSeqB={vizSeqB}
                    onHighlightSeq={(p) => {
                      if (!p) {
                        setSeqHiA(null);
                        setSeqHiB(null);
                        return;
                      }
                      if (p.seq === 'a') {
                        setSeqHiA(p.index);
                        setSeqHiB(null);
                      } else {
                        setSeqHiB(p.index);
                        setSeqHiA(null);
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
