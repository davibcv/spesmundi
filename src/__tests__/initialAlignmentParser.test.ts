import { describe, it, expect } from "vitest";
import { parseInitialAlignmentText } from "../utils/initialAlignmentParser";

describe("initialAlignmentParser", () => {
  it("deve interpretar multiplos registros com data, consolidacao, frequencia e areas sugeridas", () => {
    const input = [
      "15/03/2025 - Aprendeu a contar de 1 a 10; consolidacao atual 5/5, repeticao frequente durante aproximadamente tres meses - Matematica, Linguagem.",
      "",
      "20/05/2025 - Aprendeu a identificar diferentes especies de arvores e reconhecer algumas de suas caracteristicas; consolidacao atual 4/5, repeticao ocasional durante seis meses - Biologia, Observacao visual.",
      "",
      "10/08/2025 - Aprendeu a reconhecer e nomear as cores primarias e secundarias; consolidacao atual 5/5, repeticao frequente durante dois meses - Artes, Visao."
    ].join("\n");

    const parsed = parseInitialAlignmentText(input);
    expect(parsed).toHaveLength(3);
    expect(parsed[0].startDate).toBe("15/03/2025");
    expect(parsed[0].learningDescription).toContain("Aprendeu a contar de 1 a 10");
    expect(parsed[0].consolidationLevel).toBe(5);
    expect(parsed[0].repetitionFrequency).toContain("tres meses");
    expect(parsed[0].suggestedAreas).toEqual(["Matematica", "Linguagem"]);
    expect(parsed[1].startDate).toBe("20/05/2025");
    expect(parsed[1].consolidationLevel).toBe(4);
    expect(parsed[1].suggestedAreas).toEqual(["Biologia", "Observacao visual"]);
    expect(parsed[2].startDate).toBe("10/08/2025");
    expect(parsed[2].consolidationLevel).toBe(5);
    expect(parsed[2].suggestedAreas).toEqual(["Artes", "Visao"]);
  });

  it("deve lidar com textos tolerantes sem quebrar", () => {
    const input = "Catarina aprendeu a calcar os sapatos sozinha; nivel 3 - Autonomia";
    const parsed = parseInitialAlignmentText(input);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].learningDescription).toContain("calcar os sapatos");
    expect(parsed[0].consolidationLevel).toBe(3);
    expect(parsed[0].suggestedAreas).toEqual(["Autonomia"]);
  });
});
