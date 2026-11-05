import React, { useState } from 'react';
import { KnowledgeNode, DetailedAge } from '../types/education';
import { Award, ChevronDown, ChevronRight, TrendingUp } from 'lucide-react';

interface CurrentStateViewProps {
  childName: string;
  age: DetailedAge;
  treeWithScores: KnowledgeNode;
}

export const CurrentStateView: React.FC<CurrentStateViewProps> = ({
  childName,
  age,
  treeWithScores
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    [treeWithScores.id]: true,
    'branch-criacao': true,
    'branch-proximo': true
  });

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const rootTotalPoints = treeWithScores.totalPoints ?? treeWithScores.points ?? 0;

  const renderTreeItem = (node: KnowledgeNode, depth = 0) => {
    if (node.isArchived) return null;
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = !!expandedNodes[node.id];
    const nodePoints = node.totalPoints ?? node.points ?? 0;

    return (
      <div key={node.id} style={{ marginLeft: depth > 0 ? '1.5rem' : '0', marginTop: '0.65rem' }}>
        <div
          onClick={() => hasChildren && toggleNode(node.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1rem',
            backgroundColor: depth === 0 ? 'var(--rose-soft)' : 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: '10px',
            cursor: hasChildren ? 'pointer' : 'default',
            boxShadow: depth === 0 ? 'var(--shadow-subtle)' : 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {hasChildren ? (
              <button
                type='button'
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(node.id);
                }}
                style={{
                  color: 'var(--rose-burnished)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '20px',
                  height: '20px'
                }}
              >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            ) : (
              <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: 'var(--border-delicate)' }} />
              </div>
            )}

            <div>
              <span style={{
                fontSize: depth === 0 ? '1.05rem' : '0.92rem',
                fontWeight: depth === 0 ? 600 : 500,
                color: 'var(--text-primary)',
                fontFamily: depth <= 1 ? 'var(--font-serif)' : 'var(--font-sans)'
              }}>
                {node.name}
              </span>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {node.description}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '0.2rem 0.6rem',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-accent)',
              border: '1px solid var(--border-delicate)',
              color: 'var(--rose-burnished)'
            }}>
              <span>Nível {node.level ?? 1}</span>
            </div>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              padding: '0.25rem 0.65rem',
              borderRadius: '6px',
              backgroundColor: nodePoints > 0 ? 'var(--rose-antique)' : 'var(--bg-accent)',
              color: nodePoints > 0 ? '#FFF' : 'var(--text-muted)',
              border: nodePoints > 0 ? 'none' : '1px solid var(--border-delicate)'
            }}>
              <span>{nodePoints} pts</span>
            </div>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div style={{ borderLeft: '1px solid var(--border-light)', marginLeft: '0.65rem' }}>
            {node.children!.map(child => renderTreeItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          Estado Atual do Desenvolvimento
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6 }}>
          Visão consolidada da formação de {childName} ({age.formatted}), calculada a partir das atividades confirmadas e calibrada para a faixa etária.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-card)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--rose-burnished)', marginBottom: '0.5rem' }}>
            <Award size={18} />
            <span style={{ fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Pontuação Geral Acumulada
            </span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {rootTotalPoints} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}>pts</span>
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-card)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--rose-burnished)', marginBottom: '0.5rem' }}>
            <TrendingUp size={18} />
            <span style={{ fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Nível Agregado
            </span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--rose-deep)' }}>
            Nível {treeWithScores.level ?? 1}
          </div>
        </div>
      </div>

      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-card)',
        padding: '1.75rem',
        boxShadow: 'var(--shadow-subtle)'
      }}>
        <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>
            Progresso Hierárquico por Ramo
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Os pontos de ramos filhos acumulam-se nos ramos pais
          </span>
        </div>

        {renderTreeItem(treeWithScores)}
      </div>
    </div>
  );
};
