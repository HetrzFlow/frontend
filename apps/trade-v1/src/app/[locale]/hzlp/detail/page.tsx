'use client';

import Link from 'next/link';
import { ChevronLeftIcon, useMediaQuery, MEDIA_SIZES } from '@repo/ui';
import { AnimationDiv } from '@/common';
import DetailContainer from '@/containers/hzlp/detail';

const HzlpDetailPage = () => {
  const mediaSz = useMediaQuery();
  const isSmallScreen = mediaSz === MEDIA_SIZES.SM;

  return (
    <AnimationDiv
      initalClassName="translate-x-full"
      exitClassName="translate-x-0"
    >
      <div className={isSmallScreen ? 'space-y-4 p-4' : 'space-y-4 pt-6'}>
        <div className="flex items-center gap-[10px]">
          <Link href="/hzlp" prefetch>
            <ChevronLeftIcon className="bg-bg-3-h5 h-8 w-8 rounded-full" />
          </Link>
          <h3>Details</h3>
        </div>
        <DetailContainer />
      </div>
    </AnimationDiv>
  );
};

export default HzlpDetailPage;
