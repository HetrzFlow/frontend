import { FC } from 'react';

import { useLingui } from '@lingui/react/macro';
import {
  DialogClose,
  DialogFooter,
  Button,
  LoaderCircleIcon,
  DialogDescription,
} from '@repo/ui';

interface ContentProps {
  isPending: boolean;
  handleConfirm: () => void;
}

const Content: FC<ContentProps> = ({ isPending, handleConfirm }) => {
  const { t } = useLingui();
  return (
    <>
      <DialogDescription className="text-secondary-foreground text-sm">{t`This action cannot be reverted`}</DialogDescription>
      <DialogFooter className="flex gap-4">
        <DialogClose asChild>
          <Button
            className="bg-bg-3 hover:bg-bg-3/70 w-full shrink text-base"
            type="button"
          >
            {t`Dismiss`}
          </Button>
        </DialogClose>
        <DialogClose asChild>
          <Button
            className="bg-accent text-accent-foreground hover:bg-accent/70 w-full shrink text-base"
            type="button"
            onClick={handleConfirm}
          >
            {isPending && (
              <LoaderCircleIcon size={16} className="animate-spin" />
            )}
            {t`Confirm`}
          </Button>
        </DialogClose>
      </DialogFooter>
    </>
  );
};

export default Content;
