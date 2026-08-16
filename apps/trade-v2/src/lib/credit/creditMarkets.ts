export const CREDIT_ROUTE_PREFIX = 'credit:';
export const CREDIT_CATEGORY = 'credit';

export function isCreditCategory(category: string | undefined) {
  return category === CREDIT_CATEGORY;
}

export function parseTradeRouteInstId(instId: string) {
  const isCreditMarket = instId.startsWith(CREDIT_ROUTE_PREFIX);
  const routeInstId = instId;
  const rawInstId = isCreditMarket
    ? instId.slice(CREDIT_ROUTE_PREFIX.length)
    : instId;

  return {
    routeName: rawInstId.replace('-', '/'),
    isCreditMarket,
    routeInstId,
  };
}

export function buildTradeRouteInstId(
  routeName: string,
  isCreditMarket: boolean,
) {
  const instId =
    typeof routeName === 'string' ? routeName.replace('/', '-') : '';
  return isCreditMarket ? `${CREDIT_ROUTE_PREFIX}${instId}` : instId;
}

export function buildTradeRouteInstIdByCategory(
  routeName: string,
  category: string | undefined,
) {
  return buildTradeRouteInstId(routeName, isCreditCategory(category));
}

export function selectInstForTradeRoute<
  T extends {
    id?: string;
    name?: string;
    symbol?: string;
    category?: string;
  },
>({
  insts,
  routeName,
  isCreditMarketRoute,
  preferredInstId,
}: {
  insts: T[];
  routeName: string;
  isCreditMarketRoute: boolean;
  preferredInstId?: string;
}) {
  const sameRouteNameInsts = insts.filter(
    (inst) => (inst.name ?? inst.symbol) === routeName,
  );
  if (!sameRouteNameInsts.length) return undefined;

  const categoryMatches = sameRouteNameInsts.filter(
    (inst) => isCreditCategory(inst.category) === isCreditMarketRoute,
  );

  return (
    categoryMatches.find((inst) => inst.id === preferredInstId) ??
    categoryMatches[0] ??
    sameRouteNameInsts.find((inst) => inst.id === preferredInstId) ??
    sameRouteNameInsts[0]
  );
}
