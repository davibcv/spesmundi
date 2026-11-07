import { describe, it, expect } from "vitest";
import { SemanticAreaResolver } from "../domain/semanticAreaResolver";
import { initialTree } from "../data/initialTree";

describe("SemanticAreaResolver", () => {
  it("deve resolver identificadores exatos existentes", () => {
    const res = SemanticAreaResolver.resolveArea("aud", initialTree);
    expect(res).not.toBeNull();
    expect(res?.nodeId).toBe("aud");
    expect(res?.nodeName).toBe("Audição");
    expect(res?.isLeaf).toBe(true);
  });

  it("deve resolver nomes com acentos e variacoes para nós folha", () => {
    const resAud = SemanticAreaResolver.resolveArea("Audição", initialTree);
    expect(resAud?.nodeId).toBe("aud");

    const resFis = SemanticAreaResolver.resolveArea("Física", initialTree);
    expect(resFis?.nodeId).toBe("fis");

    const resQui = SemanticAreaResolver.resolveArea("Química", initialTree);
    expect(resQui?.nodeId).toBe("qui");

    const resMat = SemanticAreaResolver.resolveArea("Matemática", initialTree);
    expect(resMat?.nodeId).toBe("mat");
  });

  it("deve resolver sinônimos e descrições compostas", () => {
    const resMusica = SemanticAreaResolver.resolveArea("Reconhecimento de compositores", initialTree);
    expect(resMusica?.nodeId).toBe("aud");

    const resCausalidade = SemanticAreaResolver.resolveArea("Causalidade mecânica", initialTree);
    expect(resCausalidade?.nodeId).toBe("fis");

    const resEtiqueta = SemanticAreaResolver.resolveArea("Etiqueta e boas maneiras", initialTree);
    expect(resEtiqueta?.nodeId).toBe("boas-man");

    const resCortesia = SemanticAreaResolver.resolveArea("Cortesia", initialTree);
    expect(resCortesia?.nodeId).toBe("cort");
  });

  it("deve retornar null para termos completamente desconhecidos", () => {
    const res = SemanticAreaResolver.resolveArea("Area Inexistente XYZ 123", initialTree);
    expect(res).toBeNull();
  });
});
