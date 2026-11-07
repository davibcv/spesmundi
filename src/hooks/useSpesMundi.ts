import { InitialAlignmentBatchResult, InitialAlignmentRawItem } from "../types/education";
import { useState, useMemo, useCallback, useEffect } from "react";
import { SpesMundiStorageState, ChildProfile, KnowledgeNode, ActivityRecord, DetailedAge } from "../types/education";
import { StorageService } from "../services/storageService";
import { AuthService, AuthUserProfile } from "../services/authService";
import { FirebaseSyncService } from "../services/firebaseSyncService";
import { calculateDetailedAge } from "../domain/ageCalculator";
import { TreeManager } from "../domain/treeManager";
import { ScoringEngine } from "../domain/scoringEngine";
import { LevelEngine } from "../domain/levelEngine";
import { ComparativeAnalysis } from "../domain/comparativeAnalysis";

export function useSpesMundi() {
  const [state, setState] = useState<SpesMundiStorageState>(() => StorageService.loadState());
  const [currentUser, setCurrentUser] = useState<AuthUserProfile | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isHydrating, setIsHydrating] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Processar resultado pendente de redirecionamento (caso o navegador tenha usado redirect)
    AuthService.handleRedirectResult()
      .then((user) => {
        if (user) {
          setCurrentUser(user);
        }
      })
      .catch((err) => {
        console.error("[useSpesMundi] Erro no redirect result:", err);
        setAuthError(err?.message || "Erro na autenticacao via redirecionamento.");
      });

    const minHydrationDelay = new Promise((resolve) => setTimeout(resolve, 1500));

    const unsubscribe = AuthService.subscribeToAuthChanges(async (user) => {
      setCurrentUser(user);
      setAuthLoading(false);

      if (user) {
        setIsSyncing(true);
        try {
          const remoteDataPromise = FirebaseSyncService.fetchRemoteState(user.uid);
          const [remoteData] = await Promise.all([remoteDataPromise, minHydrationDelay]);

          if (remoteData) {
            const localState = StorageService.loadState();
            const localTime = localState.updatedAt ? new Date(localState.updatedAt).getTime() : 0;
            const remoteTime = remoteData.updatedAt ? new Date(remoteData.updatedAt).getTime() : 0;

            // Se o local tiver carimbo mais novo que o remoto, preserva o local e sobe para o Firestore
            if (localTime > remoteTime) {
              await FirebaseSyncService.syncRemoteState(user.uid, localState);
              setState(localState);
            } else {
              // Remoto e igual ou mais recente, hidrata localmente
              StorageService.saveState(remoteData);
              setState(remoteData);
            }
          } else {
            const localState = StorageService.loadState();
            await FirebaseSyncService.syncRemoteState(user.uid, localState);
          }
        } catch (err) {
          console.warn("[useSpesMundi] Erro ao sincronizar estado com a nuvem:", err);
        } finally {
          setIsSyncing(false);
          setIsHydrating(false);
        }
      } else {
        await minHydrationDelay;
        setIsHydrating(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const refresh = useCallback(() => {
    setState(StorageService.loadState());
  }, []);

  const syncState = useCallback(async (newState: SpesMundiStorageState) => {
    newState.updatedAt = new Date().toISOString();
    setState(newState);
    StorageService.saveState(newState);

    if (currentUser) {
      setIsSyncing(true);
      try {
        await FirebaseSyncService.syncRemoteState(currentUser.uid, newState);
      } catch (err) {
        console.warn("[useSpesMundi] Falha na sincronizacao remota:", err);
      } finally {
        setIsSyncing(false);
      }
    }
  }, [currentUser]);

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
    const current = StorageService.loadState();
    const updatedChild = {
      ...current.child,
      ...childData,
      updatedAt: new Date().toISOString()
    };
    const newState = { ...current, child: updatedChild };
    syncState(newState);
  }, [syncState]);

  const addTreeNode = useCallback((parentId: string, data: { name: string; description: string }) => {
    const current = StorageService.loadState();
    const updatedTree = TreeManager.addNode(current.tree, parentId, data);
    const newState = { ...current, tree: updatedTree };
    syncState(newState);
  }, [syncState]);

  const updateTreeNode = useCallback((targetId: string, updates: { name?: string; description?: string }) => {
    const current = StorageService.loadState();
    const updatedTree = TreeManager.updateNode(current.tree, targetId, updates);
    const newState = { ...current, tree: updatedTree };
    syncState(newState);
  }, [syncState]);

  const deleteTreeNode = useCallback((targetId: string) => {
    const current = StorageService.loadState();
    const updatedTree = TreeManager.deleteNode(current.tree, targetId);
    const newState = { ...current, tree: updatedTree };
    syncState(newState);
  }, [syncState]);


  const saveRecurringActivity = useCallback((description: string) => {
    StorageService.saveRecurringActivity(description);
    refresh();
  }, [refresh]);

  const recordRecurringActivityUsage = useCallback((id: string) => {
    StorageService.recordRecurringActivityUsage(id);
    refresh();
  }, [refresh]);

  const deleteRecurringActivity = useCallback((id: string) => {
    StorageService.deleteRecurringActivity(id);
    refresh();
  }, [refresh]);

  const saveActivity = useCallback((activityData: Omit<ActivityRecord, "id" | "createdAt" | "updatedAt">) => {
    const current = StorageService.loadState();
    const newActivity: ActivityRecord = {
      ...activityData,
      id: "act-" + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const newState = {
      ...current,
      activities: [newActivity, ...current.activities]
    };
    syncState(newState);
  }, [syncState]);


  const applyInitialAlignment = useCallback((
    rawItems: InitialAlignmentRawItem[],
    batchResult: InitialAlignmentBatchResult
  ) => {
    const current = StorageService.loadState();
    const now = new Date().toISOString();
    const newActivities: ActivityRecord[] = [];

    // Mapeia descrições para evitar duplicação em re-alinhamento retrospectivo
    const existingDescMap = new Set(
      rawItems.map(r => "[Alinhamento Inicial] " + r.learningDescription.trim())
    );

    // Remove atividades prévias de alinhamento com a mesma descrição para permitir reprocessamento limpo
    const filteredPrevious = current.activities.filter(
      a => !existingDescMap.has(a.narrative.trim())
    );

    for (let i = 0; i < rawItems.length; i++) {
      const raw = rawItems[i];
      const evaluated = batchResult.evaluatedItems.find(e => e.rawItemId === raw.id) || batchResult.evaluatedItems[i];
      const classifications = evaluated ? evaluated.classifications : [];

      const assignments = classifications.map(cls => ({
        nodeId: cls.nodeId,
        nodeName: cls.nodeName,
        points: cls.points,
        reason: cls.reason
      }));

      newActivities.push({
        id: "align-" + Date.now() + "-" + i,
        date: now,
        activityDate: raw.observedDate || raw.startDate || now.split("T")[0],
        narrative: "[Alinhamento Inicial] " + raw.learningDescription.trim(),
        consolidationLevel: (raw.consolidationLevel || 3) as any,
        confirmedAssignments: assignments,
        isConfirmed: true,
        confirmedAt: now,
        aiProposal: {
          activitySummary: evaluated?.pedagogicalEvaluation || "Registro retrospectivo consolidado no alinhamento inicial.",
          classifications: assignments,
          overallReasoning: "Alinhamento inicial retrospectivo de marcos de aprendizado.",
          confidence: 0.95,
          insufficientInformation: false,
          source: batchResult.source || "gemini"
        },
        createdAt: now,
        updatedAt: now
      });
    }

    const newState = {
      ...current,
      activities: [...newActivities, ...filteredPrevious]
    };
    syncState(newState);
    return newActivities.length;
  }, [syncState]);

  const deleteActivity = useCallback((activityId: string) => {
    const current = StorageService.loadState();
    const newState = {
      ...current,
      activities: current.activities.filter(a => a.id !== activityId)
    };
    syncState(newState);
  }, [syncState]);

  const loginWithGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      return await AuthService.loginWithGoogle();
    } catch (err: any) {
      console.error("[useSpesMundi] Erro no login:", err);
      let msg = "Falha ao iniciar sessao com Google.";
      if (err?.code === "auth/unauthorized-domain") {
        msg = "Dominio nao autorizado no Firebase Console. Adicione o dominio do Codespaces nas configuracoes de autenticacao.";
      } else if (err?.code === "auth/operation-not-allowed") {
        msg = "Provedor Google nao ativado no Firebase Console (Authentication > Sign-in method).";
      } else if (err?.message) {
        msg = err.message;
      }
      setAuthError(msg);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    setAuthError(null);
    try {
      await AuthService.logout();
      setCurrentUser(null);
    } catch (err: any) {
      console.error("[useSpesMundi] Erro no logout:", err);
      setAuthError(err?.message || "Erro ao encerrar sessao.");
      throw err;
    }
  }, []);

  const saveAndSyncNow = useCallback(async (): Promise<boolean> => {
    const currentState = StorageService.loadState();
    StorageService.saveState(currentState);
    setState(currentState);

    if (!currentUser) {
      return true;
    }

    setIsSyncing(true);
    try {
      const ok = await FirebaseSyncService.syncRemoteState(currentUser.uid, currentState);
      return ok;
    } catch (err) {
      console.warn("[useSpesMundi] Falha no salvamento manual no Firebase:", err);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [currentUser]);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  return {
    state,
    detailedAge,
    aggregatedTree,
    overallLevel,
    comparativeEstimate,
    currentUser,
    isSyncing,
    authLoading,
    isHydrating,
    authError,
    clearAuthError,
    saveAndSyncNow,
    refresh,
    updateChild,
    addTreeNode,
    updateTreeNode,
    deleteTreeNode,
    saveActivity,
    deleteActivity,
    applyInitialAlignment,
    saveRecurringActivity,
    recordRecurringActivityUsage,
    deleteRecurringActivity,
    loginWithGoogle,
    logout
  };
}
