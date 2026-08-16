import { getAddress, isAddress } from 'viem';

export function toChecksumAddress(address?: string | null) {
  if (!address) return '';
  return isAddress(address) ? getAddress(address) : address;
}

export function toValidChecksumAddress(address?: string | null) {
  if (!address || !isAddress(address)) return undefined;
  return getAddress(address);
}

export function toLowerAddressParam(address?: string | null) {
  return address?.trim().toLowerCase() || undefined;
}

export function normalizeAddressRecordKeys<T>(record?: Record<string, T>) {
  if (!record) return record;

  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [
      toChecksumAddress(key),
      value,
    ]),
  ) as Record<string, T>;
}
