import { cn } from '@repo/ui';
import PathTracker from '../PathTracker';

export type AppLayoutScrollMode = 'auto' | 'none';

export interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  scrollMode?: AppLayoutScrollMode;
  rounded?: boolean;
  animateInner?: boolean;
}

export default function AppLayout({
  children,
  className,
  innerClassName,
  scrollMode = 'auto',
  rounded = false,
  animateInner = false,
}: AppLayoutProps) {
  const scrollableClassName =
    scrollMode === 'auto'
      ? 'h-[calc(100dvh-58px)] overflow-auto pb-10 max-md:h-[calc(100dvh-56px)] max-md:pb-0'
      : undefined;

  return (
    <main
      data-app-scroll={scrollMode === 'auto' ? '' : undefined}
      className={cn(
        'duration-300',
        scrollableClassName,
        rounded && 'rounded-[20px]',
        className,
      )}
    >
      <PathTracker />
      <div
        className={cn(
          'h-full',
          animateInner && 'animate-in fade-in slide-in-from-bottom-4',
          innerClassName,
        )}
      >
        {children}
      </div>
    </main>
  );
}
