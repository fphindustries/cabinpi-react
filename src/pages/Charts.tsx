import { Link } from 'react-router-dom'
import { Container, Title, Stack, Button, Card, SimpleGrid, LoadingOverlay, SegmentedControl, Group, Collapse, Text } from '@mantine/core'
import { DatePickerInput, type DatesRangeValue } from '@mantine/dates'
import { ResponsiveLine } from '@nivo/line'
import { useState, useMemo } from 'react'
import { IconArrowLeft, IconCalendar, IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import { fromZonedTime } from 'date-fns-tz'
import { useSensorData } from '../services/api'
import '@mantine/dates/styles.css'

type TimeRangeType = '1h' | '6h' | '24h' | '7d' | 'day' | 'range'

const PACIFIC_TZ = 'America/Los_Angeles'

function Charts() {
  const [timeRange, setTimeRange] = useState<TimeRangeType>('24h')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [dateRange, setDateRange] = useState<DatesRangeValue>([null, null])

  const goToPreviousDay = () => {
    if (selectedDate) {
      const prevDay = new Date(selectedDate)
      prevDay.setDate(prevDay.getDate() - 1)
      setSelectedDate(prevDay)
    }
  }

  const goToNextDay = () => {
    if (selectedDate) {
      const nextDay = new Date(selectedDate)
      nextDay.setDate(nextDay.getDate() + 1)
      // Don't allow navigating to future dates
      if (nextDay <= new Date()) {
        setSelectedDate(nextDay)
      }
    }
  }

  const { start, stop } = useMemo(() => {
    const now = new Date()
    let start = new Date()
    let stop = now

    switch (timeRange) {
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
        if (selectedDate) {
          // Create start of day in Pacific timezone
          const year = selectedDate.getFullYear()
          const month = selectedDate.getMonth()
          const day = selectedDate.getDate()

          // Create midnight Pacific time and convert to UTC
          start = fromZonedTime(new Date(year, month, day, 0, 0, 0, 0), PACIFIC_TZ)
          // Create end of day Pacific time and convert to UTC
          stop = fromZonedTime(new Date(year, month, day, 23, 59, 59, 999), PACIFIC_TZ)
        } else {
          // Default to last 24 hours if no date selected
          start = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        }
        break
      case 'range':
        if (dateRange[0] && dateRange[1]) {
          // Create start of first day in Pacific timezone
          const startYear = dateRange[0].getFullYear()
          const startMonth = dateRange[0].getMonth()
          const startDay = dateRange[0].getDate()
          start = fromZonedTime(new Date(startYear, startMonth, startDay, 0, 0, 0, 0), PACIFIC_TZ)

          // Create end of last day in Pacific timezone
          const stopYear = dateRange[1].getFullYear()
          const stopMonth = dateRange[1].getMonth()
          const stopDay = dateRange[1].getDate()
          stop = fromZonedTime(new Date(stopYear, stopMonth, stopDay, 23, 59, 59, 999), PACIFIC_TZ)
        } else {
          // Default to last 24 hours if no range selected
          start = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        }
        break
    }

    return { start: start.toISOString(), stop: stop.toISOString() }
  }, [timeRange, selectedDate, dateRange])

  const { data, isLoading } = useSensorData({ limit: 1000, start, stop })

  const getAxisFormat = useMemo(() => {
    switch (timeRange) {
      case '1h':
      case '6h':
        return '%H:%M'
      case '24h':
        return '%H:%M'
      case '7d':
      case 'range':
        return '%m/%d'
      case 'day':
        return '%H:%M'
      default:
        return '%H:%M'
    }
  }, [timeRange])

  const chartData = useMemo(() => {
    if (!data?.data || data.data.length === 0) {
      return { powerSystem: [], temperature: [], wind: [], inverterOnRanges: [] }
    }

    // Filter out any invalid dates and ensure proper format
    const validData = data.data.filter(d => {
      if (!d.date) return false
      const date = new Date(d.date)
      if(date==null) return false
      return !isNaN(date.getTime())
    })

    if (validData.length === 0) {
      return { powerSystem: [], temperature: [], wind: [], inverterOnRanges: [] }
    }

    // Track inverter on/off ranges for background shading
    const inverterOnRanges: Array<{ start: Date; end: Date }> = []
    let rangeStart: Date | null = null

    validData.forEach((d, index) => {
      const isOn = d.inverterOn === true
      const date = new Date(d.date!)

      if (isOn && rangeStart === null) {
        rangeStart = date
      } else if (!isOn && rangeStart !== null) {
        inverterOnRanges.push({ start: rangeStart, end: date })
        rangeStart = null
      }

      // Close the last range if we're at the end and inverter is still on
      if (index === validData.length - 1 && rangeStart !== null) {
        inverterOnRanges.push({ start: rangeStart, end: date })
      }
    })

    const powerSystem = [
      {
        id: 'Battery Voltage (V)',
        data: validData
          .filter(d => d.dispavgVbatt && d.dispavgVbatt !== 0)
          .map(d => ({
            x: new Date(d.date!),
            y: d.dispavgVbatt!,
          })),
      },
      {
        id: 'Inverter AC Current (A)',
        data: validData
          .filter(d => d.inverterAacOut && d.inverterAacOut !== 0)
          .map(d => ({
            x: new Date(d.date!),
            y: d.inverterAacOut!,
          })),
      },
      {
        id: 'Solar Power (W)',
        data: validData.map(d => ({
          x: new Date(d.date!),
          y: d.watts || 0,
        })),
      },
    ]

    const temperature = [
      {
        id: 'Inside Temperature',
        data: validData.map(d => ({
          x: new Date(d.date!),
          y: d.intF || 0,
        })),
      },
      {
        id: 'Outside Temperature',
        data: validData.map(d => ({
          x: new Date(d.date!),
          y: d.extF || 0,
        })),
      },
    ]

    const wind = [
      {
        id: 'Wind Speed',
        data: validData.map(d => ({
          x: new Date(d.date!),
          y: d.windAvg || 0,
        })),
      },
      {
        id: 'Wind Gust',
        data: validData.map(d => ({
          x: new Date(d.date!),
          y: d.windGust || 0,
        })),
      },
    ]

    return {
      powerSystem,
      temperature,
      wind,
      inverterOnRanges,
    }
  }, [data])

  return (
    <Container fluid px="xl" py="xl" maw={1920}>
      <Stack gap="xl">
        <Group justify="space-between">
          <Title order={1}>Historical Data</Title>
          <Button
            component={Link}
            to="/"
            leftSection={<IconArrowLeft size={16} />}
            variant="light"
          >
            Back to Dashboard
          </Button>
        </Group>

        <Stack gap="md">
          <SegmentedControl
            value={timeRange}
            onChange={(value) => setTimeRange(value as TimeRangeType)}
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
                onChange={setSelectedDate}
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
              onChange={setDateRange}
              maxDate={new Date()}
              clearable
            />
          </Collapse>
        </Stack>

        <div style={{ position: 'relative' }}>
          <LoadingOverlay visible={isLoading} />

          <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
            <Card shadow="sm" padding="lg" radius="md" withBorder style={{ gridColumn: '1 / -1' }}>
              <Title order={3} mb="md">Power System Overview</Title>
              <div style={{ height: 400 }}>
                {chartData.powerSystem[0]?.data.length > 0 ? (
                  (() => {
                    // Calculate separate scales for all three metrics
                    const batteryData = chartData.powerSystem[0].data.map(d => d.y)
                    const currentData = chartData.powerSystem[1].data.map(d => d.y)
                    const powerData = chartData.powerSystem[2].data.map(d => d.y)

                    const batteryMin = batteryData.length > 0 ? Math.min(...batteryData) : 0
                    const batteryMax = batteryData.length > 0 ? Math.max(...batteryData) : 1
                    const currentMin = currentData.length > 0 ? Math.min(...currentData) : 0
                    const currentMax = currentData.length > 0 ? Math.max(...currentData) : 1
                    const powerMin = Math.min(...powerData)
                    const powerMax = Math.max(...powerData)

                    // Use current as the base scale (left axis), or battery if no current data
                    const hasCurrentData = currentData.length > 0
                    const baseMin = hasCurrentData ? currentMin : batteryMin
                    const baseMax = hasCurrentData ? currentMax : batteryMax
                    const baseRange = baseMax - baseMin || 1

                    // Normalize battery voltage and solar power to fit on the base scale
                    const batteryRange = batteryMax - batteryMin || 1
                    const powerRange = powerMax - powerMin || 1

                    const normalizedPowerSystem = [
                      {
                        ...chartData.powerSystem[0],
                        data: hasCurrentData
                          ? chartData.powerSystem[0].data.map(d => ({
                              ...d,
                              y: baseMin + ((d.y - batteryMin) / batteryRange) * baseRange,
                              originalY: d.y,
                              originalUnit: 'V'
                            }))
                          : chartData.powerSystem[0].data // Keep battery as-is if it's the base scale
                      },
                      chartData.powerSystem[1].data.length > 0
                        ? chartData.powerSystem[1] // Keep current as-is (base scale)
                        : { ...chartData.powerSystem[1], data: [] }, // Empty array if no current data
                      {
                        ...chartData.powerSystem[2],
                        data: chartData.powerSystem[2].data.map(d => ({
                          ...d,
                          y: baseMin + ((d.y - powerMin) / powerRange) * baseRange,
                          originalY: d.y,
                          originalUnit: 'W'
                        }))
                      }
                    ]

                    return (
                      <ResponsiveLine
                        data={normalizedPowerSystem}
                        margin={{ top: 40, right: 90, bottom: 50, left: 90 }}
                        xScale={{ type: 'time', format: 'native', useUTC: false }}
                        xFormat="time:%Y-%m-%d %H:%M"
                        yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
                        axisBottom={{
                          format: getAxisFormat,
                          tickRotation: -45,
                        }}
                        axisLeft={{
                          legend: hasCurrentData ? 'Current (A)' : 'Voltage (V)',
                          legendOffset: -70,
                          legendPosition: 'middle',
                        }}
                        axisRight={{
                          legend: 'Power (W)',
                          legendOffset: 70,
                          legendPosition: 'middle',
                          tickValues: 5,
                          format: (value) => {
                            // Convert normalized value back to watts
                            const watts = powerMin + ((value - baseMin) / baseRange) * (powerMax - powerMin)
                            return Math.round(watts).toString()
                          }
                        }}
                        enableSlices="x"
                        colors={{ scheme: 'category10' }}
                        pointSize={4}
                        pointBorderWidth={2}
                        pointBorderColor={{ from: 'serieColor' }}
                        useMesh={true}
                        curve="monotoneX"
                        tooltip={({ point }) => {
                          const data = point.data as { originalY?: number; originalUnit?: string }
                          const originalY = data.originalY
                          const unit = data.originalUnit

                          let displayValue: string
                          if (originalY !== undefined && unit) {
                            displayValue = `${originalY.toFixed(2)} ${unit}`
                          } else {
                            displayValue = `${Number(point.data.yFormatted).toFixed(2)} A`
                          }

                          return (
                            <div style={{
                              background: 'white',
                              padding: '9px 12px',
                              border: '1px solid #ccc',
                              borderRadius: '4px'
                            }}>
                              <strong>{point.seriesId}</strong>
                              <br />
                              {displayValue}
                            </div>
                          )
                        }}
                        layers={[
                          ({ xScale, innerHeight }) => {
                            // Background shading for when inverter is on
                            // Use a light version of the Inverter AC Current color (category10 scheme, second color is orange)
                            const inverterColor = 'rgba(255, 127, 14, 0.15)' // Light orange

                            if (!chartData.inverterOnRanges || chartData.inverterOnRanges.length === 0) {
                              return null
                            }

                            return (
                              <g key="inverter-background">
                                {chartData.inverterOnRanges.map((range, i) => {
                                  const x1 = xScale(range.start)
                                  const x2 = xScale(range.end)
                                  const width = Math.abs(x2 - x1)

                                  if (width <= 0 || !isFinite(width)) {
                                    return null
                                  }

                                  return (
                                    <rect
                                      key={i}
                                      x={Math.min(x1, x2)}
                                      y={0}
                                      width={width}
                                      height={innerHeight}
                                      fill={inverterColor}
                                      opacity={0.5}
                                    />
                                  )
                                })}
                              </g>
                            )
                          },
                          'grid',
                          'markers',
                          'axes',
                          'areas',
                          'crosshair',
                          'lines',
                          'points',
                          'slices',
                          'mesh',
                          'legends',
                          ({ innerHeight }) => (
                            <g key="battery-axis">
                              <text
                                x={-innerHeight / 2}
                                y={-70}
                                transform="rotate(-90)"
                                textAnchor="middle"
                                style={{
                                  fontSize: 12,
                                  fill: '#333',
                                  fontWeight: 500
                                }}
                              >
                                Voltage (V)
                              </text>
                              {/* Draw tick marks for battery voltage */}
                              {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
                                const voltage = batteryMin + t * (batteryMax - batteryMin)
                                const yPos = innerHeight - (t * innerHeight)
                                return (
                                  <text
                                    key={i}
                                    x={-50}
                                    y={yPos + 4}
                                    textAnchor="end"
                                    style={{
                                      fontSize: 10,
                                      fill: '#666'
                                    }}
                                  >
                                    {voltage.toFixed(1)}
                                  </text>
                                )
                              })}
                            </g>
                          )
                        ]}
                        legends={[
                          {
                            anchor: 'top',
                            direction: 'row',
                            justify: false,
                            translateX: 0,
                            translateY: -30,
                            itemsSpacing: 20,
                            itemDirection: 'left-to-right',
                            itemWidth: 160,
                            itemHeight: 20,
                            symbolSize: 12,
                            symbolShape: 'circle',
                          },
                        ]}
                      />
                    )
                  })()
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
                {chartData.temperature[0]?.data.length > 0 ? (
                  <ResponsiveLine
                    data={chartData.temperature}
                    margin={{ top: 40, right: 20, bottom: 50, left: 60 }}
                    xScale={{ type: 'time', format: 'native', useUTC: false }}
                    xFormat="time:%Y-%m-%d %H:%M"
                    yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
                    axisBottom={{
                      format: getAxisFormat,
                      tickRotation: -45,
                    }}
                    axisLeft={{
                      legend: '°F',
                      legendOffset: -50,
                      legendPosition: 'middle',
                    }}
                    colors={{ scheme: 'red_yellow_blue' }}
                    pointSize={4}
                    pointBorderWidth={2}
                    pointBorderColor={{ from: 'serieColor' }}
                    useMesh={true}
                    curve="monotoneX"
                    legends={[
                      {
                        anchor: 'top',
                        direction: 'row',
                        justify: false,
                        translateX: 0,
                        translateY: -30,
                        itemsSpacing: 20,
                        itemDirection: 'left-to-right',
                        itemWidth: 140,
                        itemHeight: 20,
                        symbolSize: 12,
                        symbolShape: 'circle',
                      },
                    ]}
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
                {chartData.wind[0]?.data.length > 0 ? (
                  <ResponsiveLine
                    data={chartData.wind}
                    margin={{ top: 20, right: 110, bottom: 50, left: 60 }}
                    xScale={{ type: 'time', format: 'native', useUTC: false }}
                    xFormat="time:%Y-%m-%d %H:%M"
                    yScale={{ type: 'linear', min: 0, max: 'auto' }}
                    axisBottom={{
                      format: getAxisFormat,
                      tickRotation: -45,
                    }}
                    axisLeft={{
                      legend: 'mph',
                      legendOffset: -50,
                      legendPosition: 'middle',
                    }}
                    colors={{ scheme: 'paired' }}
                    pointSize={4}
                    pointBorderWidth={2}
                    pointBorderColor={{ from: 'serieColor' }}
                    useMesh={true}
                    curve="monotoneX"
                    legends={[
                      {
                        anchor: 'bottom-right',
                        direction: 'column',
                        justify: false,
                        translateX: 100,
                        translateY: 0,
                        itemsSpacing: 0,
                        itemDirection: 'left-to-right',
                        itemWidth: 80,
                        itemHeight: 20,
                        symbolSize: 12,
                        symbolShape: 'circle',
                      },
                    ]}
                  />
                ) : (
                  <Stack align="center" justify="center" h={300}>
                    <Text c="dimmed">No data available for selected time range</Text>
                  </Stack>
                )}
              </div>
            </Card>
          </SimpleGrid>
        </div>
      </Stack>
    </Container>
  )
}

export default Charts
