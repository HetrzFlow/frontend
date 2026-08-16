'use client';

import { FC } from 'react';
import { useMediaQuery, MEDIA_SIZES } from '@repo/ui';
import TraderLayoutDesktop from './TraderLayoutDesktop';
import TraderLayoutMobile from './TraderLayoutMobile';

const TraderLayout: FC = () => {
  const mediaSz = useMediaQuery();

  return (
    <>
      {(mediaSz === MEDIA_SIZES.LG || mediaSz === MEDIA_SIZES.MD) && (
        <TraderLayoutDesktop />
      )}
      {mediaSz === MEDIA_SIZES.SM && <TraderLayoutMobile />}
    </>
  );
};

export default TraderLayout;
