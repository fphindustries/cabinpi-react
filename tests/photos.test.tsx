// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { MemoryRouter } from 'react-router-dom';
import Photos from '../src/pages/Photos';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', { writable: true, value: () => ({ matches: false,
    addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }) });
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function photo(camera: string, time = '10:00') {
  const filename = `${camera}-2026-09-08-${time.replace(':', '-')}.jpg`;
  return { key: `2026/09/08/${filename}`, filename, camera, timestamp: `2026-09-08T${time}:00`, url: `/api/photos/2026/09/08/${filename}` };
}
function response(photos = [photo('Fire Pit')], cursor: string | null = null, date: string | null = '2026-09-08') {
  return Response.json({ success: true, photos, cursor, date, count: photos.length });
}
function gallery() {
  return render(<MantineProvider><MemoryRouter><Photos /></MemoryRouter></MantineProvider>);
}

describe('Photo gallery', () => {
  it('loads another page and opens an accessible photo modal', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(response([photo('Fire Pit')], 'next'))
      .mockResolvedValueOnce(response([photo('Parking', '11:00')]));
    gallery();
    const card = await screen.findByRole('button', { name: 'View Fire Pit at 10:00' });
    fireEvent.click(card);
    expect(await screen.findByRole('dialog')).toBeTruthy();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    fireEvent.click(screen.getByRole('button', { name: 'Load more photos' }));
    expect(await screen.findByRole('button', { name: 'View Parking at 11:00' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Load more photos' })).toBeNull();
    expect(fetch).toHaveBeenLastCalledWith('/api/photos?date=2026-09-08&cursor=next', expect.any(Object));
  });
  it('navigates relative to the returned latest day and ignores stale page responses', async () => {
    let finishPage: (value: Response) => void = () => {};
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(response([photo('Fire Pit')], 'next'))
      .mockImplementationOnce(() => new Promise(resolve => { finishPage = resolve; }))
      .mockResolvedValueOnce(response([], null, '2026-09-07'));
    gallery();
    await screen.findByRole('button', { name: 'View Fire Pit at 10:00' });
    fireEvent.click(screen.getByRole('button', { name: 'Load more photos' }));
    fireEvent.click(screen.getByRole('button', { name: 'Previous Day' }));
    await screen.findByText('No photos available for this date.');
    await act(async () => { finishPage(response([photo('Parking')])); });
    expect(screen.queryByRole('button', { name: 'View Parking at 10:00' })).toBeNull();
    expect(fetch).toHaveBeenLastCalledWith('/api/photos?date=2026-09-07', expect.any(Object));
  });
  it('shows a session error and allows retry', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('<html>Sign in</html>', { headers: { 'Content-Type': 'text/html' } }))
      .mockResolvedValueOnce(response([], null, null));
    gallery();
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.queryByText('No photos available for this date.')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('No photos available for this date.')).toBeTruthy();
  });
});
