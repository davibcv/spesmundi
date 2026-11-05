import { describe, it, expect } from "vitest";
import { initialTree } from "../data/initialTree";
import { TreeManager } from "../domain/treeManager";
import { AIService } from "../services/aiService";

describe("Bateria Pedagogica dos 8 Casos", () => {
  const cases = [
    {
      id: 1,
      name: "Caso 1 - Atividade simples",
      narrative: "A crianca observou diferentes flores no jardim, comparou suas cores vivas (vermelho, amarelo) e identificou semelhancas e diferencas nas petalas.",
      age: { formatted: "3 anos e 6 meses", totalMonths: 42 },
      mockResponse: {
        activitySummary: "Observacao atenta e comparacao de flores no jardim.",
        overallReasoning: "A atividade exercitou a percepcao visual das cores e a contemplacao botanica dos seres vivos.",
        confidence: 0.95,
        insufficientInformation: false,
        classifications: [
          { nodeId: "vis", points: 15, reason: "Identificacao de cores e diferencas visuais nas petalas." },
          { nodeId: "bio", points: 15, reason: "Observacao atenta de elementos vegetais e botanicos no jardim." }
        ]
      }
    },
    {
      id: 2,
      name: "Caso 2 - Atividade interdisciplinar",
      narrative: "A crianca acompanhou o preparo de um bolo, observou a transformacao dos ingredientes (mistura de farinha e ovos, calor do forno), mediu quantidades com xicaras e experimentou o sabor do resultado.",
      age: { formatted: "4 anos", totalMonths: 48 },
      mockResponse: {
        activitySummary: "Acompanhamento do preparo de bolo, medidas e degustacao.",
        overallReasoning: "A vivencia contemplou a observacao dos estados da materia, nocoes quantitativas e refinamento gustativo.",
        confidence: 0.92,
        insufficientInformation: false,
        classifications: [
          { nodeId: "qui", points: 15, reason: "Observacao da transformacao dos ingredientes sob acao termica." },
          { nodeId: "mat", points: 15, reason: "Medicao de quantidades utilizando xicaras." },
          { nodeId: "pal", points: 10, reason: "Experimentacao e distincao de sabores no resultado final." }
        ]
      }
    },
    {
      id: 3,
      name: "Caso 3 - Atividade artistica",
      narrative: "A crianca observou uma pintura, comentou suas cores, identificou formas e demonstrou visivel preferencia estetica.",
      age: { formatted: "4 anos", totalMonths: 48 },
      mockResponse: {
        activitySummary: "Apreciacao de pintura e expressao de gosto estetico.",
        overallReasoning: "Educacao da percepcao e fruicao da harmonia e proporcao visual.",
        confidence: 0.9,
        insufficientInformation: false,
        classifications: [
          { nodeId: "sens-beleza", points: 20, reason: "Contemplacao desinteressada e manifestacao de apreco pela harmonia pictorica." },
          { nodeId: "vis", points: 15, reason: "Discriminacao de formas e paleta cromatica no quadro." }
        ]
      }
    },
    {
      id: 4,
      name: "Caso 4 - Atividade de convivencia",
      narrative: "A crianca demonstrou cortesia, compartilhou objetos voluntariamente e participou ativamente de uma conversa amigavel.",
      age: { formatted: "3 anos", totalMonths: 36 },
      mockResponse: {
        activitySummary: "Demonstracao de boas maneiras, partilha e escuta reciproca.",
        overallReasoning: "Exercicio concreto do amor ao proximo na ordem do convivio.",
        confidence: 0.95,
        insufficientInformation: false,
        classifications: [
          { nodeId: "cort", points: 18, reason: "Atitude gentil e polidez nas acoes cotidianas." },
          { nodeId: "conv", points: 18, reason: "Partilha espontanea de brinquedos e participacao em dialogo moderado." }
        ]
      }
    },
    {
      id: 5,
      name: "Caso 5 - Relato insuficiente",
      narrative: "Hoje brincou bastante.",
      age: { formatted: "2 anos e 8 meses", totalMonths: 32 },
      mockResponse: {
        activitySummary: "Relato generico de brincadeira.",
        overallReasoning: "Ausencia de descricao especifica de capacidades formativas observadas.",
        confidence: 0.4,
        insufficientInformation: true,
        clarificationPrompt: "Poderia relatar com que a crianca brincou e quais acoes concretas realizou?",
        classifications: []
      }
    },
    {
      id: 6,
      name: "Caso 6 - Relato sem correspondencia evidente",
      narrative: "A crianca ficou sentada olhando a tela do smartphone sem interacao direcionada.",
      age: { formatted: "3 anos", totalMonths: 36 },
      mockResponse: {
        activitySummary: "Exposicao passiva a dispositivo eletronico.",
        overallReasoning: "A atividade descrita nao possui aderencia aos ramos de virtudes e formacao ativa da arvore.",
        confidence: 0.8,
        insufficientInformation: true,
        clarificationPrompt: "Houve alguma observacao ou dialogo orientado durante a exposicao?",
        classifications: []
      }
    },
    {
      id: 7,
      name: "Caso 7 - Relato complexo",
      narrative: "Choveu a tarde toda, ouvimos a sirene da ambulancia e comemos sopa quente. Depois a crianca sentou e aprendeu a ordenar blocos de madeira do menor para o maior com precisao.",
      age: { formatted: "4 anos", totalMonths: 48 },
      mockResponse: {
        activitySummary: "Ordenacao e seriacao de blocos por tamanho, em meio a rotina domestica.",
        overallReasoning: "Filtrando os fatos contextuais (chuva, sirene, sopa), identificou-se o exercicio de ordenacao racional e matematica.",
        confidence: 0.92,
        insufficientInformation: false,
        classifications: [
          { nodeId: "mat", points: 20, reason: "Classificacao, seriacao e compreensao de ordem e proporcao espacial." }
        ]
      }
    },
    {
      id: 8,
      name: "Caso 8 - Relato com informacoes negativas ou contraditórias",
      narrative: "A crianca gritou com raiva, recusou-se a olhar o livro de historia, jogou os materiais no chao e nao quis aprender nada.",
      age: { formatted: "3 anos e 6 meses", totalMonths: 42 },
      mockResponse: {
        activitySummary: "Episodio de recusa e desregulacao emocional durante tentativa de leitura.",
        overallReasoning: "Nao foram constatadas evidencias positivas de desenvolvimento pedagogico ou virtude no episodio narrado.",
        confidence: 0.88,
        insufficientInformation: true,
        clarificationPrompt: "Como a situacao foi contornada posteriormente?",
        classifications: []
      }
    }
  ];

  cases.forEach(c => {
    it("Valida " + c.name + " sob os criterios pedagogicos", () => {
      expect(c.narrative.length).toBeGreaterThan(5);
      expect(c.age.totalMonths).toBeGreaterThan(0);
      expect(c.age.formatted).toBeTruthy();

      const context = TreeManager.getAiContext(initialTree);
      expect(context.length).toBeGreaterThan(5);

      const proposal = AIService.validateAIResponse(c.mockResponse, initialTree);

      for (const item of proposal.classifications) {
        const found = TreeManager.findNode(initialTree, item.nodeId);
        expect(found).not.toBeNull();
        expect(item.nodeName).toBe(found?.name);
        expect(item.reason.length).toBeGreaterThan(10);
        expect(item.points).toBeGreaterThanOrEqual(5);
        expect(item.points).toBeLessThanOrEqual(25);
      }

      if ([5, 6, 8].includes(c.id)) {
        expect(proposal.classifications.length).toBe(0);
        expect(proposal.insufficientInformation).toBe(true);
      } else {
        expect(proposal.classifications.length).toBeGreaterThan(0);
        expect(proposal.insufficientInformation).toBe(false);
      }
    });
  });
});
