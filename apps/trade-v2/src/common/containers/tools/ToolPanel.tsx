import { FC, ReactNode, useState } from 'react';
import {
  cn,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@repo/ui';

interface ToolPanelProps {
  icon: ReactNode;
  label: string;
  popoverWidth: string;
  type?: 'popover' | 'dialog';
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

const ToolPanel: FC<ToolPanelProps> = ({
  icon,
  label,
  popoverWidth,
  type = 'popover',
  onOpenChange,
  children,
}) => {
  const [open, setOpen] = useState(false);

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    onOpenChange(v);
  };

  return type === 'popover' ? (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        aria-label="select instrument"
        className={cn('flex items-center gap-1 p-0', open ? 'text-t-1100' : '')}
      >
        {icon}
        {label}
      </PopoverTrigger>

      <PopoverContent
        align="start"
        alignOffset={-8}
        sideOffset={12}
        className={cn(
          'bg-t-1100/10 p-3 shadow-none backdrop-blur-[10px]',
          popoverWidth,
        )}
      >
        {children}
      </PopoverContent>
    </Popover>
  ) : (
    <Dialog open={open} onOpenChange={handleOpenChange} modal>
      <DialogTrigger
        aria-label="select instrument"
        className="flex w-full items-center justify-start gap-4 p-0"
      >
        {icon}
        {label}
      </DialogTrigger>

      <DialogContent
        className=""
        closeClassName="hidden"
        aria-describedby={undefined}
      >
        <DialogTitle className="hidden">{label}</DialogTitle>
        {children}
      </DialogContent>
    </Dialog>
  );
};

export default ToolPanel;
