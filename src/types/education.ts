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
}

export interface ActivityRecord {
  id: string;
  date: string; // ISO string da criação
  activityDate: string; // YYYY-MM-DD do acontecimento real
  narrative: string;
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
  levelConfig: LevelCalibrationConfig;
  apiConfig: {
    apiKey?: string;
    model?: string;
  };
}

export type ActiveView = 'home' | 'activities' | 'current-state' | 'knowledge-tree';
