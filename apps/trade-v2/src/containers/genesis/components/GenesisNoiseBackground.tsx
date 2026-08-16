import Image from 'next/image';
import { cn } from '@repo/ui';

interface GenesisNoiseBackgroundProps {
  centered?: boolean;
}

export default function GenesisNoiseBackground({
  centered = false,
}: GenesisNoiseBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-x-0 top-0 z-0 h-[519px] transform-gpu overflow-hidden',
        centered && 'h-[100dvh]',
      )}
    >
      <Image
        src="/trade-static/common/light-rays-effect.png"
        alt=""
        fill
        loading="eager"
        sizes="100vw"
        className="object-cover object-top mix-blend-screen"
      />
    </div>
  );
}
