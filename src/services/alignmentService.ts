import {
  KnowledgeNode,
  DetailedAge,
  InitialAlignmentRawItem,
  InitialAlignmentAnalysisItem,
  InitialAlignmentBatchResult,
  NodeScoreAssignment
} from "../types/education";
import { TreeManager } from "../domain/treeManager";

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
      const unmatchedSuggestedAreas = Array.isArray(match.unmatchedSuggestedAreas) ? (match.unmatchedSuggestedAreas.filter(a => typeof a === "string" && a.trim()) as string[]) : [];
      const additionalAreasIdentified = Array.isArray(match.additionalAreasIdentified) ? (match.additionalAreasIdentified.filter(a => typeof a === "string" && a.trim()) as string[]) : [];
      const classifications: NodeScoreAssignment[] = [];
      if (Array.isArray(match.classifications)) {
        for (const cItem of match.classifications) {
          if (!cItem || typeof cItem !== "object") continue;
          const c = cItem as Record<string, unknown>;
          const nodeId = typeof c.nodeId === "string" ? c.nodeId.trim() : "";
          const points = typeof c.points === "number" ? Math.max(1, Math.min(100, Math.round(c.points))) : 15;
          const reason = typeof c.reason === "string" ? c.reason.trim() : "Consolidacao identificada.";
          if (!nodeId) continue;
          const existingNode = TreeManager.findNode(tree, nodeId);
          if (!existingNode) continue;
          classifications.push({ nodeId, nodeName: existingNode.name, points, reason });
        }
      }
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
    const multiplier = rawItem.consolidationLevel ? rawItem.consolidationLevel * 4 : 15;
    if (text.includes("conta") || text.includes("numero") || text.includes("matematica")) {
      const node = TreeManager.findNode(tree, "mat") || TreeManager.findNode(tree, "sens-ordem");
      if (node) classifications.push({ nodeId: node.id, nodeName: node.name, points: multiplier, reason: "Nocao inicial de contagem e numero." });
    }
    if (text.includes("arvore") || text.includes("planta") || text.includes("biologia") || text.includes("natureza")) {
      const node = TreeManager.findNode(tree, "bio") || TreeManager.findNode(tree, "sens-fisico");
      if (node) classifications.push({ nodeId: node.id, nodeName: node.name, points: multiplier, reason: "Observacao de elementos vivos e natureza." });
    }
    if (text.includes("cor") || text.includes("visao") || text.includes("arte") || text.includes("desenho")) {
      const node = TreeManager.findNode(tree, "vis") || TreeManager.findNode(tree, "sens-beleza");
      if (node) classifications.push({ nodeId: node.id, nodeName: node.name, points: multiplier, reason: "Discriminacao visual e cores." });
    }
    if (classifications.length === 0) {
      const defNode = TreeManager.findNode(tree, "sens-beleza") || tree;
      classifications.push({ nodeId: defNode.id, nodeName: defNode.name, points: multiplier, reason: "Aprendizado formativo observado." });
    }
    return {
      rawItemId: rawItem.id,
      learningDescription: rawItem.learningDescription,
      suggestedAreas: rawItem.suggestedAreas,
      startDate: rawItem.startDate || rawItem.observedDate,
      consolidationLevel: rawItem.consolidationLevel,
      pedagogicalEvaluation: "Avaliacao retrospectiva local por contingencia.",
      classifications,
      unmatchedSuggestedAreas: [],
      additionalAreasIdentified: []
    };
  }

  static fallbackBatch(items: InitialAlignmentRawItem[], tree: KnowledgeNode, errorMessage?: string): InitialAlignmentBatchResult {
    return {
      summary: "Alinhamento retrospectivo gerado localmente por contingencia.",
      evaluatedItems: items.map(i => this.fallbackItemAnalysis(i, tree)),
      source: "local-fallback",
      warningMessage: errorMessage || "A API do Gemini nao respondeu."
    };
  }

  static async alignPastLearnings(items: InitialAlignmentRawItem[], childAge: DetailedAge, tree: KnowledgeNode): Promise<InitialAlignmentBatchResult> {
    if (!items || items.length === 0) return { summary: "Nenhum aprendizado.", evaluatedItems: [], source: "local-fallback" };
    try {
      const res = await fetch("/api/align-past-learnings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, childAge, treeContext: { id: tree.id, name: tree.name } })
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
