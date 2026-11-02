import { KnowledgeNode } from "../types/education";
export const initialTree: KnowledgeNode = {
  "id": "root-1",
  "name": "Amar a Deus e ao Próximo",
  "description": "Finalidade suprema e ordenadora de todas as capacidades, virtudes e conhecimentos humanos.",
  "level": 1,
  "points": 1250,
  "children": [
    {
      "id": "branch-criacao",
      "name": "Amar a Criação",
      "description": "Reconhecimento da beleza, da ordem e da harmonia do cosmos como reflexo da sabedoria criadora.",
      "level": 1,
      "points": 730,
      "children": [
        {
          "id": "sub-capacidade-amar",
          "name": "Capacidade de Amar",
          "description": "Aperfeiçoamento dos sentidos e do intelecto para contemplar a verdade e a beleza.",
          "level": 1,
          "points": 380,
          "children": [
            {
              "id": "sens-beleza",
              "name": "Sensibilidade e Apreço pela Beleza",
              "description": "Educação da percepção sensorial e capacidade contemplativa.",
              "level": 1,
              "points": 380,
              "children": [
                {
                  "id": "sens-fisico",
                  "name": "Físico",
                  "description": "Educação ordenada dos cinco sentidos externos.",
                  "level": 1,
                  "points": 210,
                  "children": [
                    {
                      "id": "vis",
                      "name": "Visão",
                      "description": "Percepção de cores e formas na natureza.",
                      "level": 1,
                      "points": 60
                    },
                    {
                      "id": "aud",
                      "name": "Audição",
                      "description": "Sensibilidade aos timbres e ritmos serenos.",
                      "level": 1,
                      "points": 50
                    },
                    {
                      "id": "olf",
                      "name": "Olfato",
                      "description": "Aromas naturais, flores e especiarias.",
                      "level": 1,
                      "points": 30
                    },
                    {
                      "id": "tat",
                      "name": "Tato",
                      "description": "Texturas e qualidades táteis da matéria.",
                      "level": 1,
                      "points": 40
                    },
                    {
                      "id": "pal",
                      "name": "Paladar",
                      "description": "Apreciação refinada dos sabores naturais.",
                      "level": 1,
                      "points": 30
                    }
                  ]
                },
                {
                  "id": "sens-metafisico",
                  "name": "Metafísico",
                  "description": "Ordenação racional da inteligência para as formas abstratas.",
                  "level": 1,
                  "points": 170,
                  "children": [
                    {
                      "id": "aristo",
                      "name": "Categorias de Aristóteles",
                      "description": "Distinções fundamentais do ser.",
                      "level": 1,
                      "points": 80
                    },
                    {
                      "id": "mat",
                      "name": "Matemática",
                      "description": "Ordem quantitativa e proporção no cosmos.",
                      "level": 1,
                      "points": 90
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "id": "sub-conhecer-criacao",
          "name": "Conhecer e Amar a Criação em Ato",
          "description": "Investigação atenta do mundo concreto e das ciências naturais.",
          "level": 1,
          "points": 350,
          "children": [
            {
              "id": "hist",
              "name": "História",
              "description": "Ação humana no tempo e discernimento moral.",
              "level": 1,
              "points": 70
            },
            {
              "id": "geo",
              "name": "Geografia",
              "description": "Conhecimento da terra e habitats naturais.",
              "level": 1,
              "points": 80
            },
            {
              "id": "bio",
              "name": "Biologia",
              "description": "Observação da vida com reverência.",
              "level": 1,
              "points": 100
            },
            {
              "id": "fis",
              "name": "Física",
              "description": "Princípios do movimento e da luz.",
              "level": 1,
              "points": 50
            },
            {
              "id": "qui",
              "name": "Química",
              "description": "Composição e estados da matéria.",
              "level": 1,
              "points": 50
            }
          ]
        }
      ]
    },
    {
      "id": "branch-proximo",
      "name": "Amar o Próximo em Ato",
      "description": "Prática exteriorizada da caridade, delicadeza e atenção ao outro.",
      "level": 1,
      "points": 520,
      "children": [
        {
          "id": "cort",
          "name": "Cortesia e Delicadeza",
          "description": "Suavidade no trato diário e benevolência nos gestos.",
          "level": 1,
          "points": 120
        },
        {
          "id": "boas-man",
          "name": "Boas Maneiras e Etiqueta",
          "description": "Conduta adequada e respeito aos ambientes.",
          "level": 1,
          "points": 110
        },
        {
          "id": "post",
          "name": "Postura e Elegância",
          "description": "Dignidade corporal e moderação no porte.",
          "level": 1,
          "points": 90
        },
        {
          "id": "conv",
          "name": "Conversação e Convivência",
          "description": "Escuta atenta e moderação nas palavras.",
          "level": 1,
          "points": 110
        },
        {
          "id": "cerim",
          "name": "Cerimônias e Formalidades Sociais",
          "description": "Compreensão dos ritos e solenidades.",
          "level": 1,
          "points": 90
        }
      ]
    }
  ]
};
