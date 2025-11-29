import { Card, Title, Group, Text, Stack, Badge } from '@mantine/core'
import { IconPlug, IconAlertTriangle } from '@tabler/icons-react'
import type { SensorData } from '../types/api'

interface InverterCardProps {
  data?: SensorData
  loading?: boolean
}

export function InverterCard({ data }: InverterCardProps) {
  const getInverterModeLabel = (mode?: number) => {
    switch (mode) {
      case 0: return 'Search'
      case 1: return 'Inverter'
      case 2: return 'Charger'
      case 3: return 'Power Assist'
      default: return 'Unknown'
    }
  }

  const getFaultLabel = (fault?: number) => {
    if (!fault || fault === 0) return null
    return `Fault Code: ${fault}`
  }

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between">
          <Group gap="xs">
            <IconPlug size={24} />
            <Title order={3}>Inverter</Title>
          </Group>
          <Badge color={data?.inverterOn ? 'green' : 'gray'}>
            {data?.inverterOn ? 'Online' : 'Offline'}
          </Badge>
        </Group>

        <Group grow>
          <Stack gap="xs">
            <Text size="sm" c="dimmed">AC Voltage</Text>
            <Group gap="xs" align="baseline">
              <Text size="xl" fw={700}>{data?.inverterVacOut?.toFixed(1) || '—'}</Text>
              <Text size="sm" c="dimmed">V</Text>
            </Group>
          </Stack>

          <Stack gap="xs">
            <Text size="sm" c="dimmed">AC Current</Text>
            <Group gap="xs" align="baseline">
              <Text size="xl" fw={700}>{data?.inverterAacOut?.toFixed(1) || '—'}</Text>
              <Text size="sm" c="dimmed">A</Text>
            </Group>
          </Stack>

          <Stack gap="xs">
            <Text size="sm" c="dimmed">Power Output</Text>
            <Group gap="xs" align="baseline">
              <Text size="xl" fw={700}>
                {data?.inverterVacOut && data?.inverterAacOut
                  ? (data.inverterVacOut * data.inverterAacOut).toFixed(0)
                  : '—'}
              </Text>
              <Text size="sm" c="dimmed">W</Text>
            </Group>
          </Stack>
        </Group>

        {data?.inverterMode !== undefined && (
          <Badge variant="light" color="blue" fullWidth>
            Mode: {getInverterModeLabel(data.inverterMode)}
          </Badge>
        )}

        {getFaultLabel(data?.inverterFault) && (
          <Group gap="xs">
            <IconAlertTriangle size={16} color="red" />
            <Text size="sm" c="red">
              {getFaultLabel(data?.inverterFault)}
            </Text>
          </Group>
        )}

        {data?.niteMinutesNoPwr !== undefined && data.niteMinutesNoPwr > 0 && (
          <Text size="sm" c="dimmed">
            Minutes without power last night: {data.niteMinutesNoPwr}
          </Text>
        )}
      </Stack>
    </Card>
  )
}
