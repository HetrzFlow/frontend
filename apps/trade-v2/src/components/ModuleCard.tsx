import { FC, ReactNode } from 'react';
import { cn } from '@repo/ui';

interface ModuleCardProps {
  className?: string;
  children?: ReactNode;
}

const ModuleCard: FC<ModuleCardProps> = ({ className, children }) => {
  return (
    <div
      className={cn(
        'bg-card rounded-2xl p-2 max-md:bg-transparent max-md:p-0',
        className,
      )}
    >
      {children}
    </div>
  );
};

export default ModuleCard;
