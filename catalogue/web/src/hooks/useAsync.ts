import { useCallback, useEffect, useRef, useState } from 'react';

type AsyncState<T> = { data: T | null; error: Error | null; loading: boolean };

export function useAsync<T>(fn: () => Promise<T>, deps: readonly unknown[]): AsyncState<T> & { reload: () => void } {
  const fnRef = useRef(fn);
  const [reloadCount, setReloadCount] = useState(0);
  const [state, setState] = useState<AsyncState<T>>({ data: null, error: null, loading: true });
  fnRef.current = fn;

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  useEffect(() => {
    let current = true;
    setState({ data: null, loading: true, error: null });
    fnRef.current().then((data) => {
      if (current) setState({ data, error: null, loading: false });
    }).catch((error: unknown) => {
      if (current) setState({ data: null, error: error instanceof Error ? error : new Error('Request failed.'), loading: false });
    });
    return () => { current = false; };
    // The supplied dependency list is the page's request identity; fnRef avoids reruns from inline closures.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadCount]);

  return { ...state, reload };
}
