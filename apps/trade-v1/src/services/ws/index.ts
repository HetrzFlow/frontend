'use client';

import { useEffect, useRef } from 'react';

import { EVENT_NAMES } from '@repo/lib/ws';
import { ws } from '@/common';

export const addWsListener = (eventName: EVENT_NAMES, fn: () => void) => {
  const _fn = () => {
    fn();
  };
  ws.addEventListener(eventName, _fn);

  return () => {
    ws.removeEventListener(eventName, _fn);
  };
};

export const useWsListener = (eventName: EVENT_NAMES, fn: () => void) => {
  const fnRef = useRef(fn);

  useEffect(() => {
    const removeFn = addWsListener(eventName, fnRef.current);
    return () => {
      removeFn();
    };
  }, [eventName]);
};
