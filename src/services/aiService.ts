import { KnowledgeNode, AIAnalysisProposal, DetailedAge, NodeScoreAssignment } from "../types/education";
import { TreeManager } from "../domain/treeManager";

export class AIService {
  static validateAIResponse(rawJson: unknown, tree: KnowledgeNode): AIAnalysisProposal {
    if (!rawJson || typeof rawJson !== "object") {
      throw new Error("Resposta da IA invalida: objeto nao fornecido");
    }
    const obj = rawJson as Record<string, unknown>;
    const activitySummary = typeof obj.activitySummary === "string" ? obj.activitySummary.trim() : "Atividade observada e registrada.";
    const overallReasoning = typeof obj.overallReasoning === "string" ? obj.overallReasoning.trim() : "Analise baseada nos elementos formativos descritos.";
    const confidence = typeof obj.confidence === "number" ? Math.max(0, Math.min(1, obj.confidence)) : 0.85;
    const insufficientInformation = Boolean(obj.insufficientInformation);
    const clarificationPrompt = typeof obj.clarificationPrompt === "string" ? obj.clarificationPrompt.trim() : undefined;
    const source: "gemini" | "local-fallback" = obj.source === "gemini" ? "gemini" : "local-fallback";
    const warningMessage = typeof obj.warningMessage === "string" ? obj.warningMessage : undefined;

    const classifications: NodeScoreAssignment[] = [];
    if (!insufficientInformation && Array.isArray(obj.classifications)) {
      for (const item of obj.classifications) {
        if (!item || typeof item !== "object") continue;
        const c = item as Record<string, unknown>;
        const nodeId = typeof c.nodeId === "string" ? c.nodeId.trim() : "";
        const points = typeof c.points === "number" ? Math.max(1, Math.min(100, Math.round(c.points))) : 10;
        const reason = typeof c.reason === "string" ? c.reason.trim() : "Participacao ativa identificada no relato.";

        if (!nodeId) continue;
        const existingNode = TreeManager.findNode(tree, nodeId);
        if (!existingNode) continue;

        classifications.push({
          nodeId,
          nodeName: existingNode.name,
          points,
          reason
        });
      }
    }

    return {
      activitySummary,
      classifications,
      overallReasoning,
      confidence,
      insufficientInformation,
      clarificationPrompt,
      source,
      warningMessage
    };
  }

  static async analyzeActivity(
    narrative: string,
    childAge: DetailedAge,
    tree: KnowledgeNode
  ): Promise<AIAnalysisProposal> {
    const treeContext = TreeManager.getAiContext(tree);

    const res = await fetch("/api/analyze-activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        narrative,
        childAge,
        treeContext
      })
    });

    const contentType = res.headers.get("content-type") || "";
    if (!res.ok || !contentType.includes("application/json")) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Servidor de analise retornou erro HTTP ${res.status}${errText ? `: ${errText}` : ""}`);
    }

    const data = await res.json();
    return AIService.validateAIResponse(data, tree);
  }

  static fallbackLocalAnalysis(narrative: string, tree: KnowledgeNode, errorMessage?: string): AIAnalysisProposal {
    const lower = narrative.toLowerCase();
    const classifications: NodeScoreAssignment[] = [];

    if (lower.includes("folha") || lower.includes("jardim") || lower.includes("natureza") || lower.includes("planta") || lower.includes("flor")) {
      const bio = TreeManager.findNode(tree, "bio");
      if (bio) classifications.push({ nodeId: bio.id, nodeName: bio.name, points: 15, reason: "Observacao atenta de elementos botanicos e da criacao viva." });
    }

    if (lower.includes("cor") || lower.includes("olh") || lower.includes("forma") || lower.includes("observ") || lower.includes("ver")) {
      const vis = TreeManager.findNode(tree, "vis");
      if (vis) classifications.push({ nodeId: vis.id, nodeName: vis.name, points: 10, reason: "Educacao da percepcao visual e contemplacao da harmonia." });
    }

    if (lower.includes("gentil") || lower.includes("conversa") || lower.includes("fal") || lower.includes("ouvi") || lower.includes("ajud") || lower.includes("diferen") || lower.includes("madeira") || lower.includes("metal")) {
      const conv = TreeManager.findNode(tree, "conv") || TreeManager.findNode(tree, "cort") || TreeManager.findNode(tree, "sens-fisico");
      if (conv) classifications.push({ nodeId: conv.id, nodeName: conv.name, points: 12, reason: "Atividade perceptiva e de discernimento material no cotidiano." });
    }

    if (classifications.length === 0) {
      const defNode = TreeManager.findNode(tree, "sens-beleza") || tree;
      classifications.push({ nodeId: defNode.id, nodeName: defNode.name, points: 10, reason: "Vivencia formativa integrada observada no cotidiano." });
    }

    return {
      activitySummary: "Classificacao local contingencial (API indisponivel).",
      classifications,
      overallReasoning: "Analise realizada localmente por contingencia devido a falha na conexao com a API.",
      confidence: 0.5,
      insufficientInformation: false,
      source: "local-fallback",
      warningMessage: errorMessage || "A API do Gemini nao respondeu. Esta proposta foi gerada por contingencia local e deve ser revisada."
    };
  }
}
