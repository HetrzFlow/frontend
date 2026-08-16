import { FC } from 'react';
import { cn } from '@repo/ui';
import Feedback from './Feedback';
import Logo from './Logo';

interface FooterProps {
  className?: string;
}

const Footer: FC<FooterProps> = ({ className }) => {
  return (
    <footer
      className={cn(
        'text-t-430 mx-5 flex h-9 w-[calc(100vw-40px)] items-center justify-between pb-4 text-xs max-md:hidden',
        className,
      )}
    >
      <Logo />
      <Feedback />
    </footer>
  );
};

export default Footer;
