import React, {
  useRef,
  useState,
  useCallback,
  useMemo,
  memo,
  useEffect,
} from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useLingui } from '@lingui/react/macro';
import {
  Dialog,
  DialogContent,
  HzIcon,
  HzTextIcon,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
  Button,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@repo/ui';
import { IMAGES_MAP } from '../../assets';
import { useGlobalStore } from '../../stores/globalStore';

const enum EnumSteps {
  WELCOME = 0,
  CONNECT_WALLET = 1,
  OPEN_POSITION = 2,
  PROVIDE_LIQUIDITY = 3,
}
const STEPS = [
  { step: EnumSteps.WELCOME },
  { step: EnumSteps.CONNECT_WALLET },
  { step: EnumSteps.OPEN_POSITION },
  { step: EnumSteps.PROVIDE_LIQUIDITY },
] as const;

export const ImagePreloader = memo(
  ({ theme }: { theme: string | undefined }) => {
    const themeKey = theme === 'dark' ? 'dark' : 'light';
    const [shouldLoad, setShouldLoad] = useState(false);

    const getImageSrc = (imageData: string | { src: string }): string => {
      if (typeof imageData === 'string') {
        return imageData;
      }
      return imageData?.src || '';
    };

    const imageSources = [
      getImageSrc(IMAGES_MAP.steps[1][themeKey]),
      getImageSrc(IMAGES_MAP.steps[2][themeKey]),
      getImageSrc(IMAGES_MAP.steps[3][themeKey]),
    ].filter(Boolean);

    useEffect(() => {
      const loadImages = () => {
        setShouldLoad(true);
      };

      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        const idleCallbackId = window.requestIdleCallback(loadImages, {
          timeout: 2000,
        });

        return () => {
          window.cancelIdleCallback(idleCallbackId);
        };
      } else {
        const timeoutId = setTimeout(loadImages, 100);
        return () => {
          clearTimeout(timeoutId);
        };
      }
    }, []);

    if (!shouldLoad) {
      return null;
    }

    return (
      <div className="pointer-events-none fixed -top-[9999px] -left-[9999px] opacity-0">
        {imageSources.map((src, index) => (
          <Image
            key={`preload-${index}-${themeKey}`}
            src={src}
            alt=""
            width={724}
            height={220}
            priority={false}
            loading="eager"
          />
        ))}
      </div>
    );
  },
);

ImagePreloader.displayName = 'ImagePreloader';

const OnboardingImage = memo(
  ({ step, theme }: { step: EnumSteps; theme: string | undefined }) => {
    const themeKey = theme === 'dark' ? 'dark' : 'light';

    const getImageSrc = (imageData: string | { src: string }): string => {
      if (typeof imageData === 'string') {
        return imageData;
      }
      return imageData?.src || '';
    };

    const allImages = useMemo(() => {
      return [
        {
          step: EnumSteps.CONNECT_WALLET,
          src: getImageSrc(IMAGES_MAP.steps[1][themeKey]),
          alt: 'Connect Wallet',
        },
        {
          step: EnumSteps.OPEN_POSITION,
          src: getImageSrc(IMAGES_MAP.steps[2][themeKey]),
          alt: 'Open Position',
        },
        {
          step: EnumSteps.PROVIDE_LIQUIDITY,
          src: getImageSrc(IMAGES_MAP.steps[3][themeKey]),
          alt: 'Provide Liquidity',
        },
      ];
    }, [themeKey]);

    return (
      <div className="relative mx-auto h-[131px] w-full overflow-hidden md:h-[220px]">
        {allImages.map((image) => {
          const isCurrentStep = step === image.step;
          return (
            <div
              key={`${image.step}-${themeKey}`}
              className={`absolute inset-0 transition-opacity duration-300 ease-in-out ${
                isCurrentStep ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {image.src ? (
                <Image
                  width={724}
                  height={220}
                  src={image.src}
                  alt={image.alt}
                  priority={isCurrentStep}
                  loading={isCurrentStep ? 'eager' : 'lazy'}
                  className="h-full w-full transition-all duration-300"
                  sizes="(max-width: 768px) 100vw, 668px"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900" />
              )}
            </div>
          );
        })}
      </div>
    );
  },
);

OnboardingImage.displayName = 'OnboardingImage';

const OnboardingText = memo(({ step }: { step: EnumSteps }) => {
  const { t } = useLingui();
  const [isVisible, setIsVisible] = useState(true);
  const [currentStep, setCurrentStep] = useState(step);

  useEffect(() => {
    if (step !== currentStep) {
      setIsVisible(false);

      const timer = setTimeout(() => {
        setCurrentStep(step);
        setIsVisible(true);
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [step, currentStep]);

  const getStepContent = (stepValue: EnumSteps) => {
    switch (stepValue) {
      case EnumSteps.WELCOME:
        return (
          <DialogHeader>
            <DialogTitle className="text-2xl/tight font-semibold">{t`Welcome to HertzFlow`}</DialogTitle>
            <DialogDescription className="text-sm/tight">
              {t`Trade perpetuals on Sui with up to 100x leverage, unlimited liquidity, diverse order types, CEX-like experience - all at HertzFlow. Loved by degens, used by pros, powered by SUI.`}
            </DialogDescription>
          </DialogHeader>
        );
      case EnumSteps.CONNECT_WALLET:
        return (
          <DialogHeader>
            <DialogTitle className="text-2xl/tight font-semibold">{t`Step 1. Connect Wallet and Claim Faucet`}</DialogTitle>
            <DialogDescription className="text-sm/tight">
              {t`Connect your wallet to SUI Testnet and claim ETH, BTC and USDC faucets to start mock trading seamlessly.`}
            </DialogDescription>
          </DialogHeader>
        );
      case EnumSteps.OPEN_POSITION:
        return (
          <DialogHeader>
            <DialogTitle className="text-2xl/tight font-semibold">{t`Step 2. Open & Manage Positions`}</DialogTitle>
            <DialogDescription className="text-sm/tight">
              {t`Select a market, choose your order type and side, set your preferred leverage and slippage, then place your first order. Borrow from a deep pool of BTC, ETH, SUI, or USDC to power your leveraged trades. Track your positions and open orders, review your unrealized PnL, and adjust your collaterals at any time. `}
            </DialogDescription>
          </DialogHeader>
        );
      case EnumSteps.PROVIDE_LIQUIDITY:
        return (
          <DialogHeader>
            <DialogTitle className="text-2xl/tight font-semibold">{t`Step 3.  Earn Real Yield by Providing Liquidity`}</DialogTitle>
            <DialogDescription className="text-sm/tight">
              {t`Add liquidity to the HertzFlow Liquidity Pool  and earn yield from every trade - perp swaps, position opens/closes, borrowing interest, trader losses, and more. Your capital stays productive 24/7,  and stay flexible with instant withdrawals.`}
            </DialogDescription>
          </DialogHeader>
        );
      default:
        return null;
    }
  };

  return (
    <div className="mt-4 flex min-h-[120px] flex-col justify-start overflow-hidden">
      <div
        className={`transform transition-all duration-200 ease-in-out ${
          isVisible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
        }`}
      >
        {getStepContent(currentStep)}
      </div>
    </div>
  );
});
OnboardingText.displayName = 'OnboardingText';

const StepIndicator = memo(({ currentStep }: { currentStep: EnumSteps }) => {
  return (
    <div className="my-4 flex items-center gap-2">
      {STEPS.map((step) => (
        <div
          key={step.step}
          className={`h-0.5 w-10 rounded-[100px]`}
          style={{
            backgroundColor:
              currentStep === step.step
                ? 'rgb(0, 223, 235)'
                : 'rgb(179, 189, 217, 0.1)',
          }}
        />
      ))}
    </div>
  );
});

StepIndicator.displayName = 'StepIndicator';

const OnboardingDialog = () => {
  const { t } = useLingui();
  const { theme } = useTheme();
  const onOnboardingDialogClose = useGlobalStore(
    (state) => state.onOnboardingDialogClose,
  );
  const [currentStep, setCurrentStep] = useState(EnumSteps.WELCOME);
  const [open, setOpen] = useState(true);
  const nextClickRef = useRef(false);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setOpen(open);
      if (!open) onOnboardingDialogClose(nextClickRef.current);
    },
    [onOnboardingDialogClose],
  );

  const handleNextClick = useCallback(() => {
    nextClickRef.current = true;
  }, []);

  const handleBackClick = useCallback(() => {
    setCurrentStep((prev) => prev - 1);
  }, []);

  const handleNextStepClick = useCallback(() => {
    setCurrentStep((prev) => prev + 1);
  }, []);

  const stepContent = useMemo(() => {
    return (
      <div className="relative mt-10 w-full overflow-hidden rounded-lg">
        {currentStep === EnumSteps.WELCOME && (
          <>
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
            <div className="flex h-[131px] items-center justify-center gap-2 rounded-lg bg-gradient-to-t from-black/70 to-black/70 md:h-[220px]">
              <HzIcon size={32} className="text-accent" />
              <HzTextIcon size={16} className="text-white" />
            </div>
          </>
        )}
        {currentStep !== EnumSteps.WELCOME && (
          <OnboardingImage step={currentStep} theme={theme} />
        )}
      </div>
    );
  }, [currentStep, theme, t]);

  const isLastStep = currentStep === EnumSteps.PROVIDE_LIQUIDITY;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* <ImagePreloader theme={theme} /> */}
      <DialogContent
        className="w-[700px] focus:ring-0 focus:outline-none"
        position="center"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {stepContent}
        <StepIndicator currentStep={currentStep} />
        <OnboardingText step={currentStep} />

        {/* mobile button */}
        <div className="block md:hidden">
          {isLastStep ? (
            <DialogClose asChild>
              <Button
                className="bg-accent text-accent-foreground hover:bg-accent/90 h-[54px] w-full text-base font-medium"
                type="button"
                onClick={handleNextClick}
              >
                {t`Start Trading`}
              </Button>
            </DialogClose>
          ) : (
            <Button
              className="bg-accent text-accent-foreground hover:bg-accent/90 h-[54px] w-full text-base font-medium"
              type="button"
              onClick={handleNextStepClick}
            >
              {t`Next`}
            </Button>
          )}
          <Button
            className={`mt-2 h-[54px] w-full text-base font-medium ${
              currentStep === EnumSteps.WELCOME ? 'hidden' : 'block'
            } hover:bg-bg-3 ${theme === 'dark' ? 'hover:text-white/70' : 'hover:text-black/70'}`}
            type="button"
            onClick={handleBackClick}
          >
            {t`Back`}
          </Button>
        </div>
        <div className="mt-5 md:flex md:items-center md:justify-between">
          <div className="flex items-center justify-center gap-2 md:justify-start">
            <DialogClose asChild>
              <div
                onClick={handleNextClick}
                className="text-t-350 hover:text-t-1100 hover:text-t-1100 cursor-pointer text-center font-normal"
              >{t`Do not show again`}</div>
            </DialogClose>
            <Tooltip>
              <TooltipTrigger asChild>
                <svg
                  className="cursor-pointer"
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M9.99996 3.33329C6.31806 3.33329 3.33329 6.31806 3.33329 9.99996C3.33329 13.6819 6.31806 16.6666 9.99996 16.6666C13.6819 16.6666 16.6666 13.6819 16.6666 9.99996C16.6666 6.31806 13.6819 3.33329 9.99996 3.33329ZM1.66663 9.99996C1.66663 5.39759 5.39759 1.66663 9.99996 1.66663C14.6023 1.66663 18.3333 5.39759 18.3333 9.99996C18.3333 14.6023 14.6023 18.3333 9.99996 18.3333C5.39759 18.3333 1.66663 14.6023 1.66663 9.99996ZM11.2123 6.28456C11.2326 6.04164 11.0409 5.83329 10.7971 5.83329H9.20282C8.95904 5.83329 8.76733 6.04166 8.78759 6.28459L9.16698 10.8333H10.8333L11.2123 6.28456ZM9.99996 11.6666C9.3096 11.6666 8.74996 12.2263 8.74996 12.9166C8.74996 13.607 9.3096 14.1666 9.99996 14.1666C10.6903 14.1666 11.25 13.607 11.25 12.9166C11.25 12.2263 10.6903 11.6666 9.99996 11.6666Z"
                    fill="currentColor"
                    fillOpacity="0.3"
                  />
                </svg>
              </TooltipTrigger>
              <TooltipContent side="top" inDialog>
                {t`You can always reopen onboarding session in Settings.`}
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="hidden items-center gap-4 md:flex">
            <Button
              className={`h-[54px] w-[192px] shrink text-base font-medium ${
                currentStep === EnumSteps.WELCOME ? 'invisible' : 'visible'
              } hover:bg-bg-3 ${theme === 'dark' ? 'hover:text-white/70' : 'hover:text-black/70'}`}
              type="button"
              onClick={handleBackClick}
            >
              {t`Back`}
            </Button>
            {isLastStep ? (
              <DialogClose asChild>
                <Button
                  className="bg-accent text-accent-foreground hover:bg-accent/90 h-[54px] w-[192px] shrink text-base font-medium"
                  type="button"
                  onClick={handleNextClick}
                >
                  {t`Start Trading`}
                </Button>
              </DialogClose>
            ) : (
              <Button
                className="bg-accent text-accent-foreground hover:bg-accent/90 h-[54px] w-[192px] shrink text-base font-medium"
                type="button"
                onClick={handleNextStepClick}
              >
                {t`Next`}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

OnboardingDialog.displayName = 'OnboardingDialog';
export default OnboardingDialog;
