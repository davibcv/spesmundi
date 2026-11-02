import { useState, useMemo, useCallback } from "react";
import { SpesMundiStorageState, ChildProfile, KnowledgeNode, ActivityRecord, DetailedAge } from "../types/education";
import { StorageService } from "../services/storageService";
import { calculateDetailedAge } from "../domain/ageCalculator";
import { TreeManager } from "../domain/treeManager";
import { ScoringEngine } from "../domain/scoringEngine";
import { LevelEngine } from "../domain/levelEngine";
import { ComparativeAnalysis } from "../domain/comparativeAnalysis";

export function useSpesMundi() {
  const [state, setState] = useState<SpesMundiStorageState>(() => StorageService.loadState());

  const refresh = useCallback(() => {
    setState(StorageService.loadState());
  }, []);

  const detailedAge: DetailedAge = useMemo(() => {
    try {
      return calculateDetailedAge(state.child.birthDate);
    } catch {
      return { years: 2, months: 0, days: 0, totalMonths: 24, totalDays: 730, formatted: "2 anos completos" };
    }
  }, [state.child.birthDate]);

  const aggregatedTree: KnowledgeNode = useMemo(() => {
    const scoredTree = ScoringEngine.computeAggregatedTree(state.tree, state.activities);
    return LevelEngine.applyLevelsToTree(scoredTree, detailedAge.totalMonths, state.levelConfig);
  }, [state.tree, state.activities, detailedAge.totalMonths, state.levelConfig]);

  const overallLevel = useMemo(() => {
    return LevelEngine.calculateOverallLevel(aggregatedTree, detailedAge.totalMonths, state.levelConfig);
  }, [aggregatedTree, detailedAge.totalMonths, state.levelConfig]);

  const comparativeEstimate = useMemo(() => {
    return ComparativeAnalysis.getEstimate(state.child.name, detailedAge, overallLevel);
  }, [state.child.name, detailedAge, overallLevel]);

  const updateChild = useCallback((childData: Partial<ChildProfile>) => {
    StorageService.updateChild(childData);
    refresh();
  }, [refresh]);

  const addTreeNode = useCallback((parentId: string, data: { name: string; description: string }) => {
    const updated = TreeManager.addNode(state.tree, parentId, data);
    StorageService.updateTree(updated);
    refresh();
  }, [state.tree, refresh]);

  const updateTreeNode = useCallback((targetId: string, updates: { name?: string; description?: string }) => {
    const updated = TreeManager.updateNode(state.tree, targetId, updates);
    StorageService.updateTree(updated);
    refresh();
  }, [state.tree, refresh]);

  const moveTreeNode = useCallback((targetId: string, newParentId: string) => {
    const updated = TreeManager.moveNode(state.tree, targetId, newParentId);
    StorageService.updateTree(updated);
    refresh();
  }, [state.tree, refresh]);

  const deleteTreeNode = useCallback((targetId: string) => {
    const updated = TreeManager.deleteNode(state.tree, targetId, true);
    StorageService.updateTree(updated);
    refresh();
  }, [state.tree, refresh]);

  const saveActivity = useCallback((activity: ActivityRecord) => {
    StorageService.saveActivity(activity);
    refresh();
  }, [refresh]);

  const deleteActivity = useCallback((id: string) => {
    StorageService.deleteActivity(id);
    refresh();
  }, [refresh]);

  return {
    state,
    detailedAge,
    aggregatedTree,
    overallLevel,
    comparativeEstimate,
    updateChild,
    addTreeNode,
    updateTreeNode,
    moveTreeNode,
    deleteTreeNode,
    saveActivity,
    deleteActivity,
    refresh
  };
}
