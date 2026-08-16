import { Inst, ZERO_STR } from '@/common';

type FeesData = Record<
  string,
  {
    feeApy: string;
    aprHistory: {
      timestamp: number;
      value: string;
    };
  }
>;
type OriginPoolInfo = {
  insts: Inst[];
  fees: FeesData;
};
export const mergePoolInfos = ({ insts, fees }: OriginPoolInfo) => {
  return insts.map((inst) => ({
    ...inst,
    feeApy: fees[inst.marketTokenAddress]?.feeApy || '0',
    aprHistory: fees[inst.marketTokenAddress]?.aprHistory || {
      timestamp: 0,
      value: ZERO_STR,
    },
  }));
};

export const convertBigintToHumanReadable = (
  value: bigint,
  decimals: number,
) => {
  return Number(value) / 10 ** decimals;
};
