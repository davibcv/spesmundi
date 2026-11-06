import { InitialAlignmentRawItem, ConsolidationLevel } from "../types/education";

export function parseInitialAlignmentText(rawText: string): InitialAlignmentRawItem[] {
  if (!rawText || !rawText.trim()) return [];

  const blocks = rawText
    .split(/\n\s*\n+/)
    .map(b => b.trim())
    .filter(b => b.length > 0);

  const results: InitialAlignmentRawItem[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const lines = block.split(/\n+/).map(l => l.trim()).filter(Boolean);
    const candidateLines = lines.length > 1 && lines.every(l => /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(l) || l.includes(" - "))
      ? lines
      : [block.replace(/\s*\n\s*/g, " ")];

    for (const line of candidateLines) {
      const item = parseSingleLineAlignment(line, "align-" + Date.now() + "-" + i + "-" + Math.random().toString(36).slice(2, 7));
      if (item) {
        results.push(item);
      }
    }
  }

  return results;
}

function parseSingleLineAlignment(text: string, id: string): InitialAlignmentRawItem | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  let workingText = trimmed;
  let startDate: string | undefined;

  const dateMatch = workingText.match(/^(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})\s*[-–—:]\s*(.+)$/s);
  if (dateMatch) {
    startDate = dateMatch[1].trim();
    workingText = dateMatch[2].trim();
  }

  let suggestedAreas: string[] = [];
  const parts = workingText.split(/\s+[-–—]\s+/);
  let mainBody = workingText;
  if (parts.length >= 2) {
    const possibleAreas = parts[parts.length - 1].trim();
    if (!possibleAreas.includes(";") && (possibleAreas.includes(",") || possibleAreas.length < 60)) {
      suggestedAreas = possibleAreas
        .split(/[,;\/]+/)
        .map(a => a.trim().replace(/[.\s]+$/, "").trim())
        .filter(a => a.length > 0);
      mainBody = parts.slice(0, parts.length - 1).join(" - ").trim();
    }
  }

  const subParts = mainBody.split(/\s*;\s*/);
  const learningDescription = subParts[0]?.trim() || workingText;

  let consolidationLevel: ConsolidationLevel | undefined;
  let repetitionFrequency: string | undefined;

  for (let j = 1; j < subParts.length; j++) {
    const meta = subParts[j].trim();
    const consMatch = meta.match(/(?:consolação|consolida[çc][aã]o|n[ií]vel)?\s*(?:atual)?\s*([1-5])\s*(?:\/\s*5)?/i);
    if (consMatch) {
      const parsedVal = parseInt(consMatch[1], 10);
      if (parsedVal >= 1 && parsedVal <= 5) {
        consolidationLevel = parsedVal as ConsolidationLevel;
      }
    }

    if (/repeti[çc][aã]o|frequ[eê]ncia|pr[aá]tica|ocasional|di[aá]ri|semanal|meses|anos|durante/i.test(meta)) {
      repetitionFrequency = meta;
    }
  }

  return {
    id,
    originalText: trimmed,
    startDate,
    learningDescription,
    consolidationLevel,
    repetitionFrequency,
    suggestedAreas
  };
}
