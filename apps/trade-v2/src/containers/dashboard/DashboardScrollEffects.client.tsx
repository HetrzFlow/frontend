'use client';

import Image from 'next/image';
import useScrollSyncedTransform from '@/common/hooks/useScrollSyncedTransform';

const INITIAL_BACKGROUND_TRANSFORM = 'translateY(0px)';

function getDashboardHeroBackgroundTransform(scrollTop: number) {
  const offset = Math.max(0, scrollTop);
  return offset === 0
    ? INITIAL_BACKGROUND_TRANSFORM
    : `translateY(-${offset}px)`;
}

const DashboardScrollEffects = () => {
  const backgroundRef = useScrollSyncedTransform({
    getTransform: getDashboardHeroBackgroundTransform,
    initialTransform: INITIAL_BACKGROUND_TRANSFORM,
  });

  return (
    <div
      ref={backgroundRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div className="absolute top-0 right-0 h-50 w-76 md:hidden">
        <Image
          src="/trade-static/dashboard/h5-bg.png"
          alt=""
          width={307}
          height={251}
          priority
          className="absolute top-0 left-0 h-full max-w-none"
        />
      </div>
      <div className="absolute top-[-45px] right-0 hidden h-[367px] w-[645px] md:block">
        <Image
          src="/trade-static/dashboard/pc-bg.png"
          alt=""
          width={645}
          height={367}
          priority
          className="absolute top-0 left-0 h-full w-full max-w-none"
        />
      </div>
    </div>
  );
};

export default DashboardScrollEffects;
