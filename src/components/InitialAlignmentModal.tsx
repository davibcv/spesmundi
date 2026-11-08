import React, { useState } from 'react';
import { History, X, Sparkles, CheckCircle2, AlertCircle, Trash2, Plus, RefreshCw } from 'lucide-react';
import { KnowledgeNode, DetailedAge, InitialAlignmentRawItem, InitialAlignmentBatchResult, ConsolidationLevel, CONSOLIDATION_LEVELS_META } from '../types/education';
import { parseInitialAlignmentText } from '../utils/initialAlignmentParser';
import { AlignmentService } from '../services/alignmentService';

export interface InitialAlignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  childName: string;
  childAge: DetailedAge;
  tree: KnowledgeNode;
  onApplyAlignment: (rawItems: InitialAlignmentRawItem[], result: InitialAlignmentBatchResult) => void;
}
export const InitialAlignmentModal: React.FC<InitialAlignmentModalProps> = ({
  isOpen,
  onClose,
  childName,
  childAge,
  tree,
  onApplyAlignment
}) => {
  const [inputText, setInputText] = useState('');
  const [parsedItems, setParsedItems] = useState<InitialAlignmentRawItem[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<InitialAlignmentBatchResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDirectEvaluation = async () => {
    if (!inputText.trim()) return;
    const items = parseInitialAlignmentText(inputText);
    if (items.length === 0) {
      setErrorMsg("Nenhum aprendizado pôde ser identificado no texto fornecido.");
      return;
    }
    setParsedItems(items);
    setIsEvaluating(true);
    setErrorMsg(null);
    setEvaluationResult(null);
    try {
      const result = await AlignmentService.alignPastLearnings(items, childAge, tree);
      setEvaluationResult(result);
    } catch (err: any) {
      setErrorMsg(err?.message || "Erro na avaliação retrospectiva.");
    } finally {
      setIsEvaluating(false);
    }
  };

  
  const handleUpdateItem = (index: number, field: keyof InitialAlignmentRawItem, value: any) => {
    setParsedItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveItem = (index: number) => {
    setParsedItems(prev => prev.filter((_, i) => i !== index));
    setEvaluationResult(null);
  };

  const handleAddNewItem = () => {
    const newItem: InitialAlignmentRawItem = {
      id: 'item-' + Date.now(),
      learningDescription: '',
      observedDate: new Date().toISOString().split('T')[0],
      consolidationLevel: 3,
      frequency: 'as_vezes',
      suggestedAreas: []
    };
    setParsedItems(prev => [...prev, newItem]);
    setEvaluationResult(null);
  };
  const handleEvaluateWithAI = async () => {
    const validItems = parsedItems.filter(item => item.learningDescription.trim().length > 0);
    if (validItems.length === 0) {
      setErrorMsg('Adicione ao menos um aprendizado antes de avaliar.');
      return;
    }
    setIsEvaluating(true);
    setErrorMsg(null);
    try {
      const result = await AlignmentService.alignPastLearnings(validItems, childAge, tree);
      setEvaluationResult(result);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro na avaliacao retrospectiva.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleConfirmApplication = () => {
    if (!evaluationResult) return;
    const validItems = parsedItems.filter(item => item.learningDescription.trim().length > 0);
    onApplyAlignment(validItems, evaluationResult);
    onClose();
  };
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1.5rem'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: '16px',
        border: '1px solid var(--border-light)',
        width: '100%',
        maxWidth: '860px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{
          padding: '1.5rem 1.75rem',
          borderBottom: '1px solid var(--border-delicate)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: 'var(--bg-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--rose-burnished)'
            }}>
              <History size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Alinhamento Inicial de Aprendizados
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, marginTop: '2px' }}>
                Registro retrospectivo para compor o histórico inicial de {childName} ({childAge.formatted}).
              </p>
            </div>
          </div>
          <button
            type='button'
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '0.4rem',
              borderRadius: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: '1.75rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {parsedItems.length === 0 ? (
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                Cole ou digite a lista de marcos e aprendizados consolidados:
              </label>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                Você pode colar livremente itens com marcadores (ex.: •, -, 1.), indicando datas, áreas sugeridas e frequência quando souber.
              </p>
              <textarea
                rows={8}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder={'Exemplo:\n• Já reconhece todas as letras do alfabeto (data: 2025-10, nível: 4, freq: sempre, área: Linguagem)\n• Consegue contar de 1 a 20 e associar quantidades a objetos (área: Raciocínio Matemático)\n• Anda de bicicleta de equilíbrio com segurança e boa postura motora'}
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border-delicate)',
                  backgroundColor: 'var(--bg-accent)',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                  lineHeight: 1.5,
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', gap: '0.75rem' }}>
                <button
                  type='button'
                  onClick={handleAddNewItem}
                  style={{
                    padding: '0.6rem 1.2rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-delicate)',
                    backgroundColor: 'transparent',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '0.88rem'
                  }}
                >
                  Preencher Manualmente
                </button>
                <button
                  type='button'
                  onClick={handleDirectEvaluation}
                  disabled={!inputText.trim() || isEvaluating}
                  style={{
                    padding: '0.6rem 1.4rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: 'var(--rose-burnished)',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: inputText.trim() ? 'pointer' : 'not-allowed',
                    opacity: inputText.trim() ? 1 : 0.6,
                    fontSize: '0.88rem'
                  }}
                >
                  Avaliar e Alinhar com IA
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Registros Identificados ({parsedItems.length})
                </span>
                <button
                  type='button'
                  onClick={handleAddNewItem}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-accent)',
                    border: '1px solid var(--border-delicate)',
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={14} />
                  <span>Adicionar Mais</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {parsedItems.map((item, index) => (
                  <div key={item.id} style={{
                    padding: '1rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border-delicate)',
                    backgroundColor: 'var(--bg-accent)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                      <textarea
                        rows={2}
                        value={item.learningDescription}
                        onChange={e => handleUpdateItem(index, 'learningDescription', e.target.value)}
                        placeholder='Descrição do aprendizado retrospectivo...'
                        style={{
                          flex: 1,
                          padding: '0.6rem',
                          borderRadius: '6px',
                          border: '1px solid var(--border-delicate)',
                          fontSize: '0.88rem',
                          fontFamily: 'inherit'
                        }}
                      />
                      <button
                        type='button'
                        onClick={() => handleRemoveItem(index)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-muted)',
                          padding: '0.4rem'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '3px' }}>Data Estimada:</label>
                        <input
                          type='date'
                          value={item.observedDate || ''}
                          onChange={e => handleUpdateItem(index, 'observedDate', e.target.value)}
                          style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--border-delicate)', fontSize: '0.82rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '3px' }}>Consolidação:</label>
                        <select
                          value={item.consolidationLevel}
                          onChange={e => handleUpdateItem(index, 'consolidationLevel', Number(e.target.value) as ConsolidationLevel)}
                          style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--border-delicate)', fontSize: '0.82rem' }}
                        >
                          {([1, 2, 3, 4, 5] as ConsolidationLevel[]).map(lvl => (
                            <option key={lvl} value={lvl}>
                              Nível {lvl} - {(CONSOLIDATION_LEVELS_META[lvl] as any)?.label || (CONSOLIDATION_LEVELS_META[lvl] as any)?.name || ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '3px' }}>Frequência:</label>
                        <select
                          value={item.frequency || 'as_vezes'}
                          onChange={e => handleUpdateItem(index, 'frequency', e.target.value)}
                          style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--border-delicate)', fontSize: '0.82rem' }}
                        >
                          <option value='raramente'>Raramente</option>
                          <option value='as_vezes'>Às vezes</option>
                          <option value='frequentemente'>Frequentemente</option>
                          <option value='sempre'>Sempre / Consolidado</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type='button'
                  onClick={() => { setParsedItems([]); setEvaluationResult(null); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  ← Voltar e colar novo texto
                </button>
                <button
                  type='button'
                  onClick={handleEvaluateWithAI}
                  disabled={isEvaluating}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.65rem 1.4rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: 'var(--rose-burnished)',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: isEvaluating ? 'not-allowed' : 'pointer',
                    fontSize: '0.88rem'
                  }}
                >
                  {isEvaluating ? (
                    <>
                      <RefreshCw size={16} className='animate-spin' />
                      <span>Avaliando pedagogicamente...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Avaliar com IA Pedagógica</span>
                    </>
                  )}
                </button>
              </div>

              {evaluationResult && (
                <div style={{
                  marginTop: '1.5rem',
                  padding: '1.25rem',
                  borderRadius: '12px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-light)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <CheckCircle2 size={18} color='var(--forest-soft, #10b981)' />
                    <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Avaliação Concluída ({evaluationResult.evaluatedItems.length} registros processados)
                    </span>
                  </div>
                  {(evaluationResult.warningNotice || evaluationResult.warningMessage) && (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                      {(evaluationResult.warningNotice || evaluationResult.warningMessage)}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '240px', overflowY: 'auto', marginBottom: '1rem' }}>
                    {evaluationResult.evaluatedItems.map((evalItem, idx) => (
                      <div key={evalItem.rawItemId || idx} style={{
                        padding: '0.75rem',
                        borderRadius: '8px',
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-delicate)',
                        fontSize: '0.84rem'
                      }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                          {evalItem.pedagogicalEvaluation}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.4rem' }}>
                          {evalItem.classifications.map((c, cIdx) => (
                            <span key={cIdx} style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: 'var(--bg-accent)',
                              fontSize: '0.78rem',
                              border: '1px solid var(--border-delicate)'
                            }}>
                              {c.nodeName}: <strong>+{c.points} XP</strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type='button'
                    onClick={handleConfirmApplication}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: 'var(--rose-burnished)',
                      color: '#fff',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <CheckCircle2 size={18} />
                    <span>Confirmar e Integrar na Árvore de Conhecimento</span>
                  </button>
                </div>
              )}

              {errorMsg && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: '#ef4444',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
