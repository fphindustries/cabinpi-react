import { Card, Title, Group, Text, Stack, Badge } from '@mantine/core'
import { IconCloud, IconWind, IconDroplet, IconUmbrella, IconBolt, IconSun, IconThermometer, IconCompass } from '@tabler/icons-react'
import type { SensorData } from '../types/api'

interface WeatherCardProps {
  data?: SensorData
  loading?: boolean
}

export function WeatherCard({ data }: WeatherCardProps) {
  const getWindDirection = (degrees?: number) => {
    if (degrees === undefined) return '—'
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
    const index = Math.round(degrees / 22.5) % 16
    return directions[index]
  }

  const getUVLevel = (uv?: number) => {
    if (!uv) return { level: 'Low', color: 'green' }
    if (uv < 3) return { level: 'Low', color: 'green' }
    if (uv < 6) return { level: 'Moderate', color: 'yellow' }
    if (uv < 8) return { level: 'High', color: 'orange' }
    if (uv < 11) return { level: 'Very High', color: 'red' }
    return { level: 'Extreme', color: 'grape' }
  }

  const uvLevel = getUVLevel(data?.uv)

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <Group gap="xs">
          <IconCloud size={24} />
          <Title order={3}>Weather</Title>
        </Group>
        <Group grow>
          <Stack gap="xs">
            <Group gap="xs">
              <IconThermometer size={16} />
              <Text size="sm" c="dimmed">Temperature</Text>
            </Group>
            <Group gap="xs" align="baseline">
              <Text size="lg" fw={600}>{data?.extF?.toFixed(0) || '—'}</Text>
              <Text size="sm" c="dimmed">°F</Text>
            </Group>
          </Stack>          
          <Stack gap="xs">
            <Group gap="xs">
              <IconDroplet size={16} />
              <Text size="sm" c="dimmed">Humidity</Text>
            </Group>
            <Group gap="xs" align="baseline">
              <Text size="lg" fw={600}>{data?.extHumidity?.toFixed(0) || '—'}</Text>
              <Text size="sm" c="dimmed">%</Text>
            </Group>
          </Stack>
        </Group>

        <Group grow>
          <Stack gap="xs">
            <Group gap="xs">
              <IconUmbrella size={16} />
              <Text size="sm" c="dimmed">Rain</Text>
            </Group>
            <Group gap="xs" align="baseline">
              <Text size="lg" fw={600}>{data?.rain?.toFixed(2) || '0.00'}</Text>
              <Text size="sm" c="dimmed">in</Text>
            </Group>
          </Stack>
          <Stack gap="xs">
            <Group gap="xs">
              <IconUmbrella size={16} />
              <Text size="sm" c="dimmed">Rain Total</Text>
            </Group>
            <Group gap="xs" align="baseline">
              <Text size="lg" fw={600}>{data?.dailyAccumulation?.toFixed(2) || '0.00'}</Text>
              <Text size="sm" c="dimmed">in</Text>
            </Group>
          </Stack>                      
        </Group>

        <Group grow>
          <Stack gap="xs">
            <Group gap="xs">
              <IconWind size={16} />
              <Text size="sm" c="dimmed">Wind Speed</Text>
            </Group>
            <Group gap="xs" align="baseline">
              <Text size="xl" fw={700}>{data?.windAvg?.toFixed(1) || '—'} ({data?.windGust?.toFixed(1) || '—'})</Text>
              <Text size="sm" c="dimmed">mph</Text>
            </Group>
          </Stack>

          <Stack gap="xs">
            <Group gap="xs">
              <IconCompass size={16} />
              <Text size="sm" c="dimmed">Direction</Text>
            </Group>
            <Group gap="xs" align="baseline">
              <Text size="xl" fw={700}>{getWindDirection(data?.windDirection)}</Text>
              <Text size="sm" c="dimmed">{data?.windDirection?.toFixed(0)}°</Text>
            </Group>
          </Stack>
        </Group>



        <Group grow>
          <Stack gap="xs">
            <Group gap="xs">
              <IconSun size={16} />
              <Text size="sm" c="dimmed">Solar Radiation</Text>
            </Group>
            <Group gap="xs" align="baseline">
              <Text size="lg" fw={600}>{data?.solarRadiation?.toFixed(0) || '—'}</Text>
              <Text size="sm" c="dimmed">W/m²</Text>
            </Group>
          </Stack>

          <Stack gap="xs">
            <Text size="sm" c="dimmed">UV Index</Text>
            <Group gap="xs" align="baseline">
              <Text size="lg" fw={600}>{data?.uv?.toFixed(1) || '—'}</Text>
              {data?.uv !== undefined && (
                <Badge size="sm" color={uvLevel.color}>{uvLevel.level}</Badge>
              )}
            </Group>
          </Stack>
        </Group>
        <Group grow>
        {data?.vocLastMeasured !== undefined && (
          <Stack gap="xs">
            <Text size="sm" c="dimmed">VOC (Air Quality)</Text>
            <Group gap="xs" align="baseline">
              <Text size="lg" fw={600}>{data.vocLastMeasured.toFixed(1)}</Text>
              <Text size="sm" c="dimmed">ppb</Text>
            </Group>
          </Stack>
        )}
        {data?.illuminance !== undefined && (
          <Stack gap="xs">
            <Group gap="xs">
              <IconSun size={16} />
              <Text size="sm" c="dimmed">Illuminance</Text>
            </Group>
            <Group gap="xs" align="baseline">
              <Text size="lg" fw={600}>{data.illuminance.toLocaleString()}</Text>
              <Text size="sm" c="dimmed">lux</Text>
            </Group>
          </Stack>
        )}                  
        </Group>

        {data?.strikeCount !== undefined && data.strikeCount > 0 && (
          <Group gap="xs">
            <IconBolt size={16} color="orange" />
            <Text size="sm" c="orange">
              Lightning strikes: {data.strikeCount} (avg. {data?.avgStrikeDistance?.toFixed(1)} mi)
            </Text>
          </Group>
        )}
      </Stack>
    </Card>
  )
}