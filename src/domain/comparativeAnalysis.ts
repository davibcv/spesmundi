import { DetailedAge, ComparativeEstimate } from '../types/education';

export class ComparativeAnalysis {
  static getEstimate(childName: string, age: DetailedAge, overallLevel: number): ComparativeEstimate {
    let band = 'em fase inicial de exploração formativa ordenada';
    if (overallLevel >= 80) {
      band = 'com vivência rica e extraordinariamente fecunda de estímulos';
    } else if (overallLevel >= 50) {
      band = 'com desenvolvimento equilibrado e contínua expansão das capacidades';
    } else if (overallLevel >= 25) {
      band = 'com progresso consistente nos princípios fundamentais';
    }

    return {
      qualitativeSummary: childName + ' apresenta formação ' + band + ' para a idade de ' + age.formatted + ' (Nível ' + overallLevel + ').',
      methodologyNote: 'Não são atribuídos percentis populacionais arbitrários, pois inexiste base normativa estatística externa no modelo privado. A escala reflete estritamente o acompanhamento da proposta formativa definida pelos pais.',
      hasNormativePopulationBase: false,
      calculatedAt: new Date().toISOString()
    };
  }
}
