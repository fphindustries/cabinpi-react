import { Anchor, Card, Group, Image, SimpleGrid, Skeleton, Stack, Text, Title } from '@mantine/core';
import { IconPhoto } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { recentPhotosPath } from '../lib/api';
import { formatChartDate } from '../lib/dateUtils';
import type { PhotoResponse } from '../types/api';

const PHOTO_COUNT = 4;

export function RecentPhotosCard() {
  const { data, loading, error } = useApi<PhotoResponse>(recentPhotosPath(), 300000);
  const photos = [...(data?.photos ?? [])]
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || left.camera.localeCompare(right.camera))
    .slice(0, PHOTO_COUNT);

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between">
          <Group gap="xs">
            <IconPhoto size={24} />
            <Title order={3}>Latest Photos</Title>
          </Group>
          <Anchor component={Link} to="/photos" size="sm">View all</Anchor>
        </Group>

        {loading && <SimpleGrid cols={{ base: 2, sm: 4 }}>
          {Array.from({ length: PHOTO_COUNT }, (_, index) => <Skeleton key={index} h={150} radius="sm" />)}
        </SimpleGrid>}
        {error && <Text c="red" size="sm">Unable to load photos: {error}</Text>}
        {!loading && !error && photos.length === 0 && <Text c="dimmed">No photos available.</Text>}
        {!loading && !error && photos.length > 0 && <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
          {photos.map(photo => (
            <Anchor component={Link} to="/photos" key={photo.key} underline="never" c="inherit"
              aria-label={`View ${photo.camera} captured ${formatChartDate(photo.timestamp)}`}>
              <Image src={photo.url} alt={`${photo.camera}, ${formatChartDate(photo.timestamp)} Pacific`}
                h={150} fit="cover" radius="sm" loading="lazy" decoding="async" />
              <Text size="sm" fw={500} mt={4} lineClamp={1}>{photo.camera}</Text>
              <Text size="xs" c="dimmed">{formatChartDate(photo.timestamp)} Pacific</Text>
            </Anchor>
          ))}
        </SimpleGrid>}
      </Stack>
    </Card>
  );
}
