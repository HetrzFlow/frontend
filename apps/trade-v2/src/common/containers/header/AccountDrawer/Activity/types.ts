export type ActivityView = 'trade' | 'swap';

export type ActivityTimelineSource =
  | 'trade'
  | 'pool'
  | 'vault'
  | 'claim'
  | 'referral_claim'
  | 'credit_claim'
  | 'hzfl_claim'
  | 'fee_rebate';

export type ActivityTimelineTagTone = 'accent' | 'down' | 'neutral';

export type ActivityTimelineValueTone = 'default' | 'accent' | 'down';

export type ActivityTimelineIcon =
  | {
    kind: 'coin';
    src?: string;
    alt: string;
  }
  | {
    kind: 'vault';
    alt: string;
  }
  | {
    kind: 'neutral';
    alt: string;
  }
  | {
    kind: 'referralRebate';
    alt: string;
  }
  | {
    kind: 'credit';
    alt: string;
  };

export type PositionMode = 'normal' | 'hyper';

export type ActivityTimelineChildItem = {
  title?: string;
  icon?: ActivityTimelineIcon;
  tagText?: string;
  tagTone?: ActivityTimelineTagTone;
  primaryLabel: string;
  primaryText: string;
  primaryTone: ActivityTimelineValueTone;
  secondaryLabel: string;
  secondaryText: string;
  secondaryTone: ActivityTimelineValueTone;
  timestampText: string;
  txHash?: string;
  txHref?: string;
  isCreditMarket?: boolean;
};

export type ActivityTimelineItem = {
  id: string;
  source: ActivityTimelineSource;
  icon: ActivityTimelineIcon;
  entityName: string;
  entityNameCopyText: string;
  tagText: string;
  tagTone: ActivityTimelineTagTone;
  primaryLabel: string;
  primaryText: string;
  primaryTone: ActivityTimelineValueTone;
  secondaryLabel: string;
  secondaryText: string;
  secondaryTone: ActivityTimelineValueTone;
  tertiaryLabel?: string;
  tertiaryText?: string;
  tertiaryTone?: ActivityTimelineValueTone;
  detailLabel?: string;
  detailText?: string;
  detailTone?: ActivityTimelineValueTone;
  timestampMs: number;
  timestampText: string;
  txHash?: string;
  txHashCopyText?: string;
  txHref?: string;
  txLinkIcon?: 'figmaArrow';
  showPrimarySkeleton?: boolean;
  showSecondarySkeleton?: boolean;
  showTertiarySkeleton?: boolean;
  positionMode?: PositionMode;
  isHyper?: boolean;
  isCreditMarket?: boolean;
  leverageText?: string;
  directionText?: string;
  directionTone?: ActivityTimelineValueTone;
  children?: ActivityTimelineChildItem[];
  lossRebateUsd?: string;
  lossRebateText?: string;
  lossRebateRateText?: string;
  marketAddress?: string;
};
