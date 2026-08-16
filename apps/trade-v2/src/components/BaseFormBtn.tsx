import { FC, ReactNode } from 'react';
import { Button, cn } from '@repo/ui';
import { ConnectBtn, useIsConnect } from '@/common';

interface FormBtnProps {
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

const BaseFormBtn: FC<FormBtnProps> = ({
  className,
  children,
  onClick,
  disabled = false,
}) => {
  const isConnected = useIsConnect();
  return isConnected ? (
    <Button
      type="submit"
      onClick={() => {
        onClick?.();
      }}
      disabled={isConnected ? disabled : false}
      className={cn('w-full', className)}
    >
      {children}
    </Button>
  ) : (
    <ConnectBtn className={cn('w-full', className)} />
  );
};

export default BaseFormBtn;
