import { Card, Title, Group, Text, Stack, Badge } from '@mantine/core'
import { IconSun, IconBattery, IconBolt, IconBatteryCharging, IconBatteryFilled } from '@tabler/icons-react'
import type { SensorData } from '../types/api'

interface SolarPowerCardProps {
  data?: SensorData
}

export function SolarPowerCard({ data }: SolarPowerCardProps) {
  const getBatteryStateLabel = (state?: number) => {
    switch (state) {
      case 0: return 'Resting'
      case 3: return 'Absorb'
      case 4: return 'Bulk MPPT'
      case 5: return 'Float'
      case 6: return 'Float MPPT'
      case 7: return 'Equalize'
      case 10: return 'Hyper VOC'
      case 11: return 'EQ MPPT'
      default: return state !== undefined ? `Unknown (0x${state.toString(16).toUpperCase()})` : 'Unknown'
    }
  }

  const getBatteryIcon = (state?: number) => {
    if (state === undefined || state === 0) {
      return <IconBattery size={20} />
    } else if (state > 0 && state < 5) {
      return <IconBatteryCharging size={20} />
    } else {
      return <IconBatteryFilled size={20} />
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
            <Text size="sm" c="dimmed">Battery Voltage</Text>
            <Group gap="xs" align="baseline">
              {getBatteryIcon(data?.batteryState)}
              <Text size="lg" fw={700}>{data?.dispavgVbatt?.toFixed(2) || '—'}</Text>
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
        </Group>

        <Group grow>
          <Stack gap="xs">
            <Text size="sm" c="dimmed">PV Current</Text>
            <Group gap="xs" align="baseline">
              <Text size="xl" fw={600}>{data?.pvInputCurrent?.toFixed(1) || '—'}</Text>
              <Text size="sm" c="dimmed">A</Text>
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

        <Group grow>
          <Stack gap="xs">
            <Text size="sm" c="dimmed">Energy Today</Text>
            <Group gap="xs" align="baseline">
              <Text size="lg" fw={600}>{data?.kwhours?.toFixed(2) || '—'}</Text>
              <Text size="sm" c="dimmed">kWh</Text>
            </Group>
          </Stack>
        </Group>

      </Stack>
    </Card>
  )
}