import { ComponentProps, ReactNode } from 'react';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@repo/ui';

interface DialogShellProps extends ComponentProps<typeof DialogContent> {
  dialogTitle: ReactNode;
  children: ReactNode;
}

const DialogShell = ({ dialogTitle, children, ...props }: DialogShellProps) => {
  return (
    <DialogContent aria-describedby={undefined} {...props}>
      <DialogHeader>
        <DialogTitle>{dialogTitle}</DialogTitle>
      </DialogHeader>
      {children}
    </DialogContent>
  );
};

export default DialogShell;
