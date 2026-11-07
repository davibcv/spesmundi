import { describe, it, expect } from "vitest";
import { parseInitialAlignmentText } from "../utils/initialAlignmentParser";
import { AlignmentService } from "../services/alignmentService";
import { ScoringEngine } from "../domain/scoringEngine";
import { initialTree } from "../data/initialTree";
import { TreeManager } from "../domain/treeManager";
import { ActivityRecord } from "../types/education";

describe("Alinhamento Inicial Retrospectivo - Ponta a Ponta", () => {
  const rawInput = [
    "01/02/2025 - Reconhece timbres de instrumentos e identifica melodias clássicas com clareza; consolidação 5/5, frequente - Audição, Música",
    "",
    "15/03/2025 - Compreende que objetos mais pesados caem com firmeza e resistem à força; consolidação 4/5, diário - Física, Causalidade mecânica",
    "",
    "20/04/2025 - Distingue água morna de gelada, madeira de metal e consistência das matérias; consolidação 4/5, frequente - Química, Propriedades dos materiais",
    "",
    "10/05/2025 - Cumprimenta os familiares com delicadeza e diz por favor e obrigado voluntariamente; consolidação 5/5, sempre - Amar o próximo, Cortesia, Boas maneiras"
  ].join("\n");

  it("deve interpretar os aprendizados, mapear para nós folha e agregar pontuação sem nós órfãos", () => {
    // 1. Parsing
    const items = parseInitialAlignmentText(rawInput);
    expect(items).toHaveLength(4);

    // 2. Validação e resolução semântica (simulando resposta ou contingência)
    const result = AlignmentService.validateAlignmentResponse(
      {
        summary: "Marcos formativos consolidados com excelente amplitude sensorial e moral.",
        evaluatedItems: [
          {
            rawItemId: items[0].id,
            pedagogicalEvaluation: "Sensibilidade auditiva aguçada.",
            classifications: [{ nodeId: "aud", points: 25, reason: "Apreciação musical." }]
          },
          {
            rawItemId: items[1].id,
            pedagogicalEvaluation: "Percepção de física do mundo real.",
            classifications: [{ nodeId: "fis", points: 20, reason: "Noções mecânicas intuitivas." }]
          },
          {
            rawItemId: items[2].id,
            pedagogicalEvaluation: "Atenção às matérias.",
            classifications: [{ nodeId: "qui", points: 20, reason: "Distinção de substâncias." }]
          },
          {
            rawItemId: items[3].id,
            pedagogicalEvaluation: "Educação relacional e cortesia.",
            classifications: [
              { nodeId: "cort", points: 15, reason: "Gentileza." },
              { nodeId: "boas-man", points: 15, reason: "Etiqueta cotidiana." }
            ]
          }
        ]
      },
      items,
      initialTree
    );

    expect(result.evaluatedItems).toHaveLength(4);

    // Verifica se os nós folha esperados receberam atribuição
    const allAssignedIds = result.evaluatedItems.flatMap(e => e.classifications.map(c => c.nodeId));
    expect(allAssignedIds).toContain("aud");
    expect(allAssignedIds).toContain("fis");
    expect(allAssignedIds).toContain("qui");
    expect(allAssignedIds).toContain("cort");
    expect(allAssignedIds).toContain("boas-man");

    // 3. Simula persistência em atividades confirmadas
    const activities: ActivityRecord[] = result.evaluatedItems.map((item, idx) => ({
      id: "test-act-" + idx,
      date: new Date().toISOString(),
      activityDate: item.startDate || "2025-05-01",
      narrative: "[Alinhamento Inicial] " + item.learningDescription,
      consolidationLevel: (item.consolidationLevel || 4) as any,
      confirmedAssignments: item.classifications,
      isConfirmed: true,
      confirmedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    // 4. Agregação pela ScoringEngine
    const aggregated = ScoringEngine.computeAggregatedTree(initialTree, activities);

    const audNode = TreeManager.findNode(aggregated, "aud");
    const fisNode = TreeManager.findNode(aggregated, "fis");
    const quiNode = TreeManager.findNode(aggregated, "qui");
    const cortNode = TreeManager.findNode(aggregated, "cort");
    const boasManNode = TreeManager.findNode(aggregated, "boas-man");

    expect(audNode?.totalPoints).toBeGreaterThanOrEqual(25);
    expect(fisNode?.totalPoints).toBeGreaterThanOrEqual(20);
    expect(quiNode?.totalPoints).toBeGreaterThanOrEqual(20);
    expect(cortNode?.totalPoints).toBeGreaterThanOrEqual(15);
    expect(boasManNode?.totalPoints).toBeGreaterThanOrEqual(15);

    // O nó pai 'Amar a Criação' e a Raiz devem conter a soma exata dos seus ramos
    const criacao = TreeManager.findNode(aggregated, "branch-criacao");
    const proximo = TreeManager.findNode(aggregated, "branch-proximo");

    expect(criacao?.totalPoints).toBeGreaterThan(0);
    expect(proximo?.totalPoints).toBeGreaterThan(0);
    expect(aggregated.totalPoints).toBe((criacao?.totalPoints || 0) + (proximo?.totalPoints || 0));
  });
});
