import { SpesMundiStorageState, ChildProfile, KnowledgeNode, ActivityRecord, LevelCalibrationConfig } from '../types/education';
import { initialTree } from '../data/initialTree';

const STORAGE_KEY = 'spes_mundi_data_v1';

export const DEFAULT_CHILD: ChildProfile = {
  id: 'child-1',
  name: 'Catarina',
  birthDate: '2022-02-14',
  notes: 'Formação educativa integral baseada na contemplação do cosmos e amor ao próximo.',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const DEFAULT_LEVEL_CONFIG: LevelCalibrationConfig = {
  baseXpForLevel10: 50,
  baseXpForLevel100: 5000,
  powerFactor: 1.75,
  ageAdjustmentWeight: 0.04
};

export function createDefaultState(): SpesMundiStorageState {
  return {
    version: 1,
    child: { ...DEFAULT_CHILD },
    tree: JSON.parse(JSON.stringify(initialTree)),
    activities: [],
    levelConfig: { ...DEFAULT_LEVEL_CONFIG },
    apiConfig: {}
  };
}

export class StorageService {
  private static mockStore: Record<string, string> = {};

  private static getItem(key: string): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return StorageService.mockStore[key] || null;
  }

  private static setItem(key: string, value: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    } else {
      StorageService.mockStore[key] = value;
    }
  }

  static loadState(): SpesMundiStorageState {
    try {
      const raw = StorageService.getItem(STORAGE_KEY);
      if (!raw) {
        const defaults = createDefaultState();
        StorageService.saveState(defaults);
        return defaults;
      }
      const parsed = JSON.parse(raw);
      if (!parsed.child || !parsed.tree || !Array.isArray(parsed.activities)) {
        throw new Error('Esquema corrompido');
      }
      return parsed as SpesMundiStorageState;
    } catch {
      const fallback = createDefaultState();
      StorageService.saveState(fallback);
      return fallback;
    }
  }

  static saveState(state: SpesMundiStorageState): void {
    state.version = 1;
    StorageService.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  static updateChild(child: Partial<ChildProfile>): ChildProfile {
    const state = StorageService.loadState();
    state.child = {
      ...state.child,
      ...child,
      updatedAt: new Date().toISOString()
    };
    StorageService.saveState(state);
    return state.child;
  }

  static updateTree(tree: KnowledgeNode): KnowledgeNode {
    const state = StorageService.loadState();
    state.tree = tree;
    StorageService.saveState(state);
    return state.tree;
  }

  static saveActivity(activity: ActivityRecord): ActivityRecord[] {
    const state = StorageService.loadState();
    const index = state.activities.findIndex(a => a.id === activity.id);
    if (index >= 0) {
      state.activities[index] = activity;
    } else {
      state.activities.unshift(activity);
    }
    StorageService.saveState(state);
    return state.activities;
  }

  static deleteActivity(id: string): ActivityRecord[] {
    const state = StorageService.loadState();
    state.activities = state.activities.filter(a => a.id !== id);
    StorageService.saveState(state);
    return state.activities;
  }

  static exportBackupJSON(): string {
    const state = StorageService.loadState();
    return JSON.stringify(state, null, 2);
  }

  static importBackupJSON(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed.child || !parsed.tree || !Array.isArray(parsed.activities)) {
        return false;
      }
      StorageService.saveState(parsed);
      return true;
    } catch {
      return false;
    }
  }

  static clearMockStore(): void {
    StorageService.mockStore = {};
  }
}
