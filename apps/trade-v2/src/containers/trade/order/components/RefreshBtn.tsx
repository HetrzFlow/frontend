import { FC, useEffect, useState } from 'react';
import { ArrowClockwiseIcon, cn } from '@repo/ui';
import { useIsConnect } from '@/common';

interface RefreshBtnProps {
  onClick: () => void;
}

const RefreshBtn: FC<RefreshBtnProps> = ({ onClick }) => {
  const isConnected = useIsConnect();
  const [isClick, setIsClick] = useState(false);

  useEffect(() => {
    if (!isClick) return;

    const timeoutId = setTimeout(() => {
      setIsClick(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [isClick]);
  return (
    <ArrowClockwiseIcon
      size={20}
      className={cn(
        'text-t-350 hover:text-t-1100 shrink-0 origin-[10px_11.8px] cursor-pointer transition-[color,rotate] duration-300',
        isConnected ? '' : 'cursor-not-allowed',
        isConnected ? '' : 'cursor-not-allowed',
        isClick ? 'rotate-360' : 'transition-none',
      )}
      onClick={() => {
        if (!isConnected) return;
        if (!isConnected) return;
        setIsClick(true);
        onClick();
      }}
    />
  );
};

export default RefreshBtn;
