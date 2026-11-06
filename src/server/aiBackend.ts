import type { IncomingMessage, ServerResponse } from "http";

export function getResolvedApiKeys(passedKey?: string): string[] {
  const keys: string[] = [];
  if (passedKey && passedKey.startsWith("AIza")) keys.push(passedKey);
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.startsWith("AIza") && !keys.includes(process.env.GEMINI_API_KEY)) {
    keys.push(process.env.GEMINI_API_KEY);
  }
  if (process.env.GEMINI_BACKUP_API_KEY && process.env.GEMINI_BACKUP_API_KEY.startsWith("AIza") && !keys.includes(process.env.GEMINI_BACKUP_API_KEY)) {
    keys.push(process.env.GEMINI_BACKUP_API_KEY);
  }
  try {
    const fs = require("fs");
    const path = require("path");
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      const matchPrimary = content.match(/^(?:GEMINI_API_KEY|VITE_GEMINI_API_KEY)=(AIza[^\r\n\s]+)/m);
      if (matchPrimary && !keys.includes(matchPrimary[1].trim())) keys.push(matchPrimary[1].trim());
      const matchBackup = content.match(/^(?:GEMINI_BACKUP_API_KEY|VITE_GEMINI_BACKUP_API_KEY)=(AIza[^\r\n\s]+)/m);
      if (matchBackup && !keys.includes(matchBackup[1].trim())) keys.push(matchBackup[1].trim());
    }
  } catch {}
  return keys;
}

export function getResolvedApiKey(passedKey?: string): string {
  const keys = getResolvedApiKeys(passedKey);
  return keys.length > 0 ? keys[0] : "";
}

function readRequestBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => { data += chunk; });
    req.on("end", () => resolve(data));
    req.on("error", err => reject(err));
  });
}

async function callGeminiWithRetry(url: string, payload: any, maxRetries = 3): Promise<Response> {
  let lastResponse: Response | null = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify(payload)
      });
      clearTimeout(timeout);
      lastResponse = res;
      if (res.ok) return res;
      if (res.status !== 503 && res.status !== 429 && res.status !== 500) {
        return res;
      }
    } catch (err: any) {
      clearTimeout(timeout);
      if (attempt === maxRetries) throw err;
    }
    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 4000);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  return lastResponse!;
}

export async function handleAnalyzeActivity(req: IncomingMessage, res: ServerResponse, apiKey: string) {
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
    const { narrative, childAge, treeContext, consolidationLevel } = body;

    if (!narrative || typeof narrative !== "string" || !narrative.trim()) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: "Relato nao fornecido." }));
      return;
    }

    const systemPrompt = "Voce e o analista pedagogico do SpesMundi. Sua missao e analisar o relato de vivencia formativa da crianca e identificar com precisao quais ramos e folhas da arvore pedagogica do sistema foram efetivamente mobilizados. " +
    "Regras obrigatorias:\\n" +
    "1. Use exclusivamente os IDs exatos informados na arvore de conhecimento fornecida.\\n" +
    "2. Se o relato for vago, puramente circunstancial ou insuficiente para evidenciar desenvolvimento pedagogico real, retorne insufficientInformation: true e deixe classifications como lista vazia ([]).\\n" +
    "3. Nao invente capacidades nem presuma fatos nao narrados.\\n" +
    "4. Atribua pontos coerentes entre 5 e 25 por no contemplado com justificativa clara e objetiva.\\n" +
    "5. REGUA DE CONSOLIDACAO DO APRENDIZADO (1 a 5): O responsavel informa o grau de consolidacao (1 a 5). Utilize essa informacao para orientar a interpretacao pedagogica e calibrar a pontuacao.\\n" +
    "Retorne rigorosamente apenas um objeto JSON com o seguinte formato:\\n" +
    "{\\n" +
    "  \"activitySummary\": \"resumo objetivo da vivencia\",\\n" +
    "  \"overallReasoning\": \"justificativa pedagogica geral fundamentada\",\\n" +
    "  \"confidence\": 0.9,\\n" +
    "  \"insufficientInformation\": false,\\n" +
    "  \"clarificationPrompt\": \"pergunta para os pais caso o relato seja vago\",\\n" +
    "  \"classifications\": [\\n" +
    "    { \"nodeId\": \"id-do-no\", \"points\": 15, \"reason\": \"evidencia observada no relato\" }\\n" +
    "  ]\\n" +
    "}\\n" +
    "Arvore pedagogica cadastrada:\\n" + JSON.stringify(treeContext);

    const userPrompt = "Idade da crianca: " + (childAge?.formatted || "Nao informada") + " (" + (childAge?.totalMonths || 0) + " meses)." + (consolidationLevel ? "\nGrau de Consolidacao Informado: Nivel " + consolidationLevel + " de 5." : "") + "\nRelato: " + narrative.trim();

    let geminiRes: Response | null = null;
    let lastErrorText = "";

    for (const key of resolvedKeys) {
      const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=" + key;
      try {
        geminiRes = await callGeminiWithRetry(url, {
          contents: [
            {
              role: "user",
              parts: [{ text: systemPrompt + "\n\n--- DADOS DA ATIVIDADE ---\n" + userPrompt }]
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
      res.end(JSON.stringify({ error: "Erro na Gemini API (HTTP " + status + ")", details: lastErrorText }));
      return;
    }

    const data: any = await geminiRes.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      res.statusCode = 502;
      res.end(JSON.stringify({ error: "Resposta vazia recebida do modelo Gemini." }));
      return;
    }

    const parsed = JSON.parse(candidateText);
    parsed.source = "gemini";
    res.statusCode = 200;
    res.end(JSON.stringify(parsed));
  } catch (err: any) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Erro interno no servidor ao processar analise.", message: err?.message || String(err) }));
  }
}

export function getApiKeyForServer(): string {
  return getResolvedApiKey();
}
