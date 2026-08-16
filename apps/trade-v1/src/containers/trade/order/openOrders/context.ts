import { createContext, useContext } from 'react';

import { Order } from '@/common';

export const Context = createContext<Order | null>(null);

export const useOrder = () => {
  return useContext(Context) as Order;
};
