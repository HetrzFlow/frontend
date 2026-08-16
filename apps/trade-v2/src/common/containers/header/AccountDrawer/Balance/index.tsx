'use client';

import { useMemo } from 'react';
import { useLingui } from '@lingui/react/macro';
import { EMPTY_DISPLAY } from '@repo/lib/format';
import { useTotalAssets } from '../useTotalAssets';
import Allocation, { AllocationItem, SEGMENT_COLORS } from './Allocation';
import PnlCards from './PnlCards';
import TotalAssets from './TotalAssets';
import { formatUsd } from './utils';

const Balance = () => {
  const { t } = useLingui();
  const {
    walletBalanceUsd,
    poolDeposits,
    vaultDeposits,
    positionNetValue,
    orderCollateral,
    total,
    unrealisedPnl,
    totalPnl,
    totalBought,
    unrealisedBought,
    isDisconnected,
  } = useTotalAssets();

  const displayTotal = isDisconnected ? EMPTY_DISPLAY : formatUsd(total);

  const allocationItems: AllocationItem[] = useMemo(
    () => [
      {
        label: t`USDT Balance`,
        value: isDisconnected ? undefined : walletBalanceUsd,
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
      walletBalanceUsd,
      poolDeposits,
      vaultDeposits,
      positionNetValue,
      orderCollateral,
    ],
  );

  return (
    <div className="flex flex-col gap-4 px-4">
      <div className="flex flex-col gap-2">
        <TotalAssets
          displayTotal={displayTotal}
          allocationItems={allocationItems}
        />
      </div>
      <Allocation
        walletBalance={walletBalanceUsd}
        poolDeposits={poolDeposits}
        vaultDeposits={vaultDeposits}
        positionNetValue={positionNetValue}
        orderCollateral={orderCollateral}
        isDisconnected={isDisconnected}
      />

      <PnlCards
        totalPnl={totalPnl}
        totalBought={totalBought}
        unrealisedPnl={unrealisedPnl}
        unrealisedBought={unrealisedBought}
        isDisconnected={isDisconnected}
      />
    </div>
  );
};

export default Balance;
