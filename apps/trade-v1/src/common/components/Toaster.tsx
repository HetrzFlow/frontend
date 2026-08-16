'use client';

import { useTheme } from 'next-themes';

import { Toaster, useMediaQuery, MEDIA_SIZES } from '@repo/ui';

const ToasterCus: React.FC = () => {
  const { resolvedTheme: theme } = useTheme();
  const mediaSz = useMediaQuery();

  return (
    <>
      <Toaster
        position="top-center"
        // mobile: 1; PC:3
        visibleToasts={mediaSz === MEDIA_SIZES.SM ? 1 : 3}
        theme={theme as 'dark' | 'light'}
      />
      {/* not closed toast */}
      <Toaster
        id="permanent-toast"
        position="top-center"
        visibleToasts={1}
        theme={theme as 'dark' | 'light'}
      />
    </>
  );
};

export default ToasterCus;
