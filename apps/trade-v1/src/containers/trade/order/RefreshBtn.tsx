import { FC, useEffect, useState } from 'react';
import { ArrowClockwiseIcon, cn } from '@repo/ui';
import { useIsConnect } from '@/common';

interface RefreshBtnProps {
  onClick: () => void;
}

const RefreshBtn: FC<RefreshBtnProps> = ({ onClick }) => {
  const isConnect = useIsConnect();
  const [isClick, setIsClick] = useState(false);

  useEffect(() => {
    if (isClick) {
      setTimeout(() => {
        setIsClick(false);
      }, 300);
    }
  }, [isClick]);
  return (
    <ArrowClockwiseIcon
      size={20}
      className={cn(
        'text-t-350 hover:text-t-1100 shrink-0 origin-[10px_11.8px] cursor-pointer transition-[color,rotate] duration-300',
        isConnect ? '' : 'cursor-not-allowed',
        isClick ? 'rotate-360' : 'transition-none',
      )}
      onClick={() => {
        if (!isConnect) {
          return;
        }
        setIsClick(true);
        onClick();
      }}
    />
  );
};

export default RefreshBtn;
