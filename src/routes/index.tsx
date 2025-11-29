import { createFileRoute } from '@tanstack/react-router'
import { Container, Title, SimpleGrid, Stack, Text, Group, Button } from '@mantine/core'
import { IconRefresh } from '@tabler/icons-react'
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
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const newData = await getLatestSensorDataFn()
      setSensorData(newData)
    } catch (error) {
      console.error('Failed to refresh data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <Container fluid px="xl" py="xl" maw={1920}>
      <Stack gap="xl">
        <Group justify="space-between">
          <div>
            <Title order={1}>CabinPi Dashboard</Title>
            <Text size="sm" c="dimmed">
              Last Reading: {sensorData?.data.date
                ? new Date(sensorData.data.date).toLocaleString('en-US', {
                  dateStyle: 'long',
                  timeStyle: 'long'
                })
                : 'N/A'}
            </Text>
          </div>
          <Button
            leftSection={<IconRefresh size={16} />}
            onClick={handleRefresh}
            loading={isRefreshing}
            variant="light"
          >
            Refresh
          </Button>
        </Group>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          <WeatherCard data={sensorData?.data} />
          <InsideClimateCard data={sensorData?.data} />
          <SolarPowerCard data={sensorData?.data} />
          <InverterCard data={sensorData?.data} />
        </SimpleGrid>
      </Stack>
    </Container>
  )
}
