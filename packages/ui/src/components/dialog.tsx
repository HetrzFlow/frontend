import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';

import XIcon from '../icons/X';
import { cn } from '../lib/utils';

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-[#070C0D]/50 max-md:duration-400 max-md:data-[state=closed]:duration-400 max-md:data-[state=open]:duration-400',
        className,
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  closeClassName,
  overlayClassName,
  children,
  position,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  position?: 'center' | 'bottom';
  closeClassName?: string;
  overlayClassName?: string;
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay className={overlayClassName} />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          'bg-bg-3 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed top-[initial] bottom-0 left-[50%] z-50 grid translate-x-[-50%] gap-3 rounded-xl p-4 duration-200 focus:outline-hidden focus-visible:outline-0 max-md:!w-full max-md:data-[state=closed]:duration-400 max-md:data-[state=open]:duration-400 md:max-w-[calc(100%-2rem)]',
          'md:data-[state=closed]:zoom-out-95 md:w-initial md:data-[state=open]:zoom-in-95 md:top-[50%] md:bottom-[initial] md:translate-y-[-50%]',
          position === 'center'
            ? 'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-bottom-0 data-[state=closed]:slide-out-to-bottom-0 top-[50%] bottom-[initial] translate-y-[-50%] max-md:!w-[calc(100%-32px)]'
            : 'max-md:data-[state=open]:slide-in-from-bottom max-md:data-[state=closed]:slide-out-to-bottom max-md:rounded-b-none',
          position === 'bottom'
            ? 'md:data-[state=closed]:zoom-out-100 md:data-[state=open]:zoom-in-100 md:data-[state=open]:slide-in-from-bottom md:data-[state=closed]:slide-out-to-bottom md:top-[initial] md:bottom-0 md:translate-y-0'
            : '',
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          className={cn(
            'ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs focus:ring-0 focus:ring-offset-0 focus:outline-hidden focus-visible:outline-0 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0',
            closeClassName,
          )}
        >
          <XIcon />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col gap-2 text-left', className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        'flex flex-row gap-2 text-base font-medium sm:justify-end',
        className,
      )}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('text-base leading-6 font-medium', className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
