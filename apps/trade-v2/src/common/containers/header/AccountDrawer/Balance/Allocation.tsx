import { useMemo } from 'react';
import { useLingui } from '@lingui/react/macro';
import { formatUsd } from './utils';

// Allocation bar segment colors (matching Figma)
export const SEGMENT_COLORS = [
  '#57E3B7', // USDT/Wallet Balance
  '#FFBB00', // Pools
  '#FCE988', // Vaults
  '#00BFBF', // Positions
  '#80F7F9', // Orders
];

export interface AllocationItem {
  label: string;
  value: string | undefined;
  color: string;
}

export const AllocationDot = ({ color }: { color: string }) => (
  <span
    className="inline-block size-2 shrink-0 rounded-full"
    style={{ backgroundColor: color }}
  />
);

export const AllocationLegendRow = ({
  label,
  value,
  color,
}: AllocationItem) => (
  <div className="flex items-center justify-between gap-1 text-xs">
    <div className="flex items-center gap-1">
      <AllocationDot color={color} />
      <span className="text-t-350">{label}</span>
    </div>
    <span className="font-plex text-t-1100">{formatUsd(value)}</span>
  </div>
);

interface AllocationProps {
  walletBalance: string | undefined;
  poolDeposits: string | undefined;
  vaultDeposits: string | undefined;
  positionNetValue: string | undefined;
  orderCollateral: string | undefined;
  isDisconnected: boolean;
}

const Allocation = ({
  walletBalance,
  poolDeposits,
  vaultDeposits,
  positionNetValue,
  orderCollateral,
  isDisconnected,
}: AllocationProps) => {
  const { t } = useLingui();

  const allocationItems: AllocationItem[] = useMemo(
    () => [
      {
        label: t`USDT Balance`,
        value: isDisconnected ? undefined : walletBalance,
        color: SEGMENT_COLORS[0]!,
      },
      {
        label: t`Pools`,
        value: isDisconnected ? undefined : poolDeposits,
        color: SEGMENT_COLORS[1]!,
      },
      {
        label: t`Vaults`,
        value: isDisconnected ? undefined : vaultDeposits,
        color: SEGMENT_COLORS[2]!,
      },
      {
        label: t`Positions`,
        value: isDisconnected ? undefined : positionNetValue,
        color: SEGMENT_COLORS[3]!,
      },
      {
        label: t`Orders`,
        value: isDisconnected ? undefined : orderCollateral,
        color: SEGMENT_COLORS[4]!,
      },
    ],
    [
      t,
      isDisconnected,
      walletBalance,
      poolDeposits,
      vaultDeposits,
      positionNetValue,
      orderCollateral,
    ],
  );

  const segmentWidths = useMemo(() => {
    const values = allocationItems.map((item) => {
      if (item.value === undefined) return 0;
      const n = parseFloat(item.value);
      return isNaN(n) || n < 0 ? 0 : n;
    });
    const sum = values.reduce((a, b) => a + b, 0);
    if (sum === 0) return values.map(() => 0); //  no data
    return values.map((v) => v / sum);
  }, [allocationItems]);

  return (
    <div className="flex flex-col gap-2">
      {/* Horizontal allocation bar */}
      <div className="bg-t-1100/10 flex h-[5px] overflow-hidden rounded-full">
        {allocationItems.map((item, i) => (
          <div
            key={item.color}
            className={segmentWidths[i] ? 'min-w-1' : ''}
            style={{
              flex: segmentWidths[i],
              backgroundColor: item.color,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default Allocation;
