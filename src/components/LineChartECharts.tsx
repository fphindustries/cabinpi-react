import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface LineChartEChartsProps {
  data: any[];
  dataKey: string;
  series: Array<{
    name: string;
    label: string;
    color: string;
    yAxisId?: string;
  }>;
  height?: number;
  yAxisLabel?: string;
  rightYAxisLabel?: string;
  yAxisDomain?: [number | string, number | string];
  rightYAxisDomain?: [number | string, number | string];
  options?: Partial<EChartsOption>;
}

export function LineChartECharts({
  data,
  dataKey,
  series,
  height = 400,
  yAxisLabel,
  rightYAxisLabel,
  yAxisDomain,
  rightYAxisDomain,
  options: customOptions,
}: LineChartEChartsProps) {
  const defaultOption: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
      },
    },
    legend: {
      data: series.map(s => s.label),
      top: 0,
    },
    grid: {
      left: '3%',
      right: rightYAxisLabel ? '7%' : '3%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.map(item => item[dataKey]),
      axisLabel: {
        rotate: 45,
        fontSize: 10,
      },
    },
    yAxis: [
      {
        type: 'value',
        name: yAxisLabel,
        nameLocation: 'middle',
        nameGap: 50,
        nameTextStyle: {
          fontSize: 12,
        },
        min: yAxisDomain ? yAxisDomain[0] : undefined,
        max: yAxisDomain ? yAxisDomain[1] : undefined,
      },
      ...(rightYAxisLabel
        ? [
            {
              type: 'value' as const,
              name: rightYAxisLabel,
              nameLocation: 'middle' as const,
              nameGap: 50,
              nameTextStyle: {
                fontSize: 12,
              },
              min: rightYAxisDomain ? rightYAxisDomain[0] : undefined,
              max: rightYAxisDomain ? rightYAxisDomain[1] : undefined,
            },
          ]
        : []),
    ],
    series: series.map(s => ({
      name: s.label,
      type: 'line',
      smooth: true,
      yAxisIndex: s.yAxisId === 'right' ? 1 : 0,
      data: data.map(item => item[s.name]),
      itemStyle: {
        color: s.color,
      },
      lineStyle: {
        color: s.color,
        width: 2,
      },
      showSymbol: false,
      connectNulls: true,
    })),
  };

  // Deep merge custom options with default options
  const option: EChartsOption = customOptions
    ? {
        ...defaultOption,
        ...customOptions,
        series: customOptions.series && Array.isArray(customOptions.series)
          ? (defaultOption.series as Array<Record<string, unknown>>).map((defaultSeries, index) => ({
              ...defaultSeries,
              ...((customOptions.series as Array<Record<string, unknown>>)?.[index] || {}),
            }))
          : defaultOption.series,
      }
    : defaultOption;

  return (
    <ReactECharts
      option={option}
      style={{ height: `${height}px`, width: '100%' }}
      opts={{ renderer: 'canvas' }}
    />
  );
}
