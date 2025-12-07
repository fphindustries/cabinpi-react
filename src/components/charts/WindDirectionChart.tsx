import { Card, Title, Stack, Text, LoadingOverlay } from '@mantine/core';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { SensorData } from '../../types/api';

interface WindDirectionChartProps {
  data: SensorData[];
  loading?: boolean;
}

export function WindDirectionChart({ data, loading = false }: WindDirectionChartProps) {
  // Filter out data points without wind direction
  const windData = data.filter(d => d.windDirection !== null && d.windDirection !== undefined);

  // Prepare data for polar chart
  // Group by direction (in 22.5 degree increments for 16 compass points)
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const directionData: { direction: string; avgSpeed: number; maxGust: number; count: number }[] = directions.map((dir) => ({
    direction: dir,
    avgSpeed: 0,
    maxGust: 0,
    count: 0,
  }));

  // Calculate average wind speed and max gust for each direction
  windData.forEach(d => {
    if (d.windDirection === null || d.windDirection === undefined) return;

    // Convert degrees to direction index (0-15)
    // Each direction covers 22.5 degrees
    const dirIndex = Math.round(d.windDirection / 22.5) % 16;

    directionData[dirIndex].count++;
    directionData[dirIndex].avgSpeed += d.windAvg || 0;
    if ((d.windGust || 0) > directionData[dirIndex].maxGust) {
      directionData[dirIndex].maxGust = d.windGust || 0;
    }
  });

  // Calculate averages
  directionData.forEach(d => {
    if (d.count > 0) {
      d.avgSpeed = d.avgSpeed / d.count;
    }
  });

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        if (!Array.isArray(params) || params.length === 0) return '';

        const direction = params[0].name;
        const avgSpeed = params[0]?.value?.toFixed(1) || '0.0';
        const maxGust = params[1]?.value?.toFixed(1) || '0.0';

        return `${direction}<br/>Avg Speed: ${avgSpeed} mph<br/>Max Gust: ${maxGust} mph`;
      },
    },
    legend: {
      data: ['Average Wind Speed', 'Max Gust'],
      top: 0,
    },
    polar: {
      radius: ['10%', '75%'],
    },
    angleAxis: {
      type: 'category',
      data: directions,
      startAngle: 78.75, // Start at North (top)
      clockwise: false, // Go counter-clockwise to match compass
      axisLabel: {
        fontSize: 11,
      },
    },
    radiusAxis: {
      name: 'Speed (mph)',
      nameGap: 5,
      nameTextStyle: {
        fontSize: 11,
      },
    },
    series: [
      {
        name: 'Average Wind Speed',
        type: 'bar',
        data: directionData.map(d => d.avgSpeed),
        coordinateSystem: 'polar',
        itemStyle: {
          color: '#339af0',
        },
        label: {
          show: false,
        },
      },
      {
        name: 'Max Gust',
        type: 'bar',
        data: directionData.map(d => d.maxGust),
        coordinateSystem: 'polar',
        itemStyle: {
          color: '#fd7e14',
        },
        label: {
          show: false,
        },
      },
    ],
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder pos="relative">
      <LoadingOverlay visible={loading} zIndex={10} overlayProps={{ radius: "sm", blur: 1 }} />
      <Title order={3} mb="md">Wind Direction & Intensity</Title>
      <div style={{ height: 300 }}>
        {windData.length > 0 ? (
          <ReactECharts
            option={option}
            style={{ height: '300px', width: '100%' }}
            opts={{ renderer: 'canvas' }}
          />
        ) : (
          <Stack align="center" justify="center" h={300}>
            <Text c="dimmed">No wind direction data available</Text>
          </Stack>
        )}
      </div>
    </Card>
  );
}
