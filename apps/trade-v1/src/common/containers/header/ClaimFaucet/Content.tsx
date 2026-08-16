import { FC } from 'react';
import { useLingui, Trans } from '@lingui/react/macro';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { truncateFormat } from '@repo/lib/format';
import { Button, DialogFooter, Input, Loading, Separator } from '@repo/ui';
import CoinIcon from '../../../components/CoinIcon';
import ConnectBtn from '../../../components/ConnectBtn';
import { buildPriceId } from '../../../constants/common';
import { usePriceTickerStream } from '../../../services/ws/tickers';
import { useInstStore } from '../../../stores/instStore';
import {
  useFaucetClaim,
  FAUCET_COINS,
  MIN_SUI_BALANCE,
} from '../hooks/useFaucetClaim';
const Content: FC = () => {
  const { t } = useLingui();
  const currentAccount = useCurrentAccount();
  const coins = useInstStore((state) => state.getCoins());

  const {
    claimAllTokens,
    isPending: isClaimPending,
    isEligible,
    countdown,
    canClaim,
  } = useFaucetClaim();

  const { data: prices } = usePriceTickerStream(
    FAUCET_COINS.map((v) => buildPriceId(v.symbol)) || [],
  );

  const countdownText = countdown || '00:00:00';

  return (
    <>
      <div>
        <h3 className="text-t-270 mb-2 text-sm">{t`Reception Wallet Address`}</h3>
        <Input
          disabled
          className="text-t-350 mb-2 px-4 py-[10px]"
          inputClassName="break-all text-ellipsis"
          value={currentAccount ? currentAccount.address : ''}
          placeholder={
            currentAccount
              ? ''
              : 'Connect your wallet to receive testnet faucet'
          }
        />
        <p
          className={`text-sm ${
            currentAccount && !isEligible ? 'text-destructive' : 'text-t-350'
          }`}
          id="tips"
        >
          {currentAccount && !isEligible ? (
            <Trans>
              Ineligible - please ensure you{' '}
              <a
                className="underline"
                href="https://faucet.sui.io/"
                target="_blank"
                rel="noreferrer"
              >
                {`hold at least ${MIN_SUI_BALANCE} Testnet SUI.`}
              </a>
            </Trans>
          ) : (
            <Trans>
              Connect your wallet to receive testnet faucet.
              <br />
              Eligibility:{' '}
              <a
                className="text-accent text-sm underline"
                href="https://faucet.sui.io/"
                target="_blank"
                rel="noreferrer"
              >
                {`Hold at least ${MIN_SUI_BALANCE} Testnet SUI.`}
              </a>
            </Trans>
          )}
        </p>
      </div>
      <Separator />
      <div>
        <h3 className="text-t-270 text-sm">{t`Receive Test Tokens`}</h3>
        {FAUCET_COINS.map(({ coin_amount, symbol }, i) => {
          const px = prices[i]?.[0]?.p;
          return (
            <div
              key={symbol}
              className="flex items-center justify-between py-2"
            >
              <div className="flex items-center gap-3">
                <CoinIcon
                  src={coins[symbol]?.icon}
                  alt={`${symbol} icon`}
                  size={36}
                />
                <div>
                  <h3 className="font-semibold">{symbol}</h3>
                  <p className="text-t-350 text-sm">{coins[symbol]?.name}</p>
                </div>
              </div>
              <div>
                <p className={`font-plex text-right font-semibold`}>
                  {coin_amount}
                </p>
                <p className="text-t-350 text-right text-sm">
                  {truncateFormat(Number(coin_amount) * Number(px), 2, {
                    style: 'currency',
                    currency: 'USD',
                  })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <DialogFooter>
        {currentAccount ? (
          <Button
            className="bg-accent hover:bg-accent/90 text-accent-foreground hover:text-accent-foreground/90 mx-auto h-[54px] w-full font-semibold"
            onClick={() => {
              if (currentAccount && isEligible && canClaim()) {
                claimAllTokens();
              }
            }}
            disabled={
              isClaimPending ||
              (!!currentAccount && !isEligible) ||
              (!!currentAccount && !canClaim())
            }
          >
            {isClaimPending ? (
              <Loading className="h-5 w-5" />
            ) : !canClaim() ? (
              t`Claimable in ${countdownText}`
            ) : (
              t`Claim Faucet`
            )}
          </Button>
        ) : (
          <ConnectBtn className="h-[54px] w-full">{t`Connect Wallet to Claim`}</ConnectBtn>
        )}
      </DialogFooter>
    </>
  );
};

export default Content;
