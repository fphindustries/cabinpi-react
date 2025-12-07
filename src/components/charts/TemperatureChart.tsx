import { Card, Title, Stack, Text, LoadingOverlay } from '@mantine/core';
import { LineChartECharts } from '../LineChartECharts';
import { formatChartDate } from '../../lib/dateUtils';
import type { SensorData } from '../../types/api';

interface TemperatureChartProps {
  data: SensorData[];
  loading?: boolean;
}

export function TemperatureChart({ data, loading = false }: TemperatureChartProps) {
  const chartData = data.map(d => ({
    date: formatChartDate(d.date!),
    inside: d.intF || null,
    outside: d.extF || null,
  }));

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder pos="relative">
      <LoadingOverlay visible={loading} zIndex={10} overlayProps={{ radius: "sm", blur: 1 }} />
      <Title order={3} mb="md">Temperature</Title>
      <div style={{ height: 300 }}>
        {chartData.length > 0 ? (
          <LineChartECharts
            height={300}
            data={chartData}
            dataKey="date"
            series={[
              { name: 'inside', label: 'Inside Temperature', color: '#fa5252' },
              { name: 'outside', label: 'Outside Temperature', color: '#339af0' },
            ]}
            yAxisLabel="°F"
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
