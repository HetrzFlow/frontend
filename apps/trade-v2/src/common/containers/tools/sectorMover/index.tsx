import { FC } from 'react';
import { t } from '@lingui/core/macro';
import { BubbleIcon } from '@repo/ui';
import ToolPanel from '../ToolPanel';
import Content from './Content';

interface SectorMoverProps {
  type?: 'popover' | 'dialog';
  onOpenChange: (open: boolean) => void;
}

const SectorMover: FC<SectorMoverProps> = ({
  type = 'popover',
  onOpenChange,
}) => {
  return (
    <ToolPanel
      icon={<BubbleIcon size={16} />}
      label={t`Sector Mover`}
      popoverWidth="w-[760px]"
      type={type}
      onOpenChange={onOpenChange}
    >
      <Content />
    </ToolPanel>
  );
};

export default SectorMover;
