import { Card, Title, Group, Text, Stack, Badge } from '@mantine/core'
import { IconPlug, IconAlertTriangle } from '@tabler/icons-react'
import type { SensorData } from '../types/api'

interface InverterCardProps {
  data?: SensorData
}

export function InverterCard({ data }: InverterCardProps) {
  const getInverterModeLabel = (mode?: number) => {
    if (mode === undefined) return 'Unknown'

    const modes: Record<number, string> = {
      0x00: 'Standby',
      0x01: 'EQ',
      0x02: 'Float',
      0x04: 'Absorb',
      0x08: 'Bulk',
      0x09: 'BatSaver',
      0x10: 'Charge',
      0x20: 'Off',
      0x40: 'Invert',
      0x50: 'Inverter Standby',
      0x80: 'Search',
    }

    return modes[mode] || `Unknown Mode (0x${mode.toString(16).toUpperCase()})`
  }

  const getFaultLabel = (fault?: number) => {
    if (fault === undefined || fault === 0x00) return null

    const faults: Record<number, string> = {
      0x00: 'None',
      0x01: 'Stuck Relay',
      0x02: 'DC Overload',
      0x03: 'AC Overload',
      0x04: 'Dead Battery',
      0x05: 'Backfeed',
      0x08: 'Low Battery',
      0x09: 'High Battery',
      0x0a: 'High AC Volts',
      0x10: 'Bad Bridge',
      0x12: 'NTC Fault',
      0x13: 'FET Overload',
      0x14: 'Internal Fault',
      0x16: 'Stacker Mode Fault',
      0x17: 'Stacker No CLK Fault',
      0x18: 'Stacker CLK PH Fault',
      0x19: 'Stacker PH Loss Fault',
      0x20: 'Over Temp',
      0x21: 'Relay Fault',
      0x80: 'Charger Fault',
      0x81: 'High Battery Temp',
      0x90: 'Open SELCO TCO',
      0x91: 'CB3 Open Fault',
    }

    return faults[fault] || `Unknown Fault (0x${fault.toString(16).toUpperCase()})`
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
            <Text size="sm" c="dimmed">Output</Text>
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
