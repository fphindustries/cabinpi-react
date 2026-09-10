import { SimpleGrid, Stack, Text, Group, LoadingOverlay } from '@mantine/core';
import { WeatherCard } from '../components/WeatherCard';
import { InsideClimateCard } from '../components/InsideClimateCard';
import { SolarPowerCard } from '../components/SolarPowerCard';
import { InverterCard } from '../components/InverterCard';
import { DCPowerCard } from '../components/DCPowerCard';
import { useApi } from '../hooks/useApi';
import { formatChartDate } from '../lib/dateUtils';
import type { LatestSensorResponse } from '../types/api';

export default function Home() {
  const { data, loading, error } = useApi<LatestSensorResponse>('/api/sensors/latest', 300000);

  return (
    <Stack gap="xl" pos="relative">
      <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />

      {error ? (
        <Text c="red" ta="center" py="xl">{error}</Text>
      ) : (
        <>
          <Group justify="space-between">
            <div>
              <Text size="sm" c="dimmed">
                Updated: {data?.data.date
                  ? `${formatChartDate(data.data.date)} Pacific`
                  : 'N/A'}
              </Text>
            </div>
          </Group>

          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            <SolarPowerCard data={data?.data} />
            <InverterCard data={data?.data} />
            <DCPowerCard data={data?.data} />
            <WeatherCard data={data?.data} />
            <InsideClimateCard data={data?.data} />
          </SimpleGrid>
        </>
      )}
    </Stack>
  );
}
