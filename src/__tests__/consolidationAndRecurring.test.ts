import { describe, it, expect, beforeEach } from "vitest";
import { StorageService } from "../services/storageService";
import { CONSOLIDATION_LEVELS_META, ConsolidationLevel } from "../types/education";

describe("Régua de Consolidação e Atividades Recorrentes", () => {
  let mockStore: Record<string, string> = {};

  beforeEach(() => {
    mockStore = {};
    const mockLocalStorage = {
      getItem: (key: string) => mockStore[key] || null,
      setItem: (key: string, value: string) => {
        mockStore[key] = value;
      },
      removeItem: (key: string) => {
        delete mockStore[key];
      },
      clear: () => {
        mockStore = {};
      }
    };

    Object.defineProperty(globalThis, "localStorage", {
      value: mockLocalStorage,
      writable: true,
      configurable: true
    });
  });

  it("deve conter metadados consistentes para todos os 5 níveis da régua de consolidação", () => {
    const levels: ConsolidationLevel[] = [1, 2, 3, 4, 5];
    levels.forEach(lvl => {
      const meta = CONSOLIDATION_LEVELS_META[lvl];
      expect(meta).toBeDefined();
      expect(meta.level).toBe(lvl);
      expect(meta.title).toBeTruthy();
      expect(meta.shortLabel).toBeTruthy();
      expect(meta.description).toBeTruthy();
    });
  });

  it("deve cadastrar atividade recorrente e evitar duplicatas sem distinção de caixa alta/baixa", () => {
    const list1 = StorageService.saveRecurringActivity("Leitura de história antes de dormir");
    expect(list1.length).toBe(1);
    expect(list1[0].description).toBe("Leitura de história antes de dormir");
    expect(list1[0].usageCount).toBe(0);

    const list2 = StorageService.saveRecurringActivity("  leitura de história antes de dormir  ");
    expect(list2.length).toBe(1);
  });

  it("deve incrementar contador de utilizações de uma atividade recorrente", () => {
    const list = StorageService.saveRecurringActivity("Prática de piano");
    const id = list[0].id;

    StorageService.recordRecurringActivityUsage(id);
    const updated = StorageService.getRecurringActivities();
    const item = updated.find(r => r.id === id);
    expect(item?.usageCount).toBe(1);
    expect(item?.lastUsedAt).toBeDefined();
  });

  it("deve excluir atividade recorrente corretamente", () => {
    const list = StorageService.saveRecurringActivity("Arrumar os brinquedos");
    const id = list[0].id;

    const remaining = StorageService.deleteRecurringActivity(id);
    expect(remaining.some(r => r.id === id)).toBe(false);
  });
});
