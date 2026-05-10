import { useState } from 'react';

// 1. Interface atualizada
interface DossierIA {
  vibe_local: string;
  hotspot: { nome: string; descricao: string };
  segredo_premium: string[];
  vestuario_sugerido: string[];
  itens_indispensaveis: string[];
  custos: {
    nivel: 'Baixo' | 'Moderado' | 'Alto';
    cafe: string;
    refeicao: string;
    transporte: string;
  };
  burocracia: {
    visto_fronteira: string;
    saude_vacinas: string;
    alerta_legal: string;
    setup_logistico: string;
  };
  evento_sazonal: {
    nome: string;
    vibe: string;
    icone: string;
  };
}

type EstadoIA = 'fechado' | 'setup' | 'carregando' | 'pronto' | 'erro';
type PerfilViagem = 'mochilao' | 'equilibrado' | 'luxo';

export function usePremiumAI() {
  const [estadoRoteiroIA, setEstadoRoteiroIA] = useState<EstadoIA>('fechado');
  const [perfilViagem, setPerfilViagem] = useState<PerfilViagem>('equilibrado');
  const [dossieAtual, setDossieAtual] = useState<DossierIA | null>(null);

  const gerarDossiePremium = async (cidade: string, pais: string, temperatura: number) => {
    if (!cidade) return;

    setEstadoRoteiroIA('carregando');

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Chave de API não encontrada.");

      const MODELO_IA = "gemini-2.5-flash";

      // Captura o mês exato em que o usuário está fazendo a pesquisa
      const dataAtual = new Date();
      const mesAtual = dataAtual.toLocaleString('pt-BR', { month: 'long' });

      const regrasPerfil = {
        mochilao: {
          persona: "um guia local experiente em viagens 'budget' e mochilões",
          tom: "descontraído, prático e focado em economia extrema e vivência autêntica de rua",
          foco_hotspot: "uma comida de rua lendária, um bar underground ou um local autêntico e muito barato",
          foco_hacks: "transporte público, passes de desconto, dias gratuitos em museus e comida barata"
        },
        equilibrado: { 
          persona: "um consultor de viagens smart-luxury, que equilibra economia com conforto",
          tom: "equilibrado, objetivo e focado em custo-benefício inteligente (gastar onde importa)",
          foco_hotspot: "um restaurante de excelente custo-benefício ou uma atração que vale cada centavo do ingresso",
          foco_hacks: "como evitar armadilhas para turistas, onde economizar para poder gastar em experiências-chave"
        },
        luxo: {
          persona: "um concierge de ultra-luxo",
          tom: "sofisticado, direto e focado em exclusividade, conforto absoluto e zero atrito",
          foco_hotspot: "um restaurante Michelin, um rooftop exclusivo ou experiência VIP premium",
          foco_hacks: "acesso fast-track, transfers privados, regras de etiqueta da alta sociedade local"
        }
      };

      const regraAtual = regrasPerfil[perfilViagem];

      const prompt = `
        Atue como ${regraAtual.persona} para o app Equinox.
        O destino EXATO é: ${cidade} (País: ${pais}).
        REGRA GEOGRÁFICA DE OURO: É estritamente proibido sugerir locais que não existam nesta exata cidade.
        PERFIL DO VIAJANTE (IMPORTANTE): Turista com PASSAPORTE BRASILEIRO.

        DIRETRIZES DE TOM E PERFIL (ESTILO: ${perfilViagem.toUpperCase()}):
        Seja ${regraAtual.tom}. O usuário não quer ler muito, quer inteligência acionável e rápida.

        1. VIBE LOCAL: Uma única frase capturando a essência da cidade PARA ESTE PERFIL de viajante.
        2. HOTSPOT: Indique ${regraAtual.foco_hotspot} REAL em ${cidade}.
        3. SEGREDO PREMIUM (HACKS): Focados em: ${regraAtual.foco_hacks}. Máximo de 2 frases curtas por tópico.
        4. VESTUÁRIO: Baseado na temperatura de ${temperatura}°C e no perfil ${perfilViagem.toUpperCase()}. Cite a peça e o motivo em, no máximo, 15 palavras por item.
        5. NA MALA: Cite o item e o motivo tático em, no máximo, 15 palavras por item.
        6. RADAR DE CUSTO: Estime na MOEDA LOCAL EXATA DO DESTINO (usando o símbolo oficial, ex: €, ¥, R$) o preço médio para este perfil de viajante: um café, uma refeição típica, e um ticket de transporte (ou Uber curto). Classifique o custo geral da cidade como 'Baixo', 'Moderado' ou 'Alto'.
        7. MONITOR DE BUROCRACIA (Foco em Brasileiros): Forneça informações táticas e diretas (máximo 15 palavras cada):
           - visto_fronteira: Exige visto prévio para BR? É isento? Validade mínima exigida no passaporte.
           - saude_vacinas: Vacinas OBRIGATÓRIAS para brasileiros (ex: Febre Amarela) ou principal risco sanitário.
           - alerta_legal: Lei local restrita ou choque cultural/comportamental onde estrangeiros levam multas/prisão sem saber.
           - setup_logistico: Padrão de tomada/voltagem e uso de cartão de crédito vs dinheiro em espécie.
        8. NA CIDADE AGORA: O mês da viagem é ${mesAtual.toUpperCase()}. PROIBIDO usar descrições climáticas genéricas (ex: "Primavera é linda", "Clima ameno", "Dias longos"). OBRIGATÓRIO: Cite um FATO CONCRETO e tático. Qual Feriado Nacional, Festival Cultural específico, temporada de liquidações comerciais (ex: Black Friday local), evento esportivo importante ou fenômeno gastronômico exato ocorre anualmente neste mês? Retorne o nome do evento e a justificativa real do porquê ele altera o pulso da cidade.        
        RETORNE APENAS UM JSON VÁLIDO. Formato obrigatório:
        {
          "vibe_local": "Frase de impacto curta.",
          "hotspot": {
            "nome": "Nome do Local Real",
            "descricao": "Frase curta sobre a experiência."
          },
          "segredo_premium": [
            "🤝 Código de Conduta: [Regra social para este perfil]",
            "⚡ Hack de Acesso: [Tática rápida de otimização de tempo/dinheiro]",
            "🛡️ Tática de Campo: [Alerta de segurança/locomoção objetivo]"
          ],
          "vestuario_sugerido": ["Peça 1: Motivo em 15 palavras", "Peça 2: Motivo", "Peça 3: Motivo"],
          "itens_indispensaveis": ["Item 1: Motivo em 15 palavras", "Item 2: Motivo", "Item 3: Motivo"],
          "custos": {
            "nivel": "Moderado",
            "cafe": "€3.50",
            "refeicao": "€18.00",
            "transporte": "€2.50"
          },
          "burocracia": {
            "visto_fronteira": "Isento por 90 dias. Passaporte deve ter 6 meses de validade.",
            "saude_vacinas": "CIVP obrigatório para Febre Amarela.",
            "alerta_legal": "Proibido beber álcool na rua sob pena de multa severa.",
            "setup_logistico": "Tomada Tipo C (220v). País majoritariamente cashless."
          },
          "evento_sazonal": {
            "nome": "Festa da Cerveja de Outono",
            "vibe": "A cidade respira os festivais folclóricos com muita cerveja e ruas cheias de moradores com roupas típicas.",
            "icone": "🍻"
          }
        }
      `;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODELO_IA}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { 
            response_mime_type: "application/json",
            temperature: 0.7 
          }
        })
      });

      if (!response.ok) {
        throw new Error("Erro desconhecido retornado pela API");
      }

      const data = await response.json();
      let respostaTexto = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

      if (!respostaTexto) throw new Error("A IA devolveu um pacote vazio.");

      respostaTexto = respostaTexto
        .replace(new RegExp('```json', 'gi'), '')
        .replace(new RegExp('```', 'g'), '')
        .trim();
        
      const dossieJson = JSON.parse(respostaTexto);
      
      setDossieAtual(dossieJson);
      setEstadoRoteiroIA('pronto');

    } catch (error: any) {
      console.error("❌ Erro interno do motor:", error);
      setEstadoRoteiroIA('erro'); 
    }
  };

  const resetarIA = () => {
    setEstadoRoteiroIA('fechado');
    setDossieAtual(null);
  };

  return {
    estadoRoteiroIA,
    setEstadoRoteiroIA,
    perfilViagem,
    setPerfilViagem,
    dossieAtual,
    gerarDossiePremium,
    resetarIA
  };
}