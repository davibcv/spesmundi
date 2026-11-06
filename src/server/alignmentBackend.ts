import { IncomingMessage, ServerResponse } from "http";
import { getResolvedApiKeys, callGeminiWithRetry, readRequestBody } from "./aiBackend";

export async function handleAlignPastLearnings(req: IncomingMessage, res: ServerResponse, apiKey: string) {
  res.setHeader("Content-Type", "application/json");

  const resolvedKeys = getResolvedApiKeys(apiKey);
  if (resolvedKeys.length === 0) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Nenhuma chave de API do Gemini configurada no servidor." }));
    return;
  }

  try {
    const rawBody = await readRequestBody(req);
    const body = JSON.parse(rawBody || "{}");
    const { items, childAge, treeContext } = body;

    if (!Array.isArray(items) || items.length === 0) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: "Lista de itens para alinhamento inicial nao fornecida ou vazia." }));
      return;
    }

    const systemPrompt = "Voce e o analista pedagogico do SpesMundi especializado em Alinhamento Inicial Retrospectivo. " +
      "Sua missao e avaliar cada aprendizado previo informado pelo responsavel da crianca, ponderando o relato, data de inicio, frequencia e grau de consolidacao (1 a 5).\n" +
      "Diretrizes obrigatorias:\n" +
      "1. Analise item a item individualmente com rigor e profundidade.\n" +
      "2. Respeite as areas sugeridas pelos pais como guia prioritario, mas exerca plena liberdade analitica para adicionar outras areas da arvore de conhecimento que foram comprovadamente mobilizadas.\n" +
      "3. Use exclusivamente os IDs exatos informados na arvore de conhecimento fornecida.\n" +
      "4. Calibre a pontuacao (entre 5 e 30 pontos por no contemplado) considerando a solidez do aprendizado e tempo de consolidacao.\n" +
      "5. Identifique se alguma area sugerida pelos pais nao encontra correspondencia direta na arvore atual.\n" +
      "Retorne rigorosamente um objeto JSON com o formato:\n" +
      "{\n" +
      "  \"summary\": \"resumo geral do alinhamento inicial do periodo\",\n" +
      "  \"evaluatedItems\": [\n" +
      "    {\n" +
      "      \"rawItemId\": \"id-do-item\",\n" +
      "      \"pedagogicalEvaluation\": \"justificativa pedagogica fundamentada para este aprendizado\",\n" +
      "      \"unmatchedSuggestedAreas\": [\"area sugerida sem no correspondente\"],\n" +
      "      \"additionalAreasIdentified\": [\"area adicional diagnosticada pela IA\"],\n" +
      "      \"classifications\": [\n" +
      "        { \"nodeId\": \"id-do-no\", \"points\": 20, \"reason\": \"justificativa do impacto\" }\n" +
      "      ]\n" +
      "    }\n" +
      "  ]\n" +
      "}\n" +
      "Arvore pedagogica cadastrada:\n" + JSON.stringify(treeContext);

    const userPrompt = "Idade de referencia da crianca: " + (childAge?.formatted || "Nao informada") + "\n" +
      "Itens retrospectivos informados pelos pais:\n" + JSON.stringify(items, null, 2);

    let geminiRes: Response | null = null;
    let lastErrorText = "";

    for (const key of resolvedKeys) {
      const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=" + key;
      try {
        geminiRes = await callGeminiWithRetry(url, {
          contents: [
            {
              role: "user",
              parts: [{ text: systemPrompt + "\n\n--- ITENS DE ALINHAMENTO ---\n" + userPrompt }]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json"
          }
        }, 2);
        if (geminiRes && geminiRes.ok) break;
        if (geminiRes) {
          lastErrorText = await geminiRes.text().catch(() => "");
        }
      } catch (err: any) {
        lastErrorText = err?.message || String(err);
      }
    }

    if (!geminiRes || !geminiRes.ok) {
      const status = geminiRes ? geminiRes.status : 503;
      res.statusCode = status;
      res.end(JSON.stringify({ error: "Erro na Gemini API ao alinhar aprendizados (HTTP " + status + ")", details: lastErrorText }));
      return;
    }

    const data: any = await geminiRes.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      res.statusCode = 502;
      res.end(JSON.stringify({ error: "Resposta vazia recebida do modelo Gemini para alinhamento inicial." }));
      return;
    }

    const parsed = JSON.parse(candidateText);
    res.statusCode = 200;
    res.end(JSON.stringify(parsed));
  } catch (err: any) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Erro interno no servidor ao processar alinhamento inicial.", message: err?.message || String(err) }));
  }
}
