import { KnowledgeNode, ActivityRecord } from '../types/education';

export class ScoringEngine {
  static calculateDirectPointsMap(activities: ActivityRecord[]): Record<string, number> {
    const map: Record<string, number> = {};
    for (const act of activities) {
      if (!act.isConfirmed) continue;
      for (const assignment of act.confirmedAssignments) {
        map[assignment.nodeId] = (map[assignment.nodeId] || 0) + assignment.points;
      }
    }
    return map;
  }

  static computeAggregatedTree(tree: KnowledgeNode, activities: ActivityRecord[]): KnowledgeNode {
    const directPointsMap = ScoringEngine.calculateDirectPointsMap(activities);

    function calculate(node: KnowledgeNode): KnowledgeNode {
      const direct = directPointsMap[node.id] || 0;
      let childrenSum = 0;
      let updatedChildren: KnowledgeNode[] | undefined = undefined;

      if (node.children && node.children.length > 0) {
        updatedChildren = node.children.map(calculate);
        childrenSum = updatedChildren.reduce((acc, c) => acc + (c.totalPoints ?? c.points ?? 0), 0);
      }

      const total = direct + childrenSum;

      return {
        ...node,
        points: direct,
        totalPoints: total,
        children: updatedChildren
      };
    }

    return calculate(tree);
  }
}
