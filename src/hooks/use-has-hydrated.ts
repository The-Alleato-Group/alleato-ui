import { useSyncExternalStore } from "react";

const subscribeToHydration = (): (() => void) => () => undefined;
const getClientSnapshot = (): boolean => true;
const getServerSnapshot = (): boolean => false;

/**
 * `false` during server rendering and during the hydration pass, `true` on
 * every client render after that.
 *
 * Use it for output that legitimately depends on the viewer's browser -- the
 * local timezone above all. The Vercel server renders in UTC, so anything
 * formatted with the viewer's zone during SSR is different text from what the
 * client produces, and React refuses to hydrate it (minified error #418).
 * Because `useSyncExternalStore` hands the hydration pass the *server*
 * snapshot, the first client render matches the server markup exactly, and the
 * real value appears in the very next render.
 *
 * One owner: `LocalDateTime` (`@/components/ds`) and `TableDateValue` both
 * gate on this hook. Do not copy the `useSyncExternalStore` triple into a
 * component; import this.
 */
export function useHasHydrated(): boolean {
  return useSyncExternalStore(
    subscribeToHydration,
    getClientSnapshot,
    getServerSnapshot,
  );
}
