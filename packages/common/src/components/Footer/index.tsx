import { FC } from 'react';
import { cn } from '@repo/ui';
import SocialLinks from './SocialLinks';

interface FooterProps {
  className?: string;
}

const Footer: FC<FooterProps> = ({ className }) => {
  return (
    <footer
      className={cn(
        'text-t-430 mx-2 flex h-8 items-center justify-between pb-2 text-xs max-md:hidden',
        className,
      )}
    >
      <div></div>
      <SocialLinks />
    </footer>
  );
};

export default Footer;
