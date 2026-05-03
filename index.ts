// index.ts — Equinox (Servidor API Blindado + Motor Semântico Avançado)
import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";

const env = await load();
const API_KEY = env["OPENWEATHER_KEY"];

if (!API_KEY) {
  console.error("❌ OPENWEATHER_KEY não encontrada no .env");
  Deno.exit(1);
}

const ORIGEM_PERMITIDA = "*"; 
const PORTA_API = 8001; 

const LIMITE_REQUISICOES = 60; 
const JANELA_TEMPO_MS = 60000; 
const rastreadorIps = new Map<string, { acessos: number; reset: number }>();

function verificarRateLimit(ip: string): boolean {
  const agora = Date.now();
  const registro = rastreadorIps.get(ip);
  if (!registro || agora > registro.reset) {
    rastreadorIps.set(ip, { acessos: 1, reset: agora + JANELA_TEMPO_MS });
    return true;
  }
  if (registro.acessos >= LIMITE_REQUISICOES) return false;
  registro.acessos++;
  return true;
}

// ─── NOVO CONTRATO DE DADOS (DADOS ACIONÁVEIS & TAGS) ──────────
interface DadosTurista {
  viabilidade_outdoor: {
    nivel: 'Alta' | 'Média' | 'Baixa';
    descricao: string;
    cor: string;
  };
  vibe_tags: string[];
  vestuario_checklist: string[];
  roteiro_ideal: string;
  local_premium: { nome: string; contexto: string; };
}

interface ResultadoClima {
  cidade: string;
  clima_bruto: { temp: number; temp_min: number; temp_max: number; chuva_prob: number; vento: number; timezone: number; lat: number; lon: number; pais: string; };
  turista: DadosTurista;
}

const TARGET_FILE = "./cidades_alvo.json";
const STATE_FILE  = "./lote_state.json";
const OUTPUT_FILE = "./relatorio_clima.json";
const HISTORICO_FILE = "./historico_clima.json";
const TOTAL_LOTES = 60; 
const MAX_HISTORICO_ENTRIES = 500; 
const DELAY_MS = 1_100; 

// ─── CÉREBRO NARRATIVO (MOTOR SEMÂNTICO DE BOUTIQUE) ───────────

const identificarArquetipo = (pais: string, lat: number) => {
  const europa = ['FR', 'GB', 'DE', 'IT', 'ES', 'NL', 'CH', 'PT', 'GR'];
  const tropical = ['BR', 'TH', 'ID', 'SG', 'MY', 'CO'];
  const frio_extremo = ['CA', 'NO', 'SE', 'RU', 'FI', 'DK'];
  
  if (europa.includes(pais)) return 'urbano_classico';
  if (tropical.includes(pais) || Math.abs(lat) < 23) return 'tropical_resort';
  if (frio_extremo.includes(pais) || Math.abs(lat) > 50) return 'inverno_alpino';
  return 'cosmopolita'; 
};

// Vibe Tags Visuais
const DIRETORIO_TAGS = {
  chuva: ["💧 Alta Umidade", "🍷 Foco Intimista", "🏛️ Exploração Indoor"],
  calor_extremo: ["🔥 Calor Extremo", "🍹 Refúgios Sombreados", "🌙 Vida Noturna"],
  frio_elegante: ["❄️ Frio Acentuado", "🎷 Jazz & Aconchego", "☕ Rotas Gastronômicas"],
  fresco_ideal: ["🍃 Clima Perfeito", "🚶‍♂️ Walking Tours", "📸 Fotografia Externa"]
};

// Checklist Visual de Vestuário
const DIRETORIO_CHECKLIST: Record<string, any> = {
  urbano_classico: {
    frio: ["Trench coat estruturado", "Malhas ou tricot leve", "Chelsea boots confortáveis"],
    calor: ["Tecidos em linho ou algodão", "Sapatos loafers respiráveis", "Óculos escuros premium"],
    chuva: ["Capa de chuva britânica", "Guarda-chuva resistente", "Calçados de couro fechados"]
  },
  tropical_resort: {
    frio: ["Jaqueta corta-vento leve", "Calças de tecido confortável", "Sneakers casuais"],
    calor: ["Roupas vazadas/resort wear", "Chapéu de abas largas", "Protetor solar alta fixação"],
    chuva: ["Tecidos de secagem rápida", "Calçados à prova d'água", "Mochila impermeável"]
  },
  inverno_alpino: {
    frio: ["Outerwear corta-vento pesado", "Base layers térmicas", "Botas tratoradas de neve"],
    calor: ["Jeans de alta gramatura", "T-shirt respirável", "Jaqueta leve de apoio"],
    chuva: ["Gore-Tex impermeável", "Cachecol pesado e luvas", "Botas com alto isolamento"]
  },
  cosmopolita: {
    frio: ["Jaqueta de couro ou parka", "Sobreposições em moletom", "Tênis de silhueta robusta"],
    calor: ["Streetwear minimalista", "Cortes oversized frescos", "Calçados leves para asfalto"],
    chuva: ["Corta-vento impermeável", "Acessórios resistentes à água", "Solado aderente"]
  }
};

type ClimaChave = 'chuva' | 'frio' | 'calor' | 'ideal';

const GUIA_CONCIERGE: Record<string, Record<ClimaChave, { nome: string; contexto: string }>> = {
  "Paris": { chuva: { nome: "Le Jules Verne", contexto: "Refugie-se na Torre Eiffel com um menu degustação Michelin sob a garoa." }, frio: { nome: "Café de Flore", contexto: "O frio apertou. Aqueça-se com o lendário chocolate quente de Saint-Germain." }, calor: { nome: "Monsieur Bleu", contexto: "Aproveite a brisa e os drinks gelados no terraço do Palais de Tokyo." }, ideal: { nome: "Jardim de Luxemburgo", contexto: "Clima impecável. Perfeito para um piquenique gourmet nos gramados reais." } },
  "London": { chuva: { nome: "The Churchill Arms", contexto: "A inevitável garoa chegou. Refugie-se neste icônico pub coberto de flores." }, frio: { nome: "Rules", contexto: "Esconda-se no restaurante mais antigo de Londres, com lareiras acesas." }, calor: { nome: "Sky Garden", contexto: "Dia raro de calor. Aproveite a ventilação do jardim botânico nas alturas." }, ideal: { nome: "Borough Market", contexto: "Aproveite a trégua caminhando e degustando ostras frescas ao ar livre." } },
  "Tokyo": { chuva: { nome: "Omoide Yokocho", contexto: "A chuva no neon cria a atmosfera cyberpunk ideal. Busque izakayas cobertos." }, frio: { nome: "Ramen Street (Tokyo Station)", contexto: "Frio cortante exige um autêntico e fumegante Tonkotsu Ramen para aquecer." }, calor: { nome: "Roppongi Hills Observation", contexto: "Fuja do mormaço denso nas alturas climatizadas com vista para a metrópole." }, ideal: { nome: "Shinjuku Gyoen", contexto: "Clima esplêndido para caminhar sem pressa pelo parque mais bonito da cidade." } }
};

// O Gerador de Caixas Âmbar Genéricas (Fallback Procedural)
const ROTEIROS_GENERICOS = {
  chuva: { nome: "✦ Alta Gastronomia & Indoor", contexto: "A precipitação sugere mudança de rota. Busque bistrôs conceituados, galerias de arte modernas ou reserve lounges intimistas para uma noite protegida." },
  calor: { nome: "✦ Terraços & Oásis Urbanos", contexto: "Fuja do mormaço intenso. O momento exige a exploração da alta coquetelaria em rooftops ventilados ou espaços premium climatizados." },
  frio: { nome: "✦ Conforto Térmico & Tradição", contexto: "A temperatura convida ao acolhimento. Excelente janela para degustar vinhos locais encorpados em adegas subterrâneas ou restaurantes com aquecimento." },
  ideal: { nome: "✦ Exploração Plena a Céu Aberto", contexto: "Condições atmosféricas sublimes. Perca-se pela arquitetura da cidade, desfrute de cafés nas calçadas e garanta vistas em mirantes a céu aberto." }
};

function gerarDadosTurista(cidadeNomeLimpo: string, temp: number, ventoKm: number, condicaoId: number, paisIso: string, lat: number): DadosTurista {
  const isChovendo = condicaoId >= 200 && condicaoId < 700;
  const arquetipo = identificarArquetipo(paisIso, lat);
  
  let chaveVibe: keyof typeof DIRETORIO_TAGS = 'fresco_ideal';
  let chaveRoupa: 'calor' | 'frio' | 'chuva' = 'calor';
  let chavePremium: ClimaChave = 'ideal';

  // Lógica do Termômetro Outdoor
  let nivelOutdoor: 'Alta' | 'Média' | 'Baixa' = 'Alta';
  let descOutdoor = "Excelentes condições. Explore a pé livremente.";
  let corOutdoor = "#22c55e"; // Verde

  if (isChovendo) {
    chaveVibe = 'chuva'; chaveRoupa = 'chuva'; chavePremium = 'chuva';
    nivelOutdoor = 'Baixa';
    descOutdoor = "Precipitação ativa. Priorize deslocamentos curtos via app/táxi.";
    corOutdoor = "#ef4444"; // Vermelho
  } else if (temp > 32) {
    chaveVibe = 'calor_extremo'; chaveRoupa = 'calor'; chavePremium = 'calor';
    nivelOutdoor = 'Média';
    descOutdoor = "Fadiga térmica provável. Intercale caminhadas com pausas na sombra.";
    corOutdoor = "#eab308"; // Amarelo
  } else if (temp < 10) {
    chaveVibe = 'frio_elegante'; chaveRoupa = 'frio'; chavePremium = 'frio';
    nivelOutdoor = 'Média';
    descOutdoor = "Frio rigoroso. Caminhadas curtas com roupas de alto isolamento.";
    corOutdoor = "#eab308"; // Amarelo
  } else if (temp < 18) {
    chaveVibe = 'frio_elegante'; chaveRoupa = 'frio'; chavePremium = 'frio';
  }

  if (ventoKm > 35 && nivelOutdoor === 'Alta') {
    nivelOutdoor = 'Média'; descOutdoor = "Ventos fortes. Desconforto moderado em áreas muito abertas."; corOutdoor = "#eab308";
  }

  const tagsFinal = DIRETORIO_TAGS[chaveVibe];
  const checklistFinal = DIRETORIO_CHECKLIST[arquetipo][chaveRoupa];
  
  // Garantia da Caixa Âmbar: Se não tiver no Guia, gera o procedurál genérico
  const sugestaoPremium = GUIA_CONCIERGE[cidadeNomeLimpo]?.[chavePremium] || ROTEIROS_GENERICOS[chavePremium];

  const roteiro = isChovendo ? "Museus, Galerias de Arte de vanguarda e espetáculos fechados." 
                  : (temp > 30 ? "Parques Aquáticos, praias ou Museus climatizados à tarde." 
                  : "Exploração a pé, arquitetura ao ar livre e mirantes com vista panorâmica.");

  return { 
    viabilidade_outdoor: { nivel: nivelOutdoor, descricao: descOutdoor, cor: corOutdoor },
    vibe_tags: tagsFinal,
    vestuario_checklist: checklistFinal, 
    roteiro_ideal: roteiro,
    local_premium: sugestaoPremium 
  };
}

async function consultarClima(queryGeografica: string): Promise<ResultadoClima> {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${queryGeografica}&appid=${API_KEY}&units=metric&lang=pt_br`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.cod !== 200) throw new Error(`Erro: ${data.message}`);

  const tempAtual = data.main.feels_like;
  const condicaoId = data.weather[0].id;
  const ventoKm = data.wind.speed * 3.6;
  const nomeExibicao = queryGeografica.split(',')[0];

  return {
    cidade: nomeExibicao,
    clima_bruto: {
      temp: tempAtual, temp_min: data.main.temp_min, temp_max: data.main.temp_max,
      chuva_prob: condicaoId, vento: ventoKm, timezone: data.timezone,
      lat: data.coord.lat, lon: data.coord.lon, pais: data.sys.country
    },
    turista: gerarDadosTurista(nomeExibicao, tempAtual, ventoKm, condicaoId, data.sys.country, data.coord.lat)
  };
}

async function lerTodasAsCidades(): Promise<string[]> { try { return JSON.parse(await Deno.readTextFile(TARGET_FILE)); } catch { Deno.exit(1); } }
async function lerLoteAtual(): Promise<number> { try { return JSON.parse(await Deno.readTextFile(STATE_FILE)).loteAtual || 0; } catch { return 0; } }
async function salvarProximoLote(loteAtual: number) { await Deno.writeTextFile(STATE_FILE, JSON.stringify({ loteAtual: (loteAtual + 1) % TOTAL_LOTES }, null, 2)); }
async function lerCacheAtual(): Promise<ResultadoClima[]> { try { return JSON.parse(await Deno.readTextFile(OUTPUT_FILE)); } catch { return []; } }
function mergeComCache(todasCidades: string[], cache: ResultadoClima[], novos: ResultadoClima[]): ResultadoClima[] {
  const mapa = new Map<string, ResultadoClima>(cache.map((r) => [r.cidade, r]));
  for (const novo of novos) mapa.set(novo.cidade, novo);
  return todasCidades.map((c) => mapa.get(c.split(',')[0])).filter((r): r is ResultadoClima => r !== undefined);
}
async function registrarHistorico(jsonFinal: ResultadoClima[]) {
  let historico: any[] = [];
  try { historico = JSON.parse(await Deno.readTextFile(HISTORICO_FILE)); } catch { historico = []; }
  const snapshot: any = { time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) };
  for (const item of jsonFinal) snapshot[item.cidade] = item.clima_bruto.temp;
  historico.push(snapshot);
  if (historico.length > MAX_HISTORICO_ENTRIES) historico = historico.slice(-MAX_HISTORICO_ENTRIES);
  await Deno.writeTextFile(HISTORICO_FILE, JSON.stringify(historico, null, 2));
}

async function executarRotinaClimatica() {
  const todasCidades = await lerTodasAsCidades();
  const loteAtual = await lerLoteAtual();
  const tamanhoLote = Math.ceil(todasCidades.length / TOTAL_LOTES);
  const indiceInicio = loteAtual * tamanhoLote;
  const loteDeCidades = todasCidades.slice(indiceInicio, Math.min(indiceInicio + tamanhoLote, todasCidades.length));

  console.log(`\n🌍 EQUINOX ENGINE — Processando Batch ${loteAtual + 1}/${TOTAL_LOTES}`);

  const relatorios: ResultadoClima[] = [];
  for (const query of loteDeCidades) {
    try {
      const resultado = await consultarClima(query);
      relatorios.push(resultado);
      console.log(`✅ ${resultado.cidade.padEnd(14)} | Outdoor: ${resultado.turista.viabilidade_outdoor.nivel}`);
    } catch (erro) { console.error(`❌ Falha para ${query}`); }
    if (loteDeCidades.indexOf(query) < loteDeCidades.length - 1) await new Promise(r => setTimeout(r, DELAY_MS));
  }

  if (relatorios.length > 0) {
    const jsonFinal = mergeComCache(todasCidades, await lerCacheAtual(), relatorios);
    try {
      await Deno.writeTextFile(OUTPUT_FILE, JSON.stringify(jsonFinal, null, 2));
      await registrarHistorico(jsonFinal);
    } catch (e) { console.error("❌ Erro de I/O:", e); }
  }
  
  // ✅ Movido para fora! Assim, mesmo se o lote for vazio, o motor avança.
  await salvarProximoLote(loteAtual);
}

executarRotinaClimatica();
setInterval(executarRotinaClimatica, 60000); 

Deno.serve({ port: PORTA_API }, async (req, info) => {
  const ip = info.remoteAddr.hostname;
  if (!verificarRateLimit(ip)) return new Response(JSON.stringify({ erro: "Rate Limit excedido." }), { status: 429, headers: { "Content-Type": "application/json" } });

  const headersSeguros = new Headers({ "Access-Control-Allow-Origin": ORIGEM_PERMITIDA, "Access-Control-Allow-Methods": "GET, OPTIONS", "Content-Type": "application/json", "X-Content-Type-Options": "nosniff" });
  if (req.method === "OPTIONS") return new Response(null, { headers: headersSeguros });

  const url = new URL(req.url);
  try {
    if (url.pathname === "/api/clima") return new Response(await Deno.readTextFile(OUTPUT_FILE), { headers: headersSeguros });
    if (url.pathname === "/api/historico") return new Response(await Deno.readTextFile(HISTORICO_FILE), { headers: headersSeguros });
  } catch (error) { return new Response(JSON.stringify({ erro: "API aguardando dados." }), { status: 503, headers: headersSeguros }); }
  return new Response("Acesso Negado", { status: 403, headers: headersSeguros });
});