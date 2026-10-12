import * as React from "react";

import { useHasHydrated } from "./use-has-hydrated";

/**
 * State seeded from a browser-only store (localStorage) without breaking
 * hydration.
 *
 * WHY THIS EXISTS (2026-09-23, React #418 on /change-events, /support-articles,
 * /document-metadata, /errors, /estimates): the shared table state read the
 * saved row count and column list in `useState` initializers. The server has
 * no localStorage, so it rendered 50 rows; a browser that had saved 25 on
 * another table rendered 25 during hydration, and React threw away the page.
 * Only a warm browser saw it -- the crawl hit it, a fresh session never did.
 *
 * The contract, the same as `useHasHydrated`:
 * - During hydration the value is `serverValue`, exactly what the server
 *   rendered.
 * - Right after hydration the stored value is read once and applied.
 * - On a client-only mount (navigating between pages) there is no server
 *   markup to match, so the stored value is read immediately: no flash.
 *
 * `loaded` is false until the stored value has been applied. An effect that
 * WRITES the preference back must wait for it, or it saves `serverValue` over
 * the user's choice on the first commit.
 */
export function useStoredPreference<T>(
  readStored: () => T,
  serverValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>, boolean] {
  const hasHydrated = useHasHydrated();
  const [value, setValue] = React.useState<T>(() =>
    hasHydrated ? readStored() : serverValue,
  );
  const [loaded, setLoaded] = React.useState(hasHydrated);
  const readStoredRef = React.useRef(readStored);
  readStoredRef.current = readStored;

  React.useEffect(() => {
    if (loaded || !hasHydrated) return;
    setValue(readStoredRef.current());
    setLoaded(true);
  }, [hasHydrated, loaded]);

  return [value, setValue, loaded];
}
