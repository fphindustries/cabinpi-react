import { Card, Title, Stack, Text, LoadingOverlay } from '@mantine/core';
import { LineChartECharts } from '../LineChartECharts';
import { formatChartDate } from '../../lib/dateUtils';
import type { SensorData } from '../../types/api';

interface WindSpeedChartProps {
  data: SensorData[];
  loading?: boolean;
}

export function WindSpeedChart({ data, loading = false }: WindSpeedChartProps) {
  const chartData = data.map(d => ({
    date: formatChartDate(d.date!),
    avgSpeed: d.windAvg || null,
    gust: d.windGust || null,
  }));

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder pos="relative">
      <LoadingOverlay visible={loading} zIndex={10} overlayProps={{ radius: "sm", blur: 1 }} />
      <Title order={3} mb="md">Wind Speed</Title>
      <div style={{ height: 300 }}>
        {chartData.length > 0 ? (
          <LineChartECharts
            height={300}
            data={chartData}
            dataKey="date"
            series={[
              { name: 'avgSpeed', label: 'Wind Speed', color: '#22b8cf' },
              { name: 'gust', label: 'Wind Gust', color: '#cc5de8' },
            ]}
            yAxisLabel="mph"
            yAxisDomain={[0, 'auto']}
          />
        ) : (
          <Stack align="center" justify="center" h={300}>
            <Text c="dimmed">No data available for selected time range</Text>
          </Stack>
        )}
      </div>
    </Card>
  );
}
