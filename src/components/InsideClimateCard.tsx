import { Card, Title, Group, Text, Stack, Progress } from '@mantine/core'
import { IconHome, IconDroplet } from '@tabler/icons-react'
import type { SensorData } from '../types/api'

interface InsideClimateCardProps {
  data?: SensorData
}

export function InsideClimateCard({ data }: InsideClimateCardProps) {
  const getHumidityColor = (humidity?: number) => {
    if (!humidity) return 'gray'
    if (humidity < 30) return 'orange'
    if (humidity > 60) return 'blue'
    return 'green'
  }

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <Group gap="xs">
          <IconHome size={24} />
          <Title order={3}>Inside Climate</Title>
        </Group>

        <Group grow>
          <Stack gap="xs">
            <Text size="sm" c="dimmed">Temperature</Text>
            <Group gap="xs" align="baseline">
              <Text size="xl" fw={700}>{data?.intF?.toFixed(1) || '—'}</Text>
              <Text size="sm" c="dimmed">°F</Text>
            </Group>
          </Stack>

          <Stack gap="xs">
            <Text size="sm" c="dimmed">Humidity</Text>
            <Group gap="xs" align="baseline">
              <IconDroplet size={20} />
              <Text size="xl" fw={700}>{data?.humidity?.toFixed(0) || '—'}</Text>
              <Text size="sm" c="dimmed">%</Text>
            </Group>
          </Stack>
        </Group>

        {data?.humidity !== undefined && (
          <Stack gap="xs">
            <Text size="xs" c="dimmed">Humidity Level</Text>
            <Progress
              value={data.humidity}
              color={getHumidityColor(data.humidity)}
              size="lg"
              radius="md"
            />
          </Stack>
        )}



        {data?.inHg !== undefined && (
          <Stack gap="xs">
            <Text size="sm" c="dimmed">Barometric Pressure</Text>
            <Group gap="xs" align="baseline">
              <Text size="lg" fw={600}>{data.inHg.toFixed(2)}</Text>
              <Text size="sm" c="dimmed">inHg</Text>
            </Group>
          </Stack>
        )}
      </Stack>
    </Card>
  )
}