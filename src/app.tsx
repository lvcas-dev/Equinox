import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// @ts-ignore
const API_KEY = import.meta.env.VITE_OPENWEATHER_KEY;

const NOME_DO_APP = "EQUINOX"; 
const ICONE_DO_APP = "◈"; 

// ── INTERFACES E TIPAGENS TÉCNICAS ──

interface DadosTurista {
  viabilidade_outdoor: {
    nivel: 'Alta' | 'Média' | 'Baixa';
    descricao: string;
    cor: string;
  };
  vibe_tags: string[];
  vestuario_checklist: string[];
  roteiro_ideal: string;
  local_premium: {
    nome: string;
    contexto: string;
  };
}

interface ClimaCidade {
  cidade: string;
  temperatura?: number;
  clima_bruto?: {
    temp: number;
    temp_min: number;
    temp_max: number;
    chuva_prob: number;
    vento: number;
    timezone: number;
    lat: number;
    lon: number;
    pais: string;
  };
  turista?: DadosTurista;
}

// ── CONSTANTES GEOGRÁFICAS E DICIONÁRIOS ──

const a2toa3: Record<string, string> = {
  FR: 'FRA', DE: 'DEU', NL: 'NLD', BE: 'BEL', ES: 'ESP', PT: 'PRT', IT: 'ITA', 
  AT: 'AUT', CH: 'CHE', CZ: 'CZE', PL: 'POL', DK: 'DNK', SE: 'SWE', GR: 'GRC', US: 'USA',
  JP: 'JPN', KR: 'KOR', CN: 'CHN', HK: 'HKG', TW: 'TWN', TH: 'THA', SG: 'SGP', MY: 'MYS', ID: 'IDN',
  AU: 'AUS', NZ: 'NZL', EG: 'EGY', ZA: 'ZAF', MA: 'MAR', KE: 'KEN', NG: 'NGA',
  AE: 'ARE', QA: 'QAT', SA: 'SAU', IL: 'ISR', OM: 'OMN', JO: 'JOR', LB: 'LBN',
  CA: 'CAN', MX: 'MEX', BR: 'BRA', AR: 'ARG', CL: 'CHL', PE: 'PER', CO: 'COL'
};

const mapaContinentes: Record<string, string> = {
  'FR': 'Europa Ocidental', 'GB': 'Europa Ocidental', 'DE': 'Europa Ocidental', 'NL': 'Europa Ocidental', 'BE': 'Europa Ocidental', 'IE': 'Europa Ocidental',
  'IT': 'Europa Mediterrânea', 'ES': 'Europa Mediterrânea', 'PT': 'Europa Mediterrânea', 'GR': 'Europa Mediterrânea',
  'AT': 'Europa Central', 'CH': 'Europa Central', 'CZ': 'Europa Central', 'HU': 'Europa Central', 'PL': 'Europa Central',
  'DK': 'Escandinávia', 'SE': 'Escandinávia', 'NO': 'Escandinávia', 'FI': 'Escandinávia',
  'US': 'América do Norte', 'CA': 'América do Norte', 'MX': 'América Central e Caribe',
  'BR': 'América do Sul', 'AR': 'América do Sul', 'CL': 'América do Sul', 'PE': 'América do Sul', 'CO': 'América do Sul',
  'JP': 'Ásia Oriental', 'KR': 'Ásia Oriental', 'CN': 'Ásia Oriental', 'TW': 'Ásia Oriental', 'HK': 'Ásia Oriental',
  'TH': 'Sudeste Asiático', 'SG': 'Sudeste Asiático', 'MY': 'Sudeste Asiático', 'ID': 'Sudeste Asiático',
  'AU': 'Oceania', 'NZ': 'Oceania',
  'EG': 'Norte da África', 'MA': 'Norte da África', 'ZA': 'África do Sul', 'KE': 'África Oriental', 'NG': 'África Ocidental',
  'AE': 'Oriente Médio', 'QA': 'Oriente Médio', 'SA': 'Oriente Médio', 'IL': 'Oriente Médio', 'OM': 'Oriente Médio', 'JO': 'Oriente Médio', 'LB': 'Oriente Médio'
};

const getContinente = (paisIso?: string) => paisIso ? (mapaContinentes[paisIso] || 'Global') : 'Global';
const REGIOES_FILTRO = ['Todos', ...Array.from(new Set(Object.values(mapaContinentes))).sort()];
const MESES_ANO = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const CIDADES_DESTAQUE = ['Paris', 'Rome', 'Madrid', 'Tokyo'];

const DICIONARIO = {
  PT: {
    slogan: "O mundo mapeado em sensações.",
    iniciar: "Acessar Plataforma",
    destinos: "Monitoramento",
    visaoLivre: "Mapa Global",
    buscar: "Pesquisar destino...",
    radarLimpo: "Nenhum registro encontrado para esta região.",
    fecharPainel: "Encerrar Consulta",
    panorama: "Relatório",
    premium: "Premium",
    condicoesPasseio: "Protocolo de Viabilidade",
    dressCode: "Vestuário Recomendado",
    previsaoHora: "Projeção por Hora",
    previsaoSazonal: "Análise Sazonal Histórica",
    gerarRoteiro: "Consultoria de Itinerário IA",
    rotaSecreta: "Visualizar Localização",
    configurar: "Parâmetros",
    sintetizar: "Gerar Relatório",
    analisarMes: "Processar Dados",
    voltarHoje: "Retornar ao Tempo Real",
    voos: "Passagens",
    hoteis: "Acomodações",
    mesa: "Reservas",
    premiumModo: "Serviços Premium Habilitados"
  },
  EN: {
    slogan: "The world mapped in sensations.",
    iniciar: "Access Platform",
    destinos: "Monitoring",
    visaoLivre: "Global Map",
    buscar: "Search destination...",
    radarLimpo: "No records found for this region.",
    fecharPainel: "End Consultation",
    panorama: "Report",
    premium: "Premium",
    condicoesPasseio: "Viability Protocol",
    dressCode: "Recommended Attire",
    previsaoHora: "Hourly Projection",
    previsaoSazonal: "Historical Seasonal Analysis",
    gerarRoteiro: "AI Itinerary Consultancy",
    rotaSecreta: "View Location",
    configurar: "Parameters",
    sintetizar: "Generate Report",
    analisarMes: "Process Data",
    voltarHoje: "Return to Real-Time",
    voos: "Flights",
    hoteis: "Accommodations",
    mesa: "Bookings",
    premiumModo: "Premium Services Enabled"
  }
};

// ── MOTORES PROCEDURAIS ──

function gerarCuradoriaDinamica(temp: number, continente: string, idioma: 'PT' | 'EN') {
  let outdoorNivel = 'Alta';
  let outdoorDesc = '';
  let checklist: string[] = [];
  
  const isEurope = continente.includes('Europa');
  const isAsia = continente.includes('Ásia');
  const isPT = idioma === 'PT';

  if (temp <= 12) {
    outdoorNivel = 'Média';
    outdoorDesc = isPT 
      ? 'Baixa temperatura detectada. Recomenda-se alternar atividades externas com ambientes climatizados.' 
      : 'Low temperature detected. Recommended to alternate outdoor activities with climate-controlled environments.';
    checklist.push(isPT ? 'Sobretudo estruturado ou isolamento térmico de alta performance' : 'Structured overcoat or high-performance thermal insulation');
    checklist.push(isPT ? 'Calçados fechados com solado aderente' : 'Closed footwear with high-grip soles');
    checklist.push(isPT ? 'Acessórios térmicos complementares (Luvas, cachecol)' : 'Complementary thermal accessories (Gloves, scarf)');
  } else if (temp >= 28) {
    outdoorNivel = 'Baixa';
    outdoorDesc = isPT 
      ? 'Elevado estresse térmico. Priorizar atividades em períodos de menor incidência solar.' 
      : 'High thermal stress. Prioritize activities during periods of lower solar incidence.';
    checklist.push(isPT ? 'Tecidos naturais de alta respirabilidade (Linho, algodão leve)' : 'High breathability natural fabrics (Linen, light cotton)');
    checklist.push(isPT ? 'Proteção ocular premium e proteção dérmica UV mandatória' : 'Premium ocular protection and mandatory UV skin protection');
    checklist.push(isPT ? 'Calçados leves e amplamente ventilados' : 'Lightweight and highly ventilated footwear');
  } else {
    outdoorNivel = 'Alta';
    outdoorDesc = isPT 
      ? 'Equilíbrio térmico atmosférico ideal. Condições plenas para exploração urbana extensiva.' 
      : 'Ideal atmospheric thermal balance. Full conditions for extensive urban exploration.';
    checklist.push(isPT ? 'Camadas leves de transição (Cardigans ou jaquetas finas)' : 'Light transitional layers (Cardigans or thin jackets)');
    checklist.push(isPT ? 'Calçado ergonômico focado em longas distâncias' : 'Ergonomic footwear focused on long distances');
  }

  if (isEurope) {
    checklist.push(isPT 
      ? 'Padrão: Smart Casual (Restrições aplicáveis a vestuário esportivo em restaurantes tradicionais)' 
      : 'Standard: Smart Casual (Restrictions apply to sportswear in traditional restaurants)');
  } else if (isAsia) {
    checklist.push(isPT 
      ? 'Etiqueta Local: Vestuário recatado com cobertura de ombros e joelhos para acesso a templos' 
      : 'Local Etiquette: Modest attire covering shoulders and knees for access to temples');
  }

  return {
    nivel: outdoorNivel,
    cor: outdoorNivel === 'Alta' ? '#22c55e' : (outdoorNivel === 'Média' ? '#eab308' : '#ef4444'),
    descricao: outdoorDesc,
    itens: checklist
  };
}

function gerarDossieHistorico(lat: number, mesNome: string) {
  const mesIndex = MESES_ANO.indexOf(mesNome);
  const isNorte = lat >= 0;
  const isTropical = Math.abs(lat) < 23;
  
  let tempMedia, riscoChuva, fenNome, fenValor, fenCor;
  const rad = ((mesIndex - (isNorte ? 6 : 0)) * Math.PI) / 6;

  if (isTropical) {
    tempMedia = 26 + (Math.cos(rad) * 3);
    riscoChuva = (mesIndex > 10 || mesIndex < 3) ? 65 : 20; 
    fenNome = "Índice UV Extremo"; 
    fenValor = "Elevado"; 
    fenCor = "text-fuchsia-400";
  } else {
    tempMedia = 15 + (Math.cos(rad) * 12);
    riscoChuva = 30 + (Math.abs(Math.sin(rad)) * 40) - (Math.abs(lat) / 5); 
    if (riscoChuva < 0) riscoChuva = 10;

    if (tempMedia < 5) { 
      fenNome = "Precipitação Sólida (Neve)"; fenValor = "Moderado"; fenCor = "text-blue-300"; 
    } else if (tempMedia > 26) { 
      fenNome = "Onda Térmica Atípica"; fenValor = "Possível"; fenCor = "text-orange-400"; 
    } else { 
      fenNome = "Estabilidade Atmosférica"; fenValor = "Alta"; fenCor = "text-slate-300"; 
    }
  }

  return {
    temp: Math.round(tempMedia), 
    min: Math.round(tempMedia - 5), 
    max: Math.round(tempMedia + 6),
    chuva: Math.round(riscoChuva), 
    fenomeno: { nome: fenNome, valor: fenValor, cor: fenCor },
    veredito: (riscoChuva > 50) 
      ? `Atenção. ${mesNome} possui alta incidência pluviométrica histórica para as coordenadas ${lat.toFixed(2)}. Recomenda-se forte planejamento de roteiros indoor.` 
      : `Excelente janela. Historicamente, o mês de ${mesNome} apresenta o equilíbrio térmico ideal com baixíssima chance de frustrações climáticas operacionais.`
  };
}

// ── UTILITÁRIOS ──

function getHoraLocalInfo(timezoneOffsetSeconds?: number) {
  if (timezoneOffsetSeconds === undefined) return { texto: '--:--', isDia: true };
  const dataLocal = new Date(new Date().getTime() + new Date().getTimezoneOffset() * 60000 + (timezoneOffsetSeconds * 1000));
  const hora = dataLocal.getHours();
  return { texto: dataLocal.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), isDia: hora >= 6 && hora < 18 };
}

function getIconeClima(id?: number) {
  if (!id) return '🌡️';
  if (id >= 200 && id < 300) return '⛈️';
  if (id >= 300 && id < 600) return '🌧️';
  if (id >= 600 && id < 700) return '❄️';
  if (id >= 700 && id < 800) return '🌫️';
  if (id === 800) return '☀️';
  return '☁️';
}

function getMapsLink(nomeLocal: string, cidade: string) {
  const query = encodeURIComponent(`${nomeLocal} ${cidade}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export default function App() {
  // Inicialização buscando memória do Local Storage (com Fallback padrão)
  const [idioma, setIdioma] = useState<'PT' | 'EN'>(() => {
    return (localStorage.getItem('equinox_idioma') as 'PT' | 'EN') || 'PT';
  });
  const t = DICIONARIO[idioma];

  const [mostrarSplash, setMostrarSplash] = useState(true);
  const [splashSaindo, setSplashSaindo] = useState(false);
  
  const [visaoApresentacao, setVisaoApresentacao] = useState<'lista' | 'mapa'>(() => {
    return (localStorage.getItem('equinox_visao') as 'lista' | 'mapa') || 'lista';
  });
  const [camadaRadar, setCamadaRadar] = useState<'nenhuma' | 'temp_new' | 'precipitation_new'>('precipitation_new');
  
  const [dadosClima, setDadosClima] = useState<ClimaCidade[]>([]);
  const [historico, setHistorico] = useState<any[]>([]);
  const [geoJson, setGeoJson] = useState<any>(null);
  
  const [cidadeSelecionada, setCidadeSelecionada] = useState<ClimaCidade | null>(null);
  const [abaMobileAtiva, setAbaMobileAtiva] = useState<'panorama' | 'premium'>('panorama');
  
  const [estadoRoteiroIA, setEstadoRoteiroIA] = useState<'fechado' | 'setup' | 'carregando' | 'pronto'>('fechado');
  const [perfilViagem, setPerfilViagem] = useState<'mochilao' | 'equilibrado' | 'luxo'>('equilibrado');
  
  const [estadoMaquinaTempo, setEstadoMaquinaTempo] = useState<'fechado' | 'setup' | 'carregando' | 'pronto'>('fechado');
  const [mesSelecionado, setMesSelecionado] = useState('Jul');
  const [dossieAtual, setDossieAtual] = useState<any>(null);

  const [unidade, setUnidade] = useState<'C' | 'F'>(() => {
    return (localStorage.getItem('equinox_unidade') as 'C' | 'F') || 'C';
  });
  const [filtroAtivo, setFiltroAtivo] = useState('Todos');
  const [menuFiltroAberto, setMenuFiltroAberto] = useState(false);
  const [termoBusca, setTermoBusca] = useState('');
  const [limiteExibicao, setLimiteExibicao] = useState(4); 

  // ── EFEITOS DE PERSISTÊNCIA (Os "Vigias" do Local Storage) ──
  useEffect(() => { localStorage.setItem('equinox_idioma', idioma); }, [idioma]);
  useEffect(() => { localStorage.setItem('equinox_visao', visaoApresentacao); }, [visaoApresentacao]);
  useEffect(() => { localStorage.setItem('equinox_unidade', unidade); }, [unidade]);

  useEffect(() => { 
    setLimiteExibicao(filtroAtivo === 'Todos' && termoBusca === '' ? 4 : 12); 
  }, [filtroAtivo, termoBusca]);

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json')
      .then(res => res.json())
      .then(setGeoJson)
      .catch(() => {});

    const carregarDados = () => {
      fetch(`/api/clima`)
        .then(res => res.json())
        .then(data => setDadosClima(Array.isArray(data) ? data : []))
        .catch(() => {});
        
      fetch(`/api/historico`)
        .then(res => res.json())
        .then(data => setHistorico(Array.isArray(data) ? data : []))
        .catch(() => {});
    };
    
    carregarDados();
    const intervalo = setInterval(carregarDados, 5000);
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    if (cidadeSelecionada) {
      const dadosFrescos = dadosClima.find(c => c?.cidade === cidadeSelecionada.cidade);
      if (dadosFrescos && JSON.stringify(dadosFrescos) !== JSON.stringify(cidadeSelecionada)) {
        setCidadeSelecionada(dadosFrescos);
      }
    }
  }, [dadosClima]);

  const iniciarExploracao = () => {
    setSplashSaindo(true);
    setTimeout(() => setMostrarSplash(false), 800);
  };

  const converterValor = (temp?: number) => {
    if (temp === undefined || temp === null) return 0;
    return unidade === 'F' ? (temp * 9/5) + 32 : temp;
  };

  const formatarExibicao = (temp?: number) => {
    const valor = converterValor(temp);
    return valor ? valor.toFixed(1) : '--';
  };

  const cidadesFiltradasTotal = useMemo(() => {
    if (!Array.isArray(dadosClima)) return [];
    
    const cidadesFiltradas = dadosClima.filter(c => {
      if (!c || !c.cidade) return false;
      const continenteMatch = filtroAtivo === 'Todos' || getContinente(c.clima_bruto?.pais) === filtroAtivo;
      const buscaMatch = termoBusca === '' || c.cidade.toLowerCase().includes(termoBusca.toLowerCase());
      return continenteMatch && buscaMatch;
    });

    return cidadesFiltradas.sort((a, b) => {
      const nomeA = a.cidade || '';
      const nomeB = b.cidade || '';
      const indexA = CIDADES_DESTAQUE.indexOf(nomeA);
      const indexB = CIDADES_DESTAQUE.indexOf(nomeB);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1; 
      if (indexB !== -1) return 1;  
      return nomeA.localeCompare(nomeB);
    });
  }, [dadosClima, filtroAtivo, termoBusca]);

  const cidadesExibidas = cidadesFiltradasTotal.slice(0, limiteExibicao);
  const paisesMonitorados = new Set(dadosClima.map(c => a2toa3[c?.clima_bruto?.pais || '']).filter(Boolean));
  const corDestaque = '#3b82f6'; 

  const onEachFeature = (feature: any, layer: any) => {
    if (!paisesMonitorados.has(feature.id)) return;
    
    layer.on({
      mouseover: (e: any) => { 
        e.target.setStyle({ fillOpacity: 0.3, weight: 2 }); 
        e.target.bringToFront(); 
      },
      mouseout: () => { 
        if (geoJson) layer.setStyle({ fillColor: corDestaque, weight: 1.5, color: corDestaque, fillOpacity: 0.1, dashArray: '' }); 
      },
      click: () => { 
        const iso2 = Object.keys(a2toa3).find(k => a2toa3[k] === feature.id);
        if (iso2) setFiltroAtivo(getContinente(iso2) !== 'Global' ? getContinente(iso2) : 'Todos');
        setTermoBusca('');
        setVisaoApresentacao('lista'); 
      }
    });
  };

  const abrirPainel = (cidade: ClimaCidade) => {
    setCidadeSelecionada(cidade);
    setAbaMobileAtiva('panorama');
    setEstadoRoteiroIA('fechado');
    setEstadoMaquinaTempo('fechado');
  };

  const fecharModal = () => {
    setCidadeSelecionada(null);
    setEstadoRoteiroIA('fechado');
    setEstadoMaquinaTempo('fechado');
  };

  const acionarIA = () => {
    setEstadoRoteiroIA('carregando');
    setTimeout(() => setEstadoRoteiroIA('pronto'), 1800);
  };

  const acionarMaquinaTempo = () => {
    setEstadoMaquinaTempo('carregando');
    setTimeout(() => {
      setDossieAtual(gerarDossieHistorico(cidadeSelecionada?.clima_bruto?.lat || 0, mesSelecionado));
      setEstadoMaquinaTempo('pronto');
    }, 1500);
  };

  const trocarMes = (mes: string) => {
    setMesSelecionado(mes);
    if (estadoMaquinaTempo === 'pronto') {
      setDossieAtual(gerarDossieHistorico(cidadeSelecionada?.clima_bruto?.lat || 0, mes));
    }
  };

  const curadoriaAtual = cidadeSelecionada ? gerarCuradoriaDinamica(cidadeSelecionada.clima_bruto?.temp || 20, getContinente(cidadeSelecionada.clima_bruto?.pais), idioma) : null;
  
  // DADOS DO GRÁFICO (Com Fallback garantido para portfólio)
  const dadosGraficoProcessados = historico.map(p => ({ 
    hora: p.time, 
    temp: p && cidadeSelecionada && p[cidadeSelecionada.cidade] !== undefined ? Number(converterValor(p[cidadeSelecionada.cidade]).toFixed(1)) : null 
  })).filter(p => p.temp !== null);

  const dadosGraficoSeguros = dadosGraficoProcessados.length > 0 ? dadosGraficoProcessados : [
    { hora: '06:00', temp: 15 },
    { hora: '10:00', temp: 18 },
    { hora: '14:00', temp: 22 },
    { hora: '18:00', temp: 20 },
    { hora: '22:00', temp: 17 }
  ];

  return (
    <div className="h-screen w-screen bg-[#0b1120] text-slate-300 font-sans overflow-hidden relative selection:bg-purple-500/30">
      
      {/* ── SPLASH SCREEN ── */}
      {mostrarSplash && (
        <div className={`fixed inset-0 z-[5000] bg-[#0b1120] flex flex-col items-center justify-center p-6 transition-opacity duration-700 ease-in-out ${splashSaindo ? 'opacity-0' : 'opacity-100'}`}>
          <div className="text-center max-w-2xl flex flex-col items-center">
            <div className="text-7xl mb-8 text-blue-500 animate-[pulse_3s_ease-in-out_infinite] drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">
              {ICONE_DO_APP}
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-widest uppercase mb-2">
              {NOME_DO_APP}
            </h1>
            <h2 className="text-xs md:text-md text-blue-400 font-black tracking-[0.4em] uppercase mb-10">
              {t.slogan}
            </h2>
            <button 
              onClick={iniciarExploracao} 
              className="bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest px-8 md:px-10 py-3 md:py-4 rounded-full transition-all hover:scale-105 shadow-[0_0_20px_rgba(59,130,246,0.3)] text-sm md:text-base"
            >
              {t.iniciar}
            </button>
          </div>
        </div>
      )}

      {/* ── MAPA BASE (LEAFLET) ── */}
      <div className="absolute inset-0 z-0">
        <MapContainer 
          center={[20, 0]} 
          zoom={2.5} 
          minZoom={2} 
          maxBounds={[[-90, -180], [90, 180]]} 
          style={{ height: "100%", width: "100%", background: "#0b1120" }} 
          scrollWheelZoom={true} 
          zoomControl={false}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          {camadaRadar !== 'nenhuma' && API_KEY && (
            <TileLayer 
              key={camadaRadar} 
              url={`https://tile.openweathermap.org/map/${camadaRadar}/{z}/{x}/{y}.png?appid=${API_KEY}`} 
              opacity={0.5} 
            />
          )}
            {geoJson && (
            <GeoJSON 
              key={Array.from(paisesMonitorados).join('-') || 'map-base'} 
              data={geoJson} 
              style={(feature: any) => {
                 const isMonitored = paisesMonitorados.has(feature.id);
                 return isMonitored 
                   ? { fillColor: corDestaque, weight: 1.5, color: corDestaque, fillOpacity: 0.1 }
                   : { fillColor: 'transparent', weight: 0.5, color: '#1e293b' };
              }} 
              onEachFeature={(feature: any, layer: any) => {
                layer.on({
                  mouseover: (e: any) => { 
                    if(paisesMonitorados.has(feature.id)) {
                      e.target.setStyle({ fillOpacity: 0.4, weight: 2 }); 
                      e.target.bringToFront(); 
                    }
                  },
                  mouseout: (e: any) => { 
                    if(paisesMonitorados.has(feature.id)) {
                      e.target.setStyle({ fillColor: corDestaque, weight: 1.5, color: corDestaque, fillOpacity: 0.1 }); 
                    }
                  },
                  click: () => { 
                    if(paisesMonitorados.has(feature.id)) {
                      const iso2 = Object.keys(a2toa3).find(k => a2toa3[k] === feature.id);
                      if (iso2) setFiltroAtivo(getContinente(iso2) !== 'Global' ? getContinente(iso2) : 'Todos');
                      setTermoBusca('');
                      setVisaoApresentacao('lista'); 
                    }
                  }
                });
              }} 
            />
          )}
        </MapContainer>
      </div>

      <div className="absolute inset-0 z-[5] pointer-events-none bg-[radial-gradient(ellipse_at_center,_transparent_20%,_#0b1120_100%)] opacity-80" />
      <div className="absolute inset-0 z-[6] pointer-events-none bg-gradient-to-b from-[#0b1120]/80 via-transparent to-[#0b1120]/90" />

      {/* ── HEADER PRINCIPAL STICKY NO TOPO ── */}
      <header className="absolute top-4 md:top-6 left-4 md:left-6 right-4 md:right-6 z-[1000] bg-[#0b1120]/60 backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-full p-4 flex flex-col md:flex-row justify-between items-center gap-4 shadow-2xl transition-all duration-500">
        
        <div className="flex items-center gap-4 w-full md:w-auto justify-between">
          <h1 className="text-xl md:text-2xl font-black text-white uppercase flex items-center gap-2 tracking-widest leading-none drop-shadow-md">
            <span className="text-blue-500">{ICONE_DO_APP}</span> {NOME_DO_APP}
          </h1>
          <div className="flex bg-black/30 p-1 rounded-lg border border-white/10">
             <button 
               onClick={() => setIdioma('PT')} 
               className={`px-2 py-1 text-[9px] font-black rounded-md transition-all ${idioma === 'PT' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}
             >
               PT
             </button>
             <button 
               onClick={() => setIdioma('EN')} 
               className={`px-2 py-1 text-[9px] font-black rounded-md transition-all ${idioma === 'EN' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}
             >
               EN
             </button>
          </div>
        </div>

        <div className="flex w-full md:w-auto justify-between gap-3 items-center">
          <div className="bg-black/30 p-1.5 rounded-full flex border border-white/10">
            <button 
              onClick={() => setVisaoApresentacao('lista')} 
              className={`px-4 py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${visaoApresentacao === 'lista' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
            >
              {t.destinos}
            </button>
            <button 
              onClick={() => setVisaoApresentacao('mapa')} 
              className={`px-4 py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${visaoApresentacao === 'mapa' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
            >
              {t.visaoLivre}
            </button>
          </div>
          <div className="bg-black/30 p-1.5 rounded-full flex border border-white/10">
             <button 
               onClick={() => setUnidade('C')} 
               className={`px-3 md:px-4 py-1.5 text-[10px] font-black rounded-full transition-all ${unidade === 'C' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}
             >
               °C
             </button>
             <button 
               onClick={() => setUnidade('F')} 
               className={`px-3 md:px-4 py-1.5 text-[10px] font-black rounded-full transition-all ${unidade === 'F' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}
             >
               °F
             </button>
          </div>
        </div>
      </header>

      {/* ── PAINEL DE CONTEÚDO (FEED) ── */}
      <div className={`absolute top-0 bottom-0 left-0 w-full z-[100] overflow-y-auto no-scrollbar transition-all duration-700 ease-in-out ${visaoApresentacao === 'lista' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        
        <div className="h-44 md:h-32 w-full" />

        <div className="max-w-7xl mx-auto px-4 md:px-8 pb-32">
          
          <div className="flex flex-col sm:flex-row gap-3 mb-8 justify-end">
            <div className="relative w-full sm:w-80">
              <input 
                type="text" 
                placeholder={t.buscar} 
                value={termoBusca} 
                onChange={(e) => setTermoBusca(e.target.value)} 
                className="w-full bg-[#0b1120]/60 backdrop-blur-xl border border-white/10 text-white text-xs font-medium px-5 py-4 rounded-xl focus:outline-none focus:border-blue-500/50 transition-colors shadow-xl placeholder:text-slate-500" 
              />
              {termoBusca && (
                <button onClick={() => setTermoBusca('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs transition-colors">
                  ✕
                </button>
              )}
            </div>
            
            <div className="relative w-full sm:w-auto">
              <button 
                onClick={() => setMenuFiltroAberto(!menuFiltroAberto)} 
                className="w-full sm:w-auto px-5 py-4 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all bg-[#0b1120]/60 backdrop-blur-xl border border-white/10 text-slate-200 flex justify-between items-center gap-4 hover:bg-[#0b1120]/80 shadow-xl"
              >
                <span>{filtroAtivo === 'Todos' ? '🌍 Grade Global' : `📍 ${filtroAtivo}`}</span>
                <span className={`opacity-50 transition-transform ${menuFiltroAberto ? 'rotate-180' : ''}`}>▾</span>
              </button>

              {menuFiltroAberto && (
                <>
                  <div className="fixed inset-0 z-[190]" onClick={() => setMenuFiltroAberto(false)} />
                  <div className="absolute right-0 top-full mt-2 w-full sm:w-64 bg-[#0b1120]/95 border border-white/10 rounded-xl shadow-2xl z-[200] overflow-y-auto max-h-96 flex flex-col backdrop-blur-2xl animate-in slide-in-from-top-2 duration-200 no-scrollbar">
                    {REGIOES_FILTRO.map(r => (
                      <button 
                        key={r} 
                        onClick={() => { setFiltroAtivo(r); setMenuFiltroAberto(false); }} 
                        className={`px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider hover:bg-white/5 border-b border-white/5 last:border-0 transition-colors ${filtroAtivo === r ? 'text-blue-400 bg-blue-500/10' : 'text-slate-300'}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {cidadesExibidas.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-slate-500 py-32">
              <span className="text-5xl mb-4 opacity-30">🌍</span>
              <p className="text-sm font-medium tracking-wide">{t.radarLimpo}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 items-start">
              {cidadesExibidas.map((cidade) => {
                const horaLocal = getHoraLocalInfo(cidade.clima_bruto?.timezone);
                const previewCuradoria = gerarCuradoriaDinamica(cidade.clima_bruto?.temp || 20, getContinente(cidade.clima_bruto?.pais), idioma);
                
                return (
                  <div 
                    key={cidade.cidade} 
                    onClick={() => abrirPainel(cidade)} 
                    className="bg-[#0b1120]/50 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] cursor-pointer hover:bg-[#0b1120]/80 hover:border-blue-500/30 transition-all duration-300 group shadow-xl flex flex-col h-full relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <span className="text-[8px] font-black uppercase text-blue-400/80 tracking-widest block mb-1">
                          {getContinente(cidade.clima_bruto?.pais)}
                        </span>
                        <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
                          {cidade.cidade}
                        </h3>
                      </div>
                      <span className={`text-[9px] font-mono px-2.5 py-1 rounded-lg border shadow-inner flex items-center gap-1.5 ${horaLocal.isDia ? 'bg-amber-900/30 text-amber-200 border-amber-500/20' : 'bg-blue-900/30 text-blue-200 border-blue-500/20'}`}>
                        <span>{horaLocal.isDia ? '☀️' : '🌙'}</span> {horaLocal.texto}
                      </span>
                    </div>
                    
                    <div className="text-4xl font-light text-white mb-6 flex items-center gap-3 tracking-tighter drop-shadow-lg">
                      {formatarExibicao(cidade.clima_bruto?.temp ?? cidade.temperatura)}° 
                      <span className="text-2xl opacity-90 drop-shadow-md">
                        {getIconeClima(cidade.clima_bruto?.chuva_prob)}
                      </span>
                    </div>

                    <div className="mt-auto bg-black/30 p-4 rounded-2xl border border-white/5 flex items-center justify-between group-hover:border-white/10 transition-colors">
                      <div className="w-full">
                        <div className="flex justify-between items-end mb-2">
                          <span className="block text-[8px] uppercase text-slate-500 font-bold tracking-wider">{t.condicoesPasseio}</span>
                          <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: previewCuradoria.cor }}>
                            {previewCuradoria.nivel}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-1000 ease-out" 
                            style={{ width: previewCuradoria.nivel === 'Alta' ? '100%' : (previewCuradoria.nivel === 'Média' ? '60%' : '25%'), backgroundColor: previewCuradoria.cor }} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL PREMIUM (VISÃO SPLIT & TABS) ── */}
      {cidadeSelecionada && curadoriaAtual && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-[#0b1120]/95 backdrop-blur-3xl p-3 md:p-8 animate-in fade-in duration-300">
          
          <div className="w-full max-w-7xl flex flex-col h-full max-h-[96vh] md:max-h-[90vh]">
            
            <div className="flex flex-col w-full shrink-0 mb-4 md:mb-6 gap-3">
              <div className="flex justify-end w-full">
                <button 
                  onClick={fecharModal} 
                  className="bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white px-3 py-2 md:px-5 md:py-2.5 rounded-lg md:rounded-xl transition-all border border-white/10 flex items-center justify-center gap-2 text-[10px] md:text-xs font-black uppercase tracking-widest shadow-sm group"
                >
                  <span className="text-red-400 group-hover:scale-110 transition-transform">✕</span> 
                  <span className="hidden md:inline">{t.fecharPainel}</span>
                </button>
              </div>

              <div className="flex md:hidden w-full bg-black/40 rounded-xl p-1 border border-white/10 shadow-inner">
                 <button 
                   onClick={() => setAbaMobileAtiva('panorama')} 
                   className={`flex-1 py-3.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${abaMobileAtiva === 'panorama' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}
                 >
                   {t.panorama}
                 </button>
                 <button 
                   onClick={() => setAbaMobileAtiva('premium')} 
                   className={`flex-1 py-3.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${abaMobileAtiva === 'premium' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}
                 >
                   {t.premium}
                 </button>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 animate-in slide-in-from-bottom-8 duration-500">

              {/* CARD 1: RELATÓRIO TÉCNICO E CLIMÁTICO */}
              <div className={`${abaMobileAtiva === 'panorama' ? 'flex' : 'hidden'} md:flex flex-1 bg-[#0f172a] border border-white/10 rounded-[2.5rem] p-6 md:p-10 flex-col overflow-y-auto no-scrollbar shadow-2xl relative`}>
                
                <div className="flex justify-between items-start mb-8 border-b border-white/5 pb-8">
                  <div>
                    <span className="text-[10px] font-black uppercase text-blue-500 tracking-widest block mb-2">
                      {getContinente(cidadeSelecionada.clima_bruto?.pais)}
                    </span>
                    <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none">
                      {cidadeSelecionada.cidade}
                    </h2>
                  </div>
                  <div className="text-right flex flex-col items-end">
                     <div className="text-5xl font-light text-white tracking-tighter mb-2">
                       {formatarExibicao(cidadeSelecionada.clima_bruto?.temp ?? cidadeSelecionada.temperatura)}°
                     </div>
                     <span className={`text-[10px] md:text-xs font-mono px-3 py-1.5 rounded-xl border shadow-inner flex items-center gap-2 ${getHoraLocalInfo(cidadeSelecionada.clima_bruto?.timezone).isDia ? 'bg-amber-900/30 text-amber-200 border-amber-500/20' : 'bg-blue-900/30 text-blue-200 border-blue-500/20'}`}>
                       <span>{getHoraLocalInfo(cidadeSelecionada.clima_bruto?.timezone).isDia ? '☀️' : '🌙'}</span> {getHoraLocalInfo(cidadeSelecionada.clima_bruto?.timezone).texto}
                     </span>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-black/30 p-6 rounded-2xl border border-white/5 shadow-inner">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-4">
                      {t.condicoesPasseio}
                    </span>
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-black text-sm border shadow-inner" 
                        style={{ backgroundColor: `${curadoriaAtual.cor}20`, color: curadoriaAtual.cor, borderColor: `${curadoriaAtual.cor}50` }}
                      >
                        {curadoriaAtual.nivel === 'Alta' ? 'A' : (curadoriaAtual.nivel === 'Média' ? 'M' : 'B')}
                      </div>
                      <p className="text-slate-300 text-xs leading-relaxed border-l-2 pl-3 py-1" style={{ borderColor: `${curadoriaAtual.cor}50` }}>
                        {curadoriaAtual.descricao}
                      </p>
                    </div>
                  </div>

                  <div className="bg-black/30 p-6 rounded-2xl border border-white/5 shadow-inner">
                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-500 block mb-4">
                      {t.dressCode}
                    </span>
                    <div className="grid grid-cols-1 gap-3">
                      {curadoriaAtual.itens.map((item, idx) => (
                        <div key={idx} className="text-slate-300 text-[11px] flex items-center gap-3 bg-white/5 px-4 py-3 rounded-xl border border-white/5 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.8)]" /> 
                          <span className="leading-snug">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Gráfico Blindado com Altura Estática */}
                  <div className="bg-black/40 rounded-2xl p-6 border border-white/5 flex flex-col shadow-inner">
                     <div className="flex justify-between items-center mb-6">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                          {t.previsaoHora}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono bg-white/5 px-3 py-1.5 rounded border border-white/10 shadow-sm">
                          Min {formatarExibicao(cidadeSelecionada.clima_bruto?.temp_min)}° | Max {formatarExibicao(cidadeSelecionada.clima_bruto?.temp_max)}°
                        </span>
                     </div>
                     
                     <div className="w-full h-[180px] mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart 
                            margin={{ top: 20, right: 10, left: 0, bottom: 0 }} 
                            data={dadosGraficoSeguros}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" strokeOpacity={0.03} vertical={false} />
                            <XAxis dataKey="hora" stroke="#475569" fontSize={9} tickMargin={8} axisLine={false} tickLine={false} />
                            <YAxis 
                              domain={['auto', 'auto']} 
                              stroke="#475569" 
                              fontSize={9} 
                              axisLine={false} 
                              tickLine={false} 
                              width={25} 
                            />
                            <Tooltip contentStyle={{ backgroundColor: '#0b1120', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} itemStyle={{ color: '#fff' }} />
                            <Line 
                              type="monotone" 
                              dataKey="temp" 
                              stroke={corDestaque} 
                              strokeWidth={3} 
                              dot={{ r: 4, fill: '#0b1120', stroke: corDestaque, strokeWidth: 2 }} 
                              activeDot={{ r: 7, fill: corDestaque, stroke: '#0b1120', strokeWidth: 2 }} 
                              label={{ position: 'top', fill: '#94a3b8', fontSize: 10, dy: -8, fontWeight: 'bold' }} 
                            />
                          </LineChart>
                        </ResponsiveContainer>
                     </div>
                  </div>
                </div>
              </div>

              {/* CARD 2: FERRAMENTAS PREMIUM E ACIONÁVEIS */}
              <div className={`${abaMobileAtiva === 'premium' ? 'flex' : 'hidden'} md:flex flex-1 bg-gradient-to-b from-[#1a1c2e] to-black/80 border border-purple-500/20 rounded-[2.5rem] p-6 md:p-10 flex-col overflow-y-auto no-scrollbar shadow-2xl relative`}>
                
                <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg w-fit mb-8 shadow-md">
                  <span className="animate-pulse text-amber-400">✦</span> {t.premiumModo}
                </div>

                <div className="min-h-[180px] shrink-0 bg-gradient-to-br from-amber-900/20 to-black/50 p-8 rounded-[2rem] border border-amber-500/20 relative overflow-hidden mb-8 flex flex-col justify-center shadow-lg group">
                  <div className="absolute -top-6 -right-6 text-7xl md:text-8xl opacity-5 transform rotate-12 group-hover:scale-110 group-hover:rotate-45 transition-transform duration-700 text-amber-500">✦</div>
                  <h4 className="text-lg md:text-xl font-black text-amber-400 mb-3 tracking-tight uppercase italic drop-shadow-md">
                    {cidadeSelecionada.turista?.local_premium?.nome || 'Consultoria Exclusiva'}
                  </h4>
                  <p className="text-amber-200/70 leading-relaxed text-xs font-medium mb-6">
                    "{cidadeSelecionada.turista?.local_premium?.contexto || 'Análise de localização de alto padrão para o perfil selecionado.'}"
                  </p>
                  {(!cidadeSelecionada.turista?.local_premium?.nome?.includes("✦")) && (
                    <a 
                      href={getMapsLink(cidadeSelecionada.turista?.local_premium?.nome || '', cidadeSelecionada.cidade || '')} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-widest px-5 py-3.5 rounded-xl border border-amber-500/30 w-full text-center transition-colors flex items-center justify-center gap-2 shadow-sm hover:shadow-amber-500/20"
                    >
                      {t.rotaSecreta}
                    </a>
                  )}
                </div>

                <div className="space-y-4 mb-auto flex flex-col shrink-0">
                   
                   <div className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden shadow-inner transition-all duration-300">
                     <button 
                       onClick={() => setEstadoRoteiroIA(prev => prev === 'fechado' ? 'setup' : 'fechado')} 
                       className="w-full p-6 hover:bg-purple-900/10 transition-all flex items-center justify-between group"
                     >
                        <div className="text-left">
                          <span className="text-purple-500 text-[8px] md:text-[9px] font-black uppercase tracking-widest block mb-1">Processamento IA</span>
                          <span className="text-white text-sm md:text-base font-bold uppercase tracking-tight group-hover:text-purple-300 transition-colors">{t.gerarRoteiro}</span>
                        </div>
                        <span className={`bg-white/5 p-3 rounded-xl text-white group-hover:bg-purple-500/20 transition-all duration-300 border border-white/5 ${estadoRoteiroIA !== 'fechado' ? 'rotate-90 text-purple-400' : ''}`}>🤖</span>
                     </button>
                     
                     {estadoRoteiroIA !== 'fechado' && (
                       <div className="p-6 border-t border-white/5 bg-black/20 animate-in slide-in-from-top-2">
                          {estadoRoteiroIA === 'setup' && (
                            <>
                              <span className="text-slate-400 text-[9px] font-bold uppercase tracking-widest block mb-4">{t.configurar}</span>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                                <button onClick={() => setPerfilViagem('mochilao')} className={`py-4 rounded-xl border text-[10px] md:text-xs font-bold flex flex-col items-center gap-2 transition-all ${perfilViagem === 'mochilao' ? 'border-purple-500 bg-purple-500/20 text-purple-300' : 'border-white/10 bg-black/30 text-slate-400 hover:border-white/30'}`}>
                                  <span className="text-lg">🎒</span> {idioma === 'PT' ? 'Mochilão' : 'Budget'}
                                </button>
                                <button onClick={() => setPerfilViagem('equilibrado')} className={`py-4 rounded-xl border text-[10px] md:text-xs font-bold flex flex-col items-center gap-2 transition-all ${perfilViagem === 'equilibrado' ? 'border-purple-500 bg-purple-500/20 text-purple-300' : 'border-white/10 bg-black/30 text-slate-400 hover:border-white/30'}`}>
                                  <span className="text-lg">⚖️</span> {idioma === 'PT' ? 'Equilibrado' : 'Balanced'}
                                </button>
                                <button onClick={() => setPerfilViagem('luxo')} className={`py-4 rounded-xl border text-[10px] md:text-xs font-bold flex flex-col items-center gap-2 transition-all ${perfilViagem === 'luxo' ? 'border-purple-500 bg-purple-500/20 text-purple-300' : 'border-white/10 bg-black/30 text-slate-400 hover:border-white/30'}`}>
                                  <span className="text-lg">🥂</span> {idioma === 'PT' ? 'Luxo' : 'Luxury'}
                                </button>
                              </div>
                              <button onClick={acionarIA} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black text-[10px] py-4 rounded-xl uppercase tracking-widest transition-all shadow-lg hover:shadow-purple-500/40">
                                {t.sintetizar}
                              </button>
                            </>
                          )}
                          
                          {estadoRoteiroIA === 'carregando' && (
                            <div className="py-10 flex flex-col items-center justify-center">
                              <div className="w-8 h-8 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mb-4"></div>
                              <p className="text-purple-400 font-mono text-[10px] uppercase tracking-widest animate-pulse text-center">Processando parâmetros dinâmicos...</p>
                            </div>
                          )}
                          
                          {estadoRoteiroIA === 'pronto' && (
                            <div className="animate-in fade-in">
                              <div className="bg-purple-500/10 border-l-2 border-purple-500 p-4 mb-5 rounded-r-xl">
                                <p className="text-slate-300 text-[11px] md:text-xs leading-relaxed font-medium">
                                  {perfilViagem === 'mochilao' 
                                    ? 'A abordagem sugerida foca em mobilidade gratuita. Explore os perímetros boêmios a pé, integrando o transporte público local. Foque em visitas externas ou horários gratuitos para museus governamentais.' 
                                    : perfilViagem === 'luxo' 
                                    ? `Planejamento de alto padrão concluído. O foco é transição porta a porta (door-to-door). Agende visitações VIP nas galerias indicadas e planeje a transição direta para sua experiência no ${cidadeSelecionada.turista?.local_premium?.nome}.` 
                                    : 'A abordagem equilibrada sugere sessões de caminhada matinal pelos centros históricos e cartões postais, intercalando com paradas em estabelecimentos tradicionais no período de maior pico solar para reduzir a fadiga da viagem.'}
                                </p>
                              </div>
                              <button onClick={() => setEstadoRoteiroIA('setup')} className="text-slate-400 hover:text-white text-[10px] font-bold uppercase tracking-widest w-full text-center flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 py-3.5 rounded-xl transition-colors border border-white/5">
                                {t.voltarHoje}
                              </button>
                            </div>
                          )}
                       </div>
                     )}
                   </div>

                   <div className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden shadow-inner transition-all duration-300">
                     <button 
                       onClick={() => setEstadoMaquinaTempo(prev => prev === 'fechado' ? 'setup' : 'fechado')} 
                       className="w-full p-6 hover:bg-amber-900/10 transition-all flex items-center justify-between group"
                     >
                        <div className="text-left">
                          <span className="text-amber-500 text-[8px] md:text-[9px] font-black uppercase tracking-widest block mb-1">Dados Históricos</span>
                          <span className="text-white text-sm md:text-base font-bold uppercase tracking-tight group-hover:text-amber-400 transition-colors">{t.previsaoSazonal}</span>
                        </div>
                        <span className={`bg-white/5 p-3 rounded-xl text-white group-hover:bg-amber-500/20 transition-transform duration-300 border border-white/5 ${estadoMaquinaTempo !== 'fechado' ? 'rotate-90 text-amber-400' : ''}`}>⏳</span>
                     </button>
                     
                     {estadoMaquinaTempo !== 'fechado' && (
                       <div className="p-6 border-t border-white/5 bg-black/20 animate-in slide-in-from-top-2">
                          {estadoMaquinaTempo === 'setup' && (
                            <>
                              <span className="text-slate-400 text-[9px] font-bold uppercase tracking-widest block mb-4">Selecionar Mês Base</span>
                              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-5">
                                {MESES_ANO.map(mes => (
                                  <button 
                                    key={mes} 
                                    onClick={() => trocarMes(mes)} 
                                    className={`py-3 text-[10px] md:text-xs font-bold rounded-xl border transition-all ${mesSelecionado === mes ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-md' : 'bg-black/30 border-white/10 text-slate-400 hover:border-white/30'}`}
                                  >
                                    {mes}
                                  </button>
                                ))}
                              </div>
                              <button onClick={acionarMaquinaTempo} className="w-full bg-amber-600 hover:bg-amber-500 text-white font-black text-[10px] py-4 rounded-xl uppercase tracking-widest transition-all shadow-lg hover:shadow-amber-500/40">
                                {t.analisarMes}
                              </button>
                            </>
                          )}
                          
                          {estadoMaquinaTempo === 'carregando' && (
                            <div className="py-10 flex flex-col items-center justify-center">
                              <div className="w-8 h-8 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-4"></div>
                              <p className="text-amber-400 font-mono text-[10px] uppercase tracking-widest animate-pulse text-center">Inspecionando registros climáticos de longo prazo...</p>
                            </div>
                          )}
                          
                          {estadoMaquinaTempo === 'pronto' && dossieAtual && (
                            <div className="animate-in fade-in">
                              <div className="bg-black/30 p-5 rounded-2xl border border-white/5 mb-5 shadow-inner">
                                <div className="flex justify-between items-center mb-5 border-b border-white/5 pb-4">
                                  <div>
                                    <span className="text-[8px] md:text-[9px] text-slate-500 uppercase font-black tracking-widest block mb-1">Temperatura Base Prevista</span>
                                    <span className="text-3xl text-white font-light tracking-tighter">{dossieAtual.temp}°</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-[8px] md:text-[9px] text-slate-500 uppercase font-black tracking-widest block mb-1">Incidência Pluviométrica</span>
                                    <span className={`text-xl font-black px-2 py-0.5 rounded-lg ${dossieAtual.chuva > 50 ? 'bg-red-500/20 text-red-400 border border-red-500/20' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'}`}>
                                      {dossieAtual.chuva}%
                                    </span>
                                  </div>
                                </div>
                                <div className="bg-white/5 p-3 rounded-xl border border-white/5 mb-3 flex items-center justify-between">
                                  <span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Fenômeno Histórico</span>
                                  <span className={`text-[10px] font-black uppercase tracking-wider ${dossieAtual.fenomeno.cor}`}>{dossieAtual.fenomeno.nome}</span>
                                </div>
                                <p className="text-slate-300 text-[10px] md:text-[11px] leading-relaxed pt-2 font-medium">
                                  {dossieAtual.veredito}
                                </p>
                              </div>
                              <button onClick={() => setEstadoMaquinaTempo('setup')} className="text-slate-400 hover:text-white text-[10px] font-bold uppercase tracking-widest w-full text-center flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 py-3.5 rounded-xl transition-colors border border-white/5">
                                {t.voltarHoje}
                              </button>
                            </div>
                          )}
                       </div>
                     )}
                   </div>
                </div>

                {/* FAST TRACK LINKS (Passagens, Hospedagem, Restaurantes) */}
                <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-2 lg:grid-cols-3 gap-3 shrink-0">
                   <a 
                     href={`https://www.skyscanner.com.br/transporte/passagens-aereas/br/${cidadeSelecionada.cidade.toLowerCase()}`} 
                     target="_blank" rel="noopener noreferrer" 
                     className="bg-white/5 hover:bg-white/10 text-white px-3 md:px-4 py-4 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center justify-center border border-white/10 transition-colors shadow-sm"
                   >
                     {t.voos}
                   </a>
                   <a 
                     href={`https://www.booking.com/searchresults.pt-br.html?ss=${cidadeSelecionada.cidade}`} 
                     target="_blank" rel="noopener noreferrer" 
                     className="bg-white/5 hover:bg-white/10 text-white px-3 md:px-4 py-4 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center justify-center border border-white/10 transition-colors shadow-sm"
                   >
                     {t.hoteis}
                   </a>
                   <a 
                     href={`https://www.opentable.com/s?q=${cidadeSelecionada.turista?.local_premium?.nome} ${cidadeSelecionada.cidade}`} 
                     target="_blank" rel="noopener noreferrer" 
                     className="bg-rose-700/20 hover:bg-rose-700/30 text-rose-300 px-3 md:px-4 py-4 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center justify-center border border-rose-500/30 transition-colors shadow-sm col-span-2 lg:col-span-1"
                   >
                     {t.mesa}
                   </a>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}