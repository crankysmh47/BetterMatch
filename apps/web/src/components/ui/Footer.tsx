export default function Footer() {
  return (
    <footer className="border-t border-[var(--border-dim)] bg-[var(--bg-surface)]/60 backdrop-blur-[12px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-10 flex items-center justify-between text-xs text-[var(--text-muted)]">
        <span className="font-mono">GenAlign · CS-251 DAA · NUST · 2026</span>
        <span className="hidden sm:inline">Team: (add names)</span>
      </div>
    </footer>
  );
}

