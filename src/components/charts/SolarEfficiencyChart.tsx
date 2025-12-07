import { Card, Title, Stack, Text, LoadingOverlay } from '@mantine/core';
import { LineChartECharts } from '../LineChartECharts';
import { formatChartDate } from '../../lib/dateUtils';
import type { SensorData } from '../../types/api';

interface SolarEfficiencyChartProps {
  data: SensorData[];
  loading?: boolean;
}

export function SolarEfficiencyChart({ data, loading = false }: SolarEfficiencyChartProps) {
  const chartData = data.map(d => ({
    date: formatChartDate(d.date!),
    solarRadiation: d.solarRadiation || null,
    pvWatts: d.watts || null,
    illuminance: d.illuminance || null,
  }));

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder pos="relative">
      <LoadingOverlay visible={loading} zIndex={10} overlayProps={{ radius: "sm", blur: 1 }} />
      <Title order={3} mb="md">Solar Efficiency</Title>
      <div style={{ height: 300 }}>
        {chartData.length > 0 ? (
          <LineChartECharts
            height={300}
            data={chartData}
            dataKey="date"
            series={[
              { name: 'solarRadiation', label: 'Solar Radiation', color: '#fa5252' },
              { name: 'pvWatts', label: 'PV Watts', color: '#51cf66' },
              { name: 'illuminance', label: 'Illuminance (lux)', color: '#339af0', yAxisId: 'right' },
            ]}
            yAxisLabel="Watts"
            yAxisDomain={[0, 'auto']}
            rightYAxisLabel="lux"
            rightYAxisDomain={[0, 'auto']}
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
