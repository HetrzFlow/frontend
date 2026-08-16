'use client';

import { Ws } from '@repo/lib/ws';

export const ws = new Ws(`${process.env.NEXT_PUBLIC_WS_URL}/stream/v1`);
