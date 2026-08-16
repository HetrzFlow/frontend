'use client';

import { createContext, useContext } from 'react';

export const Context = createContext<{ inTradePage: boolean }>({
  inTradePage: false,
});

export const useContextData = () => {
  return useContext(Context);
};
