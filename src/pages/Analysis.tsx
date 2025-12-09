import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Stack,
  SimpleGrid,
  Select,
  Group,
  Text,
  Button,
  MultiSelect,
  Card,
  Title,
  Checkbox,
  Table,
  ScrollArea,
  LoadingOverlay,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconCalendar, IconChevronLeft, IconChevronRight, IconClock } from '@tabler/icons-react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { fetchSensorData, fetchDailySensorData } from '../lib/api';
import { formatDateOnly } from '../lib/dateUtils';
import type { SensorResponse } from '../types/api';

type TimeRangeType = '1h' | '6h' | '24h' | '7d' | 'day';
type ModeType = 'timeRange' | 'daily';

// Available data fields for selection
const dataFields = [
  { value: 'dispavgVbatt', label: 'Battery Voltage (V)', color: '#339af0' },
  { value: 'inverterAacOut', label: 'Inverter AC Current (A)', color: '#fd7e14' },
  { value: 'inverterVacOut', label: 'Inverter AC Voltage (V)', color: '#f08c00' },
  { value: 'watts', label: 'Solar Power (W)', color: '#51cf66' },
  { value: 'pvInputCurrent', label: 'PV Input Current (A)', color: '#94d82d' },
  { value: 'dispavgVpv', label: 'PV Voltage (V)', color: '#a9e34b' },
  { value: 'intF', label: 'Inside Temperature (°F)', color: '#ff6b6b' },
  { value: 'extF', label: 'Outside Temperature (°F)', color: '#4dabf7' },
  { value: 'humidity', label: 'Inside Humidity (%)', color: '#748ffc' },
  { value: 'extHumidity', label: 'Outside Humidity (%)', color: '#5c7cfa' },
  { value: 'windAvg', label: 'Wind Speed (mph)', color: '#22b8cf' },
  { value: 'windGust', label: 'Wind Gust (mph)', color: '#15aabf' },
  { value: 'windDirection', label: 'Wind Direction (°)', color: '#1098ad' },
  { value: 'solarRadiation', label: 'Solar Radiation (W/m²)', color: '#ffd43b' },
  { value: 'illuminance', label: 'Illuminance (lux)', color: '#ffe066' },
  { value: 'uv', label: 'UV Index', color: '#ff8787' },
  { value: 'inHg', label: 'Barometric Pressure (inHg)', color: '#e599f7' },
  { value: 'rain', label: 'Rain Rate (in/hr)', color: '#228be6' },
  { value: 'dailyAccumulation', label: 'Daily Rain (in)', color: '#1971c2' },
  { value: 'ampHours', label: 'Amp Hours (Ah)', color: '#845ef7' },
  { value: 'kwhours', label: 'Kilowatt Hours (kWh)', color: '#7950f2' },
];

export default function Analysis() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<SensorResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFields, setSelectedFields] = useState<string[]>(['dispavgVbatt', 'watts']);
  const [rightAxisFields, setRightAxisFields] = useState<string[]>(['watts']);
  const [showTable, setShowTable] = useState(false);

  const mode = (searchParams.get('mode') as ModeType) || 'timeRange';
  const timeRange = (searchParams.get('range') as TimeRangeType) || '24h';
  const selectedDateStr = searchParams.get('date');
  const startDateStr = searchParams.get('startDate');
  const endDateStr = searchParams.get('endDate');

  // Parse YYYY-MM-DD string into a Date object without timezone conversion
  const selectedDate = selectedDateStr ? (() => {
    const [year, month, day] = selectedDateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  })() : null;

  const startDate = startDateStr ? (() => {
    const [year, month, day] = startDateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  })() : null;

  const endDate = endDateStr ? (() => {
    const [year, month, day] = endDateStr.split('-').map(Number);
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

        if (mode === 'daily') {
          // Daily mode: use start and end dates
          if (startDate && endDate) {
            start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 0, 0, 0);
            stop = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59);
          } else {
            // Default to last 30 days
            start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          }
        } else {
          // Time Range mode
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
                start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 0, 0, 0);
                stop = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 23, 59, 59);
              } else {
                start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
              }
              break;
          }
        }

        const startParam = formatAsPacificTime(start);
        const stopParam = formatAsPacificTime(stop);

        // Use daily endpoint for SQL aggregation, otherwise use regular endpoint
        const result = mode === 'daily'
          ? await fetchDailySensorData(startParam, stopParam)
          : await fetchSensorData(startParam, stopParam, 1000);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [mode, timeRange, selectedDateStr, startDateStr, endDateStr]);

  const handleModeChange = (value: string | null) => {
    if (value) {
      const params = new URLSearchParams(searchParams);
      params.set('mode', value);
      // Clear mode-specific params when switching
      if (value === 'daily') {
        params.delete('range');
        params.delete('date');
      } else {
        params.delete('startDate');
        params.delete('endDate');
      }
      setSearchParams(params);
    }
  };

  const handleTimeRangeChange = (value: string | null) => {
    if (value) {
      const params = new URLSearchParams(searchParams);
      params.set('range', value);
      if (value !== 'day') {
        params.delete('date');
      }
      setSearchParams(params);
    }
  };

  const handleDateChange = (value: Date | string | null) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      let date: Date;
      if (typeof value === 'string') {
        // Parse string as YYYY-MM-DD in local timezone
        const [year, month, day] = value.split('-').map(Number);
        date = new Date(year, month - 1, day);
      } else {
        date = value;
      }
      params.set('date', formatDateOnly(date));
    } else {
      params.delete('date');
    }
    setSearchParams(params);
  };

  const goToPreviousDay = () => {
    if (selectedDate) {
      const prevDay = new Date(selectedDate);
      prevDay.setDate(prevDay.getDate() - 1);
      handleDateChange(prevDay);
    }
  };

  const goToNextDay = () => {
    if (selectedDate) {
      const nextDay = new Date(selectedDate);
      nextDay.setDate(nextDay.getDate() + 1);
      handleDateChange(nextDay);
    }
  };

  const handleStartDateChange = (value: Date | string | null) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      let date: Date;
      if (typeof value === 'string') {
        const [year, month, day] = value.split('-').map(Number);
        date = new Date(year, month - 1, day);
      } else {
        date = value;
      }
      params.set('startDate', formatDateOnly(date));
    } else {
      params.delete('startDate');
    }
    setSearchParams(params);
  };

  const handleEndDateChange = (value: Date | string | null) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      let date: Date;
      if (typeof value === 'string') {
        const [year, month, day] = value.split('-').map(Number);
        date = new Date(year, month - 1, day);
      } else {
        date = value;
      }
      params.set('endDate', formatDateOnly(date));
    } else {
      params.delete('endDate');
    }
    setSearchParams(params);
  };

  // Prepare chart data
  const validData = useMemo(() => {
    if (!data?.data) return [];
    return data.data.filter(d => d.date).sort((a, b) => {
      return new Date(a.date!).getTime() - new Date(b.date!).getTime();
    });
  }, [data]);

  const chartData = useMemo(() => {
    if (mode === 'daily') {
      // Daily mode: data is already aggregated by SQL, just format the date
      return validData.map(d => {
        const date = new Date(d.date!);
        return {
          date: `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`,
          ...d,
        };
      });
    } else {
      // Time Range mode: return raw data with formatted timestamps
      return validData.map(d => {
        const date = new Date(d.date!);
        return {
          date: date.toLocaleString('en-US', {
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/Los_Angeles'
          }),
          ...d,
        };
      });
    }
  }, [validData, mode]);

  // Build chart options
  const chartOption: EChartsOption = useMemo(() => {
    // Combine left and right axis fields
    const allFields = [...new Set([...selectedFields, ...rightAxisFields])];
    const selectedFieldConfigs = dataFields.filter(f => allFields.includes(f.value));
    const hasRightAxis = rightAxisFields.length > 0;

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: mode === 'daily' ? 'shadow' : 'cross',
        },
      },
      legend: {
        data: selectedFieldConfigs.map(f => f.label),
        top: 0,
      },
      grid: {
        left: '3%',
        right: hasRightAxis ? '8%' : '3%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: mode === 'daily' ? true : false,
        data: chartData.map(item => item.date),
        axisLabel: {
          rotate: 45,
          fontSize: 10,
        },
      },
      yAxis: hasRightAxis ? [
        {
          type: 'value',
          name: 'Left Axis',
          position: 'left',
        },
        {
          type: 'value',
          name: 'Right Axis',
          position: 'right',
        },
      ] : {
        type: 'value',
      },
      series: selectedFieldConfigs.map(field => {
        const isRightAxis = rightAxisFields.includes(field.value);
        return {
          name: field.label,
          type: mode === 'daily' ? 'bar' : 'line',
          smooth: mode === 'daily' ? undefined : true,
          yAxisIndex: hasRightAxis && isRightAxis ? 1 : 0,
          data: chartData.map(item => (item as any)[field.value] || null),
          itemStyle: {
            color: field.color,
          },
          lineStyle: mode === 'daily' ? undefined : {
            color: field.color,
            width: 2,
          },
          showSymbol: mode === 'daily' ? undefined : false,
          connectNulls: mode === 'daily' ? undefined : false,
        };
      }),
    };
  }, [chartData, selectedFields, rightAxisFields, mode]);

  return (
    <Stack gap="xl" pos="relative">
      {error && (
        <Text c="red" ta="center" py="xl">{error}</Text>
      )}

      <Stack gap="md">
        <Title order={2}>Data Analysis</Title>

        <Select
          label="Mode"
          placeholder="Select mode"
          data={[
            { value: 'timeRange', label: 'Time Range' },
            { value: 'daily', label: 'Daily Aggregation' },
          ]}
          value={mode}
          onChange={handleModeChange}
          allowDeselect={false}
        />

        {mode === 'timeRange' ? (
          <>
            <SimpleGrid cols={{ base: 1, sm: timeRange === 'day' ? 2 : 1 }} spacing="md">
              <Select
                leftSection={<IconClock size={16} />}
                label="Time Range"
                placeholder="Select time range"
                data={[
                  { value: '1h', label: 'Last Hour' },
                  { value: '6h', label: 'Last 6 Hours' },
                  { value: '24h', label: 'Last 24 Hours' },
                  { value: '7d', label: 'Last 7 Days' },
                  { value: 'day', label: 'Specific Day' },
                ]}
                value={timeRange}
                onChange={handleTimeRangeChange}
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
          </>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <DatePickerInput
              leftSection={<IconCalendar size={16} />}
              label="Start Date"
              placeholder="Pick start date"
              value={startDate}
              onChange={handleStartDateChange}
              maxDate={endDate || new Date()}
              clearable
              valueFormat="YYYY-MM-DD"
            />
            <DatePickerInput
              leftSection={<IconCalendar size={16} />}
              label="End Date"
              placeholder="Pick end date"
              value={endDate}
              onChange={handleEndDateChange}
              minDate={startDate || undefined}
              maxDate={new Date()}
              clearable
              valueFormat="YYYY-MM-DD"
            />
          </SimpleGrid>
        )}

        <MultiSelect
          label="Left Y-Axis Data Fields"
          placeholder="Choose fields for left axis"
          data={dataFields.map(f => ({ value: f.value, label: f.label }))}
          value={selectedFields}
          onChange={setSelectedFields}
          searchable
          clearable
        />

        <MultiSelect
          label="Right Y-Axis Data Fields (Optional)"
          placeholder="Choose fields for right axis"
          description="Fields on the right axis will use a separate scale"
          data={dataFields.map(f => ({ value: f.value, label: f.label }))}
          value={rightAxisFields}
          onChange={setRightAxisFields}
          searchable
          clearable
        />

        <Checkbox
          label="Show data table"
          checked={showTable}
          onChange={(event) => setShowTable(event.currentTarget.checked)}
        />
      </Stack>

      <Card shadow="sm" padding="lg" radius="md" withBorder pos="relative">
        <LoadingOverlay visible={loading} zIndex={10} overlayProps={{ radius: "sm", blur: 1 }} />
        <Title order={3} mb="md">Custom Chart</Title>
        <div style={{ height: 500 }}>
          {chartData.length > 0 && (selectedFields.length > 0 || rightAxisFields.length > 0) ? (
            <ReactECharts
              option={chartOption}
              style={{ height: '500px', width: '100%' }}
              opts={{ renderer: 'canvas' }}
              notMerge={true}
            />
          ) : (
            <Stack align="center" justify="center" h={500}>
              <Text c="dimmed">
                {selectedFields.length === 0 && rightAxisFields.length === 0
                  ? 'Please select at least one data field to visualize'
                  : 'No data available for selected time range'}
              </Text>
            </Stack>
          )}
        </div>
      </Card>

      {showTable && chartData.length > 0 && (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Title order={3} mb="md">Data Table ({chartData.length} records)</Title>
          <ScrollArea>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Date/Time</Table.Th>
                  {dataFields
                    .filter(f => selectedFields.includes(f.value) || rightAxisFields.includes(f.value))
                    .map(field => (
                      <Table.Th key={field.value}>{field.label}</Table.Th>
                    ))}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {chartData.map((row, index) => (
                  <Table.Tr key={index}>
                    <Table.Td>{row.date}</Table.Td>
                    {dataFields
                      .filter(f => selectedFields.includes(f.value) || rightAxisFields.includes(f.value))
                      .map(field => (
                        <Table.Td key={field.value}>
                          {(row as any)[field.value]?.toFixed(2) ?? '-'}
                        </Table.Td>
                      ))}
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Card>
      )}
    </Stack>
  );
}
