import { describe, it, expect } from 'vitest';
import { AIService } from '../services/aiService';
import { initialTree } from '../data/initialTree';

describe('AIService', () => {
  it('valida resposta correta e associa nomes reais dos nós', () => {
    const raw = {
      activitySummary: 'Observação botânica',
      classifications: [
        { nodeId: 'bio', points: 15, reason: 'Estudo de folhas' },
        { nodeId: 'id-inexistente-alucinado', points: 20, reason: 'Fantasma' }
      ],
      confidence: 0.95
    };

    const validated = AIService.validateAIResponse(raw, initialTree);
    expect(validated.classifications.length).toBe(1);
    expect(validated.classifications[0].nodeId).toBe('bio');
    expect(validated.classifications[0].nodeName).toBe('Biologia');
    expect(validated.classifications[0].points).toBe(15);
  });

  it('lida com ausência de classificações ou nós alucinados', () => {
    const raw = { activitySummary: 'Texto vago', classifications: [] };
    const validated = AIService.validateAIResponse(raw, initialTree);
    expect(validated.classifications).toEqual([]);
    expect(validated.confidence).toBe(0.85);
  });

  it('executa o motor semântico local prudente quando offline/sem chave', () => {
    const analysis = AIService.fallbackLocalAnalysis('Hoje observamos flores e folhas no jardim', initialTree);
    expect(analysis.classifications.some(c => c.nodeId === 'bio')).toBe(true);
  });
});
