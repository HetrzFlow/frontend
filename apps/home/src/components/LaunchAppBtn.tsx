import { FC } from 'react';
import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useNavItems } from '@repo/common/hooks';
import { Button } from '@repo/ui';
import ComingSoon from './ComingSoon';

interface BtnContentProps {
  disabled?: boolean;
}

const BtnContent: FC<BtnContentProps> = ({ disabled }) => {
  return (
    <Button
      variant="outline"
      disabled={disabled}
      className="border-accent group text-accent hover:text-accent hidden h-10 w-35 rounded-xl bg-transparent text-sm font-medium hover:bg-transparent disabled:opacity-100 lg:flex"
    >
      <div className="flex gap-4">
        <span className="w-0"></span>
        {i18n._(msg`Launch App`)}
        <span className="w-0 overflow-hidden text-left transition-[width] duration-300 group-hover:w-7">
          →
        </span>
      </div>
    </Button>
  );
};

const LaunchAppBtn = () => {
  const navItems = useNavItems();

  return navItems.trade.link ? (
    <a href={navItems.trade.link} rel="noopener noreferrer" className="ml-3">
      <BtnContent disabled={!navItems.trade.link} />
    </a>
  ) : (
    <ComingSoon
      className="ml-3"
      popupClassName={'left-1/2 -translate-x-1/2 top-15'}
    >
      <BtnContent disabled={!navItems.trade.link} />
    </ComingSoon>
  );
};

export default LaunchAppBtn;
