'use client';

import { AnimationDiv } from '@/common';
import InfoOverview from '@/containers/hzlp/overview';
import Pool from '@/containers/hzlp/pool';

const HzlpPage = () => {
  return (
    <AnimationDiv
      initalClassName="-translate-x-full"
      exitClassName="translate-x-0"
    >
      <InfoOverview />
      <Pool />
    </AnimationDiv>
  );
};

export default HzlpPage;
