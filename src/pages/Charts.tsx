import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Stack,
  SimpleGrid,
  Select,
  Group,
  Text,
  Button,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconCalendar, IconChevronLeft, IconChevronRight, IconClock } from '@tabler/icons-react';
import { PowerSystemChart } from '../components/charts/PowerSystemChart';
import { TemperatureChart } from '../components/charts/TemperatureChart';
import { WindSpeedChart } from '../components/charts/WindSpeedChart';
import { WindDirectionChart } from '../components/charts/WindDirectionChart';
import { SolarEfficiencyChart } from '../components/charts/SolarEfficiencyChart';
import { fetchSensorData } from '../lib/api';
import { formatDateOnly } from '../lib/dateUtils';
import type { SensorResponse } from '../types/api';

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

        // Helper to format date as Pacific time string in ISO format
        const formatAsPacificTime = (date: Date): string => {
          // Convert to Pacific time using toLocaleString
          const pacificStr = date.toLocaleString('en-US', {
            timeZone: 'America/Los_Angeles',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          });

          // Parse the result and format as "YYYY-MM-DDTHH:MM:SS" (ISO format)
          // toLocaleString returns "MM/DD/YYYY, HH:MM:SS"
          const [datePart, timePart] = pacificStr.split(', ');
          const [month, day, year] = datePart.split('/');
          return `${year}-${month}-${day}T${timePart}`;
        };

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
              // Create date at midnight Pacific time
              const year = selectedDate.getFullYear();
              const month = selectedDate.getMonth();
              const day = selectedDate.getDate();

              // Create a date string and parse it as if it's Pacific time
              start = new Date(`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00`);
              stop = new Date(`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T23:59:59`);
            } else {
              start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            }
            break;
        }

        const startParam = formatAsPacificTime(start);
        const stopParam = formatAsPacificTime(stop);

        const result = await fetchSensorData(startParam, stopParam, 1000);
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

  const validData = useMemo(() => {
    if (!data?.data || data.data.length === 0) {
      return [];
    }

    const filtered = data.data.filter(d => {
      if (!d.date) return false;
      const date = new Date(d.date);
      return !isNaN(date.getTime());
    });

    // Sort data in ascending chronological order (oldest to newest)
    return filtered.sort((a, b) => {
      return new Date(a.date!).getTime() - new Date(b.date!).getTime();
    });
  }, [data]);

  return (
    <Stack gap="xl" pos="relative">
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
        <PowerSystemChart data={validData} loading={loading} />
        <WindSpeedChart data={validData} loading={loading} />
        <WindDirectionChart data={validData} loading={loading} />
        <TemperatureChart data={validData} loading={loading} />
        <SolarEfficiencyChart data={validData} loading={loading} />
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
