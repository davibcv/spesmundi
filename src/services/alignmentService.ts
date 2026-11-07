import {
  KnowledgeNode,
  DetailedAge,
  InitialAlignmentRawItem,
  InitialAlignmentAnalysisItem,
  InitialAlignmentBatchResult,
  NodeScoreAssignment
} from "../types/education";
import { TreeManager } from "../domain/treeManager";
import { SemanticAreaResolver } from "../domain/semanticAreaResolver";

export class AlignmentService {
  static validateAlignmentResponse(
    rawJson: unknown,
    items: InitialAlignmentRawItem[],
    tree: KnowledgeNode
  ): InitialAlignmentBatchResult {
    if (!rawJson || typeof rawJson !== "object") {
      throw new Error("Resposta de alinhamento invalida");
    }
    const obj = rawJson as Record<string, unknown>;
    const summary = typeof obj.summary === "string" ? obj.summary.trim() : "Alinhamento inicial processado.";
    const evaluatedItems: InitialAlignmentAnalysisItem[] = [];
    const rawEvaluated = Array.isArray(obj.evaluatedItems) ? obj.evaluatedItems : [];

    for (const rawItem of items) {
      const match = rawEvaluated.find((ev: any) => ev && typeof ev === "object" && ev.rawItemId === rawItem.id) as Record<string, unknown> | undefined;

      if (!match) {
        evaluatedItems.push(this.fallbackItemAnalysis(rawItem, tree));
        continue;
      }

      const pedagogicalEvaluation = typeof match.pedagogicalEvaluation === "string" ? match.pedagogicalEvaluation.trim() : "Aprendizado consolidado.";
      const unmatchedSuggestedAreas: string[] = [];
      const additionalAreasIdentified = Array.isArray(match.additionalAreasIdentified) ? (match.additionalAreasIdentified.filter(a => typeof a === "string" && a.trim()) as string[]) : [];
      const classifications: NodeScoreAssignment[] = [];
      const assignedNodeIds = new Set<string>();

      // 1. Processa classificações fornecidas pela IA via SemanticAreaResolver
      if (Array.isArray(match.classifications)) {
        for (const cItem of match.classifications) {
          if (!cItem || typeof cItem !== "object") continue;
          const c = cItem as Record<string, unknown>;
          const rawIdOrName = typeof c.nodeId === "string" ? c.nodeId.trim() : "";
          if (!rawIdOrName) continue;

          const resolved = SemanticAreaResolver.resolveArea(rawIdOrName, tree);
          if (!resolved) continue;

          const points = typeof c.points === "number" ? Math.max(5, Math.min(60, Math.round(c.points))) : (rawItem.consolidationLevel ? rawItem.consolidationLevel * 5 : 15);
          const reason = typeof c.reason === "string" ? c.reason.trim() : "Consolidacao identificada.";

          if (!assignedNodeIds.has(resolved.nodeId)) {
            assignedNodeIds.add(resolved.nodeId);
            classifications.push({
              nodeId: resolved.nodeId,
              nodeName: resolved.nodeName,
              points,
              reason
            });
          }
        }
      }

      // 2. REGRA MANDATÓRIA: Respeitar e contemplar todas as áreas sugeridas existentes na árvore
      for (const suggested of rawItem.suggestedAreas) {
        const resolved = SemanticAreaResolver.resolveArea(suggested, tree);
        if (resolved) {
          if (!assignedNodeIds.has(resolved.nodeId)) {
            assignedNodeIds.add(resolved.nodeId);
            const points = rawItem.consolidationLevel ? Math.max(5, rawItem.consolidationLevel * 6) : 18;
            classifications.push({
              nodeId: resolved.nodeId,
              nodeName: resolved.nodeName,
              points,
              reason: `Atendimento obrigatorio a area sugerida: "${suggested}".`
            });
          }
        } else {
          unmatchedSuggestedAreas.push(suggested);
        }
      }

      // 3. Fallback de contingência caso nenhuma área válida tenha sido resolvida
      if (classifications.length === 0) {
        classifications.push(...this.fallbackItemAnalysis(rawItem, tree).classifications);
      }

      evaluatedItems.push({
        rawItemId: rawItem.id,
        learningDescription: rawItem.learningDescription,
        suggestedAreas: rawItem.suggestedAreas,
        startDate: rawItem.startDate || rawItem.observedDate,
        consolidationLevel: rawItem.consolidationLevel,
        pedagogicalEvaluation,
        classifications,
        unmatchedSuggestedAreas,
        additionalAreasIdentified
      });
    }

    return { summary, evaluatedItems, source: "gemini" };
  }

  static fallbackItemAnalysis(rawItem: InitialAlignmentRawItem, tree: KnowledgeNode): InitialAlignmentAnalysisItem {
    const text = (rawItem.learningDescription + " " + rawItem.suggestedAreas.join(" ")).toLowerCase();
    const classifications: NodeScoreAssignment[] = [];
    const points = rawItem.consolidationLevel ? Math.max(8, rawItem.consolidationLevel * 5) : 15;
    const assigned = new Set<string>();

    const tryAdd = (area: string, reason: string) => {
      const resolved = SemanticAreaResolver.resolveArea(area, tree);
      if (resolved && !assigned.has(resolved.nodeId)) {
        assigned.add(resolved.nodeId);
        classifications.push({
          nodeId: resolved.nodeId,
          nodeName: resolved.nodeName,
          points,
          reason
        });
      }
    };

    // Respeita primeiro as áreas sugeridas pelo responsável
    for (const s of rawItem.suggestedAreas) {
      tryAdd(s, `Área sugerida no relato: ${s}`);
    }

    if (classifications.length === 0) {
      if (text.includes("musica") || text.includes("som") || text.includes("canto") || text.includes("ouvir")) {
        tryAdd("aud", "Percepcao sonora e auditiva identificada.");
      }
      if (text.includes("conta") || text.includes("numero") || text.includes("matematica")) {
        tryAdd("mat", "Nocao inicial de contagem e numero.");
      }
      if (text.includes("arvore") || text.includes("planta") || text.includes("biologia") || text.includes("natureza")) {
        tryAdd("bio", "Observacao de elementos vivos e natureza.");
      }
      if (text.includes("cor") || text.includes("visao") || text.includes("arte") || text.includes("desenho")) {
        tryAdd("vis", "Discriminacao visual e cores.");
      }
      if (text.includes("peso") || text.includes("cair") || text.includes("mecan") || text.includes("forca")) {
        tryAdd("fis", "Nocao de relacoes e processos fisicos.");
      }
      if (text.includes("madeira") || text.includes("metal") || text.includes("material") || text.includes("quimica")) {
        tryAdd("qui", "Distincao de materiais e suas propriedades.");
      }
      if (text.includes("gentil") || text.includes("obrigad") || text.includes("por favor") || text.includes("social")) {
        tryAdd("cort", "Educacao social e delicadeza.");
      }
    }

    if (classifications.length === 0) {
      // Atribui ao nó folha Visão como base contemplativa da infância
      const defLeaf = TreeManager.findNode(tree, "vis") || tree;
      classifications.push({
        nodeId: defLeaf.id,
        nodeName: defLeaf.name,
        points,
        reason: "Aprendizado formativo observado e integrado."
      });
    }

    return {
      rawItemId: rawItem.id,
      learningDescription: rawItem.learningDescription,
      suggestedAreas: rawItem.suggestedAreas,
      startDate: rawItem.startDate || rawItem.observedDate,
      consolidationLevel: rawItem.consolidationLevel,
      pedagogicalEvaluation: "Avaliacao retrospectiva pedagogica estruturada.",
      classifications,
      unmatchedSuggestedAreas: [],
      additionalAreasIdentified: []
    };
  }

  static fallbackBatch(items: InitialAlignmentRawItem[], tree: KnowledgeNode, errorMessage?: string): InitialAlignmentBatchResult {
    return {
      summary: "Alinhamento retrospectivo gerado por contingencia.",
      evaluatedItems: items.map(i => this.fallbackItemAnalysis(i, tree)),
      source: "local-fallback",
      warningMessage: errorMessage || "A API do Gemini nao respondeu."
    };
  }

  static async alignPastLearnings(items: InitialAlignmentRawItem[], childAge: DetailedAge, tree: KnowledgeNode): Promise<InitialAlignmentBatchResult> {
    if (!items || items.length === 0) return { summary: "Nenhum aprendizado.", evaluatedItems: [], source: "local-fallback" };

    const treeContext = TreeManager.getAiContext(tree);

    try {
      const res = await fetch("/api/align-past-learnings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          childAge,
          treeContext
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "HTTP " + res.status);
      }

      const json = await res.json();
      return this.validateAlignmentResponse(json, items, tree);
    } catch (err: any) {
      return this.fallbackBatch(items, tree, err?.message || String(err));
    }
  }
}
