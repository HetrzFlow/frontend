'use client';

import { ReactNode, useRef } from 'react';
import {
  ExternalToast,
  Toaster as Sonner,
  ToasterProps,
  toast as sonnerToast,
} from 'sonner';
import CheckCircleIcon from '../icons/CheckCircle';
import ExclamationCircleIcon from '../icons/ExclamationCircle';
import InfoCircleIcon from '../icons/InfoCircle';
import LoaderCircleIcon from '../icons/LoaderCircle';
import XIcon from '../icons/X';
import { cn } from '../lib/utils';

const Toaster = ({ theme = 'system', ...props }: ToasterProps) => {
  const ref = useRef<HTMLSelectElement>(null);

  return (
    <Sonner
      ref={ref}
      visibleToasts={6}
      theme={theme as ToasterProps['theme']}
      className={
        'toaster group !font-cerebri pointer-events-auto !w-max max-md:!left-1/2 data-[x-position=center]:[&>li]:-translate-x-1/2'
      }
      icons={{
        success: <CheckCircleIcon className="text-accent" />,
        info: <InfoCircleIcon className="text-accent" />,
        error: <ExclamationCircleIcon className="text-destructive" />,
        loading: (
          <LoaderCircleIcon size={20} className="text-accent animate-spin" />
        ),
      }}
      toastOptions={{
        classNames: {
          toast: `!gap-2 !w-max !text-sm !max-w-[460px] max-md:!max-w-[94vw] !font-medium !rounded-lg backdrop-blur-[20px] group !px-4 !py-3 justify-center toast group-[.toaster]:!bg-border group-[.toaster]:!text-popover-foreground group-[.toaster]:!border group-[.toaster]:!border-border group-[.toaster]:!shadow-[0px_10px_40px_0_rgba(0,0,0,0.1)]`,
          icon: `!size-6 !mx-0 `,
          content: '',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton:
            'group-[.toast]:!bg-primary group-[.toast]:!text-primary-foreground !font-medium',
          cancelButton:
            'group-[.toast]:!bg-muted group-[.toast]:!text-muted-foreground !font-medium',
          title: 'line-clamp-4',
        },
      }}
      duration={3000}
      offset={{ bottom: 58, top: 40 }}
      {...props}
    />
  );
};

interface TradeToastProps {
  id: string | number;
  type: 'success' | 'error' | 'loading' | 'warning';
  ordType?: 'market' | 'limit' | 'swap';
  title?: string;
  description?: ReactNode;
  icon?: ReactNode;
  content?: ReactNode;
  showClose?: boolean;
  href?: string;
}

function TradeToast(props: TradeToastProps) {
  const { title, description, icon, type, content, showClose, id } = props;

  const comp = (
    <>
      <div className="flex items-center justify-between gap-1 text-sm whitespace-nowrap">
        {icon && <div className="mr-1 size-6">{icon}</div>}
        <div className="text-t-1100 mr-2 font-medium">{title}</div>
        <div
          className={cn(
            'text-t-270 ml-auto flex items-center gap-1 whitespace-break-spaces',
          )}
        >
          {description}
        </div>
        <div className="">
          {type === 'success' && <CheckCircleIcon className="text-accent" />}
          {type === 'error' && (
            <ExclamationCircleIcon className="text-destructive" />
          )}
          {type === 'warning' && (
            <ExclamationCircleIcon className="text-warning" />
          )}
          {type === 'loading' && (
            <LoaderCircleIcon size={20} className="text-accent animate-spin" />
          )}
        </div>
        {showClose && (
          <XIcon
            className="text-t-430 hover:text-t-1100 ml-1 cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              sonnerToast.dismiss(id);
            }}
          />
        )}
      </div>
      {content && <div className="text-t-270 mt-2 text-sm">{content}</div>}
    </>
  );

  return <div className="min-w-86 max-md:min-w-72">{comp}</div>;
}

interface LiqToastProps {
  id: string | number;
  type: 'success' | 'error' | 'loading' | 'warning';
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  content?: ReactNode;
  showClose?: boolean;
  href?: string;
}
function LiqToast(props: LiqToastProps) {
  const { title, description, type, content, showClose, id, href } = props;
  const comp = (
    <>
      <div className="flex items-center justify-between gap-2 text-xs/tight md:text-sm">
        <div className="text-t-1100 font-medium">{title}</div>
        <div className="ml-auto flex items-center gap-2">
          <div
            className={cn(
              'text-t-270 whitespace-break-spaces',
              href
                ? 'decoration-t-430 underline decoration-dotted underline-offset-2'
                : '',
            )}
          >
            {description}
          </div>
          <div>
            {type === 'success' && <CheckCircleIcon className="text-accent" />}
            {type === 'error' && (
              <ExclamationCircleIcon className="text-destructive" />
            )}
            {type === 'warning' && (
              <ExclamationCircleIcon className="text-warning" />
            )}
            {type === 'loading' && (
              <LoaderCircleIcon
                size={20}
                className="text-accent animate-spin"
              />
            )}
          </div>
          {showClose && (
            <XIcon
              className="text-t-430 hover:text-t-1100 ml-1 cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                sonnerToast.dismiss(id);
              }}
            />
          )}
        </div>
      </div>
      {content ? <div className="mt-2">{content}</div> : null}
    </>
  );

  return href ? (
    <a
      href={href}
      className="block min-w-72 cursor-pointer"
      target="_blank"
      rel="noopener noreferrer nofollow"
    >
      {comp}
    </a>
  ) : (
    <div className="min-w-72">{comp}</div>
  );
}

function tradeToast(
  params: Omit<TradeToastProps, 'id'>,
  options: ExternalToast = {},
) {
  if (!options.duration) {
    options.duration =
      params.type === 'error' || params.type === 'warning' ? 4000 : 3000;
  }
  return sonnerToast.custom(
    (id) => <TradeToast id={id} {...params} />,
    options,
  );
}

function liqToast(
  params: Omit<LiqToastProps, 'id'>,
  options: ExternalToast = {},
) {
  if (!options.duration) {
    options.duration =
      params.type === 'error' || params.type === 'warning' ? 4000 : 3000;
  }
  return sonnerToast.custom((id) => <LiqToast id={id} {...params} />, options);
}

const errorFun = sonnerToast.error;

const toast: typeof sonnerToast = sonnerToast;

// error toast duration 4s
toast.error = (message, options = {}) => {
  let duration = 4000;
  if (options.duration) {
    duration = options.duration;
  }

  if (!message) {
    return '';
  }

  // network offline error
  if (message === 'Failed to fetch') {
    return '';
  }

  // timeout error
  if (
    typeof message === 'string' &&
    message.includes('The request took too long to respond')
  ) {
    return '';
  }

  return errorFun(message, {
    ...options,
    duration,
  });
};

export { Toaster, toast, tradeToast, liqToast };
