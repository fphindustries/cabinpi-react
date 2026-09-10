import { Card, Title, Group, Text, Stack } from '@mantine/core'
import { IconBolt, IconCircuitCell } from '@tabler/icons-react'
import type { SensorData } from '../types/api'

interface DCPowerCardProps {
  data?: SensorData
}

export function DCPowerCard({ data }: DCPowerCardProps) {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <Group gap="xs">
          <IconCircuitCell size={24} />
          <Title order={3}>DC Power Monitor</Title>
        </Group>

        <Group grow>
          <Stack gap="xs">
            <Text size="sm" c="dimmed">Bus Voltage</Text>
            <Group gap="xs" align="baseline">
              <Text size="xl" fw={700}>{data?.dcBusVoltage?.toFixed(2) || '—'}</Text>
              <Text size="sm" c="dimmed">V</Text>
            </Group>
          </Stack>

          <Stack gap="xs">
            <Text size="sm" c="dimmed">Current</Text>
            <Group gap="xs" align="baseline">
              <IconBolt size={20} />
              <Text size="xl" fw={700}>{data?.dcCurrent?.toFixed(2) || '—'}</Text>
              <Text size="sm" c="dimmed">A</Text>
            </Group>
          </Stack>
        </Group>

        <Group grow>
          <Stack gap="xs">
            <Text size="sm" c="dimmed">Power</Text>
            <Group gap="xs" align="baseline">
              <Text size="xl" fw={700}>{data?.dcPower?.toFixed(1) || '—'}</Text>
              <Text size="sm" c="dimmed">W</Text>
            </Group>
          </Stack>

          {data?.dcShuntVoltage !== undefined && (
            <Stack gap="xs">
              <Text size="sm" c="dimmed">Shunt Voltage</Text>
              <Group gap="xs" align="baseline">
                <Text size="xl" fw={700}>{data.dcShuntVoltage.toFixed(3)}</Text>
                <Text size="sm" c="dimmed">mV</Text>
              </Group>
            </Stack>
          )}
        </Group>
      </Stack>
    </Card>
  )
}
