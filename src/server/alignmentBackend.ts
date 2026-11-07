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
      "1. Analise item a item individualmente com rigor, profundidade pedagogica e fidelidade aos marcos informados.\n" +
      "2. REGRA MANDATÓRIA DE ÁREAS SUGERIDAS: Todas as áreas sugeridas pelos pais DEVEM ser obrigatoriamente contempladas e vinculadas aos nós folha correspondentes da árvore de conhecimento. Se os pais sugerirem por exemplo 'Audição', 'Física', 'Química', 'Matemática' ou 'Boas Maneiras', associe diretamente o respectivo nó folha (ex: aud, fis, qui, mat, boas-man).\n" +
      "3. Além das áreas sugeridas obrigatórias, exerça plena acuidade analítica para identificar e adicionar outras áreas da árvore que foram comprovadamente mobilizadas no relato formativo.\n" +
      "4. ATRIBUIÇÃO EXCLUSIVA A NÓS FOLHA: Atribua pontos somente a nós folha terminais da árvore (como aud, vis, fis, qui, bio, mat, cort, boas-man, conv, etc.), NUNCA a ramos intermediários ou raízes.\n" +
      "5. REGUA DE CALIBRAÇÃO (10 a 30 pontos por nó): Calibre os pontos com base no grau de consolidação (1 a 5) e tempo de prática (ex.: Nível 1-2 = 10-14 pts; Nível 3 = 15-18 pts; Nível 4 = 19-24 pts; Nível 5 = 25-30 pts).\n" +
      "6. Use exclusivamente os IDs informados no catálogo estruturado da árvore pedagógica fornecida.\n" +
      "Retorne rigorosamente apenas um objeto JSON com o formato:\n" +
      "{\n" +
      "  \"summary\": \"resumo geral do alinhamento inicial do periodo\",\n" +
      "  \"evaluatedItems\": [\n" +
      "    {\n" +
      "      \"rawItemId\": \"id-do-item\",\n" +
      "      \"pedagogicalEvaluation\": \"justificativa pedagogica fundamentada para este aprendizado\",\n" +
      "      \"unmatchedSuggestedAreas\": [],\n" +
      "      \"additionalAreasIdentified\": [\"area adicional diagnosticada pela IA\"],\n" +
      "      \"classifications\": [\n" +
      "        { \"nodeId\": \"id-do-no-folha\", \"points\": 20, \"reason\": \"justificativa do impacto formativo\" }\n" +
      "      ]\n" +
      "    }\n" +
      "  ]\n" +
      "}\n" +
      "Catálogo estruturado da árvore de conhecimento:\n" + JSON.stringify(treeContext);

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
