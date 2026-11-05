import { describe, it, expect } from 'vitest';
import { initialTree } from '../data/initialTree';
import { ScoringEngine } from '../domain/scoringEngine';
import { TreeManager } from '../domain/treeManager';
import { AIService } from '../services/aiService';
import { ActivityRecord, KnowledgeNode } from '../types/education';

describe('Etapa 5: Integracao de Pontuacao e Arvore Pedagogica', () => {
  it('filtra nos inexistentes e valida resposta da IA', () => {
    const tree: KnowledgeNode = JSON.parse(JSON.stringify(initialTree));
    const rawProposal = {
      activitySummary: 'Observacao de cores',
      overallReasoning: 'Estimulo visual verificado.',
      confidence: 0.9,
      source: 'gemini',
      classifications: [
        { nodeId: 'vis', points: 20, reason: 'Observou cores vivas' },
        { nodeId: 'no-fantasma-inexistente', points: 30, reason: 'Nao deve entrar' }
      ]
    };

    const validated = AIService.validateAIResponse(rawProposal, tree);
    expect(validated.classifications).toHaveLength(1);
    expect(validated.classifications[0].nodeId).toBe('vis');
    expect(validated.classifications[0].points).toBe(20);
    expect(validated.source).toBe('gemini');
  });

  it('aplica pontuacao no no folha e agrega para a raiz via ScoringEngine', () => {
    const tree: KnowledgeNode = JSON.parse(JSON.stringify(initialTree));
    const baseAggregated = ScoringEngine.computeAggregatedTree(tree, []);
    const rootInitialTotal = baseAggregated.totalPoints ?? 0;

    const activity: ActivityRecord = {
      id: 'act-test-1',
      date: new Date().toISOString(),
      activityDate: '2026-11-03',
      createdAt: '2026-11-03T10:00:00.000Z',
      updatedAt: '2026-11-03T10:00:00.000Z',
      narrative: 'A crianca observou cores vivas no jardim',
      aiProposal: {
        activitySummary: 'Observacao visual',
        overallReasoning: 'Atividade no jardim',
        confidence: 0.9,
        insufficientInformation: false,
        classifications: [{ nodeId: 'vis', nodeName: 'Visão', points: 20, reason: 'Cores' }]
      },
      confirmedAssignments: [{ nodeId: 'vis', nodeName: 'Visão', points: 20, reason: 'Cores' }],
      isConfirmed: true
    };

    const updatedTree = ScoringEngine.computeAggregatedTree(tree, [activity]);
    const visNode = TreeManager.findNode(updatedTree, 'vis');

    expect(visNode?.points).toBe(20);
    expect(visNode?.totalPoints).toBe(20);
    expect(updatedTree.totalPoints).toBe(rootInitialTotal + 20);
  });

  it('permite edicao manual das pontuacoes sem distorcer o recalculo', () => {
    const tree: KnowledgeNode = JSON.parse(JSON.stringify(initialTree));
    const baseAggregated = ScoringEngine.computeAggregatedTree(tree, []);
    const rootInitialTotal = baseAggregated.totalPoints ?? 0;

    // Usuario ajustou manualmente os pontos de 20 para 15 antes de salvar
    const activityEdited: ActivityRecord = {
      id: 'act-test-2',
      date: new Date().toISOString(),
      activityDate: '2026-11-03',
      createdAt: '2026-11-03T10:00:00.000Z',
      updatedAt: '2026-11-03T10:00:00.000Z',
      narrative: 'A crianca observou cores vivas no jardim',
      aiProposal: {
        activitySummary: 'Observacao visual',
        overallReasoning: 'Atividade no jardim',
        confidence: 0.9,
        insufficientInformation: false,
        classifications: [{ nodeId: 'vis', nodeName: 'Visão', points: 20, reason: 'Cores' }]
      },
      confirmedAssignments: [{ nodeId: 'vis', nodeName: 'Visão', points: 15, reason: 'Ajuste manual pelos pais' }],
      isConfirmed: true
    };

    const updatedTree = ScoringEngine.computeAggregatedTree(tree, [activityEdited]);
    const visNode = TreeManager.findNode(updatedTree, 'vis');

    expect(visNode?.points).toBe(15);
    expect(visNode?.totalPoints).toBe(15);
    expect(updatedTree.totalPoints).toBe(rootInitialTotal + 15);
  });

  it('proposta descartada (isConfirmed: false) nao altera a pontuacao da arvore', () => {
    const tree: KnowledgeNode = JSON.parse(JSON.stringify(initialTree));
    const baseAggregated = ScoringEngine.computeAggregatedTree(tree, []);
    const rootInitialTotal = baseAggregated.totalPoints ?? 0;

    const unconfirmedActivity: ActivityRecord = {
      id: 'act-test-3',
      date: new Date().toISOString(),
      activityDate: '2026-11-03',
      createdAt: '2026-11-03T10:00:00.000Z',
      updatedAt: '2026-11-03T10:00:00.000Z',
      narrative: 'Proposta rejeitada pelo responsavel',
      aiProposal: {
        activitySummary: 'Atividade rejeitada',
        overallReasoning: 'Sem confirmacao',
        confidence: 0.8,
        insufficientInformation: false,
        classifications: [{ nodeId: 'vis', nodeName: 'Visão', points: 30, reason: 'Rejeitado' }]
      },
      confirmedAssignments: [{ nodeId: 'vis', nodeName: 'Visão', points: 30, reason: 'Rejeitado' }],
      isConfirmed: false
    };

    const updatedTree = ScoringEngine.computeAggregatedTree(tree, [unconfirmedActivity]);
    expect(updatedTree.totalPoints).toBe(rootInitialTotal);
  });

  it('mantem integridade quando proposta insuficiente possui classificacoes vazias', () => {
    const tree: KnowledgeNode = JSON.parse(JSON.stringify(initialTree));
    const baseAggregated = ScoringEngine.computeAggregatedTree(tree, []);
    const rootInitialTotal = baseAggregated.totalPoints ?? 0;

    const rawInsufficient = {
      activitySummary: 'Hoje brincou bastante.',
      overallReasoning: 'Relato vago sem correspondencia especifica.',
      insufficientInformation: true,
      classifications: []
    };

    const validated = AIService.validateAIResponse(rawInsufficient, tree);
    expect(validated.insufficientInformation).toBe(true);
    expect(validated.classifications).toHaveLength(0);

    const emptyActivity: ActivityRecord = {
      id: 'act-test-4',
      date: new Date().toISOString(),
      activityDate: '2026-11-03',
      createdAt: '2026-11-03T10:00:00.000Z',
      updatedAt: '2026-11-03T10:00:00.000Z',
      narrative: 'Hoje brincou bastante.',
      aiProposal: validated,
      confirmedAssignments: validated.classifications,
      isConfirmed: true
    };

    const updatedTree = ScoringEngine.computeAggregatedTree(tree, [emptyActivity]);
    expect(updatedTree.totalPoints).toBe(rootInitialTotal);
  });
});
