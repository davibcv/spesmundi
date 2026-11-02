import { KnowledgeNode, AIAnalysisProposal, DetailedAge, NodeScoreAssignment } from "../types/education";
import { TreeManager } from "../domain/treeManager";

export class AIService {
  static validateAIResponse(rawJson: unknown, tree: KnowledgeNode): AIAnalysisProposal {
    if (!rawJson || typeof rawJson !== "object") {
      throw new Error("Resposta da IA inválida: objeto não fornecido");
    }
    const obj = rawJson as Record<string, unknown>;
    const activitySummary = typeof obj.activitySummary === "string" ? obj.activitySummary.trim() : "Atividade observada e registrada.";
    const overallReasoning = typeof obj.overallReasoning === "string" ? obj.overallReasoning.trim() : "Análise baseada nos elementos formativos descritos.";
    const confidence = typeof obj.confidence === "number" ? Math.max(0, Math.min(1, obj.confidence)) : 0.85;
    const insufficientInformation = Boolean(obj.insufficientInformation);
    const clarificationPrompt = typeof obj.clarificationPrompt === "string" ? obj.clarificationPrompt.trim() : undefined;
    const classifications: NodeScoreAssignment[] = [];
    if (Array.isArray(obj.classifications)) {
      for (const item of obj.classifications) {
        if (!item || typeof item !== "object") continue;
        const c = item as Record<string, unknown>;
        const nodeId = typeof c.nodeId === "string" ? c.nodeId.trim() : "";
        const points = typeof c.points === "number" ? Math.max(1, Math.min(100, Math.round(c.points))) : 10;
        const reason = typeof c.reason === "string" ? c.reason.trim() : "Participação ativa identificada no relato.";
        if (!nodeId) continue;
        const existingNode = TreeManager.findNode(tree, nodeId);
        if (!existingNode) continue;
        classifications.push({ nodeId, nodeName: existingNode.name, points, reason });
      }
    }
    return { activitySummary, classifications, overallReasoning, confidence, insufficientInformation, clarificationPrompt };
  }

  static buildPromptContext(narrative: string, childAge: DetailedAge, tree: KnowledgeNode) {
    const treeContext = TreeManager.getAiContext(tree);
    const systemPrompt = "Você é a mentora educacional do sistema Spes Mundi. Identifique capacidades trabalhadas ordenadas ao fim: Amar a Deus e ao Próximo. Estrutura: " + JSON.stringify(treeContext);
    const userPrompt = "Idade: " + childAge.formatted + " (" + childAge.totalMonths + " meses). Relato: " + narrative;
    return { systemPrompt, userPrompt };
  }

  static async analyzeActivity(narrative: string, childAge: DetailedAge, tree: KnowledgeNode, customApiKey?: string): Promise<AIAnalysisProposal> {
    const apiKey = customApiKey || (typeof import.meta !== "undefined" && (import.meta as any).env ? ((import.meta as any).env.VITE_GEMINI_API_KEY as string) : "");
    if (!apiKey) {
      return AIService.fallbackLocalAnalysis(narrative, tree);
    }
    const { systemPrompt, userPrompt } = AIService.buildPromptContext(narrative, childAge, tree);
    const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: systemPrompt + " --- " + userPrompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });
    if (!response.ok) throw new Error("Falha na requisição de IA (HTTP " + response.status + ")");
    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) throw new Error("Resposta de IA vazia");
    return AIService.validateAIResponse(JSON.parse(candidateText), tree);
  }

  static fallbackLocalAnalysis(narrative: string, tree: KnowledgeNode): AIAnalysisProposal {
    const lower = narrative.toLowerCase();
    const classifications: NodeScoreAssignment[] = [];
    if (lower.includes("folha") || lower.includes("jardim") || lower.includes("natureza") || lower.includes("planta") || lower.includes("flor")) {
      const bio = TreeManager.findNode(tree, "bio");
      if (bio) classifications.push({ nodeId: bio.id, nodeName: bio.name, points: 15, reason: "Observação atenta de elementos botânicos e da criação viva." });
    }
    if (lower.includes("cor") || lower.includes("olh") || lower.includes("forma") || lower.includes("observ") || lower.includes("ver")) {
      const vis = TreeManager.findNode(tree, "vis");
      if (vis) classifications.push({ nodeId: vis.id, nodeName: vis.name, points: 10, reason: "Educação da percepção visual e contemplação da harmonia." });
    }
    if (lower.includes("gentil") || lower.includes("conversa") || lower.includes("fal") || lower.includes("ouvi") || lower.includes("ajud") || lower.includes("diferen")) {
      const conv = TreeManager.findNode(tree, "conv") || TreeManager.findNode(tree, "cort");
      if (conv) classifications.push({ nodeId: conv.id, nodeName: conv.name, points: 12, reason: "Prática de diálogo, convivência atenta e cortesia." });
    }
    if (classifications.length === 0) {
      const defNode = TreeManager.findNode(tree, "sens-beleza") || tree;
      classifications.push({ nodeId: defNode.id, nodeName: defNode.name, points: 10, reason: "Vivência formativa integrada observada no cotidiano." });
    }
    return {
      activitySummary: "Atividade observacional e formativa no cotidiano.",
      classifications,
      overallReasoning: "Classificação preliminar fundamentada na finalidade educativa do croqui, aguardando revisão e confirmação dos pais.",
      confidence: 0.9,
      insufficientInformation: false
    };
  }
}
