import { createContext, useContext } from 'react';

import type { Order, Position } from '@/common';

export const Context = createContext<Order | null>(null);

export const useOrder = () => {
  return useContext(Context) as Order;
};

export interface SizeEditContext {
  sizeEditable: boolean;
  position?: Position;
  allOrders?: Order[];
  maxCloseSize?: string;
}

export const SizeEditCtx = createContext<SizeEditContext>({
  sizeEditable: false,
});

export const useSizeEditCtx = () => {
  return useContext(SizeEditCtx);
};
