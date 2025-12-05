import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Title,
  Stack,
  Card,
  SimpleGrid,
  Select,
  Group,
  Text,
  Button,
  LoadingOverlay,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { LineChart } from '@mantine/charts';
import { IconCalendar, IconChevronLeft, IconChevronRight, IconClock } from '@tabler/icons-react';
import { fromZonedTime } from 'date-fns-tz';
import { fetchSensorData } from '../lib/api';
import type { SensorResponse } from '../types/api';

const PACIFIC_TZ = 'America/Los_Angeles';

type TimeRangeType = '1h' | '6h' | '24h' | '7d' | 'day';

export default function Charts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<SensorResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const timeRange = (searchParams.get('range') as TimeRangeType) || '24h';
  const selectedDateStr = searchParams.get('date');

  // Parse YYYY-MM-DD string into a Date object without timezone conversion
  const selectedDate = selectedDateStr ? (() => {
    const [year, month, day] = selectedDateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  })() : null;

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const now = new Date();
        let start = new Date();
        let stop = now;

        switch (timeRange) {
          case '1h':
            start = new Date(now.getTime() - 60 * 60 * 1000);
            break;
          case '6h':
            start = new Date(now.getTime() - 6 * 60 * 60 * 1000);
            break;
          case '24h':
            start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case '7d':
            start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'day':
            if (selectedDate) {
              const year = selectedDate.getFullYear();
              const month = selectedDate.getMonth();
              const day = selectedDate.getDate();
              start = fromZonedTime(new Date(year, month, day, 0, 0, 0, 0), PACIFIC_TZ);
              stop = fromZonedTime(new Date(year, month, day, 23, 59, 59, 999), PACIFIC_TZ);
            } else {
              start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            }
            break;
        }

        const result = await fetchSensorData(start.toISOString(), stop.toISOString(), 1000);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [timeRange, selectedDateStr]);

  const formatDateOnly = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleTimeRangeChange = (value: string | null) => {
    if (!value) return;
    const newRange = value as TimeRangeType;

    if (newRange !== 'day') {
      setSearchParams({ range: newRange });
    } else {
      const dateStr = selectedDate ? formatDateOnly(selectedDate) : formatDateOnly(new Date());
      setSearchParams({ range: newRange, date: dateStr });
    }
  };

  const handleDateChange = (value: Date | string | null) => {
    if (value) {
      let date: Date;
      if (typeof value === 'string') {
        // Parse string as YYYY-MM-DD in local timezone
        const [year, month, day] = value.split('-').map(Number);
        date = new Date(year, month - 1, day);
      } else {
        date = value;
      }
      setSearchParams({ range: 'day', date: formatDateOnly(date) });
    }
  };

  const goToPreviousDay = () => {
    if (selectedDate) {
      const prevDay = new Date(selectedDate);
      prevDay.setDate(prevDay.getDate() - 1);
      setSearchParams({ range: 'day', date: formatDateOnly(prevDay) });
    }
  };

  const goToNextDay = () => {
    if (selectedDate) {
      const nextDay = new Date(selectedDate);
      nextDay.setDate(nextDay.getDate() + 1);
      if (nextDay <= new Date()) {
        setSearchParams({ range: 'day', date: formatDateOnly(nextDay) });
      }
    }
  };

  const chartData = useMemo(() => {
    if (!data?.data || data.data.length === 0) {
      return { powerSystem: [], temperature: [], wind: [], light: [] };
    }

    const validData = data.data.filter(d => {
      if (!d.date) return false;
      const date = new Date(d.date);
      return !isNaN(date.getTime());
    });

    if (validData.length === 0) {
      return { powerSystem: [], temperature: [], wind: [], light: [] };
    }

    // Sort data in ascending chronological order (oldest to newest)
    const sortedData = validData.sort((a, b) => {
      return new Date(a.date!).getTime() - new Date(b.date!).getTime();
    });

    const powerSystem = sortedData.map(d => ({
      date: new Date(d.date!).toLocaleString('en-US', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      batteryVoltage: d.dispavgVbatt || null,
      inverterCurrent: d.inverterAacOut || null,
      solarPower: d.watts || null,
    }));

    const temperature = sortedData.map(d => ({
      date: new Date(d.date!).toLocaleString('en-US', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      inside: d.intF || null,
      outside: d.extF || null,
    }));

    const wind = sortedData.map(d => ({
      date: new Date(d.date!).toLocaleString('en-US', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      avgSpeed: d.windAvg || null,
      gust: d.windGust || null,
    }));

    const light = sortedData.map(d => ({
      date: new Date(d.date!).toLocaleString('en-US', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      solarRadiation: d.solarRadiation || null,
      pvWatts: d.watts || null,
      illuminance: d.illuminance || null,
    }));

    return { powerSystem, temperature, wind, light };
  }, [data]);

  return (
    <Stack gap="xl" pos="relative">
      <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />

      {error && (
        <Text c="red" ta="center" py="xl">{error}</Text>
      )}

      <Stack gap="md">
        <SimpleGrid cols={{ base: 1, sm: timeRange === 'day' ? 2 : 1 }} spacing="md">
          <Select
            leftSection={<IconClock size={16} />}
            label="Time Range"
            value={timeRange}
            onChange={handleTimeRangeChange}
            data={[
              { label: 'Last Hour', value: '1h' },
              { label: 'Last 6 Hours', value: '6h' },
              { label: 'Last 24 Hours', value: '24h' },
              { label: 'Last 7 Days', value: '7d' },
              { label: 'Specific Day', value: 'day' },
            ]}
            allowDeselect={false}
          />

          {timeRange === 'day' && (
            <DatePickerInput
              leftSection={<IconCalendar size={16} />}
              label="Select a specific day"
              placeholder="Pick date"
              value={selectedDate}
              onChange={handleDateChange}
              maxDate={new Date()}
              clearable
              valueFormat="YYYY-MM-DD"
            />
          )}
        </SimpleGrid>

        {selectedDate && timeRange === 'day' && (
          <Group justify="center" gap="md">
            <Button
              onClick={goToPreviousDay}
              leftSection={<IconChevronLeft size={16} />}
              variant="light"
            >
              Previous Day
            </Button>
            <Button
              onClick={goToNextDay}
              rightSection={<IconChevronRight size={16} />}
              variant="light"
              disabled={selectedDate >= new Date(new Date().setHours(0, 0, 0, 0))}
            >
              Next Day
            </Button>
          </Group>
        )}
      </Stack>

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
        <Card shadow="sm" padding="lg" radius="md" withBorder style={{ gridColumn: '1 / -1' }}>
          <Title order={3} mb="md">Power System Overview</Title>
          <div style={{ height: 400 }}>
            {chartData.powerSystem.length > 0 ? (
              <LineChart
                h={400}
                data={chartData.powerSystem}
                dataKey="date"
                series={[
                  { name: 'batteryVoltage', label: 'Battery Voltage (V)', color: 'blue.6', yAxisId: 'left' },
                  { name: 'inverterCurrent', label: 'Inverter AC Current (A)', color: 'orange.6', yAxisId: 'right' },
                  { name: 'solarPower', label: 'Solar Power (W)', color: 'green.6', yAxisId: 'right' },
                ]}
                curveType="monotone"
                withLegend
                legendProps={{ verticalAlign: 'top', height: 50 }}
                withTooltip
                tooltipAnimationDuration={200}
                withDots={false}
                yAxisProps={{ domain: [10, 16] }}
                withRightYAxis
                rightYAxisLabel="A / W"
                yAxisLabel="Voltage (V)"
              />
            ) : (
              <Stack align="center" justify="center" h={400}>
                <Text c="dimmed">No data available for selected time range</Text>
              </Stack>
            )}
          </div>
        </Card>

        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Title order={3} mb="md">Temperature</Title>
          <div style={{ height: 300 }}>
            {chartData.temperature.length > 0 ? (
              <LineChart
                h={300}
                data={chartData.temperature}
                dataKey="date"
                series={[
                  { name: 'inside', label: 'Inside Temperature', color: 'red.6' },
                  { name: 'outside', label: 'Outside Temperature', color: 'blue.6' },
                ]}
                curveType="monotone"
                withLegend
                legendProps={{ verticalAlign: 'top', height: 50 }}
                withTooltip
                tooltipAnimationDuration={200}
                withDots={false}
                yAxisLabel="°F"
              />
            ) : (
              <Stack align="center" justify="center" h={300}>
                <Text c="dimmed">No data available for selected time range</Text>
              </Stack>
            )}
          </div>
        </Card>

        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Title order={3} mb="md">Wind Speed</Title>
          <div style={{ height: 300 }}>
            {chartData.wind.length > 0 ? (
              <LineChart
                h={300}
                data={chartData.wind}
                dataKey="date"
                series={[
                  { name: 'avgSpeed', label: 'Wind Speed', color: 'cyan.6' },
                  { name: 'gust', label: 'Wind Gust', color: 'violet.6' },
                ]}
                curveType="monotone"
                withLegend
                legendProps={{ verticalAlign: 'bottom', height: 50 }}
                withTooltip
                tooltipAnimationDuration={200}
                withDots={false}
                yAxisLabel="mph"
                yAxisProps={{ domain: [0, 'auto'] }}
              />
            ) : (
              <Stack align="center" justify="center" h={300}>
                <Text c="dimmed">No data available for selected time range</Text>
              </Stack>
            )}
          </div>
        </Card>

        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Title order={3} mb="md">Solar Efficiency</Title>
          <div style={{ height: 300 }}>
            {chartData.light.length > 0 ? (
              <LineChart
                h={300}
                data={chartData.light}
                dataKey="date"
                series={[
                  { name: 'solarRadiation', label: 'Solar Radiation', color: 'red.6', yAxisId: 'left' },
                  { name: 'pvWatts', label: 'PV Watts', color: 'green.6', yAxisId: 'left' },
                  { name: 'illuminance', label: 'Illuminance (lux)', color: 'blue.6', yAxisId: 'right' },
                ]}
                curveType="monotone"
                withLegend
                legendProps={{ verticalAlign: 'bottom', height: 50 }}
                withTooltip
                tooltipAnimationDuration={200}
                withDots={false}
                yAxisLabel="Watts"
                yAxisProps={{ domain: [0, 'auto'] }}
                withRightYAxis
                rightYAxisLabel="lux"
                rightYAxisProps={{ domain: [0, 'auto'] }}
              />
            ) : (
              <Stack align="center" justify="center" h={300}>
                <Text c="dimmed">No data available for selected time range</Text>
              </Stack>
            )}
          </div>
        </Card>
      </SimpleGrid>

      <Group justify="space-between">
        <div>
          <Text size="sm" c="dimmed">
            {data?.data?.length || 0} data points
          </Text>
        </div>
      </Group>
    </Stack>
  );
}
