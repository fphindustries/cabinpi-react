// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { MemoryRouter } from 'react-router-dom';
import { RecentPhotosCard } from '../src/components/RecentPhotosCard';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', { writable: true, value: () => ({ matches: false,
    addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }) });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function photo(camera: string, time: string) {
  const filename = `${camera}-2026-09-08-${time.replace(':', '-')}.jpg`;
  return { key: `2026/09/08/${filename}`, filename, camera, timestamp: `2026-09-08T${time}:00`, url: `/api/photos/2026/09/08/${filename}` };
}

describe('RecentPhotosCard', () => {
  it('sorts the latest-day photos, limits the card to four, and links to the gallery', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ success: true, date: '2026-09-08', cursor: null,
      photos: [photo('Oldest', '08:00'), photo('Second', '10:00'), photo('Newest', '12:00'), photo('Third', '11:00'), photo('Fourth', '09:00')], count: 5 }));
    render(<MantineProvider><MemoryRouter><RecentPhotosCard /></MemoryRouter></MantineProvider>);

    expect(await screen.findByAltText('Newest, 9/8, 12:00 Pacific')).toBeTruthy();
    expect(screen.getByAltText('Second, 9/8, 10:00 Pacific')).toBeTruthy();
    expect(screen.queryByAltText('Oldest, 9/8, 08:00 Pacific')).toBeNull();
    expect(screen.getByRole('link', { name: 'View all' }).getAttribute('href')).toBe('/photos');
    expect(fetch).toHaveBeenCalledWith('/api/photos?recent=4', expect.any(Object));
  });
});
