import { BigNumber } from 'bignumber.js';
import { STABLE_COIN_LIST } from '../constants';

/**
 * Converts a bigint to an unsigned integer of the specified number of bits.
 * @param {bigint} int - The bigint to convert.
 * @param {number} bits - The number of bits to use in the conversion. Defaults to 32 bits.
 * @returns {string} - Returns the converted unsigned integer as a string.
 */
export function asUintN(int: bigint, bits = 32) {
  return BigInt.asUintN(bits, BigInt(int)).toString();
}

export function isStableCoinSwap(
  coinInType: string,
  coinOutType: string,
): boolean {
  return (
    STABLE_COIN_LIST.includes(coinInType) &&
    STABLE_COIN_LIST.includes(coinOutType)
  );
}

export const calc = BigNumber;
