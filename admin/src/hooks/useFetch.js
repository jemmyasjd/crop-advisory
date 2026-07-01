import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';

/**
 * Fetch helper with loading/error state and a `reload` function.
 * @param {() => Promise<any>} fetcher
 * @param {Array} deps
 */
export default function useFetch(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetcher();
      setData(result);
    } catch (err) {
      toast.error(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, reload, setData };
}
