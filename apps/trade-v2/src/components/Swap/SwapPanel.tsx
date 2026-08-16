'use client';

import {
  shouldAutoExpandSwapDetails,
  type SwapPanelVariant,
} from './swapPanelModel';
import { SwapQuoteSection } from './SwapQuoteSection';
import { SwapTokenFields } from './SwapTokenFields';
import { useSwapPanel } from './useSwapPanel';
import {
  GENESIS_QUICK_SWAP_TOKENS,
  GENESIS_SWAP_TOKENS_BY_SYMBOL,
} from './useSwapTokens';

export const SwapPanel = ({
  variant = 'trade',
  marketBaseSymbol,
  genesisAssetSymbol,
  actionButtonClassName,
  genesisPresentation = false,
}: {
  variant?: SwapPanelVariant;
  marketBaseSymbol?: string;
  genesisAssetSymbol?: keyof typeof GENESIS_SWAP_TOKENS_BY_SYMBOL;
  actionButtonClassName?: string;
  genesisPresentation?: boolean;
}) => {
  const genesisQuickTokens = genesisAssetSymbol
    ? GENESIS_QUICK_SWAP_TOKENS
    : undefined;
  const { model, actions } = useSwapPanel(variant, {
    defaultReceiveSymbol: marketBaseSymbol,
    defaultReceiveToken: genesisAssetSymbol
      ? GENESIS_SWAP_TOKENS_BY_SYMBOL[genesisAssetSymbol]
      : undefined,
    quickTokenPreset: genesisQuickTokens,
  });
  const autoExpandDetails = shouldAutoExpandSwapDetails(
    model.quote.payAmount,
    model.quote.receiveAmount,
  );

  return (
    <div className="flex flex-col gap-2">
      <SwapTokenFields
        model={model.tokenFields}
        actions={actions}
        quickTokenPreset={genesisQuickTokens}
        genesisPresentation={genesisPresentation}
      />
      <SwapQuoteSection
        key={`${
          model.quote.priceDifference.status === 'worse'
            ? 'price-warning'
            : 'price-normal'
        }-${autoExpandDetails ? 'details-ready' : 'details-empty'}`}
        variant={variant}
        model={model.quote}
        actionButton={model.actionButton}
        actionButtonClassName={actionButtonClassName}
        detailsInitiallyOpen={autoExpandDetails}
        actions={actions}
      />
    </div>
  );
};
