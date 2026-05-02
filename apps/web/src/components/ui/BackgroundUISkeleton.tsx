/**
 * Decorative wireframe “UI before UI” — sits above DNA, below real chrome (z-10).
 * Faint dashed panels suggest layout without competing with content.
 */
export default function BackgroundUISkeleton() {
  return (
    <div
      className="fixed inset-0 z-[5] pointer-events-none overflow-hidden max-md:opacity-60"
      aria-hidden
    >
      <div className="absolute inset-0 opacity-[0.055] sm:opacity-[0.065]">
        {/* Hero / title block */}
        <div className="absolute top-[14%] left-1/2 -translate-x-1/2 w-[min(90%,480px)] h-28 sm:h-36 rounded-3xl border border-dashed border-[var(--skeleton-stroke)] bg-[var(--skeleton-fill)]" />
        <div className="absolute top-[calc(14%+5.5rem)] left-1/2 -translate-x-1/2 w-[min(72%,320px)] h-3 rounded-full border border-dashed border-[var(--skeleton-stroke)] bg-[var(--skeleton-fill)]" />

        {/* Row of “cards” */}
        <div className="absolute top-[46%] left-[3%] right-[3%] flex gap-[2.5%] justify-center items-stretch">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-36 sm:h-44 flex-1 max-w-[31%] rounded-2xl border border-dashed border-[var(--skeleton-stroke)] bg-[var(--skeleton-fill)]"
            />
          ))}
        </div>

        {/* Side column + strip (align tool vibe) */}
        <div className="absolute top-[68%] left-[3%] w-[18%] max-w-[140px] h-32 sm:h-40 rounded-xl border border-dashed border-[var(--skeleton-stroke)] bg-[var(--skeleton-fill)] hidden sm:block" />
        <div className="absolute top-[68%] left-[22%] right-[3%] h-32 sm:h-40 rounded-xl border border-dashed border-[var(--skeleton-stroke)] bg-[var(--skeleton-fill)] hidden sm:block" />

        {/* Bottom metrics strip */}
        <div className="absolute bottom-[8%] left-[3%] right-[3%] h-10 rounded-lg border border-dashed border-[var(--skeleton-stroke)] bg-[var(--skeleton-fill)]" />
      </div>
    </div>
  );
}
