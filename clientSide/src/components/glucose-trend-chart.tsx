import { useEffect, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ReferenceArea, XAxis, YAxis } from 'recharts'
import { GlucoseBadge } from '@/components/glucose-scale'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { glucoseLevel } from '@/lib/glucose-scale'
import { formatDate, readingsApi, type Trend } from '@/lib/readings'

// Based on shadcn's "Area Chart – Interactive" demo: same structure (card header + range switch +
// area with a gradient fill and a hover tooltip), but fed with the user's daily average glucose.

const RANGES = [
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '3 months' },
] as const
type RangeDays = (typeof RANGES)[number]['days']

const chartConfig = {
  average: { label: 'Daily average', color: 'var(--foreground)' },
} satisfies ChartConfig

// `refreshKey` changes whenever a reading is added, edited or deleted, so the chart reloads.
export function GlucoseTrendChart({ refreshKey }: { refreshKey: number }) {
  const [range, setRange] = useState<RangeDays>(30)
  // Remember which range (and refresh) the loaded data belongs to; if it doesn't match, we're loading.
  const [loaded, setLoaded] = useState<{ key: string; trend: Trend } | null>(null)
  const [error, setError] = useState('')
  const requestKey = `${range}:${refreshKey}`

  useEffect(() => {
    let ignore = false // stops an older, slower response from overwriting a newer one
    readingsApi
      .trend(range)
      .then((trend) => !ignore && setLoaded({ key: requestKey, trend }))
      .catch(() => !ignore && setError("Couldn't load your chart. Please refresh the page."))
    return () => {
      ignore = true
    }
  }, [range, requestKey])

  const trend = loaded?.key === requestKey ? loaded.trend : null
  const days = trend?.days ?? []

  return (
    <Card className="gap-0 pt-0">
      <CardHeader className="flex flex-wrap items-center gap-4 border-b py-5">
        <div className="grid flex-1 gap-1">
          <CardTitle className="text-lg">Your glucose over time</CardTitle>
          <CardDescription>
            {trend ? `Daily average, ${formatDate(trend.from)} – ${formatDate(trend.to)}` : 'Daily average'}
            <span className="ml-2 inline-flex items-center gap-1.5 whitespace-nowrap">
              <span className="inline-block size-2.5 rounded-xs bg-[#16a34a]/20 ring-1 ring-[#16a34a]/40" aria-hidden="true" />
              Target 70–180
            </span>
          </CardDescription>
        </div>
        <Tabs value={String(range)} onValueChange={(value) => setRange(Number(value) as RangeDays)}>
          <TabsList className="h-10">
            {RANGES.map((r) => (
              <TabsTrigger key={r.days} value={String(r.days)} className="px-3 text-sm">
                {r.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className="px-2 pt-6 sm:px-6">
        {error ? (
          <p className="py-16 text-center text-destructive">{error}</p>
        ) : !trend ? (
          <div className="h-[260px] animate-pulse rounded-md bg-muted/60" aria-label="Loading chart" />
        ) : days.length === 0 ? (
          <div className="grid h-[260px] place-content-center gap-1 text-center">
            <p className="font-medium">No readings in this period yet</p>
            <p className="text-muted-foreground">Add a reading above and it will show up here.</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-[260px] w-full">
            <AreaChart data={days} margin={{ left: 4, right: 12, top: 8 }}>
              <defs>
                <linearGradient id="fillAverage" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-average)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--color-average)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              {/* Soft green band behind the line: the target range (70–180 mg/dl) */}
              <ReferenceArea y1={70} y2={180} fill="#16a34a" fillOpacity={0.06} ifOverflow="hidden" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                minTickGap={32}
                tickFormatter={(value: string) => formatDate(value, { day: 'numeric', month: 'short' })}
              />
              <YAxis tickLine={false} axisLine={false} width={36} domain={[
                  (min: number) => Math.max(0, Math.floor((min - 10) / 20) * 20), // round down to a multiple of 20
                  (max: number) => Math.ceil((max + 10) / 20) * 20, // round up to a multiple of 20
                ]}
                allowDecimals={false} />
              <ChartTooltip
                cursor={{ strokeDasharray: '4 4' }}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    labelFormatter={(_, payload) => formatDate(payload?.[0]?.payload?.date ?? '')}
                    formatter={(value, _name, item) => (
                      <div className="grid gap-1">
                        <span className="flex items-center gap-2 font-medium text-foreground">
                          Average {Number(value).toFixed(1)} mg/dl
                          <GlucoseBadge value={Number(value)} className="px-2 text-xs" />
                        </span>
                        <span className="text-muted-foreground">
                          {item.payload.count === 1
                            ? '1 reading'
                            : `${item.payload.count} readings · ${item.payload.lowest}–${item.payload.highest} mg/dl`}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Area
                dataKey="average"
                type="monotone"
                fill="url(#fillAverage)"
                stroke="var(--color-average)"
                strokeWidth={2}
                // Each day's dot is coloured by its level (green = normal … red = extremely high).
                // With 3 months of data the dots would crowd together, so they're hidden then.
                dot={
                  days.length <= 31
                    ? ({ cx, cy, payload, index }) => (
                        <circle
                          key={index}
                          cx={cx}
                          cy={cy}
                          r={4}
                          fill={glucoseLevel(payload.average).color}
                          stroke="var(--background)"
                          strokeWidth={1.5}
                        />
                      )
                    : false
                }
                activeDot={({ cx, cy, payload }) => (
                  <circle cx={cx} cy={cy} r={6} fill={glucoseLevel(payload.average).color} stroke="var(--background)" strokeWidth={2} />
                )}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
