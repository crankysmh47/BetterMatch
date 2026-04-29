'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/',        label: 'Home' },
  { href: '/align',   label: 'Align' },
  { href: '/history', label: 'History' },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <nav className="border-b border-slate-800 bg-[#111827]/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <span className="text-sky-400">Better</span>
          <span className="text-white">Match</span>
          <span className="text-xs text-slate-500 font-normal ml-1 hidden sm:inline">Sequence Aligner</span>
        </Link>
        <div className="flex gap-1">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === href
                  ? 'bg-sky-500/20 text-sky-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
