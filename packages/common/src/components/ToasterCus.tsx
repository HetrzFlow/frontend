'use client';

import { FC } from 'react';

import { Toaster, useMediaQuery, MEDIA_SIZES } from '@repo/ui';

const ToasterCus: FC<{ theme?: 'dark' | 'light' }> = ({ theme }) => {
  const finalTheme = theme || 'dark';
  const mediaSz = useMediaQuery();

  return (
    <>
      <Toaster
        position="top-center"
        // mobile: 1; PC:3
        visibleToasts={mediaSz === MEDIA_SIZES.SM ? 1 : 3}
        theme={finalTheme as 'dark' | 'light'}
      />
      {/* not closed toast */}
      <Toaster
        id="permanent-toast"
        position="top-center"
        visibleToasts={1}
        theme={finalTheme as 'dark' | 'light'}
      />
    </>
  );
};

export default ToasterCus;
