import { describe, it, expect } from 'vitest';
import { initialTree } from '../data/initialTree';
import { ScoringEngine } from '../domain/scoringEngine';
import { LevelEngine } from '../domain/levelEngine';
import { ActivityRecord, LevelCalibrationConfig } from '../types/education';

describe('CurrentState Scoring and Aggregation', () => {
  const config: LevelCalibrationConfig = {
    baseXpForLevel10: 500,
    baseXpForLevel100: 5000,
    ageAdjustmentWeight: 0.05,
    powerFactor: 1.5
  };

  it('deve acumular pontuacoes de subconjuntos na raiz e nos ramos intermediarios', () => {
    const leafId = initialTree.children?.[0]?.children?.[0]?.id || 'sub-leaf';

    const mockActivity: ActivityRecord = {
      id: 'act-test-1',
      date: new Date().toISOString(),
      activityDate: '2026-11-03',
      narrative: 'Observou cores no jardim com atencao',
      childAgeAtActivity: { years: 2, months: 6, days: 0, totalMonths: 30, totalDays: 912, formatted: '2 anos e 6 meses' },
      confirmedAssignments: [
        { nodeId: leafId, nodeName: 'Percepcao' , points: 25, reason: 'Percepcao visual apurada' }
      ],
      isConfirmed: true,
      confirmedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const scoredTree = ScoringEngine.computeAggregatedTree(initialTree, [mockActivity]);
    const treeWithLevels = LevelEngine.applyLevelsToTree(scoredTree, 30, config);

    expect(treeWithLevels.totalPoints).toBe(25);
    const parentBranch = treeWithLevels.children?.[0];
    expect(parentBranch?.totalPoints).toBe(25);
  });
});
