import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { KnowledgeNode } from '../types/education';

interface TreeNodeModalProps {
  mode: 'add-sub' | 'edit';
  node: KnowledgeNode;
  onClose: () => void;
  onSave: (name: string, description: string) => void;
}

export const TreeNodeModal: React.FC<TreeNodeModalProps> = ({ mode, node, onClose, onSave }) => {
  const [name, setName] = useState(mode === 'edit' ? node.name : '');
  const [desc, setDesc] = useState(mode === 'edit' ? node.description : '');

  useEffect(() => {
    setName(mode === 'edit' ? node.name : '');
    setDesc(mode === 'edit' ? node.description : '');
  }, [mode, node]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), desc.trim());
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(52, 41, 39, 0.45)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-card)',
        border: '1px solid var(--border-light)',
        width: '100%',
        maxWidth: '500px',
        padding: '2rem',
        boxShadow: 'var(--shadow-elevated)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.4rem', color: 'var(--text-primary)' }}>
            {mode === 'edit' ? 'Editar Elemento' : 'Novo Subconjunto: ' + node.name}
          </h3>
          <button type="button" onClick={onClose} style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--rose-burnished)', marginBottom: '0.4rem' }}>
              Nome do Ramo
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Virtude da Prudência, Botânica..."
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border-delicate)',
                backgroundColor: 'var(--bg-accent)',
                color: 'var(--text-primary)',
                fontSize: '0.95rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--rose-burnished)', marginBottom: '0.4rem' }}>
              Descrição e Finalidade Superior
            </label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Descreva a finalidade formativa deste elemento..."
              rows={4}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border-delicate)',
                backgroundColor: 'var(--bg-accent)',
                color: 'var(--text-primary)',
                fontSize: '0.92rem',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-delicate)',
                color: 'var(--text-secondary)',
                fontSize: '0.88rem',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                padding: '0.65rem 1.45rem',
                borderRadius: '8px',
                backgroundColor: 'var(--rose-antique)',
                color: '#FFF',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
