import React from 'react';

export default function DNAAnimation() {
  const basePairs = 16;
  
  return (
    <div className="relative h-[280px] w-full flex justify-center items-center perspective-1000 overflow-hidden">
      <div className="flex flex-col gap-[14px] transform-style-3d py-4">
        {Array.from({ length: basePairs }).map((_, i) => {
          const isMutation = i === 4 || i === 11;
          const delay = `${i * -0.25}s`;
          
          return (
            <div 
              key={i} 
              className="relative w-32 h-1 transform-style-3d animate-dna-twist"
              style={{ animationDelay: delay }}
            >
              <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-[14px] h-[14px] rounded-full ${isMutation ? 'bg-[var(--mismatch-red)] shadow-[0_0_12px_var(--mismatch-red)]' : 'bg-[var(--accent-green)] shadow-[0_0_12px_var(--accent-green)]'}`} />
              <div className={`absolute left-[14px] right-[14px] top-1/2 -translate-y-1/2 h-[2px] ${isMutation ? 'bg-[var(--mismatch-red)]/50' : 'bg-[var(--accent-teal)]/40'}`} />
              <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-[14px] h-[14px] rounded-full ${isMutation ? 'bg-rose-500 shadow-[0_0_12px_var(--mismatch-red)]' : 'bg-[var(--accent-teal)] shadow-[0_0_12px_var(--accent-teal)]'}`} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
