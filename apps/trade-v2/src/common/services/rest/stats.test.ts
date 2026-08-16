import assert from 'node:assert/strict';
import test from 'node:test';
import { getAddress } from 'viem';
import { mapStatsTokens } from './stats';

const SYNTHETIC_TOKEN = '0x1111111111111111111111111111111111111111';
const COLLATERAL_TOKEN = '0x2222222222222222222222222222222222222222';

test('marks an index-only stats token as synthetic', () => {
  const tokens = mapStatsTokens([
    {
      token_address: SYNTHETIC_TOKEN,
      symbol: 'BTC',
      name: 'Bitcoin',
      decimals: 18,
      is_index_token: true,
      is_long_token: false,
      is_short_token: false,
    },
  ]);

  const syntheticToken = tokens[getAddress(SYNTHETIC_TOKEN)];
  assert.ok(syntheticToken);
  assert.equal(syntheticToken.isSynthetic, true);
});

test('does not mark a usable collateral token as synthetic', () => {
  const tokens = mapStatsTokens([
    {
      token_address: COLLATERAL_TOKEN,
      symbol: 'WBNB',
      decimals: 18,
      is_index_token: true,
      is_long_token: true,
      is_short_token: false,
    },
  ]);

  const collateralToken = tokens[getAddress(COLLATERAL_TOKEN)];
  assert.ok(collateralToken);
  assert.equal(collateralToken.isSynthetic, false);
  assert.equal(collateralToken.name, 'WBNB');
});
