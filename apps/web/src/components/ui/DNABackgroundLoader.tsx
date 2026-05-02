'use client';

import dynamic from 'next/dynamic';

const GlobalDNABackground = dynamic(
  () => import('@/components/ui/GlobalDNABackground'),
  { ssr: false }
);

export default function DNABackgroundLoader() {
  return <GlobalDNABackground />;
}
