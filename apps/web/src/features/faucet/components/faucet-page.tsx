import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { AppShell } from "@workspace/ui/components/app-shell"
import { Card, CardContent } from "@workspace/ui/components/card"
import { LoadingButton } from "@workspace/ui/components/loading-button"
import { PageHeader } from "@workspace/ui/components/page-header"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Text } from "@workspace/ui/components/text"
import { FAUCET_TOKENS, type FaucetTokenConfig } from "../data/tokens" // eslint-disable-line import/consistent-type-specifier-style
import { FAUCET_CONTRACT_ID } from "../lib/clients"
import { useFaucetData } from "../hooks/useFaucetData"
import { useClaim } from "../hooks/useClaim"
import { Navbar } from "@/ui/Navbar"
import { TokenIcon } from "@/shared/components/TokenIcon"
import { formatToken } from "@/shared/lib/format"
import { NETWORK } from "@/app/config/network"
import { useWalletStore } from "@/features/wallet/store/wallet-store"
import { useNetwork } from "@/features/wallet/hooks/useNetwork"
import { NetworkMismatchBanner } from "@/features/wallet/components/NetworkMismatchBanner"
import { ConnectButton } from "@/features/wallet/components/ConnectButton"

// ── Token card ────────────────────────────────────────────────────────────────

type TokenCardProps = {
  token: FaucetTokenConfig
  balance: number | undefined
  claimAmount: number | undefined
  lastClaimLedger: number | null | undefined
  cooldownLedgers: number | undefined
  isLoading: boolean
  isPending: boolean
  isDisabled: boolean
  onClaim: (token: FaucetTokenConfig) => void
}

function TokenCard({
  token,
  balance,
  claimAmount,
  lastClaimLedger,
  cooldownLedgers,
  isLoading,
  isPending,
  isDisabled,
  onClaim,
}: TokenCardProps) {
  const cooldownText =
    lastClaimLedger && cooldownLedgers
      ? `Last claim ledger ${lastClaimLedger.toLocaleString()}`
      : "No claim recorded"

  return (
    <Card className="flex min-w-0 flex-col gap-4 rounded-lg p-5">
      <div className="flex items-center gap-3">
        <TokenIcon symbol={token.symbol.replace(/^T/, "")} size={36} />
        <div className="min-w-0">
          <Text size="base" weight="semibold">
            {token.symbol}
          </Text>
          <Text size="sm" tone="muted">
            {token.name}
          </Text>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-muted/40 px-3 py-2.5">
          <p className="mb-0.5 text-11 font-medium uppercase tracking-wider text-muted-foreground">
            Your balance
          </p>
          {isLoading ? (
            <Skeleton className="mt-1 h-4 w-20" />
          ) : (
            <p className="font-mono text-sm text-foreground">
              {formatToken(balance, token.symbol, { decimals: 4 })}
            </p>
          )}
        </div>

        <div className="rounded-lg bg-muted/40 px-3 py-2.5">
          <p className="mb-0.5 text-11 font-medium uppercase tracking-wider text-muted-foreground">
            Claim amount
          </p>
          {isLoading ? (
            <Skeleton className="mt-1 h-4 w-16" />
          ) : (
            <p className="font-mono text-sm text-foreground">
              {formatToken(claimAmount, token.symbol, { decimals: 2 })}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-xs text-muted-foreground">{cooldownText}</p>
        <LoadingButton
          variant="outline"
          size="lg"
          className="shrink-0"
          isLoading={isPending}
          loadingText="Claiming"
          disabled={isDisabled}
          onClick={() => onClaim(token)}
        >
          Claim
        </LoadingButton>
      </div>
    </Card>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function FaucetPage() {
  const address = useWalletStore((state) => state.address)
  const isConnected = useWalletStore((state) => state.status === "connected")
  const { mismatch } = useNetwork()
  const { data, isLoading } = useFaucetData(address)
  const { claimOne, claimAll, pendingTokens, isBulkPending } = useClaim()

  const isTestnet = NETWORK.name === "testnet"
  const claimDisabled = !isConnected || mismatch

  return (
    <AppShell
      navbar={<Navbar variant="app" />}
      banner={<NetworkMismatchBanner />}
      maxWidth="2xl"
    >
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <span>Testnet Faucet</span>
          </div>
        }
        description="Claim test tokens to try trading on SO4. Tokens have no real value."
        metadata={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2.5 py-0.5 text-11 font-medium text-yellow-600 dark:text-yellow-400">
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
            Stellar Testnet
          </span>
        }
      />

        {!isTestnet ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Text size="base" tone="muted">
                The faucet is only available on the Stellar testnet.
              </Text>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Token cards */}
            <div className="grid gap-4 sm:grid-cols-2">
              {FAUCET_TOKENS.map((token) => (
                <TokenCard
                  key={token.symbol}
                  token={token}
                  balance={data?.balances[token.symbol]}
                  claimAmount={data?.claimAmounts[token.symbol]}
                  lastClaimLedger={data?.lastClaimLedgers[token.symbol]}
                  cooldownLedgers={data?.cooldownLedgers}
                  isLoading={isLoading}
                  isPending={pendingTokens.has(token.contractId) || isBulkPending}
                  isDisabled={claimDisabled}
                  onClaim={(selectedToken) => claimOne(selectedToken.contractId)}
                />
              ))}
            </div>

            {/* Claim panel */}
            <Card>
              <CardContent className="flex flex-col gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Claim test tokens</p>
                  <p className="mt-0.5 text-13 text-muted-foreground">
                    Receive TUSDC, TWBTC, TETH, and TXLM in a single transaction. A cooldown
                    applies between claims.
                  </p>
                </div>

                {mismatch && (
                  <Alert variant="warning">
                    <AlertDescription>
                      Switch your wallet to Stellar Testnet to claim.
                    </AlertDescription>
                  </Alert>
                )}

                {!isConnected ? (
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-13 text-muted-foreground">Connect your wallet to claim test tokens.</p>
                    <ConnectButton />
                  </div>
                ) : (
                  <LoadingButton
                    variant="default"
                    size="lg"
                    className="w-full"
                    isLoading={isBulkPending}
                    loadingText="Claiming…"
                    disabled={claimDisabled}
                    onClick={() => claimAll()}
                  >
                    Claim Test Tokens
                  </LoadingButton>
                )}

                {data?.cooldownLedgers != null && data.cooldownLedgers > 0 && (
                  <p className="text-center text-xs text-muted-foreground">
                    Cooldown: {data.cooldownLedgers.toLocaleString()} ledgers between claims
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Info panel */}
            <div className="rounded-xl border border-border bg-muted/20 px-5 py-4">
              <p className="mb-2 text-11 font-semibold uppercase tracking-wider text-muted-foreground">
                Contract addresses
              </p>
              <dl className="space-y-1.5">
                {[
                  { label: "Faucet", id: FAUCET_CONTRACT_ID },
                  ...FAUCET_TOKENS.map((token) => ({
                    label: token.symbol,
                    id: token.contractId,
                  })),
                ].map(({ label, id }) => (
                  <div key={label} className="flex items-center justify-between gap-3">
                    <dt className="w-12 shrink-0 text-xs text-muted-foreground">{label}</dt>
                    <dd className="min-w-0 truncate font-mono text-11 text-foreground/70">
                      {id}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        )}
    </AppShell>
  )
}
