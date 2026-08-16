import { FC, memo } from 'react';
import { useLingui } from '@lingui/react/macro';
import { cn, Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui';

import { useOrderTypeText } from '@/hooks/useOrderText';
import type { OrderType } from '@hertzflow/sdk-v2/types/orders';

interface TypeProps {
  type: OrderType;
  isInactive?: boolean;
}

const Type: FC<TypeProps> = ({ type, isInactive = false }) => {
  const { t } = useLingui();
  const displayType = useOrderTypeText(type);
  const typeNode = isInactive ? (
    <Tooltip>
      <TooltipTrigger className="decoration-t-350 cursor-pointer underline decoration-dotted underline-offset-2">
        {displayType}
      </TooltipTrigger>
      <TooltipContent className="max-w-70" align="start">
        {t`Activates on your next trade and may close your position on entry. Cancel if unintended.`}
      </TooltipContent>
    </Tooltip>
  ) : (
    <span>{displayType}</span>
  );

  return (
    <div className="flex min-w-12 items-center gap-1">
      {typeNode}
      {isInactive ? (
        <span
          className={cn(
            'bg-warning/10 text-warning inline-flex h-4 items-center rounded-sm px-2 text-[10px] leading-none',
          )}
        >
          {t`Inactive`}
        </span>
      ) : null}
    </div>
  );
};

export default memo(Type);
