'use client';

import { FC, useEffect } from 'react';
import { t } from '@lingui/core/macro';
import { Button, cn } from '@repo/ui';
import { usePrices } from '@/common/services';
import ModuleCard from '@/components/ModuleCard';
import { useLaunchStore } from '../store';
import Deposit from './Deposit';
import Detail from './Detail';
import SelectFeeTiers from './SelectFeeTiers';
import SelectMarkets from './SelectMarkets';
import SelectRiskTiers from './SelectRiskTiers';

interface OperationProps {
  className?: string;
}

const Operation: FC<OperationProps> = ({ className }) => {
  const step = useLaunchStore((state) => state.currentStep);
  const setState = useLaunchStore((state) => state.setState);

  usePrices();

  useEffect(() => {
    return () => {
      setState({ currentStep: 1 });
    };
  }, [setState]);
  return (
    <>
      {step < 4 && (
        <ModuleCard
          className={cn(
            'animate-in slide-in-from-right-10 fade-in p-3 transition-none duration-300',
            className,
          )}
        >
          <SelectMarkets />
          <SelectFeeTiers />
          <SelectRiskTiers />
          <div className="mt-3 text-right">
            <Button
              onClick={() => setState({ currentStep: 4 })}
              className="bg-accent hover:bg-accent/70 text-accent-foreground h-10 rounded-lg px-10 py-2.5"
            >{t`Continue to Preview`}</Button>
          </div>
        </ModuleCard>
      )}
      {step === 4 && (
        <div
          className={cn(
            'animate-in slide-in-from-right-10 fade-in transition-none duration-300',
            className,
          )}
        >
          <Detail />
          <Deposit />
        </div>
      )}
    </>
  );
};

export default Operation;
