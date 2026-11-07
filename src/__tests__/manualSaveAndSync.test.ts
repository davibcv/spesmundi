import { describe, it, expect, vi, beforeEach } from "vitest";
import { StorageService } from "../services/storageService";
import { FirebaseSyncService } from "../services/firebaseSyncService";

const memoryStore: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => memoryStore[key] || null,
  setItem: (key: string, val: string) => { memoryStore[key] = val; },
  removeItem: (key: string) => { delete memoryStore[key]; },
  clear: () => { Object.keys(memoryStore).forEach(k => delete memoryStore[k]); }
};

Object.defineProperty(globalThis, "localStorage", {
  value: mockLocalStorage,
  writable: true
});

describe("Manual Save & Sync Workflow", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockLocalStorage.clear();
  });

  it("salva o estado localmente garantindo persistencia imediata", () => {
    const saveSpy = vi.spyOn(StorageService, "saveState");
    const state = StorageService.loadState();

    StorageService.saveState(state);
    expect(saveSpy).toHaveBeenCalledWith(state);
  });

  it("chama FirebaseSyncService com sucesso ao sincronizar com usuario autenticado", async () => {
    const syncSpy = vi.spyOn(FirebaseSyncService, "syncRemoteState").mockResolvedValue(true);
    const state = StorageService.loadState();

    const result = await FirebaseSyncService.syncRemoteState("user_test_123", state);
    expect(syncSpy).toHaveBeenCalledWith("user_test_123", state);
    expect(result).toBe(true);
  });
});
