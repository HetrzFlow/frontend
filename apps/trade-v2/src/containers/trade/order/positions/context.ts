import { createContext, useContext } from 'react';

import type { Position } from '@/common';

export const Context = createContext<Position | null>(null);

export const usePosition = () => {
  return useContext(Context) as Position;
};
