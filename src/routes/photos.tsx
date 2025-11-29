import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Container, Title, Stack, SimpleGrid, Card, Image, Text, Group, Button, Collapse, Modal, Skeleton } from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { IconCalendar, IconRefresh, IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import { useState, useEffect } from 'react'
import { formatInTimeZone } from 'date-fns-tz'
import type { Photo } from '../types/api'
import { fetchPhotos, fetchPhotoImage } from '../lib/api'
import '@mantine/dates/styles.css'
import { createServerFn } from '@tanstack/react-start'

const PACIFIC_TZ = 'America/Los_Angeles'

export const fetchPhotosFn = createServerFn({method: 'GET'})
  .inputValidator((data:{ date: string }) => data)
  .handler(async ({data}) => {
  return fetchPhotos(data.date)
})

export const fetchPhotoImageFn = createServerFn({method: 'GET'})
  .inputValidator((data:{ filename: string; size?: number }) => data)
  .handler(async ({data}) => {
    return fetchPhotoImage(data.filename, data.size)
  })


export const Route = createFileRoute('/photos')({
  component: Photos,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      date: search.date as string | undefined,
    }
  },
  loaderDeps: ({ search }) => ({ date: search.date }),
  loader: async ({ deps }) => {
    const data = await fetchPhotosFn({data:{date: deps.date || ''}})
    return { data, selectedDateStr: deps.date }
  },
})

function Photos() {
  const { data, selectedDateStr } = Route.useLoaderData()
  const navigate = useNavigate({ from: '/photos' })

  const [selectedDate, setSelectedDate] = useState<Date | null>(
    selectedDateStr ? new Date(selectedDateStr) : null
  )
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [imageCache, setImageCache] = useState<Record<string, string>>({})
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set())

  const goToPreviousDay = () => {
    const baseDate = selectedDate || (data?.date ? new Date(data.date) : new Date())
    const prevDay = new Date(baseDate)
    prevDay.setDate(prevDay.getDate() - 1)
    setSelectedDate(prevDay)
    navigate({ search: { date: prevDay.toISOString().split('T')[0] } })
  }

  const goToNextDay = () => {
    const baseDate = selectedDate || (data?.date ? new Date(data.date) : new Date())
    const nextDay = new Date(baseDate)
    nextDay.setDate(nextDay.getDate() + 1)
    if (nextDay <= new Date()) {
      setSelectedDate(nextDay)
      navigate({ search: { date: nextDay.toISOString().split('T')[0] } })
    }
  }

  const handleDateChange = (value: string | Date | null) => {
    const date = value instanceof Date ? value : (value ? new Date(value) : null)
    setSelectedDate(date)
    if (date) {
      navigate({ search: { date: date.toISOString().split('T')[0] } })
    } else {
      navigate({ search: {} })
    }
  }

  const displayDate = selectedDate
    ? selectedDate.toLocaleDateString()
    : data?.date
      ? new Date(data.date).toLocaleDateString()
      : 'Most Recent'

  const isAtCurrentDate = () => {
    if (!selectedDate) return true
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const selected = new Date(selectedDate)
    selected.setHours(0, 0, 0, 0)
    return selected >= today
  }

  // Load images using the server function
  useEffect(() => {
    const loadImages = async () => {
      if (!data?.photos) return

      // Mark all images as loading
      const loadingKeys = new Set(data.photos.map(photo => `${photo.filename}-128`))
      setLoadingImages(loadingKeys)

      const newCache: Record<string, string> = {}

      // Load thumbnails (128px) for all photos
      await Promise.all(
        data.photos.map(async (photo) => {
          const cacheKey = `${photo.filename}-128`
          if (!imageCache[cacheKey]) {
            try {
              const dataUrl = await fetchPhotoImageFn({ data: { filename: photo.filename, size: 128 } })
              newCache[cacheKey] = dataUrl
              // Remove from loading set as each image completes
              setLoadingImages(prev => {
                const next = new Set(prev)
                next.delete(cacheKey)
                return next
              })
            } catch (error) {
              console.error(`Failed to load thumbnail for ${photo.filename}:`, error)
              // Remove from loading set even on error
              setLoadingImages(prev => {
                const next = new Set(prev)
                next.delete(cacheKey)
                return next
              })
            }
          } else {
            // Already cached, remove from loading
            setLoadingImages(prev => {
              const next = new Set(prev)
              next.delete(cacheKey)
              return next
            })
          }
        })
      )

      setImageCache(prev => ({ ...prev, ...newCache }))
    }

    loadImages()
  }, [data?.photos])

  // Load full size image when modal is opened
  useEffect(() => {
    const loadFullImage = async () => {
      if (!selectedPhoto) return

      const cacheKey = `${selectedPhoto.filename}-1024`
      if (!imageCache[cacheKey]) {
        // Mark as loading
        setLoadingImages(prev => new Set(prev).add(cacheKey))

        try {
          const dataUrl = await fetchPhotoImageFn({ data: { filename: selectedPhoto.filename, size: 1024 } })
          setImageCache(prev => ({ ...prev, [cacheKey]: dataUrl }))
        } catch (error) {
          console.error(`Failed to load full image for ${selectedPhoto.filename}:`, error)
        } finally {
          // Remove from loading
          setLoadingImages(prev => {
            const next = new Set(prev)
            next.delete(cacheKey)
            return next
          })
        }
      }
    }

    loadFullImage()
  }, [selectedPhoto])

  const getPhotoUrl = (photo: Photo, size?: number) => {
    const cacheKey = `${photo.filename}-${size || 'full'}`
    return imageCache[cacheKey] || ''
  }

  return (
    <Container fluid px="xl" py="xl" maw={1920}>
      <Stack gap="xl">
        <Group justify="space-between">
          <div>
            <Title order={1}>Trail Camera Photos</Title>
            <Text size="sm" c="dimmed">
              {data?.photos?.length || 0} photos
            </Text>
          </div>
          <Button
            leftSection={<IconRefresh size={16} />}
            onClick={() => window.location.reload()}
            variant="light"
          >
            Refresh
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

            <Button
              onClick={() => setShowDatePicker(!showDatePicker)}
              leftSection={<IconCalendar size={16} />}
              variant="light"
            >
              {displayDate}
            </Button>

            <Button
              onClick={goToNextDay}
              rightSection={<IconChevronRight size={16} />}
              variant="light"
              disabled={isAtCurrentDate()}
            >
              Next Day
            </Button>
          </Group>

          <Collapse in={showDatePicker}>
            <Group justify="center">
              <DatePickerInput
                leftSection={<IconCalendar size={16} />}
                placeholder="Select date"
                value={selectedDate}
                onChange={handleDateChange}
                maxDate={new Date()}
                clearable
              />
            </Group>
          </Collapse>
        </Stack>

        <Modal
          opened={!!selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          title={selectedPhoto ? formatInTimeZone(new Date(selectedPhoto.timestamp), PACIFIC_TZ, 'PPpp') : ''}
          size="auto"
          centered
        >
          {selectedPhoto && (() => {
            const cacheKey = `${selectedPhoto.filename}-1024`
            const isLoading = loadingImages.has(cacheKey)
            const imageUrl = getPhotoUrl(selectedPhoto, 1024)

            return isLoading || !imageUrl ? (
              <Skeleton height="70vh" width="90vw" />
            ) : (
              <Image
                src={imageUrl}
                alt={`Photo from ${formatInTimeZone(new Date(selectedPhoto.timestamp), PACIFIC_TZ, 'PPpp')}`}
                fit="contain"
                style={{ maxWidth: '90vw', maxHeight: '70vh' }}
              />
            )
          })()}
        </Modal>

        {data && data.photos && data.photos.length > 0 ? (
          <SimpleGrid cols={{ base: 2, sm: 4, md: 6, lg: 8 }} spacing="lg">
            {data.photos.map((photo) => {
              const cacheKey = `${photo.filename}-128`
              const isLoading = loadingImages.has(cacheKey)
              const imageUrl = getPhotoUrl(photo, 128)

              return (
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
                    {isLoading || !imageUrl ? (
                      <Skeleton height={110} />
                    ) : (
                      <Image
                        src={imageUrl}
                        alt={`Photo from ${formatInTimeZone(new Date(photo.timestamp), PACIFIC_TZ, 'PPpp')}`}
                        fit="cover"
                        h={110}
                      />
                    )}
                  </Card.Section>
                  <Text size="sm" c="dimmed" mt="sm" ta="center">
                    {formatInTimeZone(new Date(photo.timestamp), PACIFIC_TZ, 'p')}
                  </Text>
                </Card>
              )
            })}
          </SimpleGrid>
        ) : (
          <Stack align="center" justify="center" h={400}>
            <Text c="dimmed">No photos available for this date</Text>
          </Stack>
        )}
      </Stack>
    </Container>
  )
}
