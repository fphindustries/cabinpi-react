import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Stack,
  Card,
  Group,
  Text,
  Button,
  Image,
  SimpleGrid,
  Modal,
  LoadingOverlay,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconCalendar, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { fetchPhotos, getPhotoUrl } from '../lib/api';
import { formatDateOnly } from '../lib/dateUtils';
import type { PhotoResponse, Photo } from '../types/api';

export default function Photos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<PhotoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  const selectedDateStr = searchParams.get('date');
  const selectedDate = selectedDateStr ? (() => {
    const [year, month, day] = selectedDateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  })() : null;

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const result = await fetchPhotos(selectedDateStr || undefined);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch photos');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [selectedDateStr]);

  const handleDateChange = (value: Date | string | null) => {
    if (value) {
      let date: Date;
      if (typeof value === 'string') {
        const [year, month, day] = value.split('-').map(Number);
        date = new Date(year, month - 1, day);
      } else {
        date = value;
      }
      setSearchParams({ date: formatDateOnly(date) });
    } else {
      setSearchParams({});
    }
  };

  const goToPreviousDay = () => {
    if (selectedDate) {
      const prevDay = new Date(selectedDate);
      prevDay.setDate(prevDay.getDate() - 1);
      setSearchParams({ date: formatDateOnly(prevDay) });
    } else {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      setSearchParams({ date: formatDateOnly(yesterday) });
    }
  };

  const goToNextDay = () => {
    if (selectedDate) {
      const nextDay = new Date(selectedDate);
      nextDay.setDate(nextDay.getDate() + 1);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (nextDay <= today) {
        setSearchParams({ date: formatDateOnly(nextDay) });
      }
    }
  };

  return (
    <Stack gap="xl" pos="relative">
      <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />

      {error && (
        <Text c="red" ta="center" py="xl">{error}</Text>
      )}
      <Stack gap="md">
        <Group grow>
          <DatePickerInput
            leftSection={<IconCalendar size={16} />}
            label="Select a date"
            placeholder="Pick date or leave blank for latest"
            value={selectedDate}
            onChange={handleDateChange}
            maxDate={new Date()}
            clearable
            valueFormat="YYYY-MM-DD"
          />
        </Group>

        <Group justify="center" gap="md">
          <Button
            onClick={goToPreviousDay}
            leftSection={<IconChevronLeft size={16} />}
            variant="light"
          >
            Previous Day
          </Button>
          <Button
            onClick={goToNextDay}
            rightSection={<IconChevronRight size={16} />}
            variant="light"
            disabled={
              selectedDate
                ? selectedDate >= new Date(new Date().setHours(0, 0, 0, 0))
                : false
            }
          >
            Next Day
          </Button>
        </Group>
      </Stack>

      {data && data.photos.length > 0 ? (
        <>
          <Text size="lg" fw={500}>
            {data.photos.length} photos from {data.date}
          </Text>

          <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="lg">
            {data.photos.map((photo) => (
              <Card
                key={photo.filename}
                shadow="sm"
                padding="xs"
                radius="md"
                withBorder
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedPhoto(photo)}
              >
                <Card.Section>
                  <Image
                    src={getPhotoUrl(photo.filename, 400)}
                    alt={photo.filename}
                    height={200}
                    fit="cover"
                  />
                </Card.Section>
                <Text size="xs" mt="xs" c="dimmed" ta="center">
                  {new Date(photo.timestamp).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </Card>
            ))}
          </SimpleGrid>
        </>
      ) : (
        <Text c="dimmed" ta="center" py="xl">No photos available for selected date</Text>
      )}

      <Modal
        opened={selectedPhoto !== null}
        onClose={() => setSelectedPhoto(null)}
        size="xl"
        title={
          selectedPhoto
            ? new Date(selectedPhoto.timestamp).toLocaleString('en-US', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })
            : ''
        }
      >
        {selectedPhoto && (
          <Image
            src={getPhotoUrl(selectedPhoto.filename,1280)}
            alt={selectedPhoto.filename}
            fit="contain"
          />
        )}
      </Modal>
    </Stack>
  );
}
