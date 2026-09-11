import { useState } from 'react';
import { ActionIcon, Box, Button, Group, Image, Modal, Text } from '@mantine/core';
import { IconZoomIn, IconZoomOut } from '@tabler/icons-react';
import type { Photo } from '../types/api';

export function PhotoViewerModal({ photo, onClose }: { photo: Photo | null; onClose: () => void }) {
  const [zoom, setZoom] = useState(1);
  const [zoomedKey, setZoomedKey] = useState(photo?.key);
  // Reset zoom whenever a different photo is shown, without an effect (React's
  // documented "adjust state during render" pattern for prop-driven resets).
  if (photo?.key !== zoomedKey) {
    setZoomedKey(photo?.key);
    setZoom(1);
  }

  return (
    <Modal opened={photo !== null} onClose={onClose} fullScreen
      closeButtonProps={{ 'aria-label': 'Close photo' }}
      styles={{ body: { height: 'calc(100dvh - 64px)', overflow: 'hidden', padding: 0 } }}
      title={photo && <Group gap="xs" wrap="nowrap">
        <Text lineClamp={1}>{photo.camera} — {photo.timestamp.replace('T', ' ')} Pacific</Text>
        <Group gap={4} wrap="nowrap">
          <ActionIcon variant="default" aria-label="Zoom out" disabled={zoom <= 1}
            onClick={() => setZoom(value => Math.max(1, value - 0.25))}><IconZoomOut size={18} /></ActionIcon>
          <Button variant="default" size="compact-sm" aria-label="Reset zoom" onClick={() => setZoom(1)}>{Math.round(zoom * 100)}%</Button>
          <ActionIcon variant="default" aria-label="Zoom in" disabled={zoom >= 4}
            onClick={() => setZoom(value => Math.min(4, value + 0.25))}><IconZoomIn size={18} /></ActionIcon>
        </Group>
      </Group>}>
      {photo && <Box aria-label="Zoomed photo viewer" style={{ height: '100%', overflow: 'auto', background: 'var(--mantine-color-dark-9)' }}>
        <Box data-testid="photo-zoom-canvas" style={{ width: `${zoom * 100}%`, minWidth: '100%', minHeight: '100%', display: 'flex', alignItems: 'center' }}>
          <Image src={photo.url} alt={photo.camera} w="100%" fit="contain" />
        </Box>
      </Box>}
    </Modal>
  );
}
