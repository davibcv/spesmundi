import React, { useState } from 'react';
import { CheckCircle2, Sparkles, BookOpen, Clock, Trash2, Check, RefreshCw } from 'lucide-react';
import { KnowledgeNode, ActivityRecord, AIAnalysisProposal, DetailedAge, NodeScoreAssignment } from '../types/education';
import { AIService } from '../services/aiService';

interface ActivitiesViewProps {
  childName: string;
  childAge: DetailedAge;
  tree: KnowledgeNode;
  activities: ActivityRecord[];
  onSaveActivity: (activity: ActivityRecord) => void;
  onDeleteActivity: (id: string) => void;
}

export const ActivitiesView: React.FC<ActivitiesViewProps> = ({
  childName,
  childAge,
  tree,
  activities,
  onSaveActivity,
  onDeleteActivity
}) => {
  const [narrative, setNarrative] = useState('');
  const [activityDate, setActivityDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentProposal, setCurrentProposal] = useState<AIAnalysisProposal | null>(null);
  const [activeNarrative, setActiveNarrative] = useState('');
  const [editableAssignments, setEditableAssignments] = useState<NodeScoreAssignment[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleStartAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!narrative.trim()) return;

    setIsAnalyzing(true);
    try {
      const proposal = await AIService.analyzeActivity(narrative.trim(), childAge, tree);
      setCurrentProposal(proposal);
      setActiveNarrative(narrative.trim());
      setEditableAssignments(proposal.classifications.map(c => ({ ...c })));
    } catch (err: any) {
      const errorMsg = err?.message || "Falha na comunicação com o servidor de IA";
      const fallback = AIService.fallbackLocalAnalysis(narrative.trim(), tree, errorMsg);
      setCurrentProposal(fallback);
      setActiveNarrative(narrative.trim());
      setEditableAssignments(fallback.classifications.map(c => ({ ...c })));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleScoreChange = (index: number, points: number) => {
    setEditableAssignments(prev => {
      const next = [...prev];
      next[index] = { ...next[index], points: Math.max(0, Math.min(100, points)) };
      return next;
    });
  };

  const handleConfirmAndSave = () => {
    if (!activeNarrative) return;

    const newActivity: ActivityRecord = {
      id: 'act-' + Date.now(),
      date: new Date().toISOString(),
      activityDate: activityDate || new Date().toISOString().split('T')[0],
      narrative: activeNarrative,
      childAgeAtActivity: childAge,
      aiProposal: currentProposal || undefined,
      confirmedAssignments: editableAssignments,
      isConfirmed: true,
      confirmedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSaveActivity(newActivity);
    setNarrative('');
    setActiveNarrative('');
    setCurrentProposal(null);
    setEditableAssignments([]);
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 3500);
  };

  const handleDiscardProposal = () => {
    setCurrentProposal(null);
    setActiveNarrative('');
    setEditableAssignments([]);
  };

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          Atividades Cotidianas
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6 }}>
          Registre com naturalidade os momentos educativos, conversas e vivências com {childName} ({childAge.formatted}).
        </p>
      </div>

      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-card)',
        padding: '2rem',
        boxShadow: 'var(--shadow-subtle)',
        marginBottom: '2.5rem'
      }}>
        <form onSubmit={handleStartAnalysis}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--rose-burnished)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase'
            }}>
              Relato Descritivo da Atividade
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Data da vivência:</span>
              <input
                type='date'
                value={activityDate}
                onChange={e => setActivityDate(e.target.value)}
                style={{
                  padding: '0.35rem 0.6rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-delicate)',
                  fontSize: '0.82rem',
                  backgroundColor: 'var(--bg-accent)'
                }}
              />
            </div>
          </div>

          <textarea
            value={narrative}
            onChange={(e) => setNarrative(e.target.value)}
            placeholder='Exemplo: Hoje observamos diferentes tipos de folhas no jardim. Comparamos suas formas e cores...'
            rows={5}
            style={{
              width: '100%',
              padding: '1.1rem',
              borderRadius: '12px',
              border: '1px solid var(--border-delicate)',
              backgroundColor: 'var(--bg-accent)',
              color: 'var(--text-primary)',
              fontSize: '0.98rem',
              lineHeight: 1.7,
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '1.25rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              A IA analisará a atividade relacionando-a aos ramos da Árvore para sua revisão.
            </span>

            <button
              type='submit'
              disabled={!narrative.trim() || isAnalyzing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.6rem',
                borderRadius: 'var(--radius-btn)',
                backgroundColor: narrative.trim() && !isAnalyzing ? 'var(--rose-antique)' : 'var(--delicate-beige)',
                color: narrative.trim() && !isAnalyzing ? '#FFF' : 'var(--text-muted)',
                fontSize: '0.92rem',
                fontWeight: 600,
                cursor: narrative.trim() && !isAnalyzing ? 'pointer' : 'not-allowed'
              }}
            >
              {isAnalyzing ? <RefreshCw size={16} className='animate-spin' /> : <Sparkles size={16} />}
              <span>{isAnalyzing ? 'Analisando Relato...' : 'Examinar com IA'}</span>
            </button>
          </div>
        </form>

        {isSubmitted && (
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem 1.25rem',
            borderRadius: '10px',
            backgroundColor: 'var(--rose-soft)',
            border: '1px solid var(--border-delicate)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: 'var(--rose-deep)'
          }}>
            <CheckCircle2 size={20} />
            <span style={{ fontSize: '0.92rem' }}>
              Atividade confirmada com sucesso! Pontos incorporados ao histórico.
            </span>
          </div>
        )}
      </div>

      {currentProposal && (
        <div style={{
          backgroundColor: 'var(--bg-accent)',
          border: '1px solid var(--border-delicate)',
          borderRadius: 'var(--radius-card)',
          padding: '2rem',
          marginBottom: '2.5rem',
          boxShadow: 'var(--shadow-subtle)'
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", color: "var(--rose-burnished)" }}>
              <Sparkles size={20} />
              <h3 style={{ fontSize: "1.3rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
                Proposta Pedagógica &mdash; Confirmação dos Pais
              </h3>
            </div>
            {currentProposal.source === "gemini" ? (
              <span style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem", borderRadius: "999px", backgroundColor: "#e0f2fe", color: "#0369a1", fontWeight: 600, border: "1px solid #bae6fd" }}>
                ✨ Gemini API (Flash-Lite)
              </span>
            ) : (
              <span style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem", borderRadius: "999px", backgroundColor: "#fef3c7", color: "#92400e", fontWeight: 600, border: "1px solid #fde68a" }}>
                ⚠️ Contingência Local (Sem API)
              </span>
            )}
          </div>

          {currentProposal.warningMessage && (
            <div style={{ marginBottom: "1rem", padding: "0.75rem 1rem", borderRadius: "8px", backgroundColor: "#fffbeb", border: "1px solid #fde68a", color: "#b45309", fontSize: "0.85rem", lineHeight: 1.5 }}>
              <strong>Atenção:</strong> {currentProposal.warningMessage}
            </div>
          )}

          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '1.5rem' }}>
            {currentProposal.overallReasoning}
          </p>

          <div style={{ marginBottom: '1.5rem' }}>
            <span style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--rose-burnished)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              Princípios da Árvore Contemplados (Ajuste os pontos se desejar):
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {editableAssignments.map((assignment, idx) => (
                <div key={idx} style={{
                  backgroundColor: 'var(--bg-card)',
                  padding: '1rem 1.25rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border-light)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                      {assignment.nodeName}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {assignment.reason}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Pontos:</label>
                    <input
                      type='number'
                      min={0}
                      max={100}
                      value={assignment.points}
                      onChange={e => handleScoreChange(idx, parseInt(e.target.value) || 0)}
                      style={{
                        width: '60px',
                        padding: '0.35rem 0.5rem',
                        borderRadius: '6px',
                        border: '1px solid var(--border-delicate)',
                        textAlign: 'right',
                        fontWeight: 600,
                        color: 'var(--rose-deep)'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type='button'
              onClick={handleDiscardProposal}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-delicate)',
                color: 'var(--text-secondary)',
                fontSize: '0.88rem',
                cursor: 'pointer'
              }}
            >
              Descartar Proposta
            </button>
            <button
              type='button'
              onClick={handleConfirmAndSave}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.5rem',
                borderRadius: '8px',
                backgroundColor: 'var(--rose-antique)',
                color: '#FFF',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Check size={16} />
              <span>Confirmar e Salvar</span>
            </button>
          </div>
        </div>
      )}

      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <BookOpen size={18} color='var(--rose-burnished)' />
          <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>
            Histórico de Atividades Realizadas ({activities.length})
          </h3>
        </div>

        {activities.length === 0 ? (
          <div style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px dashed var(--border-delicate)',
            borderRadius: '12px',
            padding: '2rem',
            textAlign: 'center',
            color: 'var(--text-muted)'
          }}>
            Nenhuma atividade registrada ainda.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activities.map((item) => (
              <div
                key={item.id}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '12px',
                  padding: '1.25rem 1.5rem',
                  boxShadow: 'var(--shadow-subtle)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    <Clock size={14} />
                    <span>{item.activityDate}</span>
                    {item.childAgeAtActivity && (
                      <span style={{ color: 'var(--rose-burnished)', fontWeight: 500 }}>
                        &bull; {item.childAgeAtActivity.formatted}
                      </span>
                    )}
                  </div>
                  <button
                    type='button'
                    onClick={() => onDeleteActivity(item.id)}
                    title='Excluir Registro'
                    style={{ color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem' }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <p style={{ color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: 1.65, marginBottom: '0.75rem' }}>
                  {item.narrative}
                </p>

                {item.confirmedAssignments && item.confirmedAssignments.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                    {item.confirmedAssignments.map((ca, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '0.74rem',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          backgroundColor: 'var(--rose-soft)',
                          color: 'var(--rose-deep)',
                          border: '1px solid var(--border-delicate)'
                        }}
                      >
                        {ca.nodeName}: +{ca.points} pts
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
