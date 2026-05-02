'use client';

import type { SVGProps } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import BetterMatchLogo from '@/components/ui/BetterMatchLogo';

const links = [
  { href: '/', label: 'Home' },
  { href: '/align', label: 'Align' },
  { href: '/algorithms', label: 'Algorithms' },
  { href: '/benchmark', label: 'Benchmark' },
];

function GitHubIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--card-border)] bg-[color-mix(in_srgb,var(--bg-surface)_78%,var(--card-bg)_22%)] shadow-[0_1px_0_color-mix(in_srgb,var(--accent-mint)_14%,transparent),0_0_40px_-12px_color-mix(in_srgb,var(--accent-rose)_18%,transparent)] backdrop-blur-[14px]">
      <div className="mx-auto flex h-14 min-w-0 max-w-7xl items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex min-w-0 shrink items-center gap-2 text-lg font-semibold tracking-tight transition-opacity duration-150 hover:opacity-95 sm:gap-2.5"
        >
          {/* Isolate glow/ring from flex clipping; slight padding so drop-shadow isn’t cropped at viewport */}
          <span className="relative isolate shrink-0 p-1.5 -m-1.5 sm:p-2 sm:-m-2">
            <BetterMatchLogo size={38} className="rounded-lg ring-2 ring-emerald-400/50 drop-shadow-[0_0_12px_rgba(74,222,128,0.85)]" />
          </span>
          <span className="truncate font-[var(--font-display)] font-bold text-[var(--accent-green)]">BetterMatch</span>
          <span className="hidden min-w-0 truncate font-mono text-xs font-normal text-[var(--text-secondary)] lg:inline">
            Sequence alignment lab
          </span>
        </Link>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-1 overflow-x-auto overflow-y-visible pl-2 sm:gap-1.5 sm:pl-4 md:gap-2">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`inline-flex h-10 shrink-0 items-center justify-center rounded-lg px-2.5 text-sm font-medium whitespace-nowrap transition-colors duration-150 sm:px-4 ${
                pathname === href
                  ? 'text-[var(--accent-mint)] underline decoration-[color-mix(in_srgb,var(--accent-mint)_70%,transparent)] underline-offset-8'
                  : 'text-[var(--text-muted)] hover:bg-[var(--tint-cream)] hover:text-[var(--text-primary)]'
              }`}
            >
              {label}
            </Link>
          ))}
          <a
            href="https://github.com/crankysmh47/bettermatch"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors duration-150 hover:bg-[var(--tint-cream)] hover:text-[var(--accent-green)]"
            aria-label="GitHub repository"
          >
            <GitHubIcon className="h-5 w-5" />
          </a>
        </div>
      </div>
    </nav>
  );
}
