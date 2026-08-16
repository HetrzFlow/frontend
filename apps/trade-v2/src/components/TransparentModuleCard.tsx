import { FC, ReactNode } from 'react';
import { cn } from '@repo/ui';

interface TransparentModuleCardProps {
  className?: string;
  children?: ReactNode;
}

const TransparentModuleCard: FC<TransparentModuleCardProps> = ({
  className,
  children,
}) => {
  return <div className={cn('rounded-2xl bg-white/6 p-4', className)}>{children}</div>;
};

export default TransparentModuleCard;
