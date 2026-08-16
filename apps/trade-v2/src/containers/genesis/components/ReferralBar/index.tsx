'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useQueryClient } from '@repo/lib/queryClient';
import {
  ArrowRight2Icon,
  Button,
  cn,
  DiscordIcon,
  Dialog,
  DialogContent,
  DialogTitle,
  EditIcon,
  LoaderCircleIcon,
  ShareIcon,
  TwitterIcon,
  UserIcon,
  XIcon,
  toast,
  Separator,
} from '@repo/ui';
import { useReferralCodes, useReferralProfile } from '@/common/hooks';
import {
  prepareSocialOAuth,
  SocialOAuthError,
} from '@/common/oauth/socialOAuth';
import { ENABLE_GENESIS_REFERRAL_CODE } from '@/constants/common';
import { normalizeReferralCode } from '@/containers/referral/referralCodeValidation';
import { useReferralStore } from '@/containers/referral/referralStore';
import { buildShortShareUrl } from '@/lib/referral/referralShare';
import {
  useInitiateGenesisSocialBinding,
  useUnbindGenesisSocial,
} from '@/queries/bsc/genesis';
import type {
  GenesisSocialState,
  GenesisSocialBinding,
  GenesisUserPosition,
  GenesisVaultConfig,
} from '@/services/rest/genesis';
import { getGenesisActionErrorMessage } from '../../lib/actionError';
import { getCustomSocialAvatarUrl } from '../../lib/socialAvatar';
import { GenesisRankLabel } from '../GenesisRankLabel';
import type { I18n, MessageDescriptor } from '@lingui/core';

const CreateCodeDialog = dynamic(
  () => import('@/containers/referral/AffiliatesTab/CreateCodeDialog'),
  { ssr: false },
);
const BindReferralCard = dynamic(
  () => import('@/containers/referral/TraderDiscountTab/BindReferralCard'),
  { ssr: false },
);
const EditCodeDialog = dynamic(
  () => import('@/containers/referral/TraderDiscountTab/EditCodeDialog'),
  { ssr: false },
);
const SharePosterDialog = dynamic(
  () =>
    import('../../dialogs/SharePosterDialog').then(
      (module) => module.SharePosterDialog,
    ),
  { ssr: false },
);

interface ReferralBarProps {
  socialState?: GenesisSocialState;
  position?: GenesisUserPosition;
  config?: GenesisVaultConfig;
  hasDeposit: boolean;
}

type SupportedSocialPlatform = GenesisSocialBinding['platform'];
type SocialActionType = 'binding' | 'unbinding';
type SocialActionState = {
  platform: SupportedSocialPlatform;
  type: SocialActionType;
};

const SOCIAL_PLATFORM_MESSAGES = {
  accountConnected: msg({ message: '{platformLabel} account connected' }),
  authorizationCancelled: msg({
    message: '{platformLabel} authorization was cancelled.',
  }),
  authorizationFailed: msg({
    message: '{platformLabel} authorization failed. Please try again.',
  }),
  alreadyConnected: msg({
    message:
      'This {platformLabel} account is already connected to another wallet.',
  }),
  invalidAuthorizationResponse: msg({
    message: '{platformLabel} returned an invalid authorization response.',
  }),
  authorizationTimedOut: msg({
    message: '{platformLabel} authorization timed out. Please try again.',
  }),
  unbind: msg({ message: 'Unbind {platformLabel}' }),
  connect: msg({ message: 'Connect {platformLabel}' }),
  connectYour: msg({ message: 'Connect your {platformLabel}' }),
  binding: msg({ message: 'Binding {platformLabel}...' }),
  unbinding: msg({ message: 'Unbinding {platformLabel}...' }),
};

const translateSocialPlatformMessage = (
  i18n: I18n,
  descriptor: MessageDescriptor,
  platformLabel: string,
) => i18n._(descriptor.id, { platformLabel }, { message: descriptor.message });

const SOCIAL_ICON: Record<SupportedSocialPlatform, React.ReactNode> = {
  x: <TwitterIcon size={20} />,
  discord: <DiscordIcon size={20} />,
};

const SocialPlatformIcon = ({
  platform,
}: {
  platform: SupportedSocialPlatform;
}) => (
  <span className="flex size-5 shrink-0 items-center justify-center">
    {SOCIAL_ICON[platform]}
  </span>
);

const RankIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    aria-hidden="true"
  >
    <rect x="5" y="18" width="6" height="12" rx="1.6" fill="#21353D" />
    <rect x="21" y="22" width="6" height="8" rx="1.6" fill="#21353D" />
    <rect x="13" y="11" width="6" height="19" rx="1.6" fill="#21353D" />
    <path
      d="M16.7733 3.81836C16.8198 3.94584 16.9203 4.04611 17.0477 4.09277L19.1678 4.86621L17.0477 5.63965C16.9203 5.68626 16.8199 5.78668 16.7733 5.91406L15.9998 8.03418L15.2264 5.91406C15.1797 5.78664 15.0795 5.68621 14.952 5.63965L12.8319 4.86621L14.952 4.09277C15.0795 4.04616 15.1798 3.94588 15.2264 3.81836L15.9998 1.69824L16.7733 3.81836Z"
      fill="url(#paint0_linear_genesis_rank)"
      stroke="url(#paint1_linear_genesis_rank)"
      strokeWidth="0.4608"
    />
    <defs>
      <linearGradient
        id="paint0_linear_genesis_rank"
        x1="20.9576"
        y1="2.50066"
        x2="14.6326"
        y2="7.65423"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#00DFEB" />
        <stop offset="1" stopColor="#2A434D" />
      </linearGradient>
      <linearGradient
        id="paint1_linear_genesis_rank"
        x1="16"
        y1="1.02637"
        x2="16"
        y2="8.70637"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="white" stopOpacity="0.1" />
        <stop offset="1" stopColor="white" stopOpacity="0.03" />
      </linearGradient>
    </defs>
  </svg>
);

const RankCard = ({ rank }: { rank?: GenesisUserPosition['rank'] }) => {
  const { t } = useLingui();

  return (
    <div className="flex h-[90px] items-center rounded-3xl border p-4">
      <span className="mr-4 flex size-8 shrink-0 items-center justify-center">
        <RankIcon />
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-t-350 text-xs/3.5 tracking-[-0.48px]">{t`Rank`}</p>
        <p className="text-t-1100 text-xl leading-none font-medium tracking-[-0.8px] uppercase">
          <GenesisRankLabel rank={rank} />
        </p>
      </div>
    </div>
  );
};

const ReferralCodeAction = ({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <Button
    variant="ghost"
    aria-label={label}
    title={label}
    onClick={onClick}
    className="bg-accent/10 text-accent hover:text-accent hover:bg-accent/10 size-6 rounded-lg p-1 hover:opacity-70 has-[>svg]:p-1"
  >
    {children}
  </Button>
);

const ReferralCodePanel = ({
  createdCode,
  appliedCode,
  onCreate,
  onShare,
  onBind,
  onEdit,
}: {
  createdCode: string | null;
  appliedCode: string | null;
  onCreate: () => void;
  onShare: () => void;
  onBind: () => void;
  onEdit: () => void;
}) => {
  const { t } = useLingui();
  const editLabel = t`Edit referral code`;
  const shareLabel = t`Share referral code`;

  return (
    <div className="flex min-h-[106px] flex-col rounded-2xl border bg-white/[0.01] px-4 pt-4 pb-6 backdrop-blur-[20px]">
      <div className="text-t-270 flex items-center gap-1 text-xs">
        {t`Referral code`}
      </div>
      <div className="mt-4 flex min-h-10 flex-1 items-center">
        <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <span className="text-t-270 text-xs">{t`Code Created`}</span>
          <span className="text-t-1100 flex max-w-full items-center gap-1 text-xl leading-none font-medium">
            <span className="max-w-[100px] truncate">{createdCode ?? '-'}</span>
            <ReferralCodeAction
              label={createdCode ? shareLabel : editLabel}
              onClick={createdCode ? onShare : onCreate}
            >
              {createdCode ? <ShareIcon size={16} /> : <EditIcon size={16} />}
            </ReferralCodeAction>
          </span>
        </div>
        <Separator className="h-10 shrink-0" orientation="vertical" />
        <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <span className="text-t-270 text-xs">{t`Code Applied`}</span>
          <span className="text-t-1100 flex max-w-full items-center gap-1 text-xl leading-none font-medium tracking-[-0.8px]">
            <span className="max-w-[100px] truncate">{appliedCode ?? '-'}</span>
            <ReferralCodeAction
              label={editLabel}
              onClick={appliedCode ? onEdit : onBind}
            >
              <EditIcon size={16} />
            </ReferralCodeAction>
          </span>
        </div>
      </div>
    </div>
  );
};

const SocialAvatar = ({ avatarUrl }: { avatarUrl: string | null }) => {
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
  const displayedAvatarUrl = avatarUrl === failedAvatarUrl ? null : avatarUrl;

  return (
    <span
      aria-hidden
      className="flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-full"
    >
      {displayedAvatarUrl ? (
        // Provider avatar URLs are external and should not use Next's image optimizer.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={displayedAvatarUrl}
          alt=""
          width={20}
          height={20}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="size-full object-cover"
          onError={() => setFailedAvatarUrl(displayedAvatarUrl)}
        />
      ) : (
        <UserIcon size={20} />
      )}
    </span>
  );
};

const getSocialHandle = (social: GenesisSocialBinding) => {
  if (!social.handle) return '';
  if (social.platform !== 'x' || social.handle.startsWith('@')) {
    return social.handle;
  }
  return `@${social.handle}`;
};

export const ReferralBar = ({
  socialState,
  position,
  config,
  hasDeposit,
}: ReferralBarProps) => {
  const { i18n, t } = useLingui();
  const [isAuthorizingSocial, setIsAuthorizingSocial] = useState(false);
  const isAuthorizingSocialRef = useRef(false);
  const [socialAction, setSocialAction] = useState<SocialActionState | null>(
    null,
  );
  const queryClient = useQueryClient();
  const { mutateAsync: unbindSocial, isPending: isUpdatingSocial } =
    useUnbindGenesisSocial();
  const { mutateAsync: initiateSocial, isPending: isBindingSocial } =
    useInitiateGenesisSocialBinding();
  const { items: referralCodes } = useReferralCodes();
  const { data: referralProfile } = useReferralProfile();
  const pendingRefCode = useReferralStore((state) => state.pendingRefCode);
  const urlRefCode =
    typeof window === 'undefined'
      ? null
      : normalizeReferralCode(
          new URLSearchParams(window.location.search).get('ref') ??
            new URLSearchParams(window.location.search).get('code') ??
            '',
        ) || null;
  const initialBindCode = pendingRefCode ?? urlRefCode;
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [bindDialogOpen, setBindDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [origin, setOrigin] = useState('');
  useEffect(() => setOrigin(window.location.origin), []);
  const createdCode = referralCodes[0]?.referral_code ?? null;
  const appliedCode = referralProfile?.bound_referral_code || null;
  const showReferralCode = ENABLE_GENESIS_REFERRAL_CODE && hasDeposit;
  const shareLink =
    origin && createdCode
      ? buildShortShareUrl(origin, createdCode, undefined, '/')
      : '';

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const outcome = params.get('social_bind');
    if (outcome !== 'success' && outcome !== 'error') return;

    const platform = params.get('social_platform');
    const platformLabel =
      platform === 'twitter'
        ? 'X'
        : platform === 'discord'
          ? 'Discord'
          : 'Social';
    if (outcome === 'success') {
      toast.success(
        translateSocialPlatformMessage(
          i18n,
          SOCIAL_PLATFORM_MESSAGES.accountConnected,
          platformLabel,
        ),
      );
      void queryClient.invalidateQueries({
        queryKey: ['genesisSocialState'],
      });
    } else {
      const reason = params.get('social_reason');
      const message =
        reason === 'access_denied'
          ? translateSocialPlatformMessage(
              i18n,
              SOCIAL_PLATFORM_MESSAGES.authorizationCancelled,
              platformLabel,
            )
          : reason === 'conflict'
            ? translateSocialPlatformMessage(
                i18n,
                SOCIAL_PLATFORM_MESSAGES.alreadyConnected,
                platformLabel,
              )
            : translateSocialPlatformMessage(
                i18n,
                SOCIAL_PLATFORM_MESSAGES.authorizationFailed,
                platformLabel,
              );
      toast.error(message);
    }

    params.delete('social_bind');
    params.delete('social_platform');
    params.delete('social_reason');
    const search = params.toString();
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`,
    );
  }, [i18n, queryClient]);

  const socialBindings = socialState?.boundSocials ?? [
    { platform: 'x', bound: false, handle: null, avatarUrl: null },
    { platform: 'discord', bound: false, handle: null, avatarUrl: null },
  ];

  const handleToggleSocial = async (social: GenesisSocialBinding) => {
    const requiresAuthorization = !social.bound;
    if (isAuthorizingSocialRef.current || socialAction) return;

    const oauth = requiresAuthorization
      ? prepareSocialOAuth(social.platform)
      : undefined;

    setSocialAction({
      platform: social.platform,
      type: requiresAuthorization ? 'binding' : 'unbinding',
    });

    if (requiresAuthorization) {
      isAuthorizingSocialRef.current = true;
      setIsAuthorizingSocial(true);
    }

    try {
      if (requiresAuthorization) {
        const authorization = await initiateSocial(social.platform);
        await oauth!.navigate(authorization.authorizeUrl);
        await queryClient.invalidateQueries({
          queryKey: ['genesisSocialState'],
        });
      } else {
        await unbindSocial(social.platform);
      }

      toast.success(
        social.bound
          ? t`Social account disconnected`
          : t`Social account connected`,
      );
    } catch (error) {
      oauth?.cancel();
      if (error instanceof SocialOAuthError) {
        const platformLabel = social.platform === 'x' ? 'X' : 'Discord';
        const oauthMessage =
          error.code === 'invalid_callback'
            ? translateSocialPlatformMessage(
                i18n,
                SOCIAL_PLATFORM_MESSAGES.invalidAuthorizationResponse,
                platformLabel,
              )
            : error.code === 'timeout'
              ? translateSocialPlatformMessage(
                  i18n,
                  SOCIAL_PLATFORM_MESSAGES.authorizationTimedOut,
                  platformLabel,
                )
              : error.message === 'conflict'
                ? translateSocialPlatformMessage(
                    i18n,
                    SOCIAL_PLATFORM_MESSAGES.alreadyConnected,
                    platformLabel,
                  )
                : translateSocialPlatformMessage(
                    i18n,
                    SOCIAL_PLATFORM_MESSAGES.authorizationCancelled,
                    platformLabel,
                  );
        toast.error(oauthMessage);
        return;
      }

      toast.error(
        getGenesisActionErrorMessage({
          error,
          rejectedMessage: t`User rejected the request.`,
          fallbackMessage: t`Please try again.`,
        }),
      );
    } finally {
      setSocialAction(null);
      if (requiresAuthorization) {
        isAuthorizingSocialRef.current = false;
        setIsAuthorizingSocial(false);
      }
    }
  };

  return (
    <section className="w-full">
      <div
        className={cn(
          'grid gap-2 max-md:grid-cols-1 max-md:gap-3',
          showReferralCode ? 'grid-cols-2' : 'grid-cols-[320px_minmax(0,1fr)]',
        )}
      >
        <div className="flex min-w-0 flex-col gap-2 max-md:gap-3">
          <RankCard rank={position?.rank} />
          {showReferralCode ? (
            <ReferralCodePanel
              createdCode={createdCode}
              appliedCode={appliedCode}
              onCreate={() => setCreateDialogOpen(true)}
              onShare={() => setShareDialogOpen(true)}
              onBind={() => setBindDialogOpen(true)}
              onEdit={() => setEditDialogOpen(true)}
            />
          ) : null}
        </div>
        <div className="min-h-[90px] min-w-0 self-stretch rounded-3xl border p-4">
          <div className="flex flex-col gap-2">
            <p className="text-t-350 text-xs/3.5 tracking-[-0.48px]">
              {t`Bound Social Media`}
            </p>
            <div
              className={cn(
                'flex gap-2',
                showReferralCode ? 'flex-col' : 'flex-row max-md:flex-col',
              )}
            >
              {socialBindings.map((social) => {
                const platformLabel = social.platform === 'x' ? 'X' : 'Discord';
                const isCurrentAction =
                  socialAction?.platform === social.platform;
                const isBinding =
                  isCurrentAction && socialAction?.type === 'binding';
                const isUnbinding =
                  isCurrentAction && socialAction?.type === 'unbinding';
                const actionLabel = isBinding
                  ? translateSocialPlatformMessage(
                      i18n,
                      SOCIAL_PLATFORM_MESSAGES.binding,
                      platformLabel,
                    )
                  : isUnbinding
                    ? translateSocialPlatformMessage(
                        i18n,
                        SOCIAL_PLATFORM_MESSAGES.unbinding,
                        platformLabel,
                      )
                    : social.bound
                      ? translateSocialPlatformMessage(
                          i18n,
                          SOCIAL_PLATFORM_MESSAGES.unbind,
                          platformLabel,
                        )
                      : translateSocialPlatformMessage(
                          i18n,
                          SOCIAL_PLATFORM_MESSAGES.connect,
                          platformLabel,
                        );
                const displayHandle = getSocialHandle(social);
                const isSocialActionDisabled =
                  Boolean(socialAction) ||
                  isAuthorizingSocial ||
                  isUpdatingSocial ||
                  isBindingSocial;
                const rowContent = (
                  <>
                    <span className="flex min-w-0 flex-1 items-center gap-2">
                      <SocialPlatformIcon platform={social.platform} />
                      {social.bound ? (
                        <span className="flex min-w-0 items-center gap-1">
                          <SocialAvatar
                            avatarUrl={getCustomSocialAvatarUrl(
                              social.platform,
                              social.avatarUrl,
                            )}
                          />
                          <span className="whitespace-nowrap">
                            {displayHandle || platformLabel}
                          </span>
                        </span>
                      ) : (
                        <span className="whitespace-nowrap">
                          {translateSocialPlatformMessage(
                            i18n,
                            SOCIAL_PLATFORM_MESSAGES.connectYour,
                            platformLabel,
                          )}
                        </span>
                      )}
                    </span>
                    {social.bound ? (
                      <Button
                        variant="ghost"
                        aria-label={actionLabel}
                        title={actionLabel}
                        onClick={() => void handleToggleSocial(social)}
                        disabled={isSocialActionDisabled}
                        className={cn(
                          'text-t-430 hover:text-t-1100 -mr-2 h-8 min-w-8 flex-none justify-end rounded-lg px-2 py-0 text-sm font-medium hover:bg-transparent disabled:bg-transparent disabled:hover:bg-transparent has-[>svg]:px-2',
                          (isBinding || isUnbinding) && 'min-w-[84px]',
                        )}
                      >
                        {isBinding || isUnbinding ? (
                          <>
                            <LoaderCircleIcon
                              size={14}
                              className="animate-spin"
                            />
                            <span>
                              {isBinding ? t`Binding...` : t`Unbinding...`}
                            </span>
                          </>
                        ) : (
                          t`Unbind`
                        )}
                      </Button>
                    ) : (
                      <span className="text-t-430 flex shrink-0 items-center gap-1 text-sm font-medium">
                        {isBinding || isUnbinding ? (
                          <>
                            <LoaderCircleIcon
                              size={14}
                              className="animate-spin"
                            />
                            <span>
                              {isBinding ? t`Binding...` : t`Unbinding...`}
                            </span>
                          </>
                        ) : (
                          <ArrowRight2Icon
                            size={16}
                            className="group-hover/self:text-t-1100"
                          />
                        )}
                      </span>
                    )}
                  </>
                );

                return social.bound ? (
                  <div
                    key={social.platform}
                    className="text-t-1100 flex h-9 min-w-0 flex-1 items-center justify-between gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm"
                  >
                    {rowContent}
                  </div>
                ) : (
                  <button
                    key={social.platform}
                    type="button"
                    aria-label={actionLabel}
                    title={actionLabel}
                    onClick={() => void handleToggleSocial(social)}
                    disabled={isSocialActionDisabled}
                    className="text-t-1100 group/self flex h-9 min-w-0 flex-1 cursor-pointer items-center justify-between gap-2 rounded-xl bg-white/10 px-4 py-2 text-left text-sm transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {rowContent}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      {showReferralCode ? (
        <>
          {createDialogOpen ? (
            <CreateCodeDialog
              open
              onOpenChange={setCreateDialogOpen}
              onConfirm={() => setCreateDialogOpen(false)}
            />
          ) : null}
          {shareDialogOpen ? (
            <SharePosterDialog
              referralCode={createdCode ?? ''}
              shareLink={shareLink}
              open
              onOpenChange={setShareDialogOpen}
              position={position}
              config={config}
            />
          ) : null}
          {bindDialogOpen ? (
            <Dialog open onOpenChange={setBindDialogOpen}>
              <DialogContent
                position="center"
                closeClassName="hidden"
                overlayClassName="z-[60] bg-black/60 backdrop-blur-[8px]"
                className="bg-bg-3 z-[60] w-[calc(100%-32px)] max-w-[440px] gap-0 rounded-2xl border-0 p-3 md:w-[440px] md:max-w-[440px]"
                aria-describedby={undefined}
              >
                <div className="mb-4 flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="text-base font-medium tracking-[-0.64px]">
                      {t`Enter Referral Code`}
                    </DialogTitle>
                    <p className="mt-1 text-xs text-white/70">
                      {t`Enter a valid referral code to activate your fee discount. Your referrer earns commission on every trade you make.`}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="flex size-6 shrink-0 items-center justify-center text-white/50 hover:text-white"
                    aria-label={t`Close`}
                    onClick={() => setBindDialogOpen(false)}
                  >
                    <XIcon size={16} />
                  </button>
                </div>
                <BindReferralCard
                  initialCode={initialBindCode ?? undefined}
                  onCancel={() => setBindDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          ) : null}
          {editDialogOpen ? (
            <EditCodeDialog
              open
              onOpenChange={setEditDialogOpen}
              initialCode={initialBindCode ?? appliedCode ?? undefined}
            />
          ) : null}
        </>
      ) : null}
    </section>
  );
};
