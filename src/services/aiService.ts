import { KnowledgeNode, AIAnalysisProposal, DetailedAge, NodeScoreAssignment, ConsolidationLevel } from "../types/education";
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
    tree: KnowledgeNode,
    consolidationLevel?: ConsolidationLevel
  ): Promise<AIAnalysisProposal> {
    const treeContext = TreeManager.getAiContext(tree);
    const env = (typeof import.meta !== "undefined" && (import.meta as any).env) || {};
    const primaryKey = env.VITE_GEMINI_API_KEY || "";
    const backupKey = env.VITE_GEMINI_BACKUP_API_KEY || "";

    try {
      const res = await fetch("/api/analyze-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          narrative,
          childAge,
          treeContext,
          consolidationLevel
        })
      });

      const contentType = res.headers.get("content-type") || "";
      if (res.ok && contentType.includes("application/json")) {
        const data = await res.json();
        return AIService.validateAIResponse(data, tree);
      }
    } catch {}

    const keysToTry: { key: string; label: string }[] = [];
    if (primaryKey && primaryKey.startsWith("AIza")) {
      keysToTry.push({ key: primaryKey, label: "chave primária" });
    }
    if (backupKey && backupKey.startsWith("AIza") && backupKey !== primaryKey) {
      keysToTry.push({ key: backupKey, label: "chave reserva" });
    }

    let lastError = "";
    for (const { key, label } of keysToTry) {
      try {
        const directData = await AIService.callDirectGemini(narrative, childAge, treeContext, key, consolidationLevel);
        return AIService.validateAIResponse(directData, tree);
      } catch (err: any) {
        lastError = err?.message || String(err);
        console.warn("Falha na chamada direta com " + label + ": " + lastError);
      }
    }

    if (keysToTry.length > 0) {
      const fallback = AIService.fallbackLocalAnalysis(narrative, tree);
      fallback.warningMessage = "Atenção: Falha na API direta do Gemini (todas as chaves tentadas falharam). Último erro: " + lastError;
      return fallback;
    }

    throw new Error("Servidor de análise e chaves de API do Gemini indisponíveis.");
  }

  private static async callDirectGemini(
    narrative: string,
    childAge: DetailedAge,
    treeContext: any[],
    apiKey: string,
    consolidationLevel?: ConsolidationLevel
  ): Promise<any> {
    const systemPrompt = "Voce e o analista pedagogico do SpesMundi. Sua missao e analisar o relato de vivencia formativa da crianca e identificar com precisao quais ramos e folhas da arvore pedagogica do sistema foram efetivamente mobilizados. " +
       "Regras obrigatorias:\n1. Use exclusivamente os IDs exatos informados na arvore de conhecimento fornecida.\n" + "2. Se o relato for vago, puramente circunstancial ou insuficiente para evidenciar desenvolvimento pedagogico real, retorne insufficientInformation: true e deixe classifications como lista vazia ([]).\n" + "3. Nao invente capacidades nem presuma fatos nao narrados.\n" + "4. Atribua pontos coerentes entre 5 e 25 por no contemplado com justificativa clara e objetiva.\n" + "5. REGUA DE CONSOLIDACAO DO APRENDIZADO (1 a 5): O responsavel informa o grau de consolidacao (1 a 5). Utilize esta informacao para orientar a interpretacao pedagogica e calibrar a pontuacao.\n" +
      "Retorne rigorosamente apenas um objeto JSON com o seguinte formato:\n" +
      "{\n" +
      "  \"activitySummary\": \"resumo objetivo da vivencia\",\n" +
      "  \"overallReasoning\": \"justificativa pedagogica geral fundamentada\",\n" +
      "  \"confidence\": 0.9,\n" +
      "  \"insufficientInformation\": false,\n" +
      "  \"clarificationPrompt\": \"pergunta para os pais caso o relato seja vago\",\n" +
      "  \"classifications\": [\n" +
      "    { \"nodeId\": \"id-do-no\", \"points\": 15, \"reason\": \"evidencia observada no relato\" }\n" +
      "  ]\n" +
      "}\n" +
      "Arvore pedagogica cadastrada:\n" + JSON.stringify(treeContext);

    const userPrompt = "Idade da crianca: " + (childAge?.formatted || "Nao informada") + " (" + (childAge?.totalMonths || 0) + " meses)." + (consolidationLevel ? "\nGrau de Consolidacao Informado: Nivel " + consolidationLevel + " de 5." : "") + "\nRelato: " + narrative.trim();
    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=" + apiKey;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: systemPrompt + "\n\n--- DADOS DA ATIVIDADE ---\n" + userPrompt }]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error("HTTP " + res.status + ": " + errText);
    }

    const data = await res.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error("Resposta vazia da Gemini API.");
    }

    const parsed = JSON.parse(candidateText);
    parsed.source = "gemini";
    return parsed;
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

export { AlignmentService } from "./alignmentService";
