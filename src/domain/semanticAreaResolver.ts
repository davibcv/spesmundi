import { KnowledgeNode } from "../types/education";
import { TreeManager } from "./treeManager";

export interface ResolvedNodeMatch {
  nodeId: string;
  nodeName: string;
  isLeaf: boolean;
}

export class SemanticAreaResolver {
  private static normalize(text: string): string {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "")
      .trim();
  }

  private static readonly SYNONYM_MAP: Record<string, string> = {
    // Audição e música
    "audicao": "aud",
    "auditivo": "aud",
    "sensibilidadeauditiva": "aud",
    "musica": "aud",
    "musical": "aud",
    "timbre": "aud",
    "timbres": "aud",
    "reconhecimentodecompositores": "aud",
    "reconhecimentomusical": "aud",
    "percepcaomusical": "aud",
    "canto": "aud",

    // Visão e observação
    "visao": "vis",
    "visual": "vis",
    "observacaovisual": "vis",
    "cores": "vis",
    "sensibilidadeartistica": "vis",
    "contemplacaoaudiovisual": "vis",
    "acuidadededetalhes": "vis",
    "acuidade": "vis",
    "artes": "vis",
    "arte": "vis",
    "desenho": "vis",
    "pintura": "vis",

    // Olfato, Tato, Paladar
    "olfato": "olf",
    "aromas": "olf",
    "tato": "tat",
    "texturas": "tat",
    "paladar": "pal",
    "sabores": "pal",

    // Ciências Naturais e Físico-Química
    "fisica": "fis",
    "causalidademecanica": "fis",
    "mecanica": "fis",
    "propriedadesdosmateriais": "fis",
    "processosfisicos": "fis",
    "resistencia": "fis",
    "peso": "fis",
    "maciez": "fis",
    "quimica": "qui",
    "distincaodemateriais": "qui",
    "propriedadesquimicas": "qui",
    "materiais": "qui",
    "biologia": "bio",
    "natureza": "bio",
    "plantas": "bio",
    "animais": "bio",
    "botanica": "bio",
    "geografia": "geo",
    "espaco": "geo",
    "paisagens": "geo",
    "historia": "hist",
    "tempo": "hist",
    "narrativashistoricas": "hist",

    // Metafísico e Lógica
    "matematica": "mat",
    "contagem": "mat",
    "numeros": "mat",
    "numero": "mat",
    "raciociniomatematico": "mat",
    "categoriasdearistoteles": "aristo",
    "aristoteles": "aristo",
    "metafisica": "aristo",
    "ontologia": "aristo",

    // Amar o Próximo em Ato
    "amaraoproximo": "conv",
    "amaraoproximoemato": "conv",
    "cortesia": "cort",
    "delicadeza": "cort",
    "cortesiaedelicadeza": "cort",
    "boasmaneiras": "boas-man",
    "etiqueta": "boas-man",
    "etiquetaeboasmaneiras": "boas-man",
    "boasmaneiraseetiqueta": "boas-man",
    "postura": "post",
    "elegancia": "post",
    "posturaeelegancia": "post",
    "conversacao": "conv",
    "convivencia": "conv",
    "conversacaoeconvivencia": "conv",
    "comportamentosocial": "conv",
    "social": "conv",
    "cerimonias": "cerim",
    "formalidadessociais": "cerim",
    "cerimoniaseformalidadessociais": "cerim"
  };

  static resolveArea(input: string, tree: KnowledgeNode): ResolvedNodeMatch | null {
    if (!input || !input.trim()) return null;
    const trimmed = input.trim();

    // 1. Verificação por ID exato
    const directById = TreeManager.findNode(tree, trimmed);
    if (directById) {
      return {
        nodeId: directById.id,
        nodeName: directById.name,
        isLeaf: !directById.children || directById.children.length === 0
      };
    }

    const norm = this.normalize(trimmed);

    // 2. Consulta direta ao dicionário canônico de sinônimos
    const mappedId = this.SYNONYM_MAP[norm];
    if (mappedId) {
      const node = TreeManager.findNode(tree, mappedId);
      if (node) {
        return {
          nodeId: node.id,
          nodeName: node.name,
          isLeaf: !node.children || node.children.length === 0
        };
      }
    }

    // 3. Decomposição de termos compostos por conectivos (e, de, da, com)
    const tokens = trimmed
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .split(/[\s,;\/\-]+/)
      .filter(t => t.length > 2 && !["com", "para", "que", "dos", "das", "uma", "uns"].includes(t));

    for (const token of tokens) {
      const tokenMapped = this.SYNONYM_MAP[token];
      if (tokenMapped) {
        const node = TreeManager.findNode(tree, tokenMapped);
        if (node) {
          return {
            nodeId: node.id,
            nodeName: node.name,
            isLeaf: !node.children || node.children.length === 0
          };
        }
      }
    }

    // 4. Busca por correspondência no nome normalizado dos nós
    let foundMatch: ResolvedNodeMatch | null = null;
    function search(node: KnowledgeNode) {
      if (foundMatch) return;
      const nodeNorm = SemanticAreaResolver.normalize(node.name);
      if (nodeNorm === norm || nodeNorm.includes(norm) || (norm.length > 3 && norm.includes(nodeNorm))) {
        foundMatch = {
          nodeId: node.id,
          nodeName: node.name,
          isLeaf: !node.children || node.children.length === 0
        };
      }
      if (node.children) {
        for (const c of node.children) {
          search(c);
        }
      }
    }
    search(tree);

    return foundMatch;
  }
}
