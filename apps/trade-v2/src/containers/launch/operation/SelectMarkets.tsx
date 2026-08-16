'use client';

import { FC, useEffect, useState } from 'react';
import { t } from '@lingui/core/macro';
import { useShallow } from 'zustand/react/shallow';
import { CoinIcon } from '@repo/common/components';
import { calc } from '@repo/lib/calc';
import { truncateFormat } from '@repo/lib/format';
import {
  ChevronDownIcon,
  cn,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui';
import { usePriceTickerStream } from '@/common/services';
import { useInstStore } from '@/common/stores';
import { useFeeTiers, useOracles } from '../hooks';
import { useLaunchStore } from '../store';
import SelectMarketsContent from './SelectMarketsContent';

interface SelectMarketsProps {
  className?: string;
}

const SelectMarkets: FC<SelectMarketsProps> = ({ className }) => {
  const insts = useInstStore((state) => state.getInstsArr());
  const instsMap = useInstStore((state) => state.getInsts());
  const [selectedInstId, selectedOracle] = useLaunchStore(
    useShallow((state) => [state.selectedInstId, state.selectedOracle]),
  );
  const setState = useLaunchStore((state) => state.setState);
  const selectedInst = instsMap[selectedInstId];

  const [marketSelectorOpen, setMarketSelectorOpen] = useState(false);

  const oracles = useOracles();

  const { data: lastPx } = usePriceTickerStream(selectedInst?.symbol, {
    throttleWait: 2000,
  });

  useEffect(() => {
    if (!selectedInstId) {
      const defaultInst =
        insts.find((inst) => inst.symbol === 'USD/JPY') ?? insts[0];
      setState({
        selectedInstId: defaultInst?.id ?? '',
      });
    }
  }, [selectedInstId, insts, setState]);

  const feeTiers = useFeeTiers();
  useEffect(() => {
    const selectedInst = instsMap[selectedInstId];
    if (selectedInst) {
      const bestFeeTier = feeTiers.find((v) =>
        v.categories.includes(selectedInst.category),
      );
      if (bestFeeTier) {
        setState({
          feeTier: bestFeeTier.id,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedInstId]);

  const pxDiff = oracles.find((v) => v.id === selectedOracle)?.pxDiff || 0;

  return (
    <div className={className}>
      <h2 className="font-medium">{t`Select Market`}</h2>
      <div className="mt-2 flex gap-2 font-medium">
        <div className="w-1/2">
          <Popover
            open={marketSelectorOpen}
            onOpenChange={setMarketSelectorOpen}
          >
            <PopoverTrigger className="bg-bg-3 flex h-9 w-full items-center justify-between gap-2 rounded-lg px-2 py-2.5 text-xs">
              {t`Market`}
              {selectedInst?.icon && (
                <CoinIcon
                  className="ml-auto"
                  size={24}
                  src={selectedInst?.icon}
                />
              )}
              {selectedInst && (
                <span className="text-sm">{selectedInst.name}</span>
              )}

              <ChevronDownIcon
                className={cn(
                  'ml-1 transition-transform duration-300 max-md:ml-1.5',
                )}
              />
            </PopoverTrigger>
            <PopoverContent
              className="w-max rounded-lg p-2"
              side="bottom"
              align="start"
            >
              <SelectMarketsContent
                value={selectedInstId}
                onValueChange={(v) => {
                  setState({ selectedInstId: v });
                  setMarketSelectorOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="w-1/2">
          <Select
            value={selectedOracle}
            onValueChange={(v) => setState({ selectedOracle: v })}
          >
            <SelectTrigger className="bg-bg-3 w-full rounded-lg px-2 py-2.5 text-xs">
              {t`Price Oracle`}
              <span className="ml-auto text-sm">
                <SelectValue />
              </span>
            </SelectTrigger>
            <SelectContent side="bottom" align="end" className="rounded-lg">
              {oracles.map((v) => {
                return (
                  <SelectItem className="text-xs" key={v.id} value={v.id}>
                    {v.label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="mt-2 flex gap-2 font-medium">
        <div className="bg-bg-3 w-full rounded-lg p-2 select-none">
          <div>{t`Oracle Price`}</div>
          <div className="bg-bg-3 mt-2 flex h-9 w-full items-center justify-start gap-2 rounded-lg px-2 py-2.5 text-sm font-medium">
            {selectedInst && <CoinIcon size={24} src={selectedInst?.icon} />}
            {selectedInst?.symbol}
            <span className="ml-auto">
              {truncateFormat(
                calc(lastPx[0]?.p || '').times(calc(1).plus(pxDiff)),
                selectedInst?.pxDispDecimal,
              )}
            </span>
            <span>USD</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectMarkets;
