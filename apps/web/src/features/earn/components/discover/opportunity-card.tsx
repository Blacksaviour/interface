import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Text } from "@workspace/ui/components/text"
import { cn } from "@workspace/ui/lib/utils"
import { formatPct, formatUsd } from "@/shared/lib/format"
import { TokenIcon } from "@/shared/components/TokenIcon"

export type OpportunityCardProps = {
  name: string
  tokens: Array<string>
  apy: number
  tvlUsd: number
  isAvailable?: boolean
  onAction?: () => void
  actionLabel?: string
}

export function OpportunityCard({
  name,
  tokens,
  apy,
  tvlUsd,
  isAvailable = true,
  onAction,
  actionLabel = "Earn",
}: OpportunityCardProps) {
  return (
    <Card className={cn("transition-colors", !isAvailable && "opacity-60")}>
      <CardContent>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {tokens.map((symbol, i) => (
                <TokenIcon
                  key={`${symbol}-${i}`}
                  symbol={symbol}
                  size={28}
                  className="ring-card"
                />
              ))}
            </div>
            <Text size="lg" weight="semibold" render={<span />}>
              {name}
            </Text>
          </div>
          <span className="text-15 font-semibold">{name}</span>
        </div>

      <div className="mb-5 grid grid-cols-2 gap-4">
        <div>
          <p className="mb-1 text-11 text-muted-foreground">APR</p>
          <p className="font-mono text-sm font-semibold text-green-400">
            {formatPct(apy, { sign: false })}
          </p>
        </div>
        <div>
          <p className="mb-1 text-11 text-muted-foreground">TVL</p>
          <p className="font-mono text-sm text-muted-foreground">
            {formatUsd(tvlUsd, { compact: true })}
          </p>
        </div>

      <Button
        className="w-full text-13 font-medium"
        disabled={!isAvailable}
        onClick={() => {
          if (isAvailable) onAction?.()
        }}
      >
        {isAvailable ? actionLabel : "Coming Soon"}
      </Button>
    </div>
      </CardContent>
    </Card>
  )
}
