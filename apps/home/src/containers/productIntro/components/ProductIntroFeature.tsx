'use client';

import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';
import { cn } from '@repo/ui';
import SpotlightCard from '@/components/SpotlightCard';

const FEATURE_CLASS_NAME =
  'group/self flex items-end gap-8 max-lg:flex-col max-lg:justify-between max-md:items-start max-md:gap-4 md:max-lg:min-h-102';
const CARD_CLASS_NAME =
  'flex h-[284px] w-[300px] shrink-0 items-center overflow-hidden rounded-2xl border max-lg:w-full';

type ProductIntroFeatureProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'title'
> & {
  title: ReactNode;
  description: ReactNode;
  cardClassName?: string;
};

const ProductIntroFeature = forwardRef<
  HTMLDivElement,
  ProductIntroFeatureProps
>(function ProductIntroFeature(
  { title, description, cardClassName, className, children, ...props },
  ref,
) {
  return (
    <div ref={ref} className={cn(FEATURE_CLASS_NAME, className)} {...props}>
      <div>
        <h3 className="text-2xl font-medium">{title}</h3>
        <div className="text-t-270 mt-3 text-sm">{description}</div>
      </div>
      <SpotlightCard
        className={cn(CARD_CLASS_NAME, cardClassName)}
        spotlightColor="rgba(0, 223, 235, 0.3)"
      >
        {children}
      </SpotlightCard>
    </div>
  );
});

export default ProductIntroFeature;
