import { LevelCalibrationConfig, KnowledgeNode } from '../types/education';

export class LevelEngine {
  static calculateLevel(
    totalPoints: number,
    ageInTotalMonths: number,
    config: LevelCalibrationConfig
  ): number {
    if (totalPoints <= 0) return 1;

    // Fator de escala da idade: com o avanço dos meses, o montante exigido cresce
    const ageFactor = 1 + (Math.max(0, ageInTotalMonths) * config.ageAdjustmentWeight);
    const adjustedPoints = totalPoints / ageFactor;

    // Normalização pela curva de potência
    const ratio = Math.max(0, adjustedPoints / config.baseXpForLevel100);
    const rawLevel = 1 + 99 * Math.pow(Math.min(1, ratio), 1 / config.powerFactor);

    return Math.max(1, Math.min(100, Math.round(rawLevel)));
  }

  static calculateOverallLevel(
    rootNode: KnowledgeNode,
    ageInTotalMonths: number,
    config: LevelCalibrationConfig
  ): number {
    const total = rootNode.totalPoints ?? rootNode.points;
    return LevelEngine.calculateLevel(total, ageInTotalMonths, config);
  }

  static applyLevelsToTree(
    tree: KnowledgeNode,
    ageInTotalMonths: number,
    config: LevelCalibrationConfig
  ): KnowledgeNode {
    function traverse(node: KnowledgeNode): KnowledgeNode {
      const nodePoints = node.totalPoints ?? node.points;
      const level = LevelEngine.calculateLevel(nodePoints, ageInTotalMonths, config);

      return {
        ...node,
        level,
        children: node.children ? node.children.map(traverse) : undefined
      };
    }

    return traverse(tree);
  }
}
