import { FC } from 'react';
import { t } from '@lingui/core/macro';
import { CardListIcon } from '@repo/ui';
import ToolPanel from '../ToolPanel';
import Content from './Content';

interface NewsProps {
  type?: 'popover' | 'dialog';
  onOpenChange: (open: boolean) => void;
}

const News: FC<NewsProps> = ({ type = 'popover', onOpenChange }) => {
  return (
    <ToolPanel
      icon={<CardListIcon size={16} />}
      label={t`News`}
      popoverWidth="w-[308px]"
      type={type}
      onOpenChange={onOpenChange}
    >
      <Content />
    </ToolPanel>
  );
};

export default News;
