import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Stack, Card, Group, Text, Button, Image, SimpleGrid, Modal, Alert, Loader } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconCalendar, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { fetchPhotos, photosPath } from '../lib/api';
import { dateParam, pacificToday, shiftDay } from '../lib/dateUtils';
import { useApi } from '../hooks/useApi';
import type { PhotoResponse, Photo } from '../types/api';

export default function Photos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const date = dateParam(searchParams.get('date'));
  // Reset gallery state immediately on navigation; late responses cannot cross dates.
  return <PhotoGallery key={date ?? 'latest'} date={date} onDateChange={value => setSearchParams(value ? { date: value } : {})} />;
}

function PhotoGallery({ date, onDateChange }: { date: string | null; onDateChange: (date: string | null) => void }) {
  const { data, loading, error, retry } = useApi<PhotoResponse>(photosPath(date));
  const [extra, setExtra] = useState<Photo[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null | undefined>();
  const [loadingMore, setLoadingMore] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const pending = useRef<AbortController | null>(null);
  useEffect(() => () => pending.current?.abort(), []);
  const photos = [...new Map([...(data?.photos ?? []), ...extra].map(photo => [photo.key, photo])).values()]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp) || a.camera.localeCompare(b.camera));
  const cursor = nextCursor === undefined ? data?.cursor : nextCursor;
  const displayedDate = data?.date ?? date;
  const today = pacificToday();

  async function loadMore() {
    if (!cursor || !displayedDate || pending.current) return;
    const controller = new AbortController();
    pending.current = controller;
    setLoadingMore(true);
    setPageError(null);
    try {
      const result = await fetchPhotos(displayedDate, cursor, controller.signal);
      if (!controller.signal.aborted) {
        setExtra(previous => [...previous, ...result.photos]);
        setNextCursor(result.cursor);
      }
    } catch (error) {
      if (!controller.signal.aborted) setPageError(error instanceof Error ? error.message : 'Unable to load more photos');
    } finally {
      if (!controller.signal.aborted) setLoadingMore(false);
      pending.current = null;
    }
  }

  return (
    <Stack gap="xl">
      <DatePickerInput leftSection={<IconCalendar size={16} />} label="Photo date (Pacific time)"
        placeholder="Latest available date" value={date} onChange={onDateChange}
        maxDate={today} clearable valueFormat="YYYY-MM-DD" />
      <Group justify="center">
        <Button leftSection={<IconChevronLeft size={16} />} variant="light" disabled={loading}
          onClick={() => onDateChange(shiftDay(displayedDate ?? today, -1))}>Previous Day</Button>
        <Button rightSection={<IconChevronRight size={16} />} variant="light"
          disabled={loading || !displayedDate || displayedDate >= today}
          onClick={() => displayedDate && onDateChange(shiftDay(displayedDate, 1))}>Next Day</Button>
      </Group>
      {loading && <Group justify="center"><Loader aria-label="Loading photos" /></Group>}
      {error && <Alert color="red" title="Unable to load photos">{error}<Button onClick={retry} variant="subtle">Retry</Button></Alert>}
      {!loading && !error && <>
        <Text size="lg" fw={500}>{photos.length} photos{displayedDate ? ` from ${displayedDate}` : ''} (Pacific time)</Text>
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="lg">
          {photos.map(photo => (
            <Card component="button" type="button" key={photo.key} shadow="sm" padding="xs" radius="md" withBorder
              aria-label={`View ${photo.camera} at ${photo.timestamp.slice(11, 16)}`}
              style={{ cursor: 'pointer' }} onClick={() => setSelectedPhoto(photo)}>
              <Image src={photo.url} alt={`${photo.camera}, ${photo.timestamp}`} h={200} fit="cover" loading="lazy" decoding="async" />
              <Text size="sm" mt="xs">{photo.camera}</Text>
              <Text size="xs" c="dimmed">{photo.timestamp.slice(11, 16)} Pacific</Text>
            </Card>
          ))}
        </SimpleGrid>
        {photos.length === 0 && <Text c="dimmed" ta="center">No photos available for this date.</Text>}
        {pageError && <Alert color="red">{pageError}</Alert>}
        {cursor && <Button onClick={() => { void loadMore(); }} loading={loadingMore} variant="light">Load more photos</Button>}
      </>}
      <Modal opened={selectedPhoto !== null} onClose={() => setSelectedPhoto(null)} size="xl"
        closeButtonProps={{ 'aria-label': 'Close photo' }}
        title={selectedPhoto ? `${selectedPhoto.camera} — ${selectedPhoto.timestamp.replace('T', ' ')} Pacific` : ''}>
        {selectedPhoto && <Image src={selectedPhoto.url} alt={selectedPhoto.camera} fit="contain" />}
      </Modal>
    </Stack>
  );
}
