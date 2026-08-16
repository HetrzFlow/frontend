'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function PathTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const current = sessionStorage.getItem('currentPath');
    if (current) {
      sessionStorage.setItem('prevPath', current);
    }
    sessionStorage.setItem('currentPath', pathname);
  }, [pathname]);

  return null;
}
