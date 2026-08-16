'use client';

import { FC, ReactNode, useEffect, useState } from 'react';
import { cn } from '@repo/ui';

interface AnimationDivProps {
  children: ReactNode;
  initalClassName: string;
  exitClassName: string;
  className?: string;
}

const AnimationDiv: FC<AnimationDivProps> = ({
  children,
  initalClassName,
  exitClassName,
  className,
}) => {
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    setAnimating(true);
  }, []);

  return (
    <div
      className={cn(
        'h-full transition-all duration-300 ease-out',
        className,
        animating ? exitClassName : initalClassName,
      )}
    >
      {children}
    </div>
  );
};

export default AnimationDiv;
