'use client';

import { forwardRef, useEffect, useRef } from 'react';

import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { UseFormReturn } from 'react-hook-form';
import { TRADE_TYPE } from '../../services/enum';
import Form from './Form';

import HelpfulInfo from './HelpfulInfo';
import Slippage from './Slippage';
import { SwapForm, useSwapStore } from './store';

interface SwapProps {
  onChange?: (value: Partial<SwapForm>) => void;
}

const Content = forwardRef<unknown, SwapProps>(() => {
  const setFormRef = useSwapStore((state) => state.setFormRef);
  const resetFormData = useSwapStore((state) => state.resetFormData);
  const swapFOrmRef = useRef<{
    form: UseFormReturn<SwapForm>;
    onPaySzChange: () => void;
    onReceiveSzChange: () => void;
  }>(null);

  // record formRef
  useEffect(() => {
    setFormRef({
      [TRADE_TYPE.swap]: swapFOrmRef,
    });
    return () => {
      setFormRef({
        [TRADE_TYPE.swap]: null,
      });
    };
  }, [setFormRef]);

  useEffect(() => {
    return () => {
      // reset formData
      resetFormData();
    };
  }, [resetFormData]);

  return (
    <>
      <div className="mx-auto mb-4 flex w-full flex-row justify-between">
        <h2 className="text-2xl font-semibold">{i18n._(msg`Swap`)}</h2>
        <Slippage className="h-8" />
      </div>
      <div className="scrollbar-none mx-auto flex h-full w-full justify-center overflow-y-auto">
        <div className="flex w-full flex-col gap-4">
          <Form ref={swapFOrmRef} />
          <HelpfulInfo />
        </div>
      </div>
    </>
  );
});

Content.displayName = 'Content';

export default Content;
