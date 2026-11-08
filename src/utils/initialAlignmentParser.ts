import { InitialAlignmentRawItem, ConsolidationLevel } from "../types/education";

export function parseInitialAlignmentText(
  rawText: string,
  referenceBirthDate?: string
): InitialAlignmentRawItem[] {
  if (!rawText || !rawText.trim()) return [];

  const blocks = rawText
    .split(/\n\s*\n+/)
    .map(b => b.trim())
    .filter(b => b.length > 0);

  const results: InitialAlignmentRawItem[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const lines = block.split(/\n+/).map(l => l.trim()).filter(Boolean);
    const candidateLines =
      lines.length > 1 &&
      lines.every(l => /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(l) || l.includes(" - "))
        ? lines
        : [block.replace(/\s*\n\s*/g, " ")];

    for (let j = 0; j < candidateLines.length; j++) {
      const line = candidateLines[j];
      const item = parseSingleLineAlignment(
        line,
        "align-" + Date.now() + "-" + i + "-" + j,
        referenceBirthDate
      );
      if (item) {
        results.push(item);
      }
    }
  }

  return results;
}

function parseSuggestedAreas(areasText: string): string[] {
  const areas: string[] = [];
  let buffer = "";
  let parenDepth = 0;

  for (let i = 0; i < areasText.length; i++) {
    const char = areasText[i];
    if (char === "(" || char === "[") {
      parenDepth++;
      buffer += char;
    } else if (char === ")" || char === "]") {
      parenDepth = Math.max(0, parenDepth - 1);
      buffer += char;
    } else if ((char === "," || char === ";" || char === "/") && parenDepth === 0) {
      const clean = buffer.trim().replace(/[.\s]+$/, "").trim();
      if (clean) areas.push(clean);
      buffer = "";
    } else {
      buffer += char;
    }
  }

  const lastClean = buffer.trim().replace(/[.\s]+$/, "").trim();
  if (lastClean) areas.push(lastClean);

  return areas;
}

function estimateDateFromTimeMarker(marker: string, birthDateStr?: string): string {
  const now = new Date();
  const birth = birthDateStr ? new Date(birthDateStr) : new Date(now.getFullYear() - 3, now.getMonth(), now.getDate());
  const lower = marker.toLowerCase();

  if (lower.includes("nascimento")) {
    return birth.toISOString().split("T")[0];
  }

  const yearsMatch = lower.match(/(\d+)\s*anos?(?:\s*e\s*(\d+)\s*meses?)?/);
  if (yearsMatch) {
    const years = parseInt(yearsMatch[1], 10);
    const months = yearsMatch[2] ? parseInt(yearsMatch[2], 10) : (lower.includes("poucos meses") || lower.includes("meio") ? 6 : 0);
    const targetDate = new Date(birth);
    targetDate.setFullYear(birth.getFullYear() + years);
    targetDate.setMonth(birth.getMonth() + months);
    return targetDate.toISOString().split("T")[0];
  }

  const oneYearMatch = lower.match(/(?:1\s*ano|um\s*ano)/);
  if (oneYearMatch) {
    const targetDate = new Date(birth);
    targetDate.setFullYear(birth.getFullYear() + 1);
    return targetDate.toISOString().split("T")[0];
  }

  // Fallback para datas retrospectivas genéricas: 1 ano atrás
  const fallbackDate = new Date(now);
  fallbackDate.setFullYear(now.getFullYear() - 1);
  return fallbackDate.toISOString().split("T")[0];
}

function parseSingleLineAlignment(
  text: string,
  id: string,
  referenceBirthDate?: string
): InitialAlignmentRawItem | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  let workingText = trimmed;
  let observedDate: string | undefined;
  let timeMarker: string | undefined;

  // 1. Extrai datas absolutas (DD/MM/AAAA)
  const absDateMatch = workingText.match(/^(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})\s*[-–—:]\s*(.+)$/s);
  if (absDateMatch) {
    observedDate = absDateMatch[1].trim();
    timeMarker = observedDate;
    workingText = absDateMatch[2].trim();
  } else {
    // 2. Extrai marcadores temporais relativos no início
    const relDateMatch = workingText.match(/^((?:Desde|Por volta|Perto|Antes|Após|Ao longo|Aos|Data não informada)[^–—\-]+)\s*[-–—:]\s*(.+)$/is);
    if (relDateMatch) {
      timeMarker = relDateMatch[1].trim();
      observedDate = estimateDateFromTimeMarker(timeMarker, referenceBirthDate);
      workingText = relDateMatch[2].trim();
    }
  }

  // 3. Extrai áreas sugeridas ao final da linha (após o último hífen)
  let suggestedAreas: string[] = [];
  const parts = workingText.split(/\s+[-–—]\s+/);
  let mainBody = workingText;

  if (parts.length >= 2) {
    const possibleAreas = parts[parts.length - 1].trim();
    if (!possibleAreas.includes(";") && (possibleAreas.includes(",") || possibleAreas.length < 80)) {
      suggestedAreas = parseSuggestedAreas(possibleAreas);
      mainBody = parts.slice(0, parts.length - 1).join(" - ").trim();
    }
  }

  // 4. Extrai descrição e metadados divididos por ponto e vírgula
  const subParts = mainBody.split(/\s*;\s*/);
  const learningDescription = (subParts[0]?.trim() || workingText)
    .replace(/^[-•*]\s*/, "")
    .trim();

  let consolidationLevel: ConsolidationLevel = 3;
  let frequency: 'raramente' | 'as_vezes' | 'frequentemente' | 'sempre' = 'frequentemente';
  let repetitionFrequency: string | undefined;

  for (let j = 1; j < subParts.length; j++) {
    const meta = subParts[j].trim();
    const consMatch = meta.match(/(?:consolação|consolida[çc][aã]o|n[ií]vel)?\s*(?:atual)?\s*([1-5])(?:\s*(?:a|-)\s*([1-5]))?\s*(?:\/\s*5)?/i);
    if (consMatch) {
      const val1 = parseInt(consMatch[1], 10);
      const val2 = consMatch[2] ? parseInt(consMatch[2], 10) : val1;
      const avg = Math.round((val1 + val2) / 2);
      if (avg >= 1 && avg <= 5) {
        consolidationLevel = avg as ConsolidationLevel;
      }
    } else if (/não informado|incerto/i.test(meta)) {
      consolidationLevel = 3;
    }

    if (/frequ[eê]ncia|repeti[çc][aã]o|durante/i.test(meta) || /alta|constante|sempre|di[aá]ri/i.test(meta)) {
      repetitionFrequency = meta;
      if (/sempre|di[aá]ri|alta|constante/i.test(meta)) {
        frequency = 'sempre';
      } else if (/frequente/i.test(meta)) {
        frequency = 'frequentemente';
      } else if (/baixa|rara|interrompida/i.test(meta)) {
        frequency = 'raramente';
      } else {
        frequency = 'as_vezes';
      }
    }
  }

  return {
    id,
    originalText: trimmed,
    startDate: observedDate,
    observedDate,
    learningDescription,
    consolidationLevel,
    frequency,
    repetitionFrequency: repetitionFrequency || timeMarker,
    suggestedAreas
  };
}
