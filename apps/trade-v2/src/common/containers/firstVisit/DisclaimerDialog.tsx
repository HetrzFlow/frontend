import type { FC } from 'react';
import { useRef, useState } from 'react';
import { Trans, useLingui } from '@lingui/react/macro';

import {
  policyDoc,
  termsDoc,
  tradingMechanismDoc,
} from '@repo/common/constants';
import {
  Button,
  Checkbox,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
} from '@repo/ui';
import { usePrivy } from '@/common/chainClient';
import { useGlobalStore } from '@/common/stores';
import Banner from './Banner';

interface DisclaimerDialogProps {
  show: boolean;
}

const TermsLink = () => {
  const { t } = useLingui();
  return (
    <a
      href={termsDoc || 'https://'}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="text-accent"
    >
      {t`Terms of Use`}
    </a>
  );
};

const PolicyLink = () => {
  const { t } = useLingui();
  return (
    <a
      href={policyDoc || 'https://'}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="text-accent"
    >
      {t`Privacy Policy`}
    </a>
  );
};

const DisclaimerDialog: FC<DisclaimerDialogProps> = ({ show }) => {
  const { t } = useLingui();
  const { logout } = usePrivy();
  const setStoreState = useGlobalStore((state) => state.setStoreState);
  const [open, setOpen] = useState(show);
  const [acceptPolicy, setAcceptPolicy] = useState(false);
  const [understandRule, setUnderstandRule] = useState(false);
  const acceptClickRef = useRef(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) return;

        if (acceptClickRef.current) {
          setStoreState({
            hasAcceptedInviteCodeDialog: true,
          });
          return;
        }

        logout();
      }}
    >
      <DialogContent
        className="z-[70] w-[440px]"
        overlayClassName="z-[70]"
        position="center"
        closeClassName="hidden"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <Banner />

        <DialogHeader>
          <DialogTitle className="mt-4.5 text-2xl font-semibold">{t`Welcome to HertzFlow`}</DialogTitle>
        </DialogHeader>
        <DialogDescription className="text-t-1100 text-sm">{t`Before you start trading, please review and accept our terms.`}</DialogDescription>

        <Label className="flex cursor-pointer items-start gap-2 text-sm leading-tight font-normal">
          <Checkbox
            className="m-0.5 size-[14px]"
            checked={acceptPolicy}
            onCheckedChange={(checked) => setAcceptPolicy(checked as boolean)}
          />
          <p>
            <Trans id="disclaimer.policy">
              I have read and accept the <TermsLink /> and <PolicyLink />.
            </Trans>
          </p>
        </Label>
        <Label className="flex cursor-pointer items-start gap-2 text-sm font-normal">
          <Checkbox
            className="m-0.5 size-[14px]"
            checked={understandRule}
            onCheckedChange={(checked) => setUnderstandRule(checked as boolean)}
          />
          <p>
            <Trans>
              I fully understand{' '}
              <a
                href={tradingMechanismDoc || 'https://'}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-accent"
              >
                the trading mechanism of HertzFlow
              </a>{' '}
              and am aware of the trading risks involved in the perpetual
              trading process.
            </Trans>
          </p>
        </Label>

        <DialogFooter className="flex gap-4">
          <DialogClose asChild>
            <Button
              className="bg-accent text-accent-foreground hover:bg-accent/90 disabled:bg-bg-4 disabled:hover:bg-bg-4 w-full shrink font-medium"
              type="button"
              disabled={!(acceptPolicy && understandRule)}
              onClick={() => {
                acceptClickRef.current = true;
              }}
            >
              {t`Accept and Continue`}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DisclaimerDialog;
