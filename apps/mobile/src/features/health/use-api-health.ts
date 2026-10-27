import { useCallback, useEffect, useState } from 'react';
import { API_VERSION, healthResponseSchema } from '@vmt/shared';
import { apiRequest } from '@/shared/api/client';

export type ApiHealth = 'checking' | 'ok' | 'unreachable';

function probeHealth(): Promise<ApiHealth> {
  return apiRequest(`/${API_VERSION}/health`, healthResponseSchema).then(
    (): ApiHealth => 'ok',
    (): ApiHealth => 'unreachable',
  );
}

export function useApiHealth(): { health: ApiHealth; recheck: () => void } {
  const [health, setHealth] = useState<ApiHealth>('checking');

  useEffect(() => {
    let active = true;
    void probeHealth().then((result) => {
      if (active) setHealth(result);
    });
    return () => {
      active = false;
    };
  }, []);

  const recheck = useCallback(() => {
    setHealth('checking');
    void probeHealth().then(setHealth);
  }, []);

  return { health, recheck };
}
