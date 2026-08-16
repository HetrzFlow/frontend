import { useRef, useState } from 'react';
import { Trans, useLingui } from '@lingui/react/macro';
import { useDisconnectWallet } from '@mysten/dapp-kit';
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
  HzIcon,
  HzTextIcon,
  Label,
} from '@repo/ui';
import {
  policyDoc,
  termsDoc,
  tradingMechanismDoc,
} from '../../constants/links';
import { useGlobalStore } from '../../stores/globalStore';

const RiskNoticeDialog = () => {
  const { t } = useLingui();
  const { mutate: disconnectWallet } = useDisconnectWallet();
  const onRiskNoticeDialogClose = useGlobalStore(
    (state) => state.onRiskNoticeDialogClose,
  );
  const [open, setOpen] = useState(true);
  const [acceptPolicy, setAcceptPolicy] = useState(false);
  const [understandRule, setUnderstandRule] = useState(false);
  const acceptClickRef = useRef(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
        if (!open) {
          onRiskNoticeDialogClose(acceptClickRef.current);
          if (!acceptClickRef.current) {
            disconnectWallet();
          }
        }
      }}
    >
      <DialogContent
        className="w-[440px]"
        position="center"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <div className="relative mt-10 overflow-hidden rounded-lg">
          <video
            width="100%"
            loop
            autoPlay
            preload="auto"
            muted
            playsInline
            className="absolute top-1/2 -z-1 w-full -translate-y-1/2 object-cover"
          >
            <source
              src={`${process.env.NEXT_PUBLIC_HOME_URL || ''}/home-static/banner.mp4`}
              type="video/mp4"
            />
            {t`Your browser does not support the video tag.`}
          </video>
          <div className="flex h-[130px] items-center justify-center gap-2 bg-gradient-to-t from-black/70 to-black/70">
            <HzIcon size={32} className="text-accent" />
            <HzTextIcon size={16} className="text-white" />
          </div>
        </div>

        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">{t`Welcome to HertzFlow`}</DialogTitle>
        </DialogHeader>
        <DialogDescription className="text-t-1100 text-sm">{t`Please read and accept the following before using this site.`}</DialogDescription>

        <Label className="flex cursor-pointer items-start gap-2 text-sm leading-tight font-normal">
          <Checkbox
            className="m-0.5 size-[14px]"
            checked={acceptPolicy}
            onCheckedChange={(checked) => setAcceptPolicy(checked as boolean)}
          />
          <p>
            <Trans>
              I have read and accept the{' '}
              <a
                href={termsDoc || 'https://'}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-accent"
              >
                Terms of Use
              </a>{' '}
              and{' '}
              <a
                href={policyDoc || 'https://'}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-accent"
              >
                Privacy Policy
              </a>
              .
            </Trans>
          </p>
        </Label>
        <Label className="flex cursor-pointer items-start gap-2 text-sm leading-tight font-normal">
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
              className="bg-accent text-accent-foreground hover:bg-accent/90 h-[54px] w-full shrink text-base font-medium"
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

export default RiskNoticeDialog;
