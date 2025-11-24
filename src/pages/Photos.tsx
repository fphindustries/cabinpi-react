import { Link } from 'react-router-dom'
import { Container, Title, Stack, Button, Card, LoadingOverlay, Group, Image, Text, SimpleGrid, Modal } from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { useState, useMemo } from 'react'
import { IconArrowLeft, IconCalendar, IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import { formatInTimeZone } from 'date-fns-tz'
import { usePhotos, apiClient } from '../services/api'
import type { Photo } from '../types/api'
import '@mantine/dates/styles.css'

const PACIFIC_TZ = 'America/Los_Angeles'

function Photos() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)

  const dateParam = useMemo(() => {
    if (!selectedDate) return undefined
    return selectedDate.toISOString().split('T')[0]
  }, [selectedDate])

  const { data, isLoading } = usePhotos(dateParam)

  const goToPreviousDay = () => {
    if (selectedDate) {
      const prevDay = new Date(selectedDate)
      prevDay.setDate(prevDay.getDate() - 1)
      setSelectedDate(prevDay)
    } else if (data?.date) {
      // If no date selected, go back from the current data date
      const currentDate = new Date(data.date)
      currentDate.setDate(currentDate.getDate() - 1)
      setSelectedDate(currentDate)
    }
  }

  const goToNextDay = () => {
    if (selectedDate) {
      const nextDay = new Date(selectedDate)
      nextDay.setDate(nextDay.getDate() + 1)
      // Don't allow navigating to future dates
      if (nextDay <= new Date()) {
        setSelectedDate(nextDay)
      }
    } else if (data?.date) {
      // If no date selected, go forward from the current data date
      const currentDate = new Date(data.date)
      currentDate.setDate(currentDate.getDate() + 1)
      if (currentDate <= new Date()) {
        setSelectedDate(currentDate)
      }
    }
  }

  const displayDate = selectedDate
    ? selectedDate.toLocaleDateString()
    : data?.date
      ? new Date(data.date).toLocaleDateString()
      : 'Most Recent'

  const isAtCurrentDate = useMemo(() => {
    if (!selectedDate) return true
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const selected = new Date(selectedDate)
    selected.setHours(0, 0, 0, 0)
    return selected >= today
  }, [selectedDate])

  return (
    <>

      <Container fluid px="xl" py="xl" maw={1920}>
        <Stack gap="xl">
          <Group justify="space-between">
            <Title order={1}>Photos</Title>
            <Button component={Link} to="/" leftSection={<IconArrowLeft size={16} />} variant="light">
              Back to Dashboard
            </Button>
          </Group>

          <Stack gap="md">
            <Group justify="center" gap="md">
              <Button
                onClick={goToPreviousDay}
                leftSection={<IconChevronLeft size={16} />}
                variant="light"
              >
                Previous Day
              </Button>

              <DatePickerInput
                leftSection={<IconCalendar size={16} />}
                placeholder="Select date"
                value={selectedDate}
                onChange={setSelectedDate}
                maxDate={new Date()}
                clearable
                style={{ width: 200 }}
              />

              <Button
                onClick={goToNextDay}
                rightSection={<IconChevronRight size={16} />}
                variant="light"
                disabled={isAtCurrentDate}
              >
                Next Day
              </Button>
            </Group>

            <Text ta="center" size="lg" fw={500}>
              {displayDate}
            </Text>
          </Stack>

          <div style={{ position: 'relative' }}>
            <LoadingOverlay visible={isLoading} />
      <Modal
        opened={!!selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        title={selectedPhoto ? formatInTimeZone(new Date(selectedPhoto.timestamp), PACIFIC_TZ, 'PPpp') : ''}
        size="auto"
        centered
      >
        {selectedPhoto && (
          <Image
            src={apiClient.getPhotoUrl(selectedPhoto.filename, 800)}
            alt={`Photo from ${formatInTimeZone(new Date(selectedPhoto.timestamp), PACIFIC_TZ, 'PPpp')}`}
            fit="contain"
            style={{ maxWidth: '90vw', maxHeight: '70vh' }}
          />
        )}
      </Modal>
            {data && data.photos && data.photos.length > 0 ? (
              <SimpleGrid cols={{ base: 2, sm: 4, md: 6, lg: 8 }} spacing="lg">
                {data.photos.map((photo) => (
                  <Card
                    key={photo.filename}
                    shadow="sm"
                    padding="lg"
                    radius="md"
                    withBorder
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    <Card.Section>
                      <Image
                        src={apiClient.getPhotoUrl(photo.filename, 150)}
                        alt={`Photo from ${formatInTimeZone(new Date(photo.timestamp), PACIFIC_TZ, 'PPpp')}`}
                        fit="cover"
                        h={110}
                      />
                    </Card.Section>
                    <Text size="sm" c="dimmed" mt="sm" ta="center">
                      {formatInTimeZone(new Date(photo.timestamp), PACIFIC_TZ, 'p')}
                    </Text>
                  </Card>
                ))}
              </SimpleGrid>
            ) : (
              !isLoading && (
                <Stack align="center" justify="center" h={400}>
                  <Text c="dimmed">No photos available for this date</Text>
                </Stack>
              )
            )}
          </div>
        </Stack>
      </Container>


    </>
  )
}

export default Photos
