import { generateSub } from '@repo/lib/ws';
import { ws } from './instance';

const systemChannel = 'system@notification';
export type SystemStatusResType = {
  event_type: 'system_maintenance';
  data: boolean;
};

export type SystemStatusParamType = {};

export const [subSystemStatus, unsubSystemStatus] = generateSub<
  SystemStatusParamType,
  SystemStatusResType[]
>(ws, systemChannel, []);
