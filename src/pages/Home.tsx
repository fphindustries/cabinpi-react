import { useState, useEffect } from 'react';
import { SimpleGrid, Stack, Text, Group, LoadingOverlay } from '@mantine/core';
import { WeatherCard } from '../components/WeatherCard';
import { InsideClimateCard } from '../components/InsideClimateCard';
import { SolarPowerCard } from '../components/SolarPowerCard';
import { InverterCard } from '../components/InverterCard';
import { getLatestSensorData } from '../lib/api';
import type { LatestSensorResponse } from '../types/api';

export default function Home() {
  const [data, setData] = useState<LatestSensorResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const result = await getLatestSensorData();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 300000); // Refresh every 5 minutes

    return () => clearInterval(interval);
  }, []);

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
                  ? new Date(data.data.date).toLocaleString('en-US', {
                      dateStyle: 'short',
                      timeStyle: 'short'
                    })
                  : 'N/A'}
              </Text>
            </div>
          </Group>

          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            <SolarPowerCard data={data?.data} />
            <InverterCard data={data?.data} />
            <WeatherCard data={data?.data} />
            <InsideClimateCard data={data?.data} />
          </SimpleGrid>
        </>
      )}
    </Stack>
  );
}
