import { Card, Title, Group, Text, Stack, Badge } from '@mantine/core'
import { IconSun, IconBattery, IconBolt } from '@tabler/icons-react'
import type { SensorDataJSON } from '../types/api'

interface SolarPowerCardProps {
  data?: SensorDataJSON
  loading?: boolean
}

export function SolarPowerCard({ data }: SolarPowerCardProps) {
  const getBatteryStateLabel = (state?: number) => {
    switch (state) {
      case 0: return 'Resting'
      case 1: return 'Absorb'
      case 2: return 'BulkMPPT'
      case 3: return 'Float'
      case 4: return 'FloatMPPT'
      case 5: return 'Equalize'
      case 6: return 'HyperVOC'
      case 7: return 'EQ MPPT'
      default: return 'Unknown'
    }
  }

  const getChargeStateLabel = (state?: number) => {
    switch (state) {
      case 0: return 'Not Charging'
      case 1: return 'Bulk'
      case 2: return 'Absorption'
      case 3: return 'Float'
      default: return 'Unknown'
    }
  }

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between">
          <Group gap="xs">
            <IconSun size={24} />
            <Title order={3}>Solar Power</Title>
          </Group>
          {data?.batteryState !== undefined && (
            <Badge color="blue">{getBatteryStateLabel(data.batteryState)}</Badge>
          )}
        </Group>

        <Group grow>
          <Stack gap="xs">
            <Text size="sm" c="dimmed">Power Output</Text>
            <Group gap="xs" align="baseline">
              <Text size="xl" fw={700}>{data?.watts?.toFixed(1) || '—'}</Text>
              <Text size="sm" c="dimmed">W</Text>
            </Group>
          </Stack>

          <Stack gap="xs">
            <Text size="sm" c="dimmed">PV Voltage</Text>
            <Group gap="xs" align="baseline">
              <Text size="xl" fw={700}>{data?.dispavgVpv?.toFixed(1) || '—'}</Text>
              <Text size="sm" c="dimmed">V</Text>
            </Group>
          </Stack>

          <Stack gap="xs">
            <Text size="sm" c="dimmed">PV Current</Text>
            <Group gap="xs" align="baseline">
              <Text size="xl" fw={700}>{data?.pvInputCurrent?.toFixed(1) || '—'}</Text>
              <Text size="sm" c="dimmed">A</Text>
            </Group>
          </Stack>
        </Group>

        <Group grow>
          <Stack gap="xs">
            <Text size="sm" c="dimmed">Battery Voltage</Text>
            <Group gap="xs" align="baseline">
              <IconBattery size={16} />
              <Text size="lg" fw={600}>{data?.dispavgVbatt?.toFixed(2) || '—'}</Text>
              <Text size="sm" c="dimmed">V</Text>
            </Group>
          </Stack>

          <Stack gap="xs">
            <Text size="sm" c="dimmed">Battery Current</Text>
            <Group gap="xs" align="baseline">
              <IconBolt size={16} />
              <Text size="lg" fw={600}>{data?.ibattDisplay?.toFixed(1) || '—'}</Text>
              <Text size="sm" c="dimmed">A</Text>
            </Group>
          </Stack>
        </Group>

        <Group grow>
          <Stack gap="xs">
            <Text size="sm" c="dimmed">Energy Today</Text>
            <Group gap="xs" align="baseline">
              <Text size="lg" fw={600}>{data?.kwhours?.toFixed(2) || '—'}</Text>
              <Text size="sm" c="dimmed">kWh</Text>
            </Group>
          </Stack>

          <Stack gap="xs">
            <Text size="sm" c="dimmed">Amp Hours</Text>
            <Group gap="xs" align="baseline">
              <Text size="lg" fw={600}>{data?.ampHours?.toFixed(1) || '—'}</Text>
              <Text size="sm" c="dimmed">Ah</Text>
            </Group>
          </Stack>
        </Group>

        {data?.chargeState !== undefined && (
          <Badge variant="light" color="green" fullWidth>
            {getChargeStateLabel(data.chargeState)}
          </Badge>
        )}
      </Stack>
    </Card>
  )
}
