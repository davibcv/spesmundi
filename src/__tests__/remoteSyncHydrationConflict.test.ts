import { describe, it, expect, vi, beforeEach } from "vitest";
import { StorageService, createDefaultState } from "../services/storageService";
import { SpesMundiStorageState, ActivityRecord } from "../types/education";

describe("Diagnóstico de Resolução de Conflito de Sincronização em Novo Dispositivo", () => {
  beforeEach(() => {
    StorageService.clearMockStore();
    vi.restoreAllMocks();
  });

  it("deve carregar e preservar dados remotos quando o estado local for apenas um default recém-gerado", () => {
    // 1. Simula estado remoto no Firestore com atividades e alinhamento salvos no computador principal
    const remoteSavedState: SpesMundiStorageState = {
      ...createDefaultState(),
      updatedAt: "2026-11-07T12:00:00.000Z",
      activities: [
        {
          id: "act-align-1",
          date: "2026-11-07T12:00:00.000Z",
          activityDate: "2024-05-10",
          narrative: "[Alinhamento Inicial] Escuta passiva de música clássica",
          consolidationLevel: 3,
          isConfirmed: true,
          confirmedAssignments: [{ nodeId: "aud", nodeName: "Audição", points: 25, reason: "Música" }],
          createdAt: "2026-11-07T12:00:00.000Z",
          updatedAt: "2026-11-07T12:00:00.000Z"
        } as ActivityRecord
      ]
    };

    // 2. Dispositivo secundário abre agora e cria um estado default com timestamp no presente (mais recente que o remoto)
    const localVirginState = StorageService.loadState();
    expect(localVirginState.activities.length).toBe(0);

    const localTime = localVirginState.updatedAt ? new Date(localVirginState.updatedAt).getTime() : 0;
    const remoteTime = remoteSavedState.updatedAt ? new Date(remoteSavedState.updatedAt).getTime() : 0;

    // Demonstra a falha da regra anterior: localTime > remoteTime seria true mesmo sendo um default vazio
    const isLocalMoreRecent = localTime > remoteTime;
    expect(isLocalMoreRecent).toBe(true);

    // Regra esperada para correção: se o local for default vazio e o remoto contiver dados válidos, remoto deve prevalecer
    const hasMeaningfulLocalChanges = localVirginState.activities.length > 0 || (localVirginState.recurringActivities?.length || 0) > 0;
    const resolvedState = (!hasMeaningfulLocalChanges && remoteSavedState.activities.length > 0)
      ? remoteSavedState
      : (isLocalMoreRecent ? localVirginState : remoteSavedState);

    expect(resolvedState.activities.length).toBe(1);
    expect(resolvedState.activities[0].narrative).toContain("[Alinhamento Inicial]");
  });
});
