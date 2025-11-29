import type { Route } from "./+types/photos";
import { Container, Title, Stack, SimpleGrid, Card, Image, Text, Group, Button, Collapse, Modal } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconCalendar, IconRefresh, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { useRevalidator, useNavigate } from 'react-router';
import { useState } from 'react';
import type { PhotoResponse, Photo } from '../types/api';
import { formatInTimeZone } from 'date-fns-tz';
import '@mantine/dates/styles.css';

const PACIFIC_TZ = 'America/Los_Angeles';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Photos - CabinPi Dashboard" },
    { name: "description", content: "Cabin photos from trail camera" },
  ];
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const env = context.cloudflare.env;
  const url = new URL(request.url);
  const selectedDateStr = url.searchParams.get('date');

  // Use localhost in development, production API otherwise
  const isDev = import.meta.env.DEV;
  let apiUrl = isDev
    ? 'http://localhost:3000/api/photos'
    : 'https://api.cabinpi.com/api/photos';

  // Add date parameter if specified
  if (selectedDateStr) {
    apiUrl += `?date=${selectedDateStr}`;
  }

  try {
    const headers = new Headers();
    // Only add service token headers in production
    if (!isDev && env.CF_ACCESS_CLIENT_ID && env.CF_ACCESS_CLIENT_SECRET) {
      headers.set('CF-Access-Client-Id', env.CF_ACCESS_CLIENT_ID);
      headers.set('CF-Access-Client-Secret', env.CF_ACCESS_CLIENT_SECRET);
    }

    const response = await fetch(apiUrl, { headers });
    if (!response.ok) throw new Error('Failed to fetch photos');

    const data: PhotoResponse = await response.json();
    return { data, error: null, selectedDateStr };
  } catch (error) {
    return { data: null, error: 'Failed to load photos', selectedDateStr };
  }
}

export default function Photos({ loaderData }: Route.ComponentProps) {
  const { data, error, selectedDateStr } = loaderData;
  const revalidator = useRevalidator();
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState<Date | null>(
    selectedDateStr ? new Date(selectedDateStr) : null
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  const isDev = import.meta.env.DEV;

  const goToPreviousDay = () => {
    const baseDate = selectedDate || (data?.date ? new Date(data.date) : new Date());
    const prevDay = new Date(baseDate);
    prevDay.setDate(prevDay.getDate() - 1);
    setSelectedDate(prevDay);
    navigate(`/photos?date=${prevDay.toISOString().split('T')[0]}`);
  };

  const goToNextDay = () => {
    const baseDate = selectedDate || (data?.date ? new Date(data.date) : new Date());
    const nextDay = new Date(baseDate);
    nextDay.setDate(nextDay.getDate() + 1);
    if (nextDay <= new Date()) {
      setSelectedDate(nextDay);
      navigate(`/photos?date=${nextDay.toISOString().split('T')[0]}`);
    }
  };

  const handleDateChange = (value: string | Date | null) => {
    const date = value instanceof Date ? value : (value ? new Date(value) : null);
    setSelectedDate(date);
    if (date) {
      navigate(`/photos?date=${date.toISOString().split('T')[0]}`);
    } else {
      navigate('/photos');
    }
  };

  const displayDate = selectedDate
    ? selectedDate.toLocaleDateString()
    : data?.date
      ? new Date(data.date).toLocaleDateString()
      : 'Most Recent';

  const isAtCurrentDate = () => {
    if (!selectedDate) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    return selected >= today;
  };

  const getPhotoUrl = (filename: string, size?: number) => {
    const baseUrl = isDev
      ? `http://localhost:3000/api/photos/${filename}`
      : `/api/photos/${filename}`;
    return size ? `${baseUrl}?size=${size}` : baseUrl;
  };

  return (
    <Container fluid px="xl" py="xl" maw={1920}>
      <Stack gap="xl">
        <Group justify="space-between">
          <div>
            <Title order={1}>Photos</Title>
            <Text size="sm" c="dimmed">
              {data?.photos?.length || 0} photos
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

        {error && (
          <Text c="red">{error}</Text>
        )}

        <Modal
          opened={!!selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          title={selectedPhoto ? formatInTimeZone(new Date(selectedPhoto.timestamp), PACIFIC_TZ, 'PPpp') : ''}
          size="auto"
          centered
        >
          {selectedPhoto && (
            <Image
              src={getPhotoUrl(selectedPhoto.filename, 1024)}
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
                    src={getPhotoUrl(photo.filename, 128)}
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
          <Stack align="center" justify="center" h={400}>
            <Text c="dimmed">No photos available for this date</Text>
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
