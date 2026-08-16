import { calc, type BN } from '@repo/lib/calc';

type DecimalValue = string | number | BN | null | undefined;
type GenesisMeritsAction = 'deposit' | 'withdraw';

const ZERO = calc(0);
const ONE = calc(1);

const toDecimal = (value: DecimalValue) => {
  try {
    const decimal = calc(value ?? 0);
    return decimal.isFinite() ? decimal : ZERO;
  } catch {
    return ZERO;
  }
};

const clampUnit = (value: BN) => calc.max(ZERO, calc.min(ONE, value));

export const isLpEstimateEpochCurrent = (
  epochEndSec: number | undefined,
  nowMs = Date.now(),
) => epochEndSec !== undefined && nowMs < epochEndSec * 1000;

export const isLpEstimateWithoutActiveEpoch = (
  epochStartSec: number | undefined,
  epochEndSec: number | undefined,
) =>
  epochStartSec !== undefined &&
  epochEndSec !== undefined &&
  epochEndSec <= epochStartSec;

export const hasGenesisWithdrawalLoss = ({
  meritsLost,
}: {
  meritsLost: DecimalValue;
}) => toDecimal(meritsLost).gt(0);

export const sumGenesisDecimalValues = (values: DecimalValue[]) =>
  values.reduce<BN>((sum, value) => sum.plus(toDecimal(value)), ZERO);

export const calculateUsdValue = ({
  amount,
  usdPrice,
}: {
  amount: DecimalValue;
  usdPrice: DecimalValue;
}) =>
  calc.max(toDecimal(amount), ZERO).times(calc.max(toDecimal(usdPrice), ZERO));

export const calculateAffectedUnmaturedUsd = ({
  withdrawShares,
  unmaturedShares,
  unmaturedUsd,
}: {
  withdrawShares: DecimalValue;
  unmaturedShares: DecimalValue;
  unmaturedUsd: DecimalValue;
}) => {
  const withdraw = calc.max(toDecimal(withdrawShares), ZERO);
  const shares = calc.max(toDecimal(unmaturedShares), ZERO);
  const usd = calc.max(toDecimal(unmaturedUsd), ZERO);

  if (withdraw.isZero() || shares.isZero() || usd.isZero()) return ZERO;

  return calc.min(withdraw, shares).times(usd).div(shares);
};

export const calculateProportionalWithdrawUsd = ({
  withdrawShares,
  totalShares,
  totalUsd,
}: {
  withdrawShares: DecimalValue;
  totalShares: DecimalValue;
  totalUsd: DecimalValue;
}) => {
  const withdraw = calc.max(toDecimal(withdrawShares), ZERO);
  const shares = calc.max(toDecimal(totalShares), ZERO);
  const usd = calc.max(toDecimal(totalUsd), ZERO);

  if (withdraw.isZero() || shares.isZero() || usd.isZero()) return ZERO;

  return calc.min(withdraw, shares).times(usd).div(shares);
};

export const calculateRemainingBasePoolMerits = ({
  lpPoolTotal,
  epochStartSec,
  epochEndSec,
  seasonEndSec,
  nowSec,
}: {
  lpPoolTotal: DecimalValue;
  epochStartSec: number;
  epochEndSec: number;
  seasonEndSec: number;
  nowSec: number;
}) => {
  const epochDuration = toDecimal(epochEndSec).minus(epochStartSec);
  const poolTotal = calc.max(toDecimal(lpPoolTotal), ZERO);
  const now = toDecimal(nowSec);
  const seasonEnd = toDecimal(seasonEndSec);

  if (epochDuration.lte(0) || poolTotal.isZero() || now.gte(seasonEnd)) {
    return ZERO;
  }

  const currentEpochProjectionEnd = calc.min(toDecimal(epochEndSec), seasonEnd);
  const currentEpochRemainingRatio = clampUnit(
    currentEpochProjectionEnd.minus(now).div(epochDuration),
  );
  const futureEpochEquivalent = calc.max(
    seasonEnd.minus(epochEndSec).div(epochDuration),
    ZERO,
  );

  return poolTotal.times(
    currentEpochRemainingRatio.plus(futureEpochEquivalent),
  );
};

export const estimatePostActionBoostRate = ({
  action,
  currentRate,
  userEligibleUsd,
  poolEligibleUsd,
  boostDeltaUsd,
  poolDeltaUsd,
  firstDepositPoolEligibleUsd,
  firstDepositWeight,
}: {
  action: GenesisMeritsAction;
  currentRate: DecimalValue;
  userEligibleUsd: DecimalValue;
  poolEligibleUsd: DecimalValue;
  boostDeltaUsd: DecimalValue;
  poolDeltaUsd: DecimalValue;
  firstDepositPoolEligibleUsd?: DecimalValue;
  firstDepositWeight?: DecimalValue;
}) => {
  const rate = clampUnit(toDecimal(currentRate));
  const userUsd = calc.max(toDecimal(userEligibleUsd), ZERO);
  const poolUsd = calc.max(toDecimal(poolEligibleUsd), ZERO);
  const boostDelta = calc.max(toDecimal(boostDeltaUsd), ZERO);
  const poolDelta = calc.max(toDecimal(poolDeltaUsd), ZERO);

  if (boostDelta.isZero() && poolDelta.isZero()) return rate;

  if (action === 'deposit') {
    const nextPoolUsd = poolUsd.plus(poolDelta);
    if (nextPoolUsd.isZero()) return ZERO;
    if (userUsd.isZero()) {
      const targetPoolUsd = calc.max(
        toDecimal(firstDepositPoolEligibleUsd ?? poolEligibleUsd),
        ZERO,
      );
      const targetWeight = clampUnit(toDecimal(firstDepositWeight ?? ONE));
      const nextTargetPoolUsd = targetPoolUsd.plus(poolDelta);

      return nextTargetPoolUsd.isZero()
        ? ZERO
        : clampUnit(targetWeight.times(boostDelta).div(nextTargetPoolUsd));
    }

    return clampUnit(
      rate
        .times(userUsd.plus(boostDelta))
        .div(userUsd)
        .times(poolUsd)
        .div(nextPoolUsd),
    );
  }

  const affectedUsd = calc.min(boostDelta, userUsd);
  const removedPoolUsd = calc.min(poolDelta, poolUsd);
  if (
    userUsd.isZero() ||
    affectedUsd.gte(userUsd) ||
    poolUsd.lte(removedPoolUsd)
  ) {
    return ZERO;
  }

  return clampUnit(
    rate
      .times(userUsd.minus(affectedUsd))
      .div(userUsd)
      .times(poolUsd)
      .div(poolUsd.minus(removedPoolUsd)),
  );
};

export const calculateGenesisMeritsLockedPreview = ({
  action,
  currentRewardRate,
  currentBoostRate,
  userRewardEligibleUsd,
  userBoostEligibleUsd,
  poolEligibleUsd,
  boostDeltaUsd,
  poolDeltaUsd,
  firstDepositPoolEligibleUsd,
  firstDepositWeight,
  estimatedMerits,
  estimatedBoostMerits,
  settledMerits,
  lpPoolTotal,
  boostMultiplier,
  epochStartSec,
  epochEndSec,
  seasonEndSec,
  asOfSec,
  nowSec,
}: {
  action: GenesisMeritsAction;
  currentRewardRate: DecimalValue;
  currentBoostRate: DecimalValue;
  userRewardEligibleUsd: DecimalValue;
  userBoostEligibleUsd: DecimalValue;
  poolEligibleUsd: DecimalValue;
  boostDeltaUsd: DecimalValue;
  poolDeltaUsd: DecimalValue;
  firstDepositPoolEligibleUsd?: DecimalValue;
  firstDepositWeight?: DecimalValue;
  estimatedMerits: DecimalValue;
  estimatedBoostMerits: DecimalValue;
  settledMerits: DecimalValue;
  lpPoolTotal: DecimalValue;
  boostMultiplier: DecimalValue;
  epochStartSec: number;
  epochEndSec: number;
  seasonEndSec: number;
  asOfSec: number;
  nowSec: number;
}) => {
  const remainingBasePoolMerits = calculateRemainingBasePoolMerits({
    lpPoolTotal,
    epochStartSec,
    epochEndSec,
    seasonEndSec,
    nowSec,
  });
  const normalizedCurrentRewardRate = clampUnit(toDecimal(currentRewardRate));
  const normalizedCurrentBoostRate = clampUnit(toDecimal(currentBoostRate));
  const nextRewardRate = estimatePostActionBoostRate({
    action,
    currentRate: normalizedCurrentRewardRate,
    userEligibleUsd: userRewardEligibleUsd,
    poolEligibleUsd,
    boostDeltaUsd: poolDeltaUsd,
    poolDeltaUsd,
    firstDepositPoolEligibleUsd,
    firstDepositWeight,
  });
  const nextBoostRate = estimatePostActionBoostRate({
    action,
    currentRate: normalizedCurrentBoostRate,
    userEligibleUsd: userBoostEligibleUsd,
    poolEligibleUsd,
    boostDeltaUsd,
    poolDeltaUsd,
    firstDepositPoolEligibleUsd,
    firstDepositWeight,
  });
  const extraMultiplier = calc.max(toDecimal(boostMultiplier).minus(ONE), ZERO);
  const epochDuration = toDecimal(epochEndSec).minus(epochStartSec);
  const elapsedProjectionEnd = calc.min(
    toDecimal(nowSec),
    toDecimal(epochEndSec),
    toDecimal(seasonEndSec),
  );
  const elapsedBasePoolMerits = epochDuration.gt(0)
    ? calc
        .max(elapsedProjectionEnd.minus(calc.max(asOfSec, epochStartSec)), ZERO)
        .div(epochDuration)
        .times(calc.max(toDecimal(lpPoolTotal), ZERO))
    : ZERO;
  const baseMeritsAtNow = calc
    .max(toDecimal(estimatedMerits), ZERO)
    .plus(normalizedCurrentRewardRate.times(elapsedBasePoolMerits));
  const boostMeritsAtNow = calc
    .max(toDecimal(estimatedBoostMerits), ZERO)
    .plus(
      normalizedCurrentBoostRate
        .times(elapsedBasePoolMerits)
        .times(extraMultiplier),
    );
  const currentFutureRate = normalizedCurrentRewardRate.plus(
    normalizedCurrentBoostRate.times(extraMultiplier),
  );
  const nextFutureRate = nextRewardRate.plus(
    nextBoostRate.times(extraMultiplier),
  );
  const settledMeritsBaseline = calc.max(toDecimal(settledMerits), ZERO);
  const currentMeritsLocked = settledMeritsBaseline
    .plus(baseMeritsAtNow)
    .plus(boostMeritsAtNow)
    .plus(currentFutureRate.times(remainingBasePoolMerits));
  const normalizedUserBoostEligibleUsd = calc.max(
    toDecimal(userBoostEligibleUsd),
    ZERO,
  );
  const boostLossRatio =
    action === 'withdraw' && normalizedUserBoostEligibleUsd.gt(0)
      ? clampUnit(
          calc
            .min(
              calc.max(toDecimal(boostDeltaUsd), ZERO),
              normalizedUserBoostEligibleUsd,
            )
            .div(normalizedUserBoostEligibleUsd),
        )
      : ZERO;
  const nextMeritsLocked = settledMeritsBaseline
    .plus(baseMeritsAtNow)
    .plus(boostMeritsAtNow.times(ONE.minus(boostLossRatio)))
    .plus(nextFutureRate.times(remainingBasePoolMerits));
  const meritsLost = calc.max(
    currentMeritsLocked.minus(nextMeritsLocked),
    ZERO,
  );

  return {
    remainingBasePoolMerits: remainingBasePoolMerits.toFixed(),
    currentRate: normalizedCurrentBoostRate.toFixed(),
    nextRate: nextBoostRate.toFixed(),
    currentRewardRate: normalizedCurrentRewardRate.toFixed(),
    nextRewardRate: nextRewardRate.toFixed(),
    baseMeritsAtNow: baseMeritsAtNow.toFixed(),
    boostMeritsAtNow: boostMeritsAtNow.toFixed(),
    currentMeritsLocked: currentMeritsLocked.toFixed(),
    nextMeritsLocked: nextMeritsLocked.toFixed(),
    meritsLost: meritsLost.toFixed(),
  };
};
