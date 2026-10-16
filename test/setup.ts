// jsdom has no ResizeObserver; the Table's scroll container (Radix ScrollArea)
// needs one to mount.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;

// jsdom has no media-query API; individual responsive tests can override it.
window.matchMedia ??= ((query: string) => ({
  matches: query.includes("max-width") && window.innerWidth < 768,
  media: query,
  onchange: null,
  addListener() {}, removeListener() {},
  addEventListener() {}, removeEventListener() {},
  dispatchEvent: () => true,
})) as typeof window.matchMedia;
