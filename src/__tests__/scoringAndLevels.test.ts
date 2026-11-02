import { describe, it, expect } from 'vitest';
import { ScoringEngine } from '../domain/scoringEngine';
import { LevelEngine } from '../domain/levelEngine';
import { ComparativeAnalysis } from '../domain/comparativeAnalysis';
import { KnowledgeNode, ActivityRecord, LevelCalibrationConfig, DetailedAge } from '../types/education';

const sampleTree: KnowledgeNode = {
  id: 'root',
  name: 'Raiz',
  description: 'Desc',
  level: 1,
  points: 0,
  children: [
    {
      id: 'sub-1',
      name: 'Sub 1',
      description: 'Desc 1',
      level: 1,
      points: 0,
      children: [
        { id: 'leaf-1', name: 'Folha 1', description: 'Desc Leaf 1', level: 1, points: 0 }
      ]
    }
  ]
};

const sampleActivities: ActivityRecord[] = [
  {
    id: 'act-1',
    date: '2026-05-15T10:00:00Z',
    activityDate: '2026-05-15',
    narrative: 'Observou a natureza',
    isConfirmed: true,
    confirmedAssignments: [
      { nodeId: 'leaf-1', nodeName: 'Folha 1', points: 100, reason: 'Observação' }
    ],
    createdAt: '',
    updatedAt: ''
  },
  {
    id: 'act-2',
    date: '2026-05-16T10:00:00Z',
    activityDate: '2026-05-16',
    narrative: 'Outra atividade',
    isConfirmed: false,
    confirmedAssignments: [
      { nodeId: 'leaf-1', nodeName: 'Folha 1', points: 500, reason: 'Rascunho não confirmado' }
    ],
    createdAt: '',
    updatedAt: ''
  }
];

const config: LevelCalibrationConfig = {
  baseXpForLevel10: 50,
  baseXpForLevel100: 5000,
  powerFactor: 1.75,
  ageAdjustmentWeight: 0.04
};

describe('Motores de Pontuação e Níveis', () => {
  it('acumula pontos recursivamente sem duplicar e ignora rascunhos', () => {
    const computed = ScoringEngine.computeAggregatedTree(sampleTree, sampleActivities);
    const leaf = computed.children![0].children![0];
    const sub = computed.children![0];

    expect(leaf.points).toBe(100);
    expect(leaf.totalPoints).toBe(100);
    expect(sub.points).toBe(0);
    expect(sub.totalPoints).toBe(100);
    expect(computed.totalPoints).toBe(100);
  });

  it('calcula níveis de 1 a 100 considerando idade', () => {
    const levelYoung = LevelEngine.calculateLevel(500, 24, config);
    const levelOlder = LevelEngine.calculateLevel(500, 60, config);
    expect(levelYoung).toBeGreaterThan(levelOlder);
  });

  it('emite análise comparativa transparente sem percentis falsos', () => {
    const age: DetailedAge = { years: 2, months: 3, days: 0, totalMonths: 27, totalDays: 820, formatted: '2 anos e 3 meses' };
    const estimate = ComparativeAnalysis.getEstimate('Catarina', age, 15);
    expect(estimate.hasNormativePopulationBase).toBe(false);
    expect(estimate.qualitativeSummary).toContain('Catarina');
    expect(estimate.methodologyNote).toContain('inexiste base normativa');
  });
});
