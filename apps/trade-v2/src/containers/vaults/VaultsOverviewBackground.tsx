'use client';

import Image from 'next/image';
import useScrollSyncedTransform from '@/common/hooks/useScrollSyncedTransform';

export default function VaultsOverviewBackground() {
  const backgroundRef = useScrollSyncedTransform();

  return (
    <div
      ref={backgroundRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden will-change-transform"
    >
      <div className="absolute inset-x-0 top-0 h-[220px] overflow-hidden [contain:paint] [mask-image:linear-gradient(to_bottom,rgba(0,0,0,1)_0%,rgba(0,0,0,1)_88%,rgba(0,0,0,0)_100%)] md:h-[180px]">
        <Image
          src="/trade-static/vaults/vault-home.png"
          alt=""
          fill
          sizes="(max-width: 767px) 100vw, 1px"
          priority
          className="object-cover object-top md:hidden"
        />
        <div className="hidden h-full items-start justify-center md:flex">
          <Image
            src="/trade-static/vaults/vault-home.png"
            alt=""
            width={922}
            height={370}
            sizes="900px"
            priority
            className="h-[360px] w-auto max-w-none"
          />
        </div>
      </div>
    </div>
  );
}
