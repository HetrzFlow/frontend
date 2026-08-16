import { FC } from 'react';
import { t } from '@lingui/core/macro';
import { LightningChargeIcon } from '@repo/ui';
import ToolPanel from '../ToolPanel';
import Content from './Content';

interface SmartFlowsProps {
  type?: 'popover' | 'dialog';
  onOpenChange: (open: boolean) => void;
}

const SmartFlows: FC<SmartFlowsProps> = ({
  type = 'popover',
  onOpenChange,
}) => {
  return (
    <ToolPanel
      icon={<LightningChargeIcon size={16} />}
      label={t`Smart Flows`}
      popoverWidth="w-auto min-w-[360px]"
      type={type}
      onOpenChange={onOpenChange}
    >
      <Content />
    </ToolPanel>
  );
};

export default SmartFlows;
