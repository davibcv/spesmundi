import { describe, it, expect } from "vitest";
import { parseInitialAlignmentText } from "../utils/initialAlignmentParser";

describe("Auditoria de Extração do Texto Formatado", () => {
  const text = "Desde o nascimento - Escuta passiva de música clássica, com destaque para a obra Danúbio Azul de Johann Strauss II; grau atual de consolidação não informado (incerto quanto à retenção consciente ou inconsciente), frequência de repetição não informada e duração aproximada desde o nascimento - Audição, Sensibilidade musical, Capacidade de amar pela sensibilidade e apreço à beleza.\n\nPor volta de 1 ano de idade - Reconhecimento de diferentes animais (sapo, gato e cachorro) e reprodução vocal de suas respectivas onomatopeias antes mesmo do desenvolvimento completo da fala; grau atual de consolidação 5 (inferido pelo domínio completo posterior), frequência de repetição alta (estímulo frequente) e duração aproximada não informada - Biologia, Audição, Acuidade auditiva, Categorias de Aristóteles (Substância, Ação).\n\nData não informada - Identificação de anomalias ontológicas e físicas em quatro cartas ilustradas com gatos; grau atual de consolidação não informado, frequência de repetição não informada e duração aproximada não informada - Biologia, Visão, Acuidade e percepção, Categorias de Aristóteles (Substância, Quantidade, Qualidade, Lugar, Relação).";

  it("inspeciona os campos extraidos pelo parser atual", () => {
    const items = parseInitialAlignmentText(text);
    expect(items.length).toBe(3);
    console.log("ITEM 0 (Desde o nascimento):", JSON.stringify(items[0], null, 2));
    console.log("ITEM 1 (Por volta de 1 ano):", JSON.stringify(items[1], null, 2));
    console.log("ITEM 2 (Data nao informada):", JSON.stringify(items[2], null, 2));
  });
});
