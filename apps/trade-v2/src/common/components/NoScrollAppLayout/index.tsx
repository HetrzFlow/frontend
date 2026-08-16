import AppLayout, { type AppLayoutProps } from '../AppLayout';

type NoScrollAppLayoutProps = Omit<
  AppLayoutProps,
  'scrollMode' | 'rounded' | 'animateInner'
> & {
  rounded?: boolean;
  animateInner?: boolean;
};

export default function NoScrollAppLayout({
  children,
  className,
  innerClassName,
  rounded = true,
  animateInner = true,
}: NoScrollAppLayoutProps) {
  return (
    <AppLayout
      className={className}
      innerClassName={innerClassName}
      scrollMode="none"
      rounded={rounded}
      animateInner={animateInner}
    >
      {children}
    </AppLayout>
  );
}
