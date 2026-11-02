import { KnowledgeNode } from '../types/education';

export class TreeManager {
  static findNode(root: KnowledgeNode, targetId: string): KnowledgeNode | null {
    if (root.id === targetId) return root;
    if (!root.children) return null;
    for (const child of root.children) {
      const found = TreeManager.findNode(child, targetId);
      if (found) return found;
    }
    return null;
  }

  static isDescendant(root: KnowledgeNode, ancestorId: string, potentialDescendantId: string): boolean {
    if (ancestorId === potentialDescendantId) return true;
    const ancestor = TreeManager.findNode(root, ancestorId);
    if (!ancestor) return false;
    return !!TreeManager.findNode(ancestor, potentialDescendantId);
  }

  static addNode(
    root: KnowledgeNode,
    parentId: string,
    newNode: { name: string; description: string }
  ): KnowledgeNode {
    const parent = TreeManager.findNode(root, parentId);
    if (!parent) {
      throw new Error('Nó pai não encontrado na árvore');
    }

    const created: KnowledgeNode = {
      id: 'node-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      name: newNode.name.trim(),
      description: newNode.description.trim() || 'Sem descrição definida.',
      parentId: parentId,
      level: 1,
      points: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      children: []
    };

    return TreeManager.mapTree(root, node => {
      if (node.id === parentId) {
        return {
          ...node,
          children: [...(node.children || []), created],
          updatedAt: new Date().toISOString()
        };
      }
      return node;
    });
  }

  static updateNode(
    root: KnowledgeNode,
    targetId: string,
    updates: { name?: string; description?: string }
  ): KnowledgeNode {
    return TreeManager.mapTree(root, node => {
      if (node.id === targetId) {
        return {
          ...node,
          name: updates.name !== undefined ? updates.name.trim() : node.name,
          description: updates.description !== undefined ? updates.description.trim() : node.description,
          updatedAt: new Date().toISOString()
        };
      }
      return node;
    });
  }

  static moveNode(
    root: KnowledgeNode,
    targetId: string,
    newParentId: string
  ): KnowledgeNode {
    if (targetId === root.id) {
      throw new Error('O elemento raiz supremo não pode ser movido');
    }
    if (targetId === newParentId) {
      throw new Error('Um elemento não pode se tornar pai de si mesmo');
    }
    if (TreeManager.isDescendant(root, targetId, newParentId)) {
      throw new Error('Movimento inválido: criaria um ciclo hierárquico na árvore');
    }

    const targetNode = TreeManager.findNode(root, targetId);
    if (!targetNode) throw new Error('Elemento a mover não encontrado');

    const treeWithoutTarget = TreeManager.removeNodeFromTree(root, targetId);
    if (!treeWithoutTarget) throw new Error('Falha ao desanexar nó da posição de origem');

    const updatedTarget: KnowledgeNode = {
      ...targetNode,
      parentId: newParentId,
      updatedAt: new Date().toISOString()
    };

    return TreeManager.mapTree(treeWithoutTarget, node => {
      if (node.id === newParentId) {
        return {
          ...node,
          children: [...(node.children || []), updatedTarget],
          updatedAt: new Date().toISOString()
        };
      }
      return node;
    });
  }

  static deleteNode(root: KnowledgeNode, targetId: string, softDelete = true): KnowledgeNode {
    if (targetId === root.id) {
      throw new Error('A raiz suprema não pode ser excluída');
    }

    if (softDelete) {
      return TreeManager.mapTree(root, node => {
        if (node.id === targetId || TreeManager.isDescendant(root, targetId, node.id)) {
          return { ...node, isArchived: true, updatedAt: new Date().toISOString() };
        }
        return node;
      });
    }

    const result = TreeManager.removeNodeFromTree(root, targetId);
    return result || root;
  }

  private static removeNodeFromTree(root: KnowledgeNode, targetId: string): KnowledgeNode | null {
    if (root.id === targetId) return null;
    if (!root.children) return root;

    const filteredChildren = root.children
      .filter(child => child.id !== targetId)
      .map(child => TreeManager.removeNodeFromTree(child, targetId))
      .filter((child): child is KnowledgeNode => child !== null);

    return {
      ...root,
      children: filteredChildren
    };
  }

  static mapTree(root: KnowledgeNode, fn: (node: KnowledgeNode) => KnowledgeNode): KnowledgeNode {
    const updated = fn(root);
    if (!updated.children || updated.children.length === 0) {
      return updated;
    }
    return {
      ...updated,
      children: updated.children.map(child => TreeManager.mapTree(child, fn))
    };
  }

  static getAiContext(root: KnowledgeNode): Array<{ id: string; name: string; description: string; path: string }> {
    const list: Array<{ id: string; name: string; description: string; path: string }> = [];

    function traverse(node: KnowledgeNode, currentPath: string) {
      if (node.isArchived) return;
      const path = currentPath ? currentPath + ' > ' + node.name : node.name;
      list.push({
        id: node.id,
        name: node.name,
        description: node.description,
        path
      });
      if (node.children) {
        for (const child of node.children) {
          traverse(child, path);
        }
      }
    }

    traverse(root, '');
    return list;
  }
}
