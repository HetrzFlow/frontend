import { Trans } from '@lingui/react/macro';
import { ChevronRightIcon } from '@repo/ui';

const HyperProfitShareDescription = () => {
  'use no memo';
  return (
    <div>
      <p className="flex gap-1">
        <span className="text-accent mt-px">
          <ChevronRightIcon size={12} />
        </span>
        <span>
          <Trans>
            <strong className="text-t-1100">0%</strong> open/close fee.{' '}
            <strong className="text-t-1100">0%</strong> profit share if PnL &lt;
            0.
          </Trans>
        </span>
      </p>
      <p className="flex gap-1">
        <span className="text-accent mt-px">
          <ChevronRightIcon size={12} />
        </span>
        <span>
          <Trans>
            Higher ROI (
            <strong className="text-t-1100">PnL / full collateral</strong>),
            higher share.
          </Trans>
        </span>
      </p>
      <p className="flex gap-1">
        <span className="text-accent mt-px">
          <ChevronRightIcon size={12} />
        </span>
        <span>
          <Trans>
            Partial closes <strong className="text-t-1100">&gt;</strong> full
            close profit share.
          </Trans>
        </span>
      </p>
    </div>
  );
};

export default HyperProfitShareDescription;
