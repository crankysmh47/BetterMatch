'use client';

import { useState, useRef } from 'react';
import { api } from '@/lib/api';
import type { AlignResult, AllResults, Algorithm } from '@/types/alignment';
import AlignmentOutput from '@/components/ui/AlignmentOutput';
import DPTableVisualizer from '@/components/ui/DPTableVisualizer';

const ALGO_OPTIONS: { value: Algorithm; label: string; desc: string }[] = [
  { value: 'global',    label: 'Needleman-Wunsch',  desc: 'Global alignment · O(m×n) space' },
  { value: 'local',     label: 'Smith-Waterman',    desc: 'Local alignment · O(m×n) space' },
  { value: 'optimized', label: "Hirschberg's",       desc: 'Space-optimized global · O(n) space' },
  { value: 'all',       label: 'Compare All Three',  desc: 'Runs all algorithms side by side' },
];

const EXAMPLES = [
  { label: 'Simple DNA', a: 'AGCTGAC', b: 'AGCGAC' },
  { label: 'COVID vs Omicron (spike excerpt)', a: 'MFVFLVLLPLVSSQCVNLTTRTQLPPAYTNSFTRGVYYPDKVFRSSVLHSTQDLFLPFFSNVTWFHAIHVSGTNGTKRFDNPVLPFNDGVYFASTEKSNIIRGWIFGTTLDSKTQSLLIVNNATNVVIKVCEFQFCNDPFLGVYYHKNNKSWMESEFRVYSSANNCTFEYVSQPFLMDLEGKQGNFKNLREFVFKNIDGYFKIYSKHTPINLVRDLPQGFSALEPLVDLPIGINITRFQTLLALHRSYLTPGDSSSGWTAGAAAYYVGYLQPRTFLLKYNENGTITDAVDCALDPLSETKCTLKSFTVEKGIYQTSNFRVQPTESIVRFPNITNLCPFGEVFNATRFASVYAWNRKRISNCVADYSVLYNSASFSTFKCYGVSPTKLNDLCFTNVYADSFVIRGDEVRQIAPGQTGKIADYNYKLPDDFTGCVIAWNSNNLDSKVGGNYNYLYRLFRKSNLKPFERDISTEIYQAGSTPCNGVEGFNCYFPLQSYGFQPTNGVGYQPYRVVVLSFELLHAPATVCGPKKSTNLVKNKCVNFNFNGLTGTGVLTESNKKFLPFQQFGRDIADTTDAVRDPQTLEILDITPCSFGGVSVITPGTNTSNQVAVLYQDVNCTEVPVAIHADQLTPTWRVYSTGSNVFQTRAGCLIGAEHVNNSYECDIPIGAGICASYQTQTNSPRRARSVASQSIIAYTMSLGAENSVAYSNNSIAIPTNFTISVTTEILPVSMTKTSVDCTMYICGDSTECSNLLLQYGSFCTQLNRALTGIAVEQDKNTQEVFAQVKQIYKTPPIKDFGGFNFSQILPDPSKPSKRSFIEDLLFNKVTLADAGFIKQYGDCLGDIAARDLICAQKFNGLTVLPPLLTDEMIAQYTSALLAGTITSGWTFGAGAALQIPFAMQMAYRFNGIGVTQNVLYENQKLIANQFNSAIGKIQDSLSSTASALGKLQDVVNQNAQALNTLVKQLSSNFGAISSVLNDILSRLDKVEAEVQIDRLITGRLQSLQTYVTQQLIRAAEIRASANLAATKMSECVLGQSKRVDFCGKGYHLMSFPQSAPHGVVFLHVTYVPAQEKNFTTAPAICHDGKAHFPREGVFVSNGTHWFVTQRNFYEPQIITTDNTFVSGNCDVVIGIVNNTVYDPLQPELDSFKEELDKYFKNHTSPDVDLGDISGINASVVNIQKEIDRLNEVAKNLNESLIDLQELGKYEQYIKWPWYIWLGFIAGLIAIVMVTIMLCCMTSCCSCLKGCCSCGSCCKFDEDDSEPVLKGVKLHYT',
  b: 'MFVFLVLLPLVSSQCVNLITRTQLPPAYTNSFTRGVYYPDKVFRSSVLHSTQDLFLPFFSNVTWFHAIHVSGTNGTKRFDNPVLPFNDGVYFASTEKSNIIRGWIFGTTLDSKTQSLLIVNNATNVVIKVCEFQFCNDPFLGVYYHKNNKSWMESEFRVYSSANNCTFEYVSQPFLMDLEGKQGNFKNLREFVFKNIDGYFKIYSKHTPINLVRDLPQGFSALEPLVDLPIGINITRFQTLLALHRSYLTPGDSSSGWTAGAAAYYVGYLQPRTFLLKYNENGTITDAVDCALDPLSETKCTLKSFTVEKGIYQTSNFRVQPTESIVRFPNITNLCPFGEVFNATRFASVYAWNRKRISNCVADYSVLYNSASFSTFKCYGVSPTKLNDLCFTNVYADSFVIRGDEVRQIAPGQTGKIADYNYKLPDDFTGCVIAWNSNNLDSKVGGNYNYLYRLFRKSNLKPFERDISTEIYQAGSTPCNGVEGFNCYFPLQSYGFQPTNGVGYQPYRVVVLSFELLHAPATVCGPKKSTNLVKNKCVNFNFNGLTGTGVLTESNKKFLPFQQFGRDIADTTDAVRDPQTLEILDITPCSFGGVSVITPGTNTSNQVAVLYQDVNCTEVPVAIHADQLTPTWRVYSTGSNVFQTRAGCLIGAEHVNNSYECDIPIGAGICASYQTQTNSPRRARSVASQSIIAYTMSLGAENSVAYSNNSIAIPTNFTISVTTEILPVSMTKTSVDCTMYICGDSTECSNLLLQYGSFCTQLNRALTGIAVEQDKNTQEVFAQVKQIYKTPPIKDFGGFNFSQILPDPSKPSKRSFIEDLLFNKVTLADAGFIKQYGDCLGDIAARDLICAQKFNGLTVLPPLLTDEMIAQYTSALLAGTITSGWTFGAGAALQIPFAMQMAYRFNGIGVTQNVLYENQKLIANQFNSAIGKIQDSLSSTASALGKLQDVVNQNAQALNTLVKQLSSNFGAISSVLNDILSRLDKVEAEVQIDRLITGRLQSLQTYVTQQLIRAAEIRASANLAATKMSECVLGQSKRVDFCGKGYHLMSFPQSAPHGVVFLHVTYVPAQEKNFTTAPAICHDGKAHFPREGVFVSNGTHWFVTQRNFYEPQIITTDNTFVSGNCDVVIGIVNNTVYDPLQPELDSFKEELDKYFKNHTSPDVDLGDISGINASVVNIQKEIDRLNEVAKNLNESLIDLQELGKYEQYIKWPWYIWLGFIAGLIAIVMVTIMLCCMTSCCSCLKGCCSCGSCCKFDEDDSEPVLKGVKLHYT' },
];

export default function AlignPage() {
  const [seqA, setSeqA] = useState('AGCTGAC');
  const [seqB, setSeqB] = useState('AGCGAC');
  const [algo, setAlgo] = useState<Algorithm>('global');
  const [match, setMatch] = useState(1);
  const [mismatch, setMismatch] = useState(-1);
  const [gap, setGap] = useState(-2);
  const [useBlosum, setUseBlosum] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AlignResult | null>(null);
  const [allResults, setAllResults] = useState<AllResults | null>(null);
  const [showDPTable, setShowDPTable] = useState(false);
  const fileARef = useRef<HTMLInputElement>(null);
  const fileBRef = useRef<HTMLInputElement>(null);

  const handleFastaUpload = (setter: (v: string) => void, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(l => !l.startsWith('>')).join('');
      setter(lines.replace(/\s/g, '').toUpperCase());
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setAllResults(null);
    setLoading(true);
    setShowDPTable(false);
    try {
      const body = { seq_a: seqA.trim().toUpperCase(), seq_b: seqB.trim().toUpperCase(), match, mismatch, gap, use_blosum62: useBlosum };
      if (algo === 'all') {
        const data = await api.alignAll(body);
        setAllResults(data);
      } else {
        let data: AlignResult;
        if (algo === 'global')    data = await api.alignGlobal(body);
        else if (algo === 'local') data = await api.alignLocal(body);
        else                       data = await api.alignOptimized(body);
        setResult(data);
      }
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const canVisualize = result?.dp_table && seqA.length <= 50 && seqB.length <= 50;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Sequence Alignment</h1>
        <p className="text-slate-400 mt-1">Enter sequences below or upload a .fasta file</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Algorithm selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ALGO_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`rounded-xl border p-4 cursor-pointer transition-all space-y-1 ${
                algo === opt.value
                  ? 'border-sky-500 bg-sky-500/10'
                  : 'border-slate-700 bg-slate-900/50 hover:border-slate-500'
              }`}
            >
              <input type="radio" name="algo" value={opt.value} className="hidden" onChange={() => setAlgo(opt.value)} />
              <div className="font-semibold text-sm text-slate-200">{opt.label}</div>
              <div className="text-xs text-slate-500">{opt.desc}</div>
            </label>
          ))}
        </div>

        {/* Examples */}
        <div className="flex gap-2 flex-wrap">
          <span className="text-xs text-slate-500 self-center">Examples:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              type="button"
              onClick={() => { setSeqA(ex.a); setSeqB(ex.b); }}
              className="text-xs px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              {ex.label}
            </button>
          ))}
        </div>

        {/* Sequence inputs */}
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { label: 'Sequence A', value: seqA, setter: setSeqA, ref: fileARef },
            { label: 'Sequence B', value: seqB, setter: setSeqB, ref: fileBRef },
          ].map(({ label, value, setter, ref }) => (
            <div key={label} className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-300">{label}</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">{value.replace(/\s/g,'').length} bp</span>
                  <button
                    type="button"
                    onClick={() => ref.current?.click()}
                    className="text-xs px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 border border-slate-600"
                  >
                    Upload FASTA
                  </button>
                  <input
                    type="file"
                    accept=".fasta,.fa,.txt"
                    ref={ref}
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFastaUpload(setter, e.target.files[0])}
                  />
                </div>
              </div>
              <textarea
                value={value}
                onChange={(e) => setter(e.target.value.toUpperCase())}
                rows={4}
                placeholder="Paste raw sequence or FASTA..."
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 font-mono text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/40 resize-none"
              />
            </div>
          ))}
        </div>

        {/* Scoring parameters */}
        <div className="flex flex-wrap gap-4 items-end rounded-xl border border-slate-700 bg-slate-900/30 p-4">
          <h3 className="w-full text-sm font-semibold text-slate-300 -mb-2">Scoring Parameters</h3>
          {[
            { label: 'Match', value: match, setter: setMatch },
            { label: 'Mismatch', value: mismatch, setter: setMismatch },
            { label: 'Gap', value: gap, setter: setGap },
          ].map(({ label, value, setter }) => (
            <label key={label} className="space-y-1">
              <span className="text-xs text-slate-400">{label}</span>
              <input
                type="number"
                value={value}
                onChange={(e) => setter(parseInt(e.target.value) || 0)}
                className="block w-24 rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </label>
          ))}
          <label className="flex items-center gap-2 cursor-pointer pb-1">
            <input
              type="checkbox"
              checked={useBlosum}
              onChange={(e) => setUseBlosum(e.target.checked)}
              className="w-4 h-4 rounded accent-sky-500"
            />
            <span className="text-sm text-slate-400">Use BLOSUM62</span>
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !seqA.trim() || !seqB.trim()}
          className="w-full sm:w-auto px-8 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-semibold transition-colors shadow-lg shadow-sky-500/20"
        >
          {loading ? 'Aligning...' : 'Run Alignment'}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Single result */}
      {result && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6">
            <AlignmentOutput result={result} />
          </div>

          {canVisualize && (
            <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-100">DP Table Visualizer</h3>
                <button
                  onClick={() => setShowDPTable(!showDPTable)}
                  className="text-sm px-3 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300"
                >
                  {showDPTable ? 'Hide' : 'Show'} Table
                </button>
              </div>
              {showDPTable && (
                <DPTableVisualizer
                  dpTable={result.dp_table!}
                  seqA={seqA.trim()}
                  seqB={seqB.trim()}
                  maxPos={result.max_pos ?? null}
                  algorithm={result.algorithm}
                />
              )}
              {!showDPTable && (
                <p className="text-slate-500 text-sm">
                  Click "Show Table" to open the animated DP matrix visualizer.
                </p>
              )}
            </div>
          )}

          {result?.algorithm === 'hirschberg' && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-300">
              Hirschberg uses only O(n) space — the full DP matrix is not retained, so the table visualizer is not available.
            </div>
          )}
        </div>
      )}

      {/* All results comparison */}
      {allResults && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-100">Algorithm Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Algorithm</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-medium">Score</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-medium">Identity</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-medium">Time (ms)</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-medium">Memory (KB)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(allResults).map(([key, r]) => (
                  <tr key={key} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="py-3 px-4 font-medium text-slate-200 capitalize">{key.replace(/_/g,' ')}</td>
                    <td className="py-3 px-4 text-right text-sky-400 font-mono">{r.score}</td>
                    <td className="py-3 px-4 text-right text-emerald-400">{r.identity}%</td>
                    <td className="py-3 px-4 text-right text-slate-300 font-mono">{r.elapsed_ms}</td>
                    <td className="py-3 px-4 text-right text-slate-300 font-mono">{r.peak_memory_kb}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {Object.entries(allResults).map(([key, r]) => (
            <div key={key} className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6">
              <AlignmentOutput result={r} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
