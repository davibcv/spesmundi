import React, { useState } from 'react';
import { KnowledgeNode } from '../types/education';
import { TreeNodeModal } from './TreeNodeModal';
import { TreePine, Plus, Edit2, ChevronDown, ChevronRight, Info, Trash2 } from 'lucide-react';

interface KnowledgeTreeViewProps {
  tree: KnowledgeNode;
  onAddNode: (parentId: string, data: { name: string; description: string }) => void;
  onUpdateNode: (targetId: string, updates: { name?: string; description?: string }) => void;
  onDeleteNode: (targetId: string) => void;
}

export const KnowledgeTreeView: React.FC<KnowledgeTreeViewProps> = ({
  tree,
  onAddNode,
  onUpdateNode,
  onDeleteNode
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>(tree.id);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    [tree.id]: true,
    'branch-criacao': true,
    'branch-proximo': true
  });
  const [modalMode, setModalMode] = useState<'add-sub' | 'edit' | null>(null);

  const findInTree = (node: KnowledgeNode, id: string): KnowledgeNode | null => {
    if (node.id === id) return node;
    if (!node.children) return null;
    for (const child of node.children) {
      const found = findInTree(child, id);
      if (found) return found;
    }
    return null;
  };

  const selectedNode = findInTree(tree, selectedNodeId) || tree;

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = (name: string, description: string) => {
    if (modalMode === 'edit') {
      onUpdateNode(selectedNode.id, { name, description });
    } else if (modalMode === 'add-sub') {
      onAddNode(selectedNode.id, { name, description });
      setExpandedNodes(prev => ({ ...prev, [selectedNode.id]: true }));
    }
    setModalMode(null);
  };

  const handleDelete = () => {
    if (selectedNode.id === tree.id) {
      alert('A raiz suprema não pode ser excluída.');
      return;
    }
    if (window.confirm('Deseja realmente arquivar este elemento da Árvore?')) {
      onDeleteNode(selectedNode.id);
      setSelectedNodeId(tree.id);
    }
  };

  const renderTreeItem = (node: KnowledgeNode, depth = 0) => {
    if (node.isArchived) return null;
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = !!expandedNodes[node.id];
    const isSelected = selectedNode.id === node.id;

    return (
      <div key={node.id} style={{ marginLeft: depth > 0 ? '1.5rem' : '0', marginTop: '0.45rem' }}>
        <div
          onClick={() => setSelectedNodeId(node.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.65rem 0.95rem',
            backgroundColor: isSelected ? 'var(--rose-soft)' : depth === 0 ? 'var(--bg-accent)' : 'var(--bg-card)',
            border: isSelected ? '1px solid var(--border-delicate)' : '1px solid var(--border-light)',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1 }}>
            {hasChildren ? (
              <button
                type='button'
                onClick={(e) => toggleExpand(node.id, e)}
                style={{
                  color: 'var(--rose-burnished)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '22px',
                  height: '22px'
                }}
              >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            ) : (
              <div style={{ width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--border-delicate)' }} />
              </div>
            )}

            <div>
              <span style={{
                fontSize: depth === 0 ? '1.05rem' : depth === 1 ? '0.96rem' : '0.9rem',
                fontWeight: depth <= 1 ? 600 : 500,
                color: isSelected ? 'var(--rose-deep)' : 'var(--text-primary)',
                fontFamily: depth <= 1 ? 'var(--font-serif)' : 'var(--font-sans)'
              }}>
                {node.name}
              </span>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {node.description}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              type='button'
              onClick={(e) => {
                e.stopPropagation();
                setSelectedNodeId(node.id);
                setModalMode('add-sub');
              }}
              title='Adicionar Subconjunto'
              style={{
                color: 'var(--rose-burnished)',
                padding: '0.25rem',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Plus size={15} />
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div style={{ borderLeft: '1px solid var(--border-light)', marginLeft: '0.7rem' }}>
            {node.children!.map(child => renderTreeItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          Árvore do Conhecimento
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6 }}>
          Estrutura viva e formativa organizada a partir da finalidade última. Todos os ramos e subconjuntos convergem para o amor a Deus e ao próximo.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.1fr', gap: '2rem', alignItems: 'start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <TreePine size={18} color='var(--rose-burnished)' />
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>Estrutura Hierárquica</h3>
          </div>

          <div style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-card)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-subtle)'
          }}>
            {renderTreeItem(tree)}
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-card)',
          padding: '2rem',
          boxShadow: 'var(--shadow-subtle)',
          minHeight: '380px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--rose-burnished)' }}>
                <Info size={17} />
                <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Detalhes do Ramo</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type='button'
                  onClick={() => setModalMode('edit')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.4rem 0.75rem',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-delicate)',
                    color: 'var(--rose-deep)',
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  <Edit2 size={13} />
                  <span>Editar</span>
                </button>
                {selectedNode.id !== tree.id && (
                  <button
                    type='button'
                    onClick={handleDelete}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.4rem 0.75rem',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-delicate)',
                      color: 'var(--rose-burnished)',
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Arquivar</span>
                  </button>
                )}
              </div>
            </div>

            <h3 style={{ fontSize: '1.6rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{selectedNode.name}</h3>
            <div style={{
              display: 'inline-block',
              fontSize: '0.75rem',
              padding: '0.25rem 0.65rem',
              borderRadius: '6px',
              backgroundColor: 'var(--rose-soft)',
              color: 'var(--rose-deep)',
              marginBottom: '1.25rem',
              border: '1px solid var(--border-delicate)'
            }}>
              Identificador: {selectedNode.id}
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <span style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Descrição e Finalidade
              </span>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                {selectedNode.description}
              </p>
            </div>

            <div>
              <span style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.45rem' }}>
                Relação de Pertencimento
              </span>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-card)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                {selectedNode.id === tree.id ? (
                  <span>Princípio Primeiro e Fundamental (Raiz Suprema)</span>
                ) : (
                  <span>Subordinado teleologicamente aos princípios superiores da criação e do próximo.</span>
                )}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-delicate)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5, display: 'block' }}>
              Modificações e adições persistem no armazenamento local e estruturam as análises pedagógicas da inteligência artificial.
            </span>
          </div>
        </div>
      </div>

      {modalMode && (
        <TreeNodeModal
          mode={modalMode}
          node={selectedNode}
          onClose={() => setModalMode(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};
