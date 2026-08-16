'use client';

import { FC, ReactNode } from 'react';
import { Button, cn } from '@repo/ui';
import { ConnectBtn } from '@/common';
import { useIsConnect } from '@/hooks/hzlp/useAccount';

interface BaseFormBtnProps {
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

const BaseFormBtn: FC<BaseFormBtnProps> = ({
  className,
  children,
  onClick,
  disabled = false,
}) => {
  const isConnect = useIsConnect();

  return isConnect ? (
    <Button
      type="submit"
      onClick={onClick}
      disabled={isConnect ? disabled : false}
      className={cn('text-md w-full', className)}
    >
      {children}
    </Button>
  ) : (
    <ConnectBtn className="w-full" />
  );
};

export default BaseFormBtn;
