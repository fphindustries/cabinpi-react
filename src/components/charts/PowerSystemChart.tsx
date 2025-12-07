import { Card, Title, Stack, Text, LoadingOverlay } from '@mantine/core';
import { LineChartECharts } from '../LineChartECharts';
import { formatChartDate } from '../../lib/dateUtils';
import type { SensorData } from '../../types/api';

interface PowerSystemChartProps {
  data: SensorData[];
  loading?: boolean;
}

export function PowerSystemChart({ data, loading = false }: PowerSystemChartProps) {
  const chartData = data.map(d => ({
    date: formatChartDate(d.date!),
    batteryVoltage: d.dispavgVbatt || null,
    inverterCurrent: d.inverterAacOut || null,
    solarPower: d.watts || null,
  }));

  // Build markArea data for when inverter is on
  const markAreaData: Array<[{ xAxis: string }, { xAxis: string }]> = [];
  let inverterOnStart: string | null = null;

  data.forEach((d, index) => {
    const formattedDate = formatChartDate(d.date!);

    if (d.inverterOn && !inverterOnStart) {
      // Inverter just turned on
      inverterOnStart = formattedDate;
    } else if (!d.inverterOn && inverterOnStart) {
      // Inverter just turned off, add the period
      markAreaData.push([
        { xAxis: inverterOnStart },
        { xAxis: chartData[index - 1]?.date || inverterOnStart }
      ]);
      inverterOnStart = null;
    }
  });

  // If inverter is still on at the end, close the period
  if (inverterOnStart && chartData.length > 0) {
    markAreaData.push([
      { xAxis: inverterOnStart },
      { xAxis: chartData[chartData.length - 1].date }
    ]);
  }

  const customOptions = {
    series: [
      {
        markArea: {
          silent: true,
          itemStyle: {
            color: 'rgba(253, 126, 20, 0.15)', // Light orange with transparency
          },
          data: markAreaData,
        },
      },
      {},
      {},
    ],
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder style={{ gridColumn: '1 / -1' }} pos="relative">
      <LoadingOverlay visible={loading} zIndex={10} overlayProps={{ radius: "sm", blur: 1 }} />
      <Title order={3} mb="md">Power System Overview</Title>
      <div style={{ height: 400 }}>
        {chartData.length > 0 ? (
          <LineChartECharts
            height={400}
            data={chartData}
            dataKey="date"
            series={[
              { name: 'batteryVoltage', label: 'Battery Voltage (V)', color: '#339af0' },
              { name: 'inverterCurrent', label: 'Inverter AC Current (A)', color: '#fd7e14', yAxisId: 'right' },
              { name: 'solarPower', label: 'Solar Power (W)', color: '#51cf66', yAxisId: 'right' },
            ]}
            yAxisDomain={[10, 16]}
            rightYAxisLabel="A / W"
            yAxisLabel="Voltage (V)"
            options={customOptions}
          />
        ) : (
          <Stack align="center" justify="center" h={400}>
            <Text c="dimmed">No data available for selected time range</Text>
          </Stack>
        )}
      </div>
    </Card>
  );
}
