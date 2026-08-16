import { FC, ReactNode } from 'react';

import { Button, cn } from '@repo/ui';
import { useIsConnect } from '../../chainClient';
import ConnectBtn from '../../components/ConnectBtn';

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
  const isConnect = useIsConnect();

  return isConnect ? (
    <Button
      type="submit"
      onClick={onClick}
      disabled={isConnect ? disabled : false}
      className={cn('w-full text-base', className)}
    >
      {children}
    </Button>
  ) : (
    <ConnectBtn className={cn('w-full text-base', className)} />
  );
};

export default BaseFormBtn;
