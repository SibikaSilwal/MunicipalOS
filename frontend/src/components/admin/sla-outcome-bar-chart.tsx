import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useTranslation } from 'react-i18next'

const ON_TIME = '#065f46'
const PAST_DUE = '#c2410c'

type Row = { label: string; count: number; key: 'onTime' | 'pastDue' }

interface SlaOutcomeBarChartProps {
  onTime: number
  pastDue: number
  className?: string
}

export function SlaOutcomeBarChart({
  onTime,
  pastDue,
  className,
}: SlaOutcomeBarChartProps) {
  const { t } = useTranslation()
  const data: Row[] = [
    { label: t('sla.onTime'), count: onTime, key: 'onTime' },
    { label: t('sla.pastDue'), count: pastDue, key: 'pastDue' },
  ]

  const max = Math.max(onTime, pastDue, 1)

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%" minHeight={260}>
        <BarChart
          data={data}
          margin={{ top: 12, right: 16, left: 0, bottom: 8 }}
          barCategoryGap="28%"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-border/80"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            allowDecimals={false}
            domain={[0, Math.ceil(max * 1.1)]}
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip
            cursor={{ fill: 'oklch(0.955 0.018 264 / 0.6)' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const row = payload[0].payload as Row
              return (
                <div className="bg-popover text-popover-foreground rounded-lg border px-3 py-2 text-sm shadow-md">
                  <p className="font-medium">{row.label}</p>
                  <p className="text-muted-foreground tabular-nums">
                    {t('sla.applicationCount', {
                      count: row.count,
                      suffix: row.count === 1 ? '' : 's',
                    })}
                  </p>
                </div>
              )
            }}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={72}>
            {data.map((entry) => (
              <Cell
                key={entry.key}
                fill={entry.key === 'onTime' ? ON_TIME : PAST_DUE}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
