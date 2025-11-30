import { createFileRoute, useNavigate, useRouterState } from '@tanstack/react-router'
import { Container, Title, Stack, Card, SimpleGrid, Select, Group, Text, Button, LoadingOverlay } from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { LineChart } from '@mantine/charts'
import { IconCalendar, IconChevronLeft, IconChevronRight, IconClock } from '@tabler/icons-react'
import { useState, useMemo } from 'react'
import { fromZonedTime } from 'date-fns-tz'
import { fetchSensorData } from '../lib/api'
import '@mantine/dates/styles.css'
import '@mantine/charts/styles.css'
import { createServerFn } from '@tanstack/react-start'

const PACIFIC_TZ = 'America/Los_Angeles'

type TimeRangeType = '1h' | '6h' | '24h' | '7d' | 'day'
export const fetchSensorDataFn = createServerFn({method: 'GET'})
  .inputValidator((data:{ start: string; stop: string; limit: number }) => data)
  .handler(async ({data}) => {
  return fetchSensorData(data.start, data.stop, data.limit)
})


export const Route = createFileRoute('/charts')({
  component: Charts,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      range: (search.range as TimeRangeType) || '24h',
      date: search.date as string | undefined,
    }
  },
  loaderDeps: ({ search }) => ({ range: search.range, date: search.date }),
  loader: async ({ deps }) => {
    const { range, date: selectedDateStr } = deps
    const now = new Date()
    let start = new Date()
    let stop = now

    switch (range) {
      case '1h':
        start = new Date(now.getTime() - 60 * 60 * 1000)
        break
      case '6h':
        start = new Date(now.getTime() - 6 * 60 * 60 * 1000)
        break
      case '24h':
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'day':
        if (selectedDateStr) {
          const selectedDate = new Date(selectedDateStr)
          const year = selectedDate.getUTCFullYear()
          const month = selectedDate.getUTCMonth()
          const day = selectedDate.getUTCDate()
          start = fromZonedTime(new Date(year, month, day, 0, 0, 0, 0), PACIFIC_TZ)
          stop = fromZonedTime(new Date(year, month, day, 23, 59, 59, 999), PACIFIC_TZ)
        } else {
          start = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        }
        break
    }
    console.log('Fetching data from', start.toISOString(), 'to', stop.toISOString())
    const data = await fetchSensorDataFn({ data: { start: start.toISOString(), stop: stop.toISOString(), limit: 1000 } })
    return { data, range, selectedDateStr }
  }})
  
function Charts() {
  const { data, range: initialRange, selectedDateStr } = Route.useLoaderData()
  const navigate = useNavigate({ from: '/charts' })
  const routerState = useRouterState()
  const isLoading = routerState.isLoading

  const [timeRange, setTimeRange] = useState<TimeRangeType>(initialRange)
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    selectedDateStr ? new Date(selectedDateStr) : null
  )

  const goToPreviousDay = () => {
    if (selectedDate) {
      const prevDay = new Date(selectedDate)
      prevDay.setDate(prevDay.getDate() - 1)
      setSelectedDate(prevDay)
      navigate({ search: { range: 'day', date: prevDay.toISOString() } })
    }
  }

  const goToNextDay = () => {
    if (selectedDate) {
      const nextDay = new Date(selectedDate)
      nextDay.setDate(nextDay.getDate() + 1)
      if (nextDay <= new Date()) {
        setSelectedDate(nextDay)
        navigate({ search: { range: 'day', date: nextDay.toISOString() } })
      }
    }
  }

  const handleTimeRangeChange = (value: string) => {
    const newRange = value as TimeRangeType
    setTimeRange(newRange)

    if (newRange !== 'day') {
      navigate({ search: { range: newRange, date: undefined } })
    }
  }

  const handleDateChange = (value: string | Date | null) => {
    const date = value instanceof Date ? value : (value ? new Date(value) : null)
    setSelectedDate(date)
    if (date) {
      navigate({ search: { range: 'day', date: date.toISOString() } })
    }
  }

  const chartData = useMemo(() => {
    if (!data?.data || data.data.length === 0) {
      return { powerSystem: [], temperature: [], wind: [] }
    }

    const validData = data.data.filter(d => {
      if (!d.date) return false
      const date = new Date(d.date)
      return !isNaN(date.getTime())
    })

    if (validData.length === 0) {
      return { powerSystem: [], temperature: [], wind: [] }
    }

    // Sort data in ascending chronological order (oldest to newest)
    const sortedData = validData.sort((a, b) => {
      return new Date(a.date!).getTime() - new Date(b.date!).getTime()
    })

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
    }))

    const temperature = sortedData.map(d => ({
      date: new Date(d.date!).toLocaleString('en-US', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      inside: d.intF || null,
      outside: d.extF || null,
    }))

    const wind = sortedData.map(d => ({
      date: new Date(d.date!).toLocaleString('en-US', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      avgSpeed: d.windAvg || null,
      gust: d.windGust || null,
    }))

    return { powerSystem, temperature, wind }
  }, [data])

  return (
    <Container fluid px="xl" py="xl" maw={1920}>
      <Stack gap="xl" pos="relative">
        <LoadingOverlay visible={isLoading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />


        <Stack gap="md">
          <SimpleGrid cols={{ base: 1, sm: timeRange === 'day' ? 2 : 1 }} spacing="md">
            <Select
              leftSection={<IconClock size={16} />}
              label="Time Range"
              value={timeRange}
              onChange={(value) => handleTimeRangeChange(value || '24h')}
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
        </SimpleGrid>
        <Group justify="space-between">
          <div>
            <Text size="sm" c="dimmed">
              {data?.data?.length || 0} data points
            </Text>
          </div>
        </Group>

      </Stack>
    </Container>
  )
}
