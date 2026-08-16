'use client';

import Image from 'next/image';
import { useSelectedLayoutSegment } from 'next/navigation';

export default function VaultsNoiseBackground() {
  const selectedSegment = useSelectedLayoutSegment();

  if (selectedSegment) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 transform-gpu overflow-hidden"
    >
      <div className="absolute inset-x-0 top-0 h-[871px] transform-gpu [contain:paint]">
        <Image
          src="/trade-static/common/light-rays-effect.png"
          alt=""
          fill
          preload
          fetchPriority="high"
          sizes="100vw"
          className="object-cover object-top mix-blend-screen"
        />
        <div className="absolute inset-x-0 bottom-0 h-[180px] bg-[linear-gradient(180deg,transparent_0%,var(--bg-1)_100%)]" />
      </div>
    </div>
  );
}
