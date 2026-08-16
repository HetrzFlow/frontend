import { isDebugMode } from '@/common';

export const log = isDebugMode() ? console.log.bind(console) : () => {};

export const warn = isDebugMode() ? console.warn.bind(console) : () => {};

export const error = isDebugMode() ? console.error.bind(console) : () => {};
