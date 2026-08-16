import { ComponentProps, FC } from 'react';
import { useLingui } from '@lingui/react/macro';
import { useShallow } from 'zustand/react/shallow';
import { Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui';
import { Slippage as BasicSlippage } from '@/common';

import ListItem from '@/components/ListItem';
import { usePreferenceStore } from '@/stores/trade/preference';

interface SlippageProps extends ComponentProps<typeof TooltipContent> {
  inDialog?: boolean;
}

const Slippage: FC<SlippageProps> = ({ inDialog, ...tooltipContentProps }) => {
  const { t } = useLingui();
  const [slippage, setSlippage] = usePreferenceStore(
    useShallow((state) => [state.slippage, state.setSlippage]),
  );

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
            inDialog={inDialog}
            {...tooltipContentProps}
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

export default Slippage;
