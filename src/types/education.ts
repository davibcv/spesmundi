
export type ConsolidationLevel = 1 | 2 | 3 | 4 | 5;

export interface ConsolidationLevelMeta {
  level: ConsolidationLevel;
  title: string;
  shortLabel: string;
  description: string;
}

export const CONSOLIDATION_LEVELS_META: Record<ConsolidationLevel, ConsolidationLevelMeta> = {
  1: {
    level: 1,
    title: "Ponto 1 — Aprendizado inicial",
    shortLabel: "Inicial",
    description: "A criança acabou de aprender, apresentou dificuldade e provavelmente ainda não conseguiria reproduzir o conhecimento sozinha no dia seguinte."
  },
  2: {
    level: 2,
    title: "Ponto 2 — Pouco consolidado",
    shortLabel: "Pouco consolidado",
    description: "A criança demonstra alguma compreensão, mas ainda precisa de ajuda, orientação ou repetição frequente."
  },
  3: {
    level: 3,
    title: "Ponto 3 — Em desenvolvimento",
    shortLabel: "Em desenvolvimento",
    description: "A criança já consegue realizar a atividade, mas ainda apresenta oscilações ou necessita de algum auxílio."
  },
  4: {
    level: 4,
    title: "Ponto 4 — Bem consolidado",
    shortLabel: "Bem consolidado",
    description: "A criança realiza a atividade com segurança e pouca ou nenhuma ajuda, embora ainda possa apresentar alguma dificuldade ocasional."
  },
  5: {
    level: 5,
    title: "Ponto 5 — Plenamente consolidado",
    shortLabel: "Plenamente consolidado",
    description: "O conhecimento está bem estabelecido, sendo demonstrado com autonomia, segurança e consistência."
  }
};

export interface RecurringActivity {
  id: string;
  description: string;
  createdAt: string;
  lastUsedAt?: string;
  usageCount: number;
}

export interface ChildProfile {
  id: string;
  name: string;
  birthDate: string; // Formato YYYY-MM-DD
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DetailedAge {
  years: number;
  months: number;
  days: number;
  totalMonths: number;
  totalDays: number;
  formatted: string; // Ex: '2 anos e 3 meses' ou '4 anos completos'
}

export interface KnowledgeNode {
  id: string;
  name: string;
  description: string;
  parentId?: string | null;
  level: number;
  points: number; // Pontos diretos acumulados
  totalPoints?: number; // Pontos somados de toda a subárvore (derivado)
  order?: number;
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
  children?: KnowledgeNode[];
}

export interface NodeScoreAssignment {
  nodeId: string;
  nodeName: string;
  points: number;
  reason: string;
}

export interface AIAnalysisProposal {
  activitySummary: string;
  classifications: NodeScoreAssignment[];
  overallReasoning: string;
  confidence: number;
  insufficientInformation: boolean;
  clarificationPrompt?: string;
  source?: "gemini" | "local-fallback";
  warningMessage?: string;
}

export interface ActivityRecord {
  id: string;
  date: string; // ISO string da criação
  activityDate: string; // YYYY-MM-DD do acontecimento real
  narrative: string;
  consolidationLevel?: ConsolidationLevel;
  childAgeAtActivity?: DetailedAge;
  aiProposal?: AIAnalysisProposal;
  confirmedAssignments: NodeScoreAssignment[];
  isConfirmed: boolean;
  confirmedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LevelCalibrationConfig {
  baseXpForLevel10: number; // XP representativo para nível 10
  baseXpForLevel100: number; // XP representativo para nível 100
  powerFactor: number; // Não linearidade da curva (ex: 1.6 a 2.0)
  ageAdjustmentWeight: number; // Fator de ajuste pela idade em meses
}

export interface ComparativeEstimate {
  qualitativeSummary: string;
  methodologyNote: string;
  hasNormativePopulationBase: boolean;
  calculatedAt: string;
}

export interface SpesMundiStorageState {
  version: number;
  child: ChildProfile;
  tree: KnowledgeNode;
  activities: ActivityRecord[];
  recurringActivities?: RecurringActivity[];
  levelConfig: LevelCalibrationConfig;
  apiConfig: {
    apiKey?: string;
    model?: string;
  };
}

export type ActiveView = 'home' | 'activities' | 'current-state' | 'knowledge-tree';
