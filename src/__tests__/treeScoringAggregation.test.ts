import { describe, it, expect } from "vitest";
import { initialTree } from "../data/initialTree";
import { ScoringEngine } from "../domain/scoringEngine";
import { TreeManager } from "../domain/treeManager";
import { ActivityRecord, KnowledgeNode } from "../types/education";

describe("Integridade Matemática de Agregação de Pontos na Árvore", () => {
  it("deve somar recursivamente os nós folhas e refletir exatamente nos ramos e raiz", () => {
    const tree = JSON.parse(JSON.stringify(initialTree)) as KnowledgeNode;

    const mockActivities: ActivityRecord[] = [
      {
        id: "act-align-1",
        title: "Alinhamento - Audição e Timbres",
        description: "Reconhecimento auditivo",
        date: "2024-05-10",
        isConfirmed: true,
        confirmedAssignments: [
          { nodeId: "aud", nodeName: "Audição", points: 25, reason: "Música e timbres" }
        ]
      } as any,
      {
        id: "act-align-2",
        title: "Alinhamento - Física Mecânica",
        description: "Causalidade mecânica",
        date: "2024-06-12",
        isConfirmed: true,
        confirmedAssignments: [
          { nodeId: "fis", nodeName: "Física", points: 30, reason: "Causalidade mecânica" }
        ]
      } as any,
      {
        id: "act-align-3",
        title: "Alinhamento - Matemática Formal",
        description: "Contagem e proporções",
        date: "2024-07-15",
        isConfirmed: true,
        confirmedAssignments: [
          { nodeId: "mat", nodeName: "Matemática", points: 20, reason: "Contagem e proporções" }
        ]
      } as any,
      {
        id: "act-align-4",
        title: "Alinhamento - Cortesia Social",
        description: "Etiqueta e gentileza",
        date: "2024-08-20",
        isConfirmed: true,
        confirmedAssignments: [
          { nodeId: "cort", nodeName: "Cortesia", points: 15, reason: "Etiqueta e gentileza" }
        ]
      } as any
    ];

    const updatedTree = ScoringEngine.computeAggregatedTree(tree, mockActivities);

    // 1. Verifica pontuações diretas dos nós folha
    const audNode = TreeManager.findNode(updatedTree, "aud");
    const fisNode = TreeManager.findNode(updatedTree, "fis");
    const matNode = TreeManager.findNode(updatedTree, "mat");
    const cortNode = TreeManager.findNode(updatedTree, "cort");

    expect(audNode?.points).toBe(25);
    expect(fisNode?.points).toBe(30);
    expect(matNode?.points).toBe(20);
    expect(cortNode?.points).toBe(15);

    // 2. Função recursiva de verificação de folhas
    function getExpectedTotalFromLeaves(node: KnowledgeNode): number {
      if (!node.children || node.children.length === 0) {
        return node.points || 0;
      }
      return node.children.reduce((acc, child) => acc + getExpectedTotalFromLeaves(child), 0);
    }

    // 3. Validação recursiva de subconjuntos e ramos intermediários
    function validateBranchIntegrity(node: KnowledgeNode) {
      const expectedTotal = getExpectedTotalFromLeaves(node);
      expect(node.totalPoints).toBe(expectedTotal);

      if (node.children && node.children.length > 0) {
        expect(node.points).toBe(0);
        for (const child of node.children) {
          validateBranchIntegrity(child);
        }
      }
    }

    validateBranchIntegrity(updatedTree);

    // 4. A raiz global deve somar exatamente 25 + 30 + 20 + 15 = 90 XP
    expect(updatedTree.totalPoints).toBe(90);
  });
});
