import { t } from '@lingui/core/macro';

export const useOracles = () => {
  return [
    {
      id: 'Acurast',
      label: t`Acurast`,
      pxDiff: '-0.001',
    },
    {
      id: 'API3',
      label: t`API3`,
      pxDiff: '-0.00075',
    },
    {
      id: 'Band',
      label: t`Band Protocol`,
      pxDiff: '-0.00025',
    },
    {
      id: 'Chainlink',
      label: t`Chainlink`,
      pxDiff: '-0.0005',
    },
    {
      id: 'DIA',
      label: t`DIA`,
      pxDiff: '0.00025',
    },
    {
      id: 'HertzFlow',
      label: t`HertzFlow`,
      pxDiff: '0',
    },
    {
      id: 'pyth',
      label: t`Pyth Network`,
      pxDiff: '0.0005',
    },
    {
      id: 'SEDA',
      label: t`SEDA`,
      pxDiff: '0.00075',
    },
    {
      id: 'SupraOracles',
      label: t`SupraOracles`,
      pxDiff: '0.001',
    },
  ];
};

export const useRiskTiers = () => {
  return [
    {
      id: 'low_risk',
      name: t`Low-Risk`,
      initialTvl: '10000',
      impactFactor: '0.5',
      mmr: '0.04',
      maxLeverage: '25',
    },
    {
      id: 'mid_risk',
      name: t`Mid-Risk`,
      initialTvl: '100000',
      impactFactor: '0.68',
      mmr: '0.01',
      maxLeverage: '100',
    },
    {
      id: 'high_risk',
      name: t`High-Risk`,
      initialTvl: '1000000',
      impactFactor: '0.86',
      mmr: '0.02',
      maxLeverage: '500',
    },
  ];
};

export const useFeeTiers = () => {
  return [
    {
      id: 'standard',
      name: t`Standard`,
      openCloseFee: '0.0006',
      swapFee: '0.002',
      lpRate: '0.0035',
      categories: ['crypto', 'equities'],
      tag: t`Crypto/Eqty`,
    },
    {
      id: 'volatile',
      name: t`Volatile`,
      openCloseFee: '0.002',
      swapFee: '0.0035',
      lpRate: '0.005',
      categories: ['commodities', 'memes'],
      tag: t`Commod/Meme`,
    },
    {
      id: 'institutional',
      name: t`Institutional`,
      openCloseFee: '0.0004',
      swapFee: '0.001',
      lpRate: '0.003',
      categories: ['indices', 'forex'],
      tag: t`FX/Idx`,
    },
  ];
};
