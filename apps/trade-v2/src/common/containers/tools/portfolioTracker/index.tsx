import { FC } from 'react';
import { t } from '@lingui/core/macro';
import { BullseyeIcon } from '@repo/ui';
import ToolPanel from '../ToolPanel';
import Content from './Content';

interface PortfolioTrackerProps {
  type?: 'popover' | 'dialog';
  onOpenChange: (open: boolean) => void;
}

const PortfolioTracker: FC<PortfolioTrackerProps> = ({
  type = 'popover',
  onOpenChange,
}) => {
  return (
    <ToolPanel
      icon={<BullseyeIcon size={16} />}
      label={t`Portfolio Tracker`}
      popoverWidth="w-[546px]"
      type={type}
      onOpenChange={onOpenChange}
    >
      <Content />
    </ToolPanel>
  );
};

export default PortfolioTracker;
