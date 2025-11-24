import { Link } from 'react-router-dom'
import { Container, Title, Button, Group, Text, Stack, SimpleGrid, LoadingOverlay, Alert } from '@mantine/core'
import { IconRefresh, IconChartBar, IconAlertCircle, IconPhoto } from '@tabler/icons-react'
import { useLatestSensorData } from '../services/api'
import { SolarPowerCard } from '../components/SolarPowerCard'
import { InverterCard } from '../components/InverterCard'
import { InsideClimateCard } from '../components/InsideClimateCard'
import { WeatherCard } from '../components/WeatherCard'

function Home() {
  const { data, isLoading, error, refetch } = useLatestSensorData(30000) // Refresh every 30 seconds

  const lastUpdate = data?.data?.date
    ? new Date(data.data.date).toLocaleString()
    : 'Never'

  return (
    <Container fluid px="xl" py="xl" maw={1920}>
      <Stack gap="xl">
        <Group justify="space-between" align="center">
          <div>
            <Title order={1}>CabinPi Dashboard</Title>
            <Text size="sm" c="dimmed">
              Last updated: {lastUpdate}
            </Text>
          </div>
          <Group>
            <Button
              leftSection={<IconRefresh size={16} />}
              onClick={() => refetch()}
              loading={isLoading}
              variant="light"
            >
              Refresh
            </Button>
            <Button
              component={Link}
              to="/charts"
              leftSection={<IconChartBar size={16} />}
              variant="outline"
            >
              View Charts
            </Button>
            <Button
              component={Link}
              to="/photos"
              leftSection={<IconPhoto size={16} />}
              variant="outline"
            >
              View Photos
            </Button>
          </Group>
        </Group>

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
            Failed to load sensor data. Please check your API connection.
          </Alert>
        )}

        <div style={{ position: 'relative' }}>
          <LoadingOverlay visible={isLoading && !data} />

          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            <SolarPowerCard data={data?.data} loading={isLoading} />
            <InverterCard data={data?.data} loading={isLoading} />
            <InsideClimateCard data={data?.data} loading={isLoading} />
            <WeatherCard data={data?.data} loading={isLoading} />
          </SimpleGrid>
        </div>
      </Stack>
    </Container>
  )
}

export default Home
