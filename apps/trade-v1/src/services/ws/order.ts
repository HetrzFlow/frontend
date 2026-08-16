import { generateSub } from '@repo/lib/ws';
import { ws } from '@/common';

const orderChannel = 'user@orderExecTicker';
export type OrderResType = {
  r: string; // request_id
  o: string; // order_id
  t: 'market' | 'limit'; // order_type
  d: 'incr' | 'decr'; // increase order or decrease order
  a: 'cancel' | 'exec'; // action
  x: string; // transaction digest
};

export type OrderParamType = {};

export const [subOrder, unsubOrder] = generateSub<
  OrderParamType,
  OrderResType[]
>(ws, orderChannel, [], true);
