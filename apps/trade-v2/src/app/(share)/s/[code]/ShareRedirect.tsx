'use client';

import { useEffect } from 'react';

type ShareRedirectProps = Readonly<{
  href: string;
}>;

const ShareRedirect = ({ href }: ShareRedirectProps) => {
  useEffect(() => {
    window.location.replace(href);
  }, [href]);

  return null;
};

export default ShareRedirect;
