import { cn } from '../lib/utils';

function Loading({
  className,
  innerClassName,
  ...props
}: React.ComponentProps<'div'> & {
  innerClassName?: string;
}) {
  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center',
        className,
      )}
    >
      <div
        data-slot="loading"
        className={cn(
          'border-primary border-t-primary-foreground h-6 w-6 animate-spin rounded-full border-2 duration-700',
          innerClassName,
        )}
        {...props}
      />
    </div>
  );
}

export { Loading };
