'use client';

import type { SVGProps } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { dnaBaseTextClass } from '@/lib/dna-colors';

const links = [
  { href: '/align', label: 'Align' },
  { href: '/algorithms', label: 'Algorithms' },
  { href: '/benchmark', label: 'Benchmark' },
  { href: '/about', label: 'About' },
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
    <nav className="border-b border-[var(--border-dim)] bg-[var(--bg-surface)]/70 backdrop-blur-[12px] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 h-14">
        <Link
          href="/"
          className="flex flex-wrap items-center gap-2 font-semibold text-lg tracking-tight duration-150 transition-opacity hover:opacity-95 shrink-0"
        >
          <span className="font-[var(--font-display)] italic text-[var(--accent-teal)]">GenAlign</span>
          <span className="text-xs text-[var(--text-muted)] font-normal ml-1 hidden sm:inline font-mono">
            Where sequences meet.
          </span>
          <span className="hidden md:inline-flex font-mono text-[10px] tracking-wider gap-px ml-1" aria-hidden>
            {'ATGCATGC'.split('').map((b, i) => (
              <span key={i} className={dnaBaseTextClass(b) || 'text-[var(--text-muted)]'}>
                {b}
              </span>
            ))}
          </span>
        </Link>

        <div className="flex justify-center min-w-0 overflow-x-auto scrollbar-thin">
          <div className="flex gap-0.5 sm:gap-1">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors duration-150 ${
                  pathname === href
                    ? 'text-[var(--accent-teal)] underline underline-offset-8 decoration-[var(--accent-teal)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        <a
          href="https://github.com/"
          target="_blank"
          rel="noreferrer"
          className="text-[var(--text-muted)] hover:text-[var(--accent-teal)] p-2 shrink-0 justify-self-end duration-150"
          aria-label="GitHub repository"
        >
          <GitHubIcon className="w-5 h-5" />
        </a>
      </div>
    </nav>
  );
}
