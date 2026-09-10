import { useMemo } from 'react';
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
import { useApi } from '../hooks/useApi';
import { dateParam, timeRangeParam, sensorRange, pacificToday, shiftDay } from '../lib/dateUtils';
import type { SensorResponse } from '../types/api';


export default function Charts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const timeRange = timeRangeParam(searchParams.get('range'));
  const selectedDateStr = dateParam(searchParams.get('date'));
  const selectedDate = selectedDateStr;
  const path = useMemo(() => {
    const [start, stop] = sensorRange(timeRange, selectedDateStr);
    return '/api/sensors?' + new URLSearchParams({ start, stop, limit: '10000' });
  }, [timeRange, selectedDateStr]);
  const { data, loading, error } = useApi<SensorResponse>(path);

  const handleTimeRangeChange = (value: string | null) => {
    if (!value) return;
    const newRange = timeRangeParam(value);

    if (newRange !== 'day') {
      setSearchParams({ range: newRange });
    } else {
      const dateStr = selectedDate ?? pacificToday();
      setSearchParams({ range: newRange, date: dateStr });
    }
  };

  const handleDateChange = (value: string | null) => {
    setSearchParams(value ? { range: 'day', date: value } : { range: '24h' });
  };
  const goToPreviousDay = () => selectedDate && handleDateChange(shiftDay(selectedDate, -1));
  const goToNextDay = () => selectedDate && selectedDate < pacificToday() && handleDateChange(shiftDay(selectedDate, 1));

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
      return a.date!.localeCompare(b.date!);
    });
  }, [data]);

  return (
    <Stack gap="xl" pos="relative">
      {data?.truncated && <Text c="orange">Showing the newest 10,000 readings. Choose a shorter range for all readings.</Text>}
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
              maxDate={pacificToday()}
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
              disabled={selectedDate >= pacificToday()}
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
