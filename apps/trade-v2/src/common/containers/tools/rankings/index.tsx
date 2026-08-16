import { FC } from 'react';
import { t } from '@lingui/core/macro';
import { TrophyIcon } from '@repo/ui';
import ToolPanel from '../ToolPanel';
import Content from './Content';

interface RankingsProps {
  type?: 'popover' | 'dialog';
  onOpenChange: (open: boolean) => void;
}

const Rankings: FC<RankingsProps> = ({ type = 'popover', onOpenChange }) => {
  return (
    <ToolPanel
      icon={<TrophyIcon size={16} />}
      label={t`Rankings`}
      popoverWidth="w-[308px]"
      type={type}
      onOpenChange={onOpenChange}
    >
      <Content />
    </ToolPanel>
  );
};

export default Rankings;
