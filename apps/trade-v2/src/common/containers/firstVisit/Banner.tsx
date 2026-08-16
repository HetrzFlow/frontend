import Image from 'next/image';

import { cn, HzIcon, HzTextIcon } from '@repo/ui';

interface BannerProps {
  className?: string;
  gradientClassName?: string;
}

const Banner = ({ className, gradientClassName }: BannerProps) => {
  return (
    <div
      className={cn(
        'relative -m-4 overflow-hidden rounded-t-xl select-none',
        className,
      )}
    >
      <Image
        src={`/trade-static/banner.webp`}
        alt={'Banner'}
        width={440}
        height={175}
        unoptimized
        className="absolute top-1/2 -z-1 h-[175px] w-full -translate-y-1/2 object-cover"
      ></Image>
      <div
        className={cn(
          'from-bg-3 flex h-[176px] items-center justify-center gap-2 bg-gradient-to-t to-transparent',
          gradientClassName,
        )}
      >
        <HzIcon size={32} className="text-accent" />
        <HzTextIcon size={16} className="text-t-1100" />
      </div>
    </div>
  );
};

export default Banner;
