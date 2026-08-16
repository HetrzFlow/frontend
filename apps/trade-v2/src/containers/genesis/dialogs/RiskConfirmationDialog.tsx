'use client';

import { useState } from 'react';
import { Trans, useLingui } from '@lingui/react/macro';
import { policyDoc, termsDoc } from '@repo/common/constants';
import { percentFormat, thoFormat } from '@repo/lib/format';
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Separator,
} from '@repo/ui';
import Banner from '@/common/containers/firstVisit/Banner';
import type { GenesisVaultConfig } from '@/services/rest/genesis';
import { GENESIS_INTEGER_FORMAT_OPTIONS } from '../lib/constants';
import { useGenesisAccessStore } from '../stores/genesisAccessStore';

interface RiskConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccepted: () => void;
  config?: GenesisVaultConfig;
}

const ApyIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
    >
      <rect width="48" height="48" fill="#16242A" />
      <g opacity="0.6">
        <path
          opacity="0.5"
          d="M15.384 32.3114C16.8647 33.3261 18.1153 34.6617 18.7923 36.0724C19.4696 37.4842 19.434 38.6757 18.885 39.4768C18.336 40.2779 17.2377 40.7412 15.6766 40.619C14.1166 40.4969 12.4197 39.8125 10.939 38.7978C9.45833 37.7831 8.20767 36.4476 7.53074 35.0369C6.85341 33.6251 6.88986 32.4341 7.43878 31.633C7.98777 30.8319 9.0853 30.3681 10.6464 30.4903C12.2064 30.6124 13.9033 31.2967 15.384 32.3114Z"
          fill="url(#paint0_linear_27707_23850)"
          stroke="url(#paint1_linear_27707_23850)"
          strokeWidth="0.307655"
        />
        <path
          d="M8.19811 33.9285C6.8155 31.0467 8.27789 28.9127 11.4644 29.1621C14.651 29.4114 18.355 31.9497 19.7376 34.8315C21.1203 37.7133 19.6579 39.8473 16.4713 39.598C13.2848 39.3486 9.58071 36.8103 8.19811 33.9285Z"
          fill="url(#paint2_linear_27707_23850)"
        />
        <path
          d="M7.96922 30.6341C7.5339 31.4803 7.5757 32.6301 8.20119 33.9339C9.5838 36.8157 13.2878 39.3539 16.4743 39.6033C17.9005 39.7149 18.9801 39.3481 19.6151 38.6515L19.1812 39.2846C18.6622 40.326 17.4293 40.9163 15.6689 40.7786C12.4824 40.5292 8.77842 37.9909 7.39578 35.1092C6.63898 33.5316 6.73592 32.1791 7.50055 31.3181L7.96922 30.6341Z"
          fill="#21353D"
        />
      </g>
      <g opacity="0.6">
        <path
          opacity="0.5"
          d="M26.8982 22.4332C27.7404 24.0183 28.2302 25.7812 28.1766 27.3451C28.123 28.9101 27.5395 29.9495 26.6819 30.4052C25.8243 30.8609 24.6362 30.7627 23.3093 29.9313C21.9834 29.1004 20.7965 27.7079 19.9542 26.1228C19.112 24.5377 18.6222 22.7747 18.6758 21.2109C18.7294 19.646 19.3134 18.6073 20.171 18.1516C21.0286 17.6959 22.2161 17.7933 23.5431 18.6247C24.869 19.4555 26.0559 20.848 26.8982 22.4332Z"
          fill="url(#paint3_linear_27707_23850)"
          stroke="url(#paint4_linear_27707_23850)"
          strokeWidth="0.307655"
        />
        <path
          d="M28.1567 21.765C28.999 23.3501 29.4887 25.113 29.4352 26.6769C29.3815 28.2418 28.798 29.2813 27.9404 29.737C27.0828 30.1926 25.8948 30.0944 24.5679 29.2631C23.242 28.4322 22.055 27.0397 21.2128 25.4546C20.3705 23.8694 19.8808 22.1065 19.9343 20.5427C19.988 18.9778 20.572 17.9391 21.4295 17.4834C22.2871 17.0277 23.4747 17.1251 24.8016 17.9565C26.1276 18.7873 27.3144 20.1798 28.1567 21.765Z"
          fill="url(#paint5_linear_27707_23850)"
          stroke="url(#paint6_linear_27707_23850)"
          strokeWidth="0.307655"
        />
        <path
          d="M21.1044 17.5122C20.3263 18.0604 19.8302 19.0989 19.7807 20.5445C19.6713 23.7389 21.7781 27.7043 24.4866 29.4012C25.6988 30.1606 26.8252 30.3348 27.7105 30.0116L27.0396 30.3681C26.0971 31.0558 24.7276 31.01 23.2276 30.0702C20.5191 28.3732 18.4122 24.4079 18.5216 21.2136C18.5816 19.4644 19.2946 18.3105 20.3714 17.9017L21.1044 17.5122Z"
          fill="url(#paint7_linear_27707_23850)"
        />
      </g>
      <g opacity="0.6">
        <path
          opacity="0.5"
          d="M37.3844 10.3114C38.8651 11.3261 40.1157 12.6617 40.7926 14.0724C41.47 15.4842 41.4344 16.6757 40.8854 17.4768C40.3364 18.2779 39.238 18.7412 37.677 18.619C36.117 18.4969 34.4201 17.8125 32.9394 16.7978C31.4587 15.7831 30.208 14.4476 29.5311 13.0369C28.8538 11.6251 28.8902 10.4341 29.4392 9.63299C29.9881 8.83188 31.0857 8.3681 32.6468 8.49026C34.2068 8.61239 35.9036 9.29674 37.3844 10.3114Z"
          fill="url(#paint8_linear_27707_23850)"
          stroke="url(#paint9_linear_27707_23850)"
          strokeWidth="0.307655"
        />
        <path
          d="M38.1905 9.13664C39.6712 10.1513 40.9219 11.4869 41.5988 12.8976C42.2761 14.3094 42.2405 15.5009 41.6916 16.302C41.1426 17.1031 40.0442 17.5664 38.4831 17.4442C36.9232 17.3221 35.2262 16.6377 33.7455 15.623C32.2648 14.6083 31.0142 13.2728 30.3373 11.8621C29.6599 10.4503 29.6964 9.2593 30.2453 8.45819C30.7943 7.65708 31.8918 7.19329 33.4529 7.31545C35.0129 7.43759 36.7098 8.12193 38.1905 9.13664Z"
          fill="#2A434D"
          stroke="url(#paint10_linear_27707_23850)"
          strokeWidth="0.307655"
        />
        <path
          d="M29.9664 8.64033C29.5348 9.48585 29.5782 10.6329 30.202 11.9331C31.5846 14.8149 35.2885 17.3531 38.4751 17.6025C39.9009 17.714 40.9803 17.3477 41.6153 16.6515L41.1814 17.2846C40.6624 18.326 39.4296 18.9163 37.6691 18.7786C34.4827 18.5292 30.7787 15.9908 29.396 13.1092C28.6374 11.528 28.7366 10.1729 29.506 9.31217L29.9664 8.64033Z"
          fill="url(#paint11_linear_27707_23850)"
        />
      </g>
      <defs>
        <linearGradient
          id="paint0_linear_27707_23850"
          x1="15.4713"
          y1="32.1842"
          x2="10.852"
          y2="38.925"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00DFEB" stopOpacity="0.4" />
          <stop offset="1" stopColor="#00DFEB" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient
          id="paint1_linear_27707_23850"
          x1="15.4713"
          y1="32.1842"
          x2="10.852"
          y2="38.925"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" stopOpacity="0.1" />
          <stop offset="1" stopColor="white" stopOpacity="0.03" />
        </linearGradient>
        <linearGradient
          id="paint2_linear_27707_23850"
          x1="14.9998"
          y1="29.9998"
          x2="10.138"
          y2="46.8794"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#16242A" />
          <stop offset="1" stopColor="#00DFEB" />
        </linearGradient>
        <linearGradient
          id="paint3_linear_27707_23850"
          x1="27.0344"
          y1="22.3608"
          x2="19.8182"
          y2="26.1951"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00DFEB" stopOpacity="0.4" />
          <stop offset="1" stopColor="#00DFEB" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient
          id="paint4_linear_27707_23850"
          x1="27.0344"
          y1="22.3608"
          x2="19.8182"
          y2="26.1951"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" stopOpacity="0.1" />
          <stop offset="1" stopColor="white" stopOpacity="0.03" />
        </linearGradient>
        <linearGradient
          id="paint5_linear_27707_23850"
          x1="28.293"
          y1="21.6926"
          x2="21.0767"
          y2="25.5269"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00DFEB" />
          <stop offset="1" stopColor="#005F65" />
        </linearGradient>
        <linearGradient
          id="paint6_linear_27707_23850"
          x1="28.293"
          y1="21.6926"
          x2="21.0767"
          y2="25.5269"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" stopOpacity="0.1" />
          <stop offset="1" stopColor="white" stopOpacity="0.03" />
        </linearGradient>
        <linearGradient
          id="paint7_linear_27707_23850"
          x1="22.9741"
          y1="24.5584"
          x2="18.3582"
          y2="28.6381"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#16242A" />
          <stop offset="1" stopColor="#00DFEB" />
        </linearGradient>
        <linearGradient
          id="paint8_linear_27707_23850"
          x1="37.4716"
          y1="10.1842"
          x2="32.8523"
          y2="16.925"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00DFEB" stopOpacity="0.4" />
          <stop offset="1" stopColor="#00DFEB" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient
          id="paint9_linear_27707_23850"
          x1="37.4716"
          y1="10.1842"
          x2="32.8523"
          y2="16.925"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" stopOpacity="0.1" />
          <stop offset="1" stopColor="white" stopOpacity="0.03" />
        </linearGradient>
        <linearGradient
          id="paint10_linear_27707_23850"
          x1="38.2778"
          y1="9.00938"
          x2="33.6585"
          y2="15.7502"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" stopOpacity="0.1" />
          <stop offset="1" stopColor="white" stopOpacity="0.03" />
        </linearGradient>
        <linearGradient
          id="paint11_linear_27707_23850"
          x1="31.9999"
          y1="13.0002"
          x2="26.2902"
          y2="26.2311"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#16242A" />
          <stop offset="1" stopColor="#00DFEB" />
        </linearGradient>
      </defs>
    </svg>
  );
};

const PointsBoostIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
    >
      <mask
        id="mask0_27707_23879"
        className="mask-type-alpha"
        maskUnits="userSpaceOnUse"
        x="8"
        y="8"
        width="33"
        height="32"
      >
        <rect x="8.00098" y="8" width="32" height="32" fill="#D9D9D9" />
      </mask>
      <g mask="url(#mask0_27707_23879)">
        <path
          d="M11.6286 22.2546C11.4552 22.1803 11.4117 21.9544 11.5451 21.821L16.8666 16.4995C17.1777 16.1884 17.5444 15.9661 17.9666 15.8328C18.3888 15.6995 18.8222 15.6773 19.2666 15.7661L20.5639 16.0406C20.7611 16.0823 20.8426 16.3196 20.7141 16.475C19.649 17.7625 18.7998 18.9373 18.1666 19.9995C17.5137 21.0946 16.8808 22.4093 16.2679 23.9435C16.212 24.0833 16.0521 24.1504 15.9137 24.0911L11.6286 22.2546ZM18.2141 25.2477C18.1439 25.1771 18.1188 25.0733 18.1498 24.9788C18.6559 23.4357 19.3337 21.976 20.1833 20.5995C21.061 19.1773 22.1222 17.8439 23.3666 16.5995C25.3222 14.6439 27.5555 13.1828 30.0666 12.2161C32.5066 11.2768 34.7893 10.9722 36.9146 11.3023C37.0259 11.3196 37.1131 11.4068 37.1304 11.5181C37.4608 13.6434 37.1618 15.9261 36.2333 18.3661C35.2777 20.8773 33.8222 23.1106 31.8666 25.0661C30.6444 26.2884 29.311 27.3495 27.8666 28.2495C26.4689 29.1203 24.9984 29.8091 23.4551 30.3159C23.36 30.3471 23.2555 30.3215 23.185 30.2505L18.2141 25.2477ZM29.1833 21.8995C29.9277 21.8995 30.5555 21.6439 31.0666 21.1328C31.5777 20.6217 31.8333 19.9939 31.8333 19.2495C31.8333 18.505 31.5777 17.8773 31.0666 17.3661C30.5555 16.855 29.9277 16.5995 29.1833 16.5995C28.4388 16.5995 27.811 16.855 27.2999 17.3661C26.7888 17.8773 26.5333 18.505 26.5333 19.2495C26.5333 19.9939 26.7888 20.6217 27.2999 21.1328C27.811 21.6439 28.4388 21.8995 29.1833 21.8995ZM26.6434 36.8894C26.5105 37.0223 26.2854 36.9796 26.2103 36.8072L24.3437 32.5199C24.2834 32.3813 24.3504 32.2204 24.4907 32.1643C26.0249 31.5515 27.3446 30.9188 28.4499 30.2661C29.5203 29.6341 30.6983 28.787 31.9838 27.7247C32.1409 27.5949 32.3807 27.6797 32.4192 27.8798L32.6666 29.1661C32.7555 29.6106 32.7333 30.0495 32.5999 30.4828C32.4666 30.9162 32.2444 31.2884 31.9333 31.5995L26.6434 36.8894Z"
          fill="#2A434D"
        />
        <path
          d="M16.2362 28.4819C17.2765 28.4715 18.1523 28.8277 18.8788 29.5542C19.6058 30.2813 19.9666 31.1577 19.9667 32.1987C19.9667 33.2397 19.6057 34.1161 18.8788 34.8433C18.3689 35.3532 17.4897 35.8151 16.205 36.2104C14.9912 36.5839 13.3293 36.9198 11.2137 37.2183C11.5122 35.1034 11.8483 33.4474 12.2216 32.2446C12.6167 30.9713 13.0784 30.0977 13.5887 29.5874C14.3166 28.8596 15.1941 28.4924 16.2362 28.4819Z"
          fill="url(#paint0_linear_27707_23879)"
          stroke="url(#paint1_linear_27707_23879)"
          strokeWidth="0.533333"
        />
      </g>
      <defs>
        <linearGradient
          id="paint0_linear_27707_23879"
          x1="14.5959"
          y1="28.3816"
          x2="14.5959"
          y2="37.5158"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00DFEB" />
          <stop offset="1" stopColor="#2A434D" />
        </linearGradient>
        <linearGradient
          id="paint1_linear_27707_23879"
          x1="15.5669"
          y1="28.2153"
          x2="15.5669"
          y2="37.5322"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" stopOpacity="0.1" />
          <stop offset="1" stopColor="white" stopOpacity="0.03" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export const RiskConfirmationDialog = ({
  open,
  onOpenChange,
  onAccepted,
  config,
}: RiskConfirmationDialogProps) => {
  const { t } = useLingui();
  const [agreed, setAgreed] = useState(false);
  const acceptAgreement = useGenesisAccessStore(
    (state) => state.acceptAgreement,
  );
  const apy = config
    ? `~${percentFormat(config.apr / 100, 2, { stripTrailingZeros: true })}`
    : '--';
  const maturityDays = config
    ? thoFormat(config.maturityDays, GENESIS_INTEGER_FORMAT_OPTIONS)
    : '--';
  const boostMultiplier = config
    ? `${thoFormat(config.boostMultiplier, GENESIS_INTEGER_FORMAT_OPTIONS)}X`
    : '--';

  const handleAccept = () => {
    if (!agreed) return;
    acceptAgreement();
    onAccepted();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        position="center"
        onOpenAutoFocus={(event) => event.preventDefault()}
        className="flex max-h-[calc(100dvh-32px)] w-[440px] max-w-[440px] flex-col gap-0 overflow-y-auto rounded-xl max-md:!w-[calc(100%-16px)]"
        closeClassName="hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <div className="relative -mx-4 -mt-4 shrink-0">
          <Banner className="m-0 rounded-t-xl" gradientClassName="from-bg-3" />
        </div>

        <DialogHeader className="mt-4 gap-1">
          <DialogTitle className="text-t-1100 text-xl font-medium">
            {t`Welcome to HertzFlow Genesis`}
          </DialogTitle>
          <DialogDescription className="text-t-270 text-sm">
            {t`HertzFlow Genesis event for Mainnet liquidity. Deposit and hold for ${maturityDays} days to earn:`}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 grid h-12 shrink-0 grid-cols-2 gap-6">
          <div className="flex items-center">
            <div aria-hidden="true" className="relative size-12 shrink-0">
              <ApyIcon />
            </div>
            <div className="ml-2.5">
              <p className="text-t-270 text-xs">{t`APY`}</p>
              <p className="text-t-1100 mt-1 text-2xl font-medium">{apy}</p>
            </div>
          </div>

          <div className="flex items-center">
            <div
              aria-hidden="true"
              className="grid size-12 shrink-0 place-items-center"
            >
              <PointsBoostIcon />
            </div>
            <div className="ml-2.5">
              <p className="text-t-270 text-xs">{t`Merits Boost`}</p>
              <p className="text-t-1100 mt-1 text-2xl font-medium">
                {boostMultiplier}
              </p>
            </div>
          </div>
        </div>

        <Separator className="mt-4" />

        <Label className="mt-4 flex cursor-pointer items-start gap-2 text-sm font-normal">
          <Checkbox
            checked={agreed}
            onCheckedChange={(v) => setAgreed(v === true)}
            className="m-0.5 size-[14px]"
          />
          <p>
            <Trans id="genesis.riskAgreement">
              I have read and accept the{' '}
              <a
                href={policyDoc || 'https://'}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-accent"
              >
                Privacy Policy
              </a>{' '}
              and{' '}
              <a
                href={termsDoc || 'https://'}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-accent"
              >
                Terms of Use
              </a>
              , and acknowledge the risks of smart contracts, post-deposit PnL
              exposure, and the Ceffu custody path.
            </Trans>
          </p>
        </Label>

        <DialogFooter className="mt-4 flex shrink-0 flex-col gap-2">
          <Button
            variant="accent"
            onClick={handleAccept}
            disabled={!agreed}
            className="disabled:bg-bg-4 disabled:text-t-430 disabled:hover:bg-bg-4 w-full"
          >
            {t`Accept and Continue`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
