'use client';

import { FC, ReactNode, useEffect, useState } from 'react';
import { cn } from '@repo/ui';

interface AnimationDivProps {
  children: ReactNode;
  initalClassName: string;
  exitClassName: string;
}

const AnimationDiv: FC<AnimationDivProps> = ({
  children,
  initalClassName,
  exitClassName,
}) => {
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    setAnimating(true);
  }, []);

  return (
    <div
      className={cn(
        'transition-all duration-300 ease-out',
        animating ? exitClassName : initalClassName,
      )}
    >
      {children}
    </div>
  );
};

export default AnimationDiv;
