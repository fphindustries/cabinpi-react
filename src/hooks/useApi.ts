import { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';

/** Cancel obsolete requests and schedule polling only after the last request settles. */
export function useApi<T>(path: string, refreshMs?: number) {
  const [state, setState] = useState<{ path: string; data: T | null; error: string | null; loading: boolean }>({
    path, data: null, error: null, loading: true,
  });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let timeout: ReturnType<typeof setTimeout> | undefined;
    async function load() {
      try {
        const data = await apiRequest<T>(path, controller.signal);
        if (!controller.signal.aborted) setState({ path, data, error: null, loading: false });
      } catch (error) {
        if (!controller.signal.aborted) setState({ path, data: null,
          error: error instanceof Error ? error.message : 'Unable to load data', loading: false });
      } finally {
        if (refreshMs && !controller.signal.aborted) timeout = setTimeout(() => { void load(); }, refreshMs);
      }
    }
    void load();
    return () => { controller.abort(); clearTimeout(timeout); };
  }, [path, refreshMs, revision]);
  return {
    ...(state.path === path ? state : { data: null, error: null, loading: true }),
    retry: () => setRevision(value => value + 1),
  };
}
