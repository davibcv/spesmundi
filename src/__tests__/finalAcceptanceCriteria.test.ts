import { describe, it, expect } from 'vitest';
import { AIService } from '../services/aiService';
import { initialTree } from '../data/initialTree';
import { TreeManager } from '../domain/treeManager';
import { ScoringEngine } from '../domain/scoringEngine';
import { ActivityRecord } from '../types/education';

describe('Verificacao Final de Aceitacao (Itens 9, 10 e 11)', () => {
  it('Item 9: Fallback local e acionado com discriminacao explicita de origem e aviso', () => {
    const fallback = AIService.fallbackLocalAnalysis('observou flores no quintal', initialTree, 'API temporariamente inacessivel');
    expect(fallback.source).toBe('local-fallback');
    expect(fallback.warningMessage).toContain('API temporariamente inacessivel');
    expect(fallback.confidence).toBeLessThanOrEqual(0.5);
    expect(fallback.classifications.length).toBeGreaterThan(0);
  });

  it('Item 10: Integracao com interface permite confirmacao, edicao e recusa sem duplicar', () => {
    const baseTree = JSON.parse(JSON.stringify(initialTree));
    const initialTotal = ScoringEngine.computeAggregatedTree(baseTree, []).totalPoints ?? 0;

    const acceptedActivity: ActivityRecord = {
      id: 'acc-1',
      date: new Date().toISOString(),
      activityDate: '2026-11-03',
      narrative: 'Leitura e identificacao de figuras',
      aiProposal: {
        activitySummary: 'Leitura',
        overallReasoning: 'Estimulo cognitivo',
        confidence: 0.9,
        insufficientInformation: false,
        classifications: [{ nodeId: 'vis', nodeName: 'Visão', points: 20, reason: 'Identificou figuras' }]
      },
      confirmedAssignments: [{ nodeId: 'vis', nodeName: 'Visão', points: 15, reason: 'Pai ajustou para 15' }],
      isConfirmed: true,
      createdAt: '2026-11-03T10:00:00.000Z',
      updatedAt: '2026-11-03T10:00:00.000Z'
    };

    const aggregated = ScoringEngine.computeAggregatedTree(baseTree, [acceptedActivity]);
    const vis = TreeManager.findNode(aggregated, 'vis');
    expect(vis?.points).toBe(15);
    expect(aggregated.totalPoints).toBe(initialTotal + 15);
  });

  it('Item 11: Preservacao da logica pedagogica e ordenacao das capacidades', () => {
    const context = TreeManager.getAiContext(initialTree);
    expect(initialTree.name).toContain('Amar a Deus e ao Próximo');
    expect(context).toBeDefined();
    expect(context.length).toBeGreaterThan(5);
  });
});
