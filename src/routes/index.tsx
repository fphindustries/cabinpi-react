import { createFileRoute } from '@tanstack/react-router'
import { Container, SimpleGrid, Stack, Text, Group } from '@mantine/core'
import { WeatherCard } from '../components/WeatherCard'
import { InsideClimateCard } from '../components/InsideClimateCard'
import { SolarPowerCard } from '../components/SolarPowerCard'
import { InverterCard } from '../components/InverterCard'
import { useState } from 'react'
import { getLatestSensorData } from '../lib/api'
import { createServerFn } from '@tanstack/react-start'

export const getLatestSensorDataFn = createServerFn({
  method: 'GET',
}).handler(getLatestSensorData)

export const Route = createFileRoute('/')({
  component: Home,
  loader: async () => await getLatestSensorDataFn()
})

function Home() {
  const initialSensorData = Route.useLoaderData()
  const [sensorData, setSensorData] = useState(initialSensorData)

  return (
    <Container fluid px="xl" py="xl" maw={1920}>
      <Stack gap="xl">
        <Group justify="space-between">
          <div>
            <Text size="sm" c="dimmed">
              Updated: {sensorData?.data.date
                ? new Date(sensorData.data.date).toLocaleString('en-US', {
                  dateStyle: 'short',
                  timeStyle: 'short'
                })
                : 'N/A'}
            </Text>
          </div>
        </Group>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          <SolarPowerCard data={sensorData?.data} />
          <InverterCard data={sensorData?.data} />
          <WeatherCard data={sensorData?.data} />
          <InsideClimateCard data={sensorData?.data} />
        </SimpleGrid>
      </Stack>
    </Container>
  )
}
