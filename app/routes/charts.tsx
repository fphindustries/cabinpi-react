import type { Route } from "./+types/charts";
import { Container, Title, Stack, Card, SimpleGrid, SegmentedControl, Group, Collapse, Text, Button } from '@mantine/core';
import { DatePickerInput, type DatesRangeValue } from '@mantine/dates';
import { LineChart } from '@mantine/charts';
import { useState, useMemo } from 'react';
import { IconCalendar, IconChevronLeft, IconChevronRight, IconRefresh } from '@tabler/icons-react';
import { fromZonedTime } from 'date-fns-tz';
import { useRevalidator, useNavigate } from 'react-router';
import type { SensorResponse } from '../types/api';
import '@mantine/dates/styles.css';
import '@mantine/charts/styles.css';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Charts - CabinPi Dashboard" },
    { name: "description", content: "Historical sensor data charts" },
  ];
}

type TimeRangeType = '1h' | '6h' | '24h' | '7d' | 'day' | 'range';

const PACIFIC_TZ = 'America/Los_Angeles';

export async function loader({ context, request }: Route.LoaderArgs) {
  const env = context.cloudflare.env;
  const url = new URL(request.url);

  // Get time range parameters from URL
  const timeRange = (url.searchParams.get('range') || '24h') as TimeRangeType;
  const selectedDateStr = url.searchParams.get('date');
  const rangeStart = url.searchParams.get('rangeStart');
  const rangeEnd = url.searchParams.get('rangeEnd');

  // Calculate start and stop times
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
      if (selectedDateStr) {
        const selectedDate = new Date(selectedDateStr);
        // Use UTC methods to avoid timezone shifting
        const year = selectedDate.getUTCFullYear();
        const month = selectedDate.getUTCMonth();
        const day = selectedDate.getUTCDate();
        start = fromZonedTime(new Date(year, month, day, 0, 0, 0, 0), PACIFIC_TZ);
        stop = fromZonedTime(new Date(year, month, day, 23, 59, 59, 999), PACIFIC_TZ);
      } else {
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }
      break;
    case 'range':
      if (rangeStart && rangeEnd) {
        const startDate = new Date(rangeStart);
        const endDate = new Date(rangeEnd);
        // Use UTC methods to avoid timezone shifting
        const startYear = startDate.getUTCFullYear();
        const startMonth = startDate.getUTCMonth();
        const startDay = startDate.getUTCDate();
        start = fromZonedTime(new Date(startYear, startMonth, startDay, 0, 0, 0, 0), PACIFIC_TZ);

        const stopYear = endDate.getUTCFullYear();
        const stopMonth = endDate.getUTCMonth();
        const stopDay = endDate.getUTCDate();
        stop = fromZonedTime(new Date(stopYear, stopMonth, stopDay, 23, 59, 59, 999), PACIFIC_TZ);
      } else {
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }
      break;
  }

  // Use localhost in development, production API otherwise
  const isDev = import.meta.env.DEV;
  const apiUrl = isDev
    ? `http://localhost:3000/api/sensors?limit=1000&start=${start.toISOString()}&stop=${stop.toISOString()}`
    : `https://api.cabinpi.com/api/sensors?limit=1000&start=${start.toISOString()}&stop=${stop.toISOString()}`;

  try {
    const headers = new Headers();
    // Only add service token headers in production
    if (!isDev && env.CF_ACCESS_CLIENT_ID && env.CF_ACCESS_CLIENT_SECRET) {
      headers.set('CF-Access-Client-Id', env.CF_ACCESS_CLIENT_ID);
      headers.set('CF-Access-Client-Secret', env.CF_ACCESS_CLIENT_SECRET);
    }

    const response = await fetch(apiUrl, { headers });
    if (!response.ok) throw new Error('Failed to fetch sensor data');

    const data: SensorResponse = await response.json();
    return { data, error: null, timeRange, selectedDateStr, rangeStart, rangeEnd };
  } catch (error) {
    return { data: null, error: 'Failed to load sensor data', timeRange, selectedDateStr, rangeStart, rangeEnd };
  }
}

export default function Charts({ loaderData }: Route.ComponentProps) {
  const { data, error, timeRange: initialTimeRange, selectedDateStr, rangeStart, rangeEnd } = loaderData;
  const revalidator = useRevalidator();
  const navigate = useNavigate();

  const [timeRange, setTimeRange] = useState<TimeRangeType>(initialTimeRange || '24h');
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    selectedDateStr ? new Date(selectedDateStr) : null
  );
  const [dateRange, setDateRange] = useState<DatesRangeValue>([
    rangeStart ? new Date(rangeStart) : null,
    rangeEnd ? new Date(rangeEnd) : null
  ]);

  const goToPreviousDay = () => {
    if (selectedDate) {
      const prevDay = new Date(selectedDate);
      prevDay.setDate(prevDay.getDate() - 1);
      setSelectedDate(prevDay);
      navigate(`/charts?range=day&date=${prevDay.toISOString()}`);
    }
  };

  const goToNextDay = () => {
    if (selectedDate) {
      const nextDay = new Date(selectedDate);
      nextDay.setDate(nextDay.getDate() + 1);
      if (nextDay <= new Date()) {
        setSelectedDate(nextDay);
        navigate(`/charts?range=day&date=${nextDay.toISOString()}`);
      }
    }
  };

  const handleTimeRangeChange = (value: string) => {
    const newRange = value as TimeRangeType;
    setTimeRange(newRange);

    // For 'day' and 'range' modes, wait for user to pick a date before navigating
    // For other modes, navigate immediately
    if (newRange !== 'day' && newRange !== 'range') {
      navigate(`/charts?range=${newRange}`);
    }
  };

  const handleDateChange = (dateString: string | null) => {
    const date = dateString ? new Date(dateString) : null;
    setSelectedDate(date);
    if (date) {
      navigate(`/charts?range=day&date=${date.toISOString()}`);
    }
  };

  const handleDateRangeChange = (range: DatesRangeValue) => {
    setDateRange(range);
    if (range[0] && range[1]) {
      const start = range[0] instanceof Date ? range[0] : new Date(range[0]);
      const end = range[1] instanceof Date ? range[1] : new Date(range[1]);
      navigate(`/charts?range=range&rangeStart=${start.toISOString()}&rangeEnd=${end.toISOString()}`);
    }
  };

  const chartData = useMemo(() => {
    if (!data?.data || data.data.length === 0) {
      return { powerSystem: [], temperature: [], wind: [] };
    }

    const validData = data.data.filter(d => {
      if (!d.date) return false;
      const date = new Date(d.date);
      return !isNaN(date.getTime());
    });

    if (validData.length === 0) {
      return { powerSystem: [], temperature: [], wind: [] };
    }

    // Mantine Charts expects data in format: [{ date: ..., series1: ..., series2: ... }]
    const powerSystem = validData.map(d => {
      const timestamp = new Date(d.date!).getTime();
      return {
        timestamp,
        date: new Date(d.date!).toLocaleString('en-US', {
          month: 'numeric',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        batteryVoltage: d.dispavgVbatt || null,
        inverterCurrent: d.inverterAacOut || null,
        solarPower: d.watts || null,
        inverterOn: d.inverterOn || false,
      };
    });

    const temperature = validData.map(d => {
      const timestamp = new Date(d.date!).getTime();
      return {
        timestamp,
        date: new Date(d.date!).toLocaleString('en-US', {
          month: 'numeric',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        inside: d.intF || null,
        outside: d.extF || null,
      };
    });

    const wind = validData.map(d => {
      const timestamp = new Date(d.date!).getTime();
      return {
        timestamp,
        date: new Date(d.date!).toLocaleString('en-US', {
          month: 'numeric',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        avgSpeed: d.windAvg || null,
        gust: d.windGust || null,
      };
    });

    return { powerSystem, temperature, wind };
  }, [data]);

  return (
    <Container fluid px="xl" py="xl" maw={1920}>
      <Stack gap="xl">
        <Group justify="space-between">
          <div>
            <Title order={1}>Charts</Title>
            <Text size="sm" c="dimmed">
              {data?.data?.length || 0} data points
            </Text>
          </div>
          <Button
            leftSection={<IconRefresh size={16} />}
            onClick={() => revalidator.revalidate()}
            loading={revalidator.state === 'loading'}
            variant="light"
          >
            Refresh
          </Button>
        </Group>

        <Stack gap="md">
          <SegmentedControl
            value={timeRange}
            onChange={handleTimeRangeChange}
            data={[
              { label: 'Last Hour', value: '1h' },
              { label: 'Last 6 Hours', value: '6h' },
              { label: 'Last 24 Hours', value: '24h' },
              { label: 'Last 7 Days', value: '7d' },
              { label: 'Specific Day', value: 'day' },
              { label: 'Date Range', value: 'range' },
            ]}
          />

          <Collapse in={timeRange === 'day'}>
            <Stack gap="sm">
              <DatePickerInput
                leftSection={<IconCalendar size={16} />}
                label="Select a specific day"
                placeholder="Pick date"
                value={selectedDate}
                onChange={handleDateChange}
                maxDate={new Date()}
                clearable
              />
              {selectedDate && (
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
          </Collapse>

          <Collapse in={timeRange === 'range'}>
            <DatePickerInput
              type="range"
              leftSection={<IconCalendar size={16} />}
              label="Select date range"
              placeholder="Pick dates range"
              value={dateRange}
              onChange={handleDateRangeChange}
              maxDate={new Date()}
              clearable
            />
          </Collapse>
        </Stack>

        {error && (
          <Text c="red">{error}</Text>
        )}

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
        </SimpleGrid>
      </Stack>
    </Container>
  );
}
