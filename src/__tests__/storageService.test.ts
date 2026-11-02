import { describe, it, expect, beforeEach } from 'vitest';
import { StorageService } from '../services/storageService';

describe('StorageService', () => {
  beforeEach(() => {
    StorageService.clearMockStore();
  });

  it('inicializa com estado padrão e dados corretos', () => {
    const state = StorageService.loadState();
    expect(state.child.name).toBe('Catarina');
    expect(state.child.birthDate).toBe('2022-02-14');
    expect(state.tree.name).toBe('Amar a Deus e ao Próximo');
    expect(state.activities).toEqual([]);
  });

  it('permite atualizar o cadastro da criança', () => {
    StorageService.updateChild({ name: 'Catarina Vieira' });
    const state = StorageService.loadState();
    expect(state.child.name).toBe('Catarina Vieira');
  });

  it('exporta e importa backup mantendo a integridade', () => {
    StorageService.updateChild({ name: 'Catarina Modificada' });
    const backup = StorageService.exportBackupJSON();
    StorageService.clearMockStore();
    expect(StorageService.importBackupJSON(backup)).toBe(true);
    expect(StorageService.loadState().child.name).toBe('Catarina Modificada');
  });

  it('rejeita JSON malformado na importação de backup', () => {
    expect(StorageService.importBackupJSON('json-invalido')).toBe(false);
  });
});
