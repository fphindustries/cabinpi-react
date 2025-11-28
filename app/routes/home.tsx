import type { Route } from "./+types/home";
import { Container, Title, Button, Group, Text, Stack, SimpleGrid, Alert } from '@mantine/core';
import { IconAlertCircle, IconRefresh } from '@tabler/icons-react';
import { useRevalidator } from 'react-router';
import { SolarPowerCard } from '../components/SolarPowerCard';
import { InverterCard } from '../components/InverterCard';
import { InsideClimateCard } from '../components/InsideClimateCard';
import { WeatherCard } from '../components/WeatherCard';
import type { LatestSensorResponse } from '../types/api';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "CabinPi Dashboard" },
    { name: "description", content: "Real-time cabin monitoring dashboard" },
  ];
}

export async function loader({ context }: Route.LoaderArgs) {
  const env = context.cloudflare.env;

  // Use localhost in development, production API otherwise
  const isDev = import.meta.env.DEV;
  const apiUrl = isDev
    ? 'http://localhost:3000/api/sensors/latest'
    : 'https://api.cabinpi.com/api/sensors/latest';

  try {
    const headers = new Headers();
    // Only add service token headers in production
    if (!isDev && env.CF_ACCESS_CLIENT_ID && env.CF_ACCESS_CLIENT_SECRET) {
      headers.set('CF-Access-Client-Id', env.CF_ACCESS_CLIENT_ID);
      headers.set('CF-Access-Client-Secret', env.CF_ACCESS_CLIENT_SECRET);
    }

    const response = await fetch(apiUrl, { headers });
    if (!response.ok) throw new Error('Failed to fetch sensor data');

    const data: LatestSensorResponse = await response.json();
    return { data, error: null };
  } catch (error) {
    return { data: null, error: 'Failed to load sensor data' };
  }
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { data, error } = loaderData;
  const revalidator = useRevalidator();

  const lastUpdate = data?.data?.date
    ? new Date(data.data.date).toLocaleString()
    : 'Never';

  return (
    <Container fluid px="xl" py="xl" maw={1920}>
      <Stack gap="xl">
        <Group justify="space-between" align="center">
          <div>
            <Title order={1}>Dashboard</Title>
            <Text size="sm" c="dimmed">
              Last updated: {lastUpdate}
            </Text>
          </div>
          <Button
            leftSection={<IconRefresh size={16} />}
            onClick={() => revalidator.revalidate()}
            loading={revalidator.state === 'loading'}
            variant="light"
          >
            Refresh
          </Button>
        </Group>

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
            {error}
          </Alert>
        )}

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          <SolarPowerCard data={data?.data} />
          <InverterCard data={data?.data} />
          <InsideClimateCard data={data?.data} />
          <WeatherCard data={data?.data} />
        </SimpleGrid>
      </Stack>
    </Container>
  );
}
