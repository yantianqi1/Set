import { vi } from "vitest";

if (globalThis.fetch === undefined) {
  globalThis.fetch = vi.fn();
}

const store: Record<string, string> = {};

vi.stubGlobal("localStorage", {
  getItem(key: string) {
    return store[key] ?? null;
  },
  setItem(key: string, value: string) {
    store[key] = value;
  },
  removeItem(key: string) {
    delete store[key];
  },
  clear() {
    Object.keys(store).forEach((key) => delete store[key]);
  }
});
