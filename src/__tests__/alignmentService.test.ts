import { describe, it, expect } from "vitest";
import { AlignmentService } from "../services/alignmentService";
import { KnowledgeNode, InitialAlignmentRawItem } from "../types/education";

const mockTree: KnowledgeNode = {
  id: "root",
  name: "Raiz",
  description: "Raiz da arvore",
  points: 0,
  level: 1,
  children: [
    {
      id: "mat",
      name: "Matematica Inicial",
      description: "Contagem e numeros",
      points: 0,
      level: 1,
      children: []
    },
    {
      id: "bio",
      name: "Ciencias da Natureza",
      description: "Observacao de plantas e seres vivos",
      points: 0,
      level: 1,
      children: []
    },
    {
      id: "vis",
      name: "Educacao Visual",
      description: "Cores e formas",
      points: 0,
      level: 1,
      children: []
    },
    {
      id: "sens-beleza",
      name: "Apreciacao do Belo",
      description: "Sensibilidade estetica",
      points: 0,
      level: 1,
      children: []
    }
  ]
};

describe("AlignmentService", () => {
  const items: InitialAlignmentRawItem[] = [
    {
      id: "item-1",
        originalText: "Conta até 10",
      learningDescription: "Aprendeu a contar ate 10 usando pedrinhas",
      suggestedAreas: ["Matematica"],
      consolidationLevel: 4
    },
    {
      id: "item-2",
        originalText: "Reconhece cores",
      learningDescription: "Observa e cuida das plantinhas no jardim todos os dias",
      suggestedAreas: ["Biologia", "Natureza"],
      consolidationLevel: 5
    }
  ];

  it("deve validar resposta estruturada da IA e vincular aos IDs da arvore", () => {
    const rawResponse = {
      summary: "Excelente desenvolvimento nas areas logica e biologica.",
      evaluatedItems: [
        {
          rawItemId: "item-1",
          pedagogicalEvaluation: "Solida compreensao da sequencia ordinal e cardinal.",
          unmatchedSuggestedAreas: [],
          additionalAreasIdentified: ["Concentracao"],
          classifications: [
            { nodeId: "mat", points: 20, reason: "Uso ativo de contagem de objetos concretos." }
          ]
        },
        {
          rawItemId: "item-2",
          pedagogicalEvaluation: "Cuidado diario com o meio ambiente e atencao aos ciclos vitais.",
          unmatchedSuggestedAreas: [],
          additionalAreasIdentified: [],
          classifications: [
            { nodeId: "bio", points: 25, reason: "Observacao atenta e interacao harmonica com plantas." }
          ]
        }
      ]
    };

    const result = AlignmentService.validateAlignmentResponse(rawResponse, items, mockTree);

    expect(result.summary).toBe("Excelente desenvolvimento nas areas logica e biologica.");
    expect(result.evaluatedItems).toHaveLength(2);
    expect(result.evaluatedItems[0].classifications[0].nodeName).toBe("Matematica Inicial");
    expect(result.evaluatedItems[0].classifications[0].points).toBe(20);
    expect(result.evaluatedItems[0].additionalAreasIdentified).toContain("Concentracao");
    expect(result.evaluatedItems[1].classifications[0].nodeName).toBe("Ciencias da Natureza");
    expect(result.evaluatedItems[1].classifications[0].points).toBe(25);
  });

  it("deve aplicar fallback local e atribuir pontuacao coerente caso a resposta seja omitida para um item", () => {
    const incompleteResponse = {
      summary: "Resposta parcial",
      evaluatedItems: []
    };

    const result = AlignmentService.validateAlignmentResponse(incompleteResponse, items, mockTree);

    expect(result.evaluatedItems).toHaveLength(2);
    expect(result.evaluatedItems[0].classifications.length).toBeGreaterThan(0);
    expect(result.evaluatedItems[0].classifications[0].nodeId).toBe("mat");
    expect(result.evaluatedItems[1].classifications[0].nodeId).toBe("bio");
  });

  it("deve gerar batch fallback completo com aviso claro se houver falha de rede ou API", () => {
    const fallback = AlignmentService.fallbackBatch(items, mockTree, "Timeout na requisicao");

    expect(fallback.source).toBe("local-fallback");
    expect(fallback.warningMessage).toContain("Timeout");
    expect(fallback.evaluatedItems).toHaveLength(2);
  });
});
