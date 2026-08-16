import { FC, useEffect, useState } from 'react';
import { ArrowDownIcon, cn } from '@repo/ui';

interface SwitchBtnProps {
  onSwitch: () => void;
}

const SwitchBtn: FC<SwitchBtnProps> = ({ onSwitch }) => {
  const [isClick, setIsClick] = useState(false);

  useEffect(() => {
    if (isClick) {
      setTimeout(() => {
        setIsClick(false);
      }, 100);
    }
  }, [isClick]);

  return (
    <div
      className={cn(
        'bg-bg-swap-arrow max-md:bg-bg-swap-arrow-h5 max-md:border-background border-secondary group absolute left-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-[calc(var(--spacing)*1.5)] transition-[rotate] select-none',
        isClick ? 'md:rotate-180' : 'transition-none',
      )}
      onClick={() => {
        setIsClick(true);
        onSwitch();
      }}
    >
      <ArrowDownIcon
        size={32}
        className="absolute transition-[scale,translate] group-hover:translate-x-[-3px] group-hover:translate-y-[-4px] group-hover:scale-70 group-hover:rotate-180"
      />
      <ArrowDownIcon
        size={32}
        className="absolute transition-[scale,translate] group-hover:translate-x-[3px] group-hover:translate-y-[4px] group-hover:scale-70"
      />
    </div>
  );
};

export default SwitchBtn;
