import assert from 'node:assert/strict';
import test from 'node:test';
import { selectScopedHlvs } from './hlvScope';
import type { HlvListItem } from '../types';
import type { Address } from 'viem';

const VAULT_A = '0x0000000000000000000000000000000000000001' as Address;
const VAULT_B = '0x0000000000000000000000000000000000000002' as Address;
const MARKET_A = '0x0000000000000000000000000000000000000011' as Address;
const MARKET_B = '0x0000000000000000000000000000000000000012' as Address;
const TOKEN = '0x0000000000000000000000000000000000000021' as Address;

const hlvList: HlvListItem[] = [
  {
    hlv: { hlvToken: VAULT_A, longToken: TOKEN, shortToken: TOKEN },
    markets: [MARKET_A],
  },
  {
    hlv: { hlvToken: VAULT_B, longToken: TOKEN, shortToken: TOKEN },
    markets: [MARKET_B],
  },
];

test('keeps only HLVs in the requested vault scope', () => {
  const result = selectScopedHlvs(
    hlvList,
    { [MARKET_A.toUpperCase()]: {} },
    [VAULT_A.toUpperCase()],
  );

  assert.deepEqual(result, [hlvList[0]]);
});

test('drops an HLV instead of querying it with incomplete markets', () => {
  const result = selectScopedHlvs(hlvList, { [MARKET_A]: {} });

  assert.deepEqual(result, [hlvList[0]]);
});

test('an explicit empty vault scope disables every HLV', () => {
  const result = selectScopedHlvs(
    hlvList,
    { [MARKET_A]: {}, [MARKET_B]: {} },
    [],
  );

  assert.deepEqual(result, []);
});

test('drops an HLV with no markets', () => {
  const emptyHlv: HlvListItem = {
    hlv: {
      hlvToken: VAULT_A,
      longToken: TOKEN,
      shortToken: TOKEN,
    },
    markets: [],
  };

  assert.deepEqual(selectScopedHlvs([emptyHlv], {}), []);
});
