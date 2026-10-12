/**
 * Layout contract for a full-height split view (list pane + reading pane) that
 * renders inside the app shell — `/emails?tab=…`, `/teams-conversations`, and
 * any future inbox-style surface.
 *
 * The shell already owns the height. `SidebarInset` is `h-svh overflow-hidden`,
 * its scroller is `flex-1 overflow-auto`, and `<main>` may add its own padding
 * and gaps. A split view must FILL whatever is left — hence `flex-1` +
 * `min-h-0`, never its own viewport math.
 *
 * A hardcoded `h-[calc(100vh-4rem)]` guesses that the chrome above and below is
 * exactly 4rem. It is not, so the pane renders taller than its visible box: the
 * shell scroller (which is `scrollbar-hide`) silently absorbs the excess and the
 * panes get chopped off mid-height with no scrollbar to explain why.
 *
 * `flex-1` sets `flex-basis: 0%`, so it — not `h-full` — decides the height in
 * the shell's flex column. `h-full` is kept for any non-flex parent.
 *
 * The `app-shell-split-view` marker class carries no layout of its own — it lets
 * `<main>` drop its vertical padding (see globals.css) so the panes reach the
 * bottom edge of the viewport instead of stopping short.
 */
export const APP_SHELL_SPLIT_VIEW_CLASSNAME =
  "app-shell-split-view flex h-full min-h-0 flex-1 w-full overflow-hidden bg-background";

/** The marker class alone, for panes that compose their own flex direction. */
export const APP_SHELL_SPLIT_VIEW_MARKER = "app-shell-split-view";

/**
 * Opt-in marker for a pane that is NOT a direct child of `<main>`.
 *
 * The globals.css rules for the plain marker use `main:has(> …)`, so they only
 * fire for a pane `<main>` renders directly (e.g. `/teams-conversations`). A pane
 * nested inside `PageShell` needs the whole ancestor chain to give up its padding
 * and become a shrinkable flex column — that is what this marker enables.
 *
 * It is a second class rather than a looser `:has()` on the first so that adding
 * a nested pane cannot silently change the layout of an existing one.
 */
export const APP_SHELL_SPLIT_VIEW_NESTED_MARKER = "app-shell-split-view-nested";

/**
 * Column-direction variant: a header band stacked above the split body, rather
 * than a bare list | reading-pane row. Same contract, `flex-col`.
 *
 * Used by the /site-map admin-pages and access-review tabs, which put a title +
 * tab bar above the list/editor split. That pane is NOT a direct child of
 * `<main>` — it renders inside `PageShell` → `PageContainer` → a `pt-2 pb-12`
 * content div — so this variant also carries
 * `APP_SHELL_SPLIT_VIEW_NESTED_MARKER`, whose globals.css rules walk the whole
 * ancestor chain. Two things are required of every wrapper in that chain, and
 * both are easy to get wrong:
 *
 *   - `min-height: 0`, or a flex child cannot shrink below its content.
 *   - `display: flex`, or this pane's `flex-1` has no flex container to resolve
 *     against and falls back to its intrinsic content height. It then gets
 *     *clipped* by `<main>`'s `overflow: hidden`, which looks fixed from the
 *     outside — measured 7385px tall on /site-map while appearing correct.
 *
 * When verifying a nested pane, check `pane.bottom` vs `window.innerHeight` AND
 * scan for subtrees where `scrollHeight > clientHeight` under `overflow: hidden`
 * (the silent-clip signature). A screenshot alone cannot tell the two apart.
 */
export const APP_SHELL_SPLIT_VIEW_COLUMN_CLASSNAME =
  "app-shell-split-view app-shell-split-view-nested flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden";
