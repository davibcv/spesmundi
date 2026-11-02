import { describe, it, expect } from 'vitest';
import { TreeManager } from '../domain/treeManager';
import { KnowledgeNode } from '../types/education';

const baseTree: KnowledgeNode = {
  id: 'root',
  name: 'Raiz',
  description: 'Raiz do sistema',
  level: 1,
  points: 0,
  children: [
    {
      id: 'branch-a',
      name: 'Ramo A',
      description: 'Desc A',
      level: 1,
      points: 0,
      children: [
        { id: 'leaf-1', name: 'Folha 1', description: 'Desc Folha 1', level: 1, points: 0 }
      ]
    },
    {
      id: 'branch-b',
      name: 'Ramo B',
      description: 'Desc B',
      level: 1,
      points: 0
    }
  ]
};

describe('TreeManager', () => {
  it('localiza nós existentes corretamente', () => {
    const node = TreeManager.findNode(baseTree, 'leaf-1');
    expect(node).not.toBeNull();
    expect(node?.name).toBe('Folha 1');
  });

  it('adiciona novo nó a um conjunto existente', () => {
    const updated = TreeManager.addNode(baseTree, 'branch-b', { name: 'Novo Subconjunto', description: 'Nova desc' });
    const added = TreeManager.findNode(updated, 'branch-b');
    expect(added?.children?.length).toBe(1);
    expect(added?.children?.[0].name).toBe('Novo Subconjunto');
  });

  it('move nó entre conjuntos sem criar ciclos', () => {
    const updated = TreeManager.moveNode(baseTree, 'leaf-1', 'branch-b');
    const branchA = TreeManager.findNode(updated, 'branch-a');
    const branchB = TreeManager.findNode(updated, 'branch-b');
    expect(branchA?.children?.length).toBe(0);
    expect(branchB?.children?.some(c => c.id === 'leaf-1')).toBe(true);
  });

  it('impede movimentação que provocaria ciclo', () => {
    expect(() => TreeManager.moveNode(baseTree, 'branch-a', 'leaf-1')).toThrow(/ciclo hierárquico/);
  });

  it('impede excluir a raiz suprema', () => {
    expect(() => TreeManager.deleteNode(baseTree, 'root')).toThrow(/raiz suprema/);
  });

  it('gera contexto serializado para a IA', () => {
    const context = TreeManager.getAiContext(baseTree);
    expect(context.length).toBe(4);
    expect(context.find(c => c.id === 'leaf-1')?.path).toBe('Raiz > Ramo A > Folha 1');
  });
});
