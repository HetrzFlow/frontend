'use client';

import { useRef } from 'react';
import { Trans, useLingui } from '@lingui/react/macro';
import ProductIntroFeature from '../components/ProductIntroFeature';
import Card from './Card';

import type { AnimationItem } from 'lottie-web/build/player/lottie_svg';

const Oracle = () => {
  const { t } = useLingui();
  const animRef = useRef<AnimationItem | null>(null);

  return (
    <ProductIntroFeature
      title={
        <Trans>
          Anchored with <span className="text-accent">Real World Price</span>
        </Trans>
      }
      description={t`24/7 uninterrupted pricing secured by multi-oracle-validation, forming a robust risk control module.`}
      onMouseEnter={() => {
        animRef.current?.goToAndPlay(0, true);
      }}
      onMouseLeave={() => {
        animRef.current?.goToAndStop(0, true);
      }}
    >
      <Card ref={animRef} />
    </ProductIntroFeature>
  );
};

export default Oracle;
