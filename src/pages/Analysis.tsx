import { useMemo } from 'react';
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
import { EChart } from '../components/EChart';
import type { EChartsOption } from 'echarts';
import { useApi } from '../hooks/useApi';
import { formatChartDate, dailyRange, dateParam, timeRangeParam, sensorRange, pacificToday, shiftDay } from '../lib/dateUtils';
import type { SensorResponse, SensorData } from '../types/api';


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
  { value: 'basementF', label: 'Basement Temperature (°F)', color: '#f06595' },
  { value: 'dcBusVoltage', label: 'DC Bus Voltage (V)', color: '#12b886' },
  { value: 'dcCurrent', label: 'DC Current (A)', color: '#20c997' },
  { value: 'dcPower', label: 'DC Power (W)', color: '#38d9a9' },
] satisfies { value: keyof Omit<SensorData, 'date' | 'inverterOn'>; label: string; color: string }[];

export default function Analysis() {
  const [searchParams, setSearchParams] = useSearchParams();
  const timeRange = timeRangeParam(searchParams.get('range'));
  const selectedDateStr = dateParam(searchParams.get('date'));
  const selectedDate = selectedDateStr;
  const mode = searchParams.get('mode') === 'daily' ? 'daily' : 'timeRange';
  const startDateStr = dateParam(searchParams.get('startDate'));
  const endDateStr = dateParam(searchParams.get('endDate'));
  const startDate = startDateStr;
  const endDate = endDateStr;
  const readFields = (param: string, fallback: string[]) => searchParams.has(param)
    ? searchParams.get(param)!.split(',').filter(value => dataFields.some(field => field.value === value)) : fallback;
  const selectedFields = readFields('left', ['dispavgVbatt']);
  const rightAxisFields = readFields('right', ['watts']);
  const showTable = searchParams.get('table') === '1';
  const setParam = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set(name, value);
    setSearchParams(params);
  };
  const path = useMemo(() => {
    const [start, stop] = mode === 'daily' ? dailyRange(startDateStr, endDateStr) : sensorRange(timeRange, selectedDateStr);
    return '/api/sensors' + (mode === 'daily' ? '/daily?' : '?') + new URLSearchParams({ start, stop, limit: '10000' });
  }, [mode, timeRange, selectedDateStr, startDateStr, endDateStr]);
  const { data, loading, error } = useApi<SensorResponse>(path);

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
      if (value !== 'day') params.delete('date');
      else if (!selectedDate) params.set('date', pacificToday());
      setSearchParams(params);
    }
  };

  const setDateParam = (name: string, value: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(name, value); else params.delete(name);
    setSearchParams(params);
  };
  const handleDateChange = (value: string | null) => setDateParam('date', value);
  const handleStartDateChange = (value: string | null) => setDateParam('startDate', value);
  const handleEndDateChange = (value: string | null) => setDateParam('endDate', value);
  const goToPreviousDay = () => selectedDate && handleDateChange(shiftDay(selectedDate, -1));
  const goToNextDay = () => selectedDate && selectedDate < pacificToday() && handleDateChange(shiftDay(selectedDate, 1));

  // Prepare chart data
  const validData = useMemo(() => {
    if (!data?.data) return [];
    return data.data.filter(d => d.date).sort((a, b) => {
      return a.date!.localeCompare(b.date!);
    });
  }, [data]);

  const chartData = useMemo(() => validData.map(row => ({
    ...row, date: formatChartDate(row.date!),
  })), [validData]);

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
          smooth: false,
          yAxisIndex: hasRightAxis && isRightAxis ? 1 : 0,
          data: chartData.map(item => item[field.value] ?? null),
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
      {data?.truncated && <Text c="orange">Showing the newest 10,000 readings. Choose a shorter range for all readings.</Text>}
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
            { value: 'daily', label: 'Daily Maximums' },
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
          </>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <DatePickerInput
              leftSection={<IconCalendar size={16} />}
              label="Start Date"
              placeholder="Pick start date"
              value={startDate}
              onChange={handleStartDateChange}
              maxDate={endDate || pacificToday()}
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
              maxDate={pacificToday()}
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
          onChange={values => setParam('left', values.join(','))}
          searchable
          clearable
        />

        <MultiSelect
          label="Right Y-Axis Data Fields (Optional)"
          placeholder="Choose fields for right axis"
          description="Fields on the right axis will use a separate scale"
          data={dataFields.map(f => ({ value: f.value, label: f.label }))}
          value={rightAxisFields}
          onChange={values => setParam('right', values.join(','))}
          searchable
          clearable
        />

        <Checkbox
          label="Show data table"
          checked={showTable}
          onChange={(event) => setParam('table', event.currentTarget.checked ? '1' : '0')}
        />
      </Stack>

      <Card shadow="sm" padding="lg" radius="md" withBorder pos="relative">
        <LoadingOverlay visible={loading} zIndex={10} overlayProps={{ radius: "sm", blur: 1 }} />
        <Title order={3} mb="md">Custom Chart</Title>
        <div style={{ height: 500 }}>
          {chartData.length > 0 && (selectedFields.length > 0 || rightAxisFields.length > 0) ? (
            <EChart
              option={chartOption}
              height={500}
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
                          {row[field.value]?.toFixed(2) ?? '-'}
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
