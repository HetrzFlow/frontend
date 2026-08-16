import { cn } from '@repo/ui';

interface SkeletonBlockProps {
  className?: string;
}

export const CreditSkeletonBlock = ({ className }: SkeletonBlockProps) => (
  <span
    aria-hidden
    className={cn(
      'block animate-pulse rounded-[6px] bg-white/10',
      className,
    )}
  />
);

export const CreditHeroSkeleton = () => (
  <div className="flex w-[397px] flex-col justify-center gap-[7px] max-md:w-full max-md:gap-3">
    <div className="flex w-full flex-col gap-[7px]">
      <div className="flex h-[38px] items-center gap-2">
        <CreditSkeletonBlock className="h-8 w-[105px]" />
        <CreditSkeletonBlock className="h-8 w-[141px] rounded-xl max-md:hidden" />
      </div>
      <CreditSkeletonBlock className="h-[34px] w-full" />
      <CreditSkeletonBlock className="h-[17px] w-[118px]" />
    </div>
    <CreditSkeletonBlock className="hidden h-8 w-[141px] rounded-xl max-md:block" />
  </div>
);

export const CreditAllocationSkeleton = () => (
  <div className="h-[214px] rounded-xl border border-white/10 bg-white/[0.01] p-6 backdrop-blur-[40px] max-md:flex max-md:h-[267px] max-md:flex-col max-md:items-center max-md:gap-3 max-md:px-3 max-md:py-6">
    <CreditSkeletonBlock className="mx-auto h-[29px] w-[260px] max-md:h-[19px] max-md:w-[201px]" />
    <div className="mt-6 flex h-[72px] items-center max-md:mt-0 max-md:h-[142px] max-md:w-full max-md:flex-col max-md:gap-4">
      <div className="flex flex-1 justify-center">
        <div className="flex w-[184px] flex-col items-center gap-2">
          <CreditSkeletonBlock className="h-[15px] w-12" />
          <CreditSkeletonBlock className="h-[55px] w-[174px] max-md:h-[38px] max-md:w-[116px]" />
        </div>
      </div>
      <CreditSkeletonBlock className="h-[72px] w-px rounded-none max-md:h-px max-md:w-full" />
      <div className="flex flex-1 justify-center">
        <div className="flex w-[184px] flex-col items-center gap-2">
          <CreditSkeletonBlock className="h-[15px] w-12" />
          <CreditSkeletonBlock className="h-[55px] w-[96px] max-md:h-[38px] max-md:w-[64px]" />
        </div>
      </div>
    </div>
    <CreditSkeletonBlock className="mx-auto mt-6 h-[17px] w-[520px] max-w-full max-md:mt-0 max-md:h-[34px] max-md:w-full" />
  </div>
);

export const CreditAirdropCardSkeleton = () => (
  <>
    <div className="flex h-[323px] flex-col justify-between rounded-2xl border border-white/10 bg-bg-1 p-3 max-md:hidden">
      <div className="flex flex-col gap-3">
        <div className="flex h-[17px] items-center justify-between">
          <CreditSkeletonBlock className="h-[17px] w-[58px]" />
          <CreditSkeletonBlock className="size-4" />
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex h-[38px] items-start justify-between">
            <CreditSkeletonBlock className="h-[15px] w-[35px]" />
            <CreditSkeletonBlock className="h-[38px] w-20" />
          </div>
          <CreditSkeletonBlock className="h-px w-full rounded-none" />
          <div className="flex h-[38px] items-start justify-between">
            <CreditSkeletonBlock className="h-[15px] w-[35px]" />
            <CreditSkeletonBlock className="h-[38px] w-20" />
          </div>
          <CreditSkeletonBlock className="h-px w-full rounded-none" />
        </div>
      </div>
      <div className="flex flex-col gap-4 pb-2">
        <div className="grid h-8 grid-cols-2 gap-2">
          <CreditSkeletonBlock className="h-8 rounded-xl" />
          <CreditSkeletonBlock className="h-8 rounded-xl" />
        </div>
        <CreditSkeletonBlock className="mx-auto h-[15px] w-[360px] max-w-full" />
      </div>
    </div>
    <div className="hidden h-[291px] flex-col justify-between rounded-2xl border border-white/10 bg-bg-1 p-3 max-md:flex">
      <div className="flex flex-col gap-3">
        <div className="flex h-[17px] items-center justify-between">
          <CreditSkeletonBlock className="h-[17px] w-[58px]" />
          <CreditSkeletonBlock className="size-4" />
        </div>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="flex w-full flex-col gap-3">
              <div className="flex flex-col gap-1">
                <CreditSkeletonBlock className="h-[15px] w-[35px]" />
                <CreditSkeletonBlock className="h-[29px] w-[72px]" />
              </div>
              <CreditSkeletonBlock className="h-8 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
      <CreditSkeletonBlock className="mx-auto h-[30px] w-[286px] max-w-full" />
    </div>
  </>
);

export const CreditBalanceCardSkeleton = () => (
  <div className="h-[323px] rounded-2xl border border-white/10 bg-bg-1 p-3 max-md:h-auto max-md:min-h-[323px]">
    <div className="flex h-[17px] items-center gap-1">
      <CreditSkeletonBlock className="h-[17px] w-[104px]" />
      <CreditSkeletonBlock className="size-[14px]" />
    </div>
    <div className="mt-3 flex h-[38px] items-start justify-between">
      <CreditSkeletonBlock className="h-[15px] w-[88px]" />
      <CreditSkeletonBlock className="h-[38px] w-[54px]" />
    </div>
    <div className="mt-3 flex flex-col gap-2">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex h-[15px] items-start justify-between">
          <CreditSkeletonBlock className="h-[15px] w-[120px]" />
          <CreditSkeletonBlock className="h-[15px] w-[60px]" />
        </div>
      ))}
    </div>
    <CreditSkeletonBlock className="mt-3 h-px w-full rounded-none" />
    <div className="mt-3 flex flex-col gap-2">
      <div className="flex h-[15px] items-start justify-between">
        <CreditSkeletonBlock className="h-[15px] w-[137px]" />
        <CreditSkeletonBlock className="h-[15px] w-[101px]" />
      </div>
      <CreditSkeletonBlock className="h-8 rounded-xl" />
      <CreditSkeletonBlock className="h-8 rounded-xl" />
      <CreditSkeletonBlock className="h-8 rounded-xl" />
    </div>
  </div>
);

export const CreditMarketPreviewSkeleton = () => (
  <div className="flex min-h-[173px] w-full flex-col items-center justify-center gap-6 overflow-visible max-md:min-h-[122px] max-md:gap-4">
    <CreditSkeletonBlock className="h-[29px] w-[360px] max-w-full max-md:h-[58px] max-md:w-[270px]" />
    <div className="flex w-full flex-wrap items-center justify-center gap-2 max-md:hidden">
      {Array.from({ length: 9 }).map((_, index) => (
        <div
          key={index}
          className="flex h-[58px] shrink-0 items-center gap-3 rounded-full border border-[rgba(191,207,255,0.1)] py-2 pr-10 pl-3"
        >
          <CreditSkeletonBlock className="size-10 rounded-full" />
          <div className="flex w-[57px] flex-col gap-1">
            <CreditSkeletonBlock className="h-[17px] w-[57px]" />
            <CreditSkeletonBlock className="h-[15px] w-9" />
          </div>
        </div>
      ))}
    </div>
    <div className="relative left-1/2 hidden w-screen -translate-x-1/2 overflow-hidden max-md:block">
      <div className="mx-auto flex w-[499px] items-center justify-center gap-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="flex h-[58px] shrink-0 items-center gap-3 rounded-full border border-[rgba(191,207,255,0.1)] py-2 pr-10 pl-3"
          >
            <CreditSkeletonBlock className="size-10 rounded-full" />
            <div className="flex w-[57px] flex-col gap-1">
              <CreditSkeletonBlock className="h-[17px] w-[57px]" />
              <CreditSkeletonBlock className="h-[15px] w-9" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const CreditFaqSkeleton = () => (
  <div className="flex w-full flex-col items-center gap-6 max-md:gap-3">
    <CreditSkeletonBlock className="h-[29px] w-[52px]" />
    <div className="flex w-full flex-col gap-2">
      <CreditSkeletonBlock className="h-[88px] rounded-xl" />
      <CreditSkeletonBlock className="h-[52px] rounded-xl" />
      <CreditSkeletonBlock className="h-[52px] rounded-xl" />
    </div>
  </div>
);
