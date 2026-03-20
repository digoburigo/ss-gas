'use client'
'use no memo'

import {
  type ComponentProps,
  type ComponentType,
  createContext,
  type CSSProperties,
  type ReactNode,
  use,
  useId,
  useMemo,
} from 'react'
import * as RechartsPrimitive from 'recharts'

import { cn } from '.'

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { dark: '.dark', light: '' } as const

export type ChartConfig = Record<
  string,
  (
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
    | { color?: string; theme?: never }
  ) & {
    icon?: ComponentType
    label?: ReactNode
  }
>

export interface ChartLegendContentProps {
  className?: string
  hideIcon?: boolean
  nameKey?: string
  payload?: RechartsPrimitive.LegendPayload[]
  verticalAlign?: RechartsPrimitive.LegendProps['verticalAlign']
}

export type CustomTooltipProps = RechartsPrimitive.TooltipContentProps<
  RechartsPrimitive.TooltipValueType,
  NameType
> & {
  className?: string
  color?: string
  formatter?: Formatter
  hideIndicator?: boolean
  hideLabel?: boolean
  indicator?: 'dashed' | 'dot' | 'line'
  labelClassName?: string
  labelFormatter?: (
    label: RechartsPrimitive.TooltipContentProps<number, string>['label'],
    payload: RechartsPrimitive.TooltipContentProps<number, string>['payload']
  ) => ReactNode
  labelKey?: string
  nameKey?: string
}

export type Formatter<
  TValue extends RechartsPrimitive.TooltipValueType = RechartsPrimitive.TooltipValueType,
  TName extends NameType = NameType,
> = (
  value: TValue | undefined,
  name: TName | undefined,
  item: RechartsPrimitive.TooltipPayloadEntry<TValue, TName>,
  index: number,
  payload: readonly RechartsPrimitive.TooltipPayloadEntry<TValue, TName>[]
) => [React.ReactNode, TName] | React.ReactNode

export type NameType = number | string

export type TooltipType = 'none'

interface ChartContextProps {
  config: ChartConfig
}

const ChartContext = createContext<ChartContextProps | null>(null)

function ChartContainer({
  children,
  className,
  config,
  id,
  ...props
}: ComponentProps<'div'> & {
  children: ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>['children']
  config: ChartConfig
}) {
  const uniqueId = useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, '')}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        className={cn(
          "flex w-full aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-hidden",
          className
        )}
        data-chart={chartId}
        data-slot="chart"
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer minWidth={0} minHeight={0}>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

function useChart() {
  const context = use(ChartContext)

  if (!context) {
    throw new Error('useChart must be used within a <ChartContainer />')
  }

  return context
}

const ChartStyle = ({ config, id }: { config: ChartConfig; id: string }) => {
  const colorConfig = Object.entries(config).filter(([, config]) => config.theme || config.color)

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
            ${prefix} [data-chart=${id}] {
            ${colorConfig
              .map(([key, itemConfig]) => {
                const color =
                  itemConfig.theme?.[theme as keyof typeof itemConfig.theme] || itemConfig.color
                return color ? `  --color-${key}: ${color};` : null
              })
              .join('\n')}
            }
            `
          )
          .join('\n'),
      }}
    />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

function ChartTooltipContent({
  active,
  className,
  color,
  formatter,
  hideIndicator = false,
  hideLabel = false,
  indicator = 'dot',
  label,
  labelClassName,
  labelFormatter,
  labelKey,
  nameKey,
  payload,
}: CustomTooltipProps) {
  const { config } = useChart()

  const tooltipLabel = useMemo(() => {
    if (hideLabel || !payload?.length) {
      return null
    }

    const [item] = payload
    const key = `${labelKey || item?.dataKey || item?.name || 'value'}`
    const itemConfig = getPayload(config, item, key)
    const value = (() => {
      const v =
        !labelKey && typeof label === 'string'
          ? (config[label as keyof typeof config]?.label ?? label)
          : itemConfig?.label

      return typeof v === 'string' || typeof v === 'number' ? v : undefined
    })()

    if (labelFormatter) {
      return (
        <div className={cn('font-medium', labelClassName)}>{labelFormatter(value, payload)}</div>
      )
    }

    if (!value) {
      return null
    }

    return <div className={cn('font-medium', labelClassName)}>{value}</div>
  }, [label, labelFormatter, payload, hideLabel, labelClassName, config, labelKey])

  if (!active || !payload?.length) {
    return null
  }

  const nestLabel = payload.length === 1 && indicator !== 'dot'

  return (
    <div
      className={cn(
        'grid min-w-32 items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl',
        className
      )}
    >
      {!nestLabel ? tooltipLabel : null}
      <div className="grid gap-1.5">
        {payload.map((item, index) => {
          const key = `${nameKey || item.name || item.dataKey || 'value'}`
          const itemConfig = getPayload(config, item, key)
          const indicatorColor = color || item.payload.fill || item.color

          return (
            <div
              key={key}
              className={cn(
                'flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground',
                indicator === 'dot' && 'items-center'
              )}
            >
              {formatter && item?.value !== undefined && item.name ? (
                formatter(item.value, item.name, item, index, item.payload)
              ) : (
                <>
                  {itemConfig?.icon ? (
                    <itemConfig.icon />
                  ) : (
                    !hideIndicator && (
                      <div
                        className={cn('shrink-0 rounded-[2px] border-border bg-(--color-bg)', {
                          'h-2.5 w-2.5': indicator === 'dot',
                          'my-0.5': nestLabel && indicator === 'dashed',
                          'w-0 border-[1.5px] border-dashed bg-transparent': indicator === 'dashed',
                          'w-1': indicator === 'line',
                        })}
                        style={
                          {
                            '--color-bg': indicatorColor,
                            '--color-border': indicatorColor,
                          } as CSSProperties
                        }
                      />
                    )
                  )}
                  <div
                    className={cn(
                      'flex flex-1 justify-between leading-none',
                      nestLabel ? 'items-end' : 'items-center'
                    )}
                  >
                    <div className="grid gap-1.5">
                      {nestLabel ? tooltipLabel : null}
                      <span className="text-muted-foreground">
                        {itemConfig?.label || item.name}
                      </span>
                    </div>
                    {item.value && (
                      <span className="font-mono font-medium text-foreground tabular-nums">
                        {item.value.toLocaleString()}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const ChartLegend = RechartsPrimitive.Legend

function ChartLegendContent({
  className,
  hideIcon = false,
  nameKey,
  payload,
  verticalAlign = 'bottom',
}: ChartLegendContentProps) {
  const { config } = useChart()

  if (!payload?.length) {
    return null
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-4',
        verticalAlign === 'top' ? 'pb-3' : 'pt-3',
        className
      )}
    >
      {payload.map((item) => {
        const key = `${nameKey || item.dataKey || 'value'}`
        const itemConfig = getPayload(config, item, key)

        return (
          <div
            key={item.value}
            className={cn(
              'flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground'
            )}
          >
            {itemConfig?.icon && !hideIcon ? (
              <itemConfig.icon />
            ) : (
              <div
                className="h-2 w-2 shrink-0 rounded-[2px]"
                style={{
                  backgroundColor: item.color,
                }}
              />
            )}
            {itemConfig?.label}
          </div>
        )
      })}
    </div>
  )
}

function getPayload(config: ChartConfig, payload: unknown, key: string) {
  if (typeof payload !== 'object' || payload === null) {
    return undefined
  }

  const payloadPayload =
    'payload' in payload && typeof payload.payload === 'object' && payload.payload !== null
      ? payload.payload
      : undefined

  let configLabelKey: string = key

  if (key in payload && typeof payload[key as keyof typeof payload] === 'string') {
    configLabelKey = payload[key as keyof typeof payload] as string
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === 'string'
  ) {
    configLabelKey = payloadPayload[key as keyof typeof payloadPayload] as string
  }

  return configLabelKey in config ? config[configLabelKey] : config[key as keyof typeof config]
}

export {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
}
