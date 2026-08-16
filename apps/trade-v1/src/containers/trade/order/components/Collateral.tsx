import { FC } from 'react';

import { unitFormat } from '@repo/lib/format';
import { cn, PencilLineIcon } from '@repo/ui';
import { useGlobalStore } from '@/common';

interface CollateralProps {
  collateral: string;
  editable?: boolean;
  className?: string;
  onEdit?: () => void;
}

const Collateral: FC<CollateralProps> = ({
  collateral,
  editable,
  className,
  onEdit,
}) => {
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  return (
    <div
      className={cn(
        'font-plex flex items-center gap-1 leading-tight max-md:text-sm',
        className,
      )}
    >
      {unitFormat(collateral, usdAmountDisplayDecimal, {
        minNumber: 1000000,
        unitDecimal: 3,
        style: 'currency',
        currency: 'USD',
      })}
      {editable && (
        <PencilLineIcon
          size={14}
          className="text-t-430 hover:text-t-1100 cursor-pointer"
          onClick={() => {
            // add/reduce collateral dialog
            if (onEdit) {
              onEdit();
            }
          }}
        />
      )}
    </div>
  );
};

export default Collateral;
