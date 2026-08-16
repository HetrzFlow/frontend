'use client';

import { FC, useEffect } from 'react';
import { useGlobalStore } from '@/stores/trade/global';

const PageClient: FC<{ instId: string }> = ({ instId }) => {
  const setInstId = useGlobalStore((state) => state.setInstId);

  useEffect(() => {
    setInstId(instId);
  }, [instId, setInstId]);

  return null;
};

export default PageClient;
