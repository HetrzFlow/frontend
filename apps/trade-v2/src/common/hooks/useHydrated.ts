'use client';

import { useEffect, useState } from 'react';

// hydrated
export const useHydrated = () => {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
};
