import { useEffect, useState } from 'react';
import { cropsApi, stagesApi, diseasesApi } from '../api/services';

/**
 * Loads reference lists (crops, stages, diseases) for use as select options.
 * Loaded once per mount; failures are non-fatal (returns empty arrays).
 */
export default function useOptions({ crops, stages, diseases } = {}) {
  const [data, setData] = useState({ crops: [], stages: [], diseases: [] });

  useEffect(() => {
    const tasks = [];
    if (crops) tasks.push(cropsApi.list().then((d) => ['crops', d]));
    if (stages) tasks.push(stagesApi.list().then((d) => ['stages', d]));
    if (diseases) tasks.push(diseasesApi.list().then((d) => ['diseases', d]));

    Promise.allSettled(tasks).then((results) => {
      const next = {};
      results.forEach((r) => {
        if (r.status === 'fulfilled') next[r.value[0]] = r.value[1] || [];
      });
      setData((prev) => ({ ...prev, ...next }));
    });
  }, [crops, stages, diseases]);

  return data;
}
