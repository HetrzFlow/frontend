import { memo } from 'react';
import { useLingui } from '@lingui/react/macro';
import { useShallow } from 'zustand/react/shallow';
import { Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui';
import { Slippage as BasicSlippage } from '@/common';

import ListItem from '@/components/ListItem';
import { usePreferenceStore } from '@/stores/trade/preference';
import { useTradeStore } from '../store';

const Slippage = () => {
  const { t } = useLingui();
  const [slippage, setSlippage] = usePreferenceStore(
    useShallow((state) => [state.slippage, state.setSlippage]),
  );

  const smDialogOpen = useTradeStore((state) => state.smDialogOpen);

  return (
    <ListItem
      label={
        <Tooltip>
          <TooltipTrigger
            className={
              'decoration-t-430 underline decoration-dotted underline-offset-3'
            }
          >
            {t`Slippage`}
          </TooltipTrigger>

          <TooltipContent
            side="top"
            className="w-[224px]"
            inDialog={smDialogOpen}
          >
            <p>{t`Slippage below 1% in versatile markets may cause failed execution and gas loss.`}</p>
          </TooltipContent>
        </Tooltip>
      }
      value={
        <BasicSlippage
          type="text"
          value={slippage}
          onValueChange={setSlippage}
          className={''}
        />
      }
    />
  );
};

export default memo(Slippage);
