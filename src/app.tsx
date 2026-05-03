import { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// @ts-ignore
const API_KEY = import.meta.env.VITE_OPENWEATHER_KEY;

const NOME_DO_APP = "EQUINOX"; 
const ICONE_DO_APP = "◈"; 
const SLOGAN_APP = "O mundo mapeado em sensações.";

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

// ── MOTOR PROCEDURAL HISTÓRICO (AGORA DINÂMICO E CORRETO) ──
function gerarDossieHistorico(lat: number, mesNome: string) {
  const mesIndex = MESES_ANO.indexOf(mesNome);
  const isNorte = lat >= 0;
  const isTropical = Math.abs(lat) < 23;
  
  let tempMedia, riscoChuva, fenNome, fenValor, fenCor;
  
  // Lógica senoide para simular estações baseadas no mês e hemisfério
  const rad = ((mesIndex - (isNorte ? 6 : 0)) * Math.PI) / 6;

  if (isTropical) {
    tempMedia = 26 + (Math.cos(rad) * 3);
    riscoChuva = (mesIndex > 10 || mesIndex < 3) ? 65 : 20; 
    fenNome = "Índice UV Máximo"; fenValor = "Extremo"; fenCor = "text-fuchsia-400";
  } else {
    tempMedia = 15 + (Math.cos(rad) * 12);
    // Variação de chuva com um pouco de randomização procedural determinística baseada na latitude
    riscoChuva = 30 + (Math.abs(Math.sin(rad)) * 40) - (Math.abs(lat) / 5); 
    if (riscoChuva < 0) riscoChuva = 10;

    if (tempMedia < 5) { fenNome = "Risco de Neve"; fenValor = "Moderado"; fenCor = "text-blue-300"; }
    else if (tempMedia > 26) { fenNome = "Ondas de Calor"; fenValor = "Possível"; fenCor = "text-orange-400"; }
    else { fenNome = "Ventos Sazonais"; fenValor = "Leve"; fenCor = "text-slate-300"; }
  }

  return {
    temp: Math.round(tempMedia), 
    min: Math.round(tempMedia - 5), 
    max: Math.round(tempMedia + 6),
    chuva: Math.round(riscoChuva), 
    fenomeno: { nome: fenNome, valor: fenValor, cor: fenCor },
    veredito: (riscoChuva > 50) ? `Atenção. ${mesNome} possui alta incidência pluviométrica histórica. Planeje roteiros indoor.` : `Excelente janela. Historicamente, ${mesNome} apresenta o equilíbrio térmico ideal com baixa chance de frustrações climáticas.`
  };
}

function getHoraLocalInfo(timezoneOffsetSeconds?: number) {
  if (timezoneOffsetSeconds === undefined) return { texto: '--:--', isDia: true };
  const dataLocal = new Date(new Date().getTime() + new Date().getTimezoneOffset() * 60000 + (timezoneOffsetSeconds * 1000));
  const hora = dataLocal.getHours();
  const isDia = hora >= 6 && hora < 18;
  const texto = dataLocal.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return { texto, isDia };
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

const CIDADES_DESTAQUE = ['Paris', 'Rome', 'Madrid', 'Tokyo'];

export default function App() {
  const [mostrarSplash, setMostrarSplash] = useState(true);
  const [splashSaindo, setSplashSaindo] = useState(false);
  const [visaoApresentacao, setVisaoApresentacao] = useState<'lista' | 'mapa'>('lista');
  const [camadaRadar, setCamadaRadar] = useState<'nenhuma' | 'temp_new' | 'precipitation_new'>('precipitation_new');
  const [menuCamadasAberto, setMenuCamadasAberto] = useState(false);
  
  const [dadosClima, setDadosClima] = useState<ClimaCidade[]>([]);
  const [historico, setHistorico] = useState<any[]>([]);
  const [geoJson, setGeoJson] = useState<any>(null);
  
  const [cidadeSelecionada, setCidadeSelecionada] = useState<ClimaCidade | null>(null);
  
  const [estadoRoteiroIA, setEstadoRoteiroIA] = useState<'fechado' | 'setup' | 'carregando' | 'pronto'>('fechado');
  const [perfilViagem, setPerfilViagem] = useState<'mochilao' | 'equilibrado' | 'luxo'>('equilibrado');
  
  const [estadoMaquinaTempo, setEstadoMaquinaTempo] = useState<'fechado' | 'setup' | 'carregando' | 'pronto'>('fechado');
  const [mesSelecionado, setMesSelecionado] = useState('Jul');
  const [dossieAtual, setDossieAtual] = useState<any>(null);

  const [unidade, setUnidade] = useState<'C' | 'F'>('C');
  const [filtroAtivo, setFiltroAtivo] = useState('Todos');
  const [menuFiltroAberto, setMenuFiltroAberto] = useState(false);
  const [termoBusca, setTermoBusca] = useState('');
  const [limiteExibicao, setLimiteExibicao] = useState(4); 

  useEffect(() => { 
    setLimiteExibicao(filtroAtivo === 'Todos' && termoBusca === '' ? 4 : 12); 
  }, [filtroAtivo, termoBusca]);

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json')
      .then(res => res.json()).then(setGeoJson).catch(() => {});

    const carregarDados = () => {
      fetch(`/api/clima`)
        .then(res => res.json()).then(data => setDadosClima(Array.isArray(data) ? data : [])).catch(() => {});
      fetch(`/api/historico`)
        .then(res => res.json()).then(data => setHistorico(Array.isArray(data) ? data : [])).catch(() => {});
    };
    
    carregarDados();
    const intervalo = setInterval(carregarDados, 5000);
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    if (cidadeSelecionada) {
      const dadosFrescos = dadosClima.find(c => c.cidade === cidadeSelecionada.cidade);
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
      if (!c) return false;
      const continenteMatch = filtroAtivo === 'Todos' || getContinente(c.clima_bruto?.pais) === filtroAtivo;
      const buscaMatch = termoBusca === '' || (c.cidade && c.cidade.toLowerCase().includes(termoBusca.toLowerCase()));
      return continenteMatch && buscaMatch;
    });

    return cidadesFiltradas.sort((a, b) => {
      const indexA = CIDADES_DESTAQUE.indexOf(a.cidade);
      const indexB = CIDADES_DESTAQUE.indexOf(b.cidade);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1; 
      if (indexB !== -1) return 1;  
      return a.cidade.localeCompare(b.cidade);
    });
  }, [dadosClima, filtroAtivo, termoBusca]);

  const cidadesExibidas = cidadesFiltradasTotal.slice(0, limiteExibicao);
  const temMaisCidades = cidadesFiltradasTotal.length > limiteExibicao;

  const paisesMonitorados = new Set(dadosClima.map(c => a2toa3[c?.clima_bruto?.pais || '']).filter(Boolean));
  const corDestaque = '#3b82f6'; 
  
  const chaveAtualizacaoMapa = Array.from(paisesMonitorados).sort().join('-');

  const onEachFeature = (feature: any, layer: any) => {
    if (!paisesMonitorados.has(feature.id)) return;
    
    layer.on({
      mouseover: (e: any) => { e.target.setStyle({ fillOpacity: 0.3, weight: 2 }); e.target.bringToFront(); },
      mouseout: () => { if (geoJson) layer.setStyle({ fillColor: corDestaque, weight: 1.5, color: corDestaque, fillOpacity: 0.1, dashArray: '' }); },
      click: () => { 
        const iso2 = Object.keys(a2toa3).find(k => a2toa3[k] === feature.id);
        if (iso2) setFiltroAtivo(getContinente(iso2) !== 'Global' ? getContinente(iso2) : 'Todos');
        setTermoBusca('');
        setVisaoApresentacao('lista'); 
      }
    });
    
    layer.bindTooltip(feature.properties.name, { className: 'bg-slate-900/90 backdrop-blur-sm text-slate-200 border border-slate-700/50 px-3 py-1.5 rounded-lg text-xs uppercase shadow-2xl font-medium tracking-wider', direction: 'auto', opacity: 1 });
  };

  const fecharModal = () => {
    setCidadeSelecionada(null);
    setEstadoRoteiroIA('fechado'); 
    setEstadoMaquinaTempo('fechado');
    setPerfilViagem('equilibrado');
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

  // Se o dossiê estiver aberto e o usuário trocar o mês, atualiza imediatamente
  const trocarMes = (mes: string) => {
    setMesSelecionado(mes);
    if (estadoMaquinaTempo === 'pronto') {
      setDossieAtual(gerarDossieHistorico(cidadeSelecionada?.clima_bruto?.lat || 0, mes));
    }
  };

  return (
    <div className="h-screen w-screen bg-[#0b1120] text-slate-300 font-sans overflow-hidden relative">
      
      {mostrarSplash && (
        <div className={`fixed inset-0 z-[5000] bg-[#0b1120] flex flex-col items-center justify-center p-6 transition-opacity duration-700 ease-in-out ${splashSaindo ? 'opacity-0' : 'opacity-100'}`}>
          <div className="text-center max-w-2xl flex flex-col items-center">
            <div className="text-7xl mb-8 text-blue-500 animate-[pulse_3s_ease-in-out_infinite] drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">{ICONE_DO_APP}</div>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-widest uppercase mb-2">{NOME_DO_APP}</h1>
            <h2 className="text-xs md:text-md text-blue-400 font-black tracking-[0.4em] uppercase mb-8">{SLOGAN_APP}</h2>
            <p className="text-slate-400 text-base md:text-xl font-light mb-12 leading-relaxed">O seu concierge de estilo de vida. Descubra a vibe, a temperatura e o roteiro ideal em qualquer latitude.</p>
            <button onClick={iniciarExploracao} className="bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest px-8 md:px-10 py-3 md:py-4 rounded-full transition-all hover:scale-105 shadow-[0_0_20px_rgba(59,130,246,0.3)] text-sm md:text-base">Iniciar Exploração</button>
          </div>
        </div>
      )}

      <div className="absolute inset-0 z-0">
        <MapContainer center={[20, 0]} zoom={2.5} minZoom={2} maxBounds={[[-90, -180], [90, 180]]} style={{ height: "100%", width: "100%", background: "#0b1120" }} scrollWheelZoom={true} zoomControl={false}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          {camadaRadar !== 'nenhuma' && API_KEY && <TileLayer key={camadaRadar} url={`https://tile.openweathermap.org/map/${camadaRadar}/{z}/{x}/{y}.png?appid=${API_KEY}`} opacity={0.5} />}
          {geoJson && <GeoJSON key={chaveAtualizacaoMapa || 'mapa-inicial'} data={geoJson} style={(f) => ({ fillColor: paisesMonitorados.has(f?.id) ? corDestaque : 'transparent', weight: paisesMonitorados.has(f?.id) ? 1.5 : 0.5, color: paisesMonitorados.has(f?.id) ? corDestaque : '#1e293b', fillOpacity: paisesMonitorados.has(f?.id) ? 0.1 : 0, dashArray: paisesMonitorados.has(f?.id) ? '' : '3' })} onEachFeature={onEachFeature} />}
        </MapContainer>
      </div>

      <div className="absolute inset-0 z-[5] pointer-events-none bg-[radial-gradient(ellipse_at_center,_transparent_20%,_#0b1120_100%)] opacity-80" />
      <div className="absolute inset-0 z-[6] pointer-events-none bg-gradient-to-b from-[#0b1120]/80 via-transparent to-[#0b1120]/90" />

      <header className="absolute top-3 md:top-6 left-3 md:left-6 right-3 md:right-6 z-[1000] bg-[#0b1120]/60 backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-full p-3 md:p-4 md:px-8 shadow-2xl flex flex-row justify-between items-center gap-2 md:gap-4 transition-all duration-500">
        <div className="flex items-center gap-1 md:gap-4 w-auto">
          <h1 className="text-lg md:text-2xl font-black text-white uppercase flex items-center gap-1.5 md:gap-2 tracking-widest leading-none drop-shadow-md"><span className="text-blue-500">{ICONE_DO_APP}</span> {NOME_DO_APP}</h1>
          <span className="text-[8px] text-blue-400/80 uppercase tracking-[0.3em] font-bold md:border-l md:border-white/20 md:pl-4 hidden sm:block">{SLOGAN_APP}</span>
        </div>
        <div className="flex w-auto justify-end gap-2 md:gap-3 items-center">
          <div className="bg-black/30 p-1 md:p-1.5 rounded-full flex w-auto justify-center border border-white/10">
            <button onClick={() => setVisaoApresentacao('lista')} className={`px-3 md:px-5 py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${visaoApresentacao === 'lista' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]' : 'text-slate-400 hover:text-white'}`}>Destinos</button>
            <button onClick={() => setVisaoApresentacao('mapa')} className={`px-3 md:px-5 py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${visaoApresentacao === 'mapa' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]' : 'text-slate-400 hover:text-white'}`}>Visão Livre</button>
          </div>
          <div className="bg-black/30 p-1.5 rounded-full hidden md:flex border border-white/10">
             <button onClick={() => setUnidade('C')} className={`px-4 py-1.5 text-[10px] font-black rounded-full transition-all ${unidade === 'C' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}>°C</button>
             <button onClick={() => setUnidade('F')} className={`px-4 py-1.5 text-[10px] font-black rounded-full transition-all ${unidade === 'F' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}>°F</button>
          </div>
        </div>
      </header>

      <div className={`absolute top-20 md:top-28 bottom-0 left-0 w-full z-[100] overflow-y-auto px-3 md:px-8 pb-32 no-scrollbar transition-all duration-700 ease-in-out ${visaoApresentacao === 'lista' ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-12 pointer-events-none'}`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-2 md:gap-3 mb-6 md:mb-8 justify-end mt-2 md:mt-4">
          <div className="relative w-full sm:w-72">
            <input type="text" placeholder="Buscar destino no radar..." value={termoBusca} onChange={(e) => setTermoBusca(e.target.value)} className="w-full bg-[#0b1120]/60 backdrop-blur-xl border border-white/10 text-white text-[11px] md:text-xs font-medium px-4 md:px-5 py-3 md:py-3.5 rounded-xl md:rounded-2xl focus:outline-none focus:border-blue-500/50 transition-colors shadow-xl placeholder:text-slate-500" />
            {termoBusca && <button onClick={() => setTermoBusca('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs">✕</button>}
          </div>
          <div className="relative w-full sm:w-auto">
            <button onClick={() => setMenuFiltroAberto(!menuFiltroAberto)} className="w-full sm:w-auto px-4 md:px-5 py-3 md:py-3.5 rounded-xl md:rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all bg-[#0b1120]/60 backdrop-blur-xl border border-white/10 text-slate-200 flex justify-between items-center gap-3 hover:bg-[#0b1120]/80 shadow-xl">
              <span>{filtroAtivo === 'Todos' ? '🌍 Grade Global' : `📍 ${filtroAtivo}`}</span>
              <span className="opacity-50">▾</span>
            </button>
            {menuFiltroAberto && (
              <>
                <div className="fixed inset-0 z-[190]" onClick={() => setMenuFiltroAberto(false)} />
                <div className="absolute right-0 top-full mt-2 w-full sm:w-64 bg-[#0b1120]/95 border border-white/10 rounded-xl md:rounded-2xl shadow-2xl z-[200] overflow-y-auto max-h-96 flex flex-col backdrop-blur-2xl animate-in slide-in-from-top-2 duration-200 no-scrollbar">
                  {REGIOES_FILTRO.map(r => (
                    <button key={r} onClick={() => { setFiltroAtivo(r); setMenuFiltroAberto(false); }} className={`px-4 md:px-5 py-3 md:py-3.5 text-left text-[9px] md:text-[10px] font-bold uppercase tracking-wider hover:bg-white/5 border-b border-white/5 last:border-0 transition-colors ${filtroAtivo === r ? 'text-blue-400 bg-blue-500/10' : 'text-slate-300'}`}>{r}</button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {cidadesExibidas.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center text-slate-500 py-32">
            <span className="text-4xl md:text-5xl mb-4 opacity-30">🌍</span>
            <p className="text-xs md:text-sm font-medium tracking-wide">Radar limpo. Nenhum destino encontrado nesta região.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5 max-w-7xl mx-auto">
            {cidadesExibidas.map((cidade) => {
              const horaLocal = getHoraLocalInfo(cidade.clima_bruto?.timezone);
              return (
              <div key={cidade.cidade} onClick={() => { setCidadeSelecionada(cidade); setEstadoRoteiroIA('fechado'); setEstadoMaquinaTempo('fechado'); }} className="bg-[#0b1120]/50 backdrop-blur-xl border border-white/10 p-4 md:p-6 rounded-2xl md:rounded-[2rem] cursor-pointer hover:bg-[#0b1120]/70 hover:border-blue-500/30 transition-all duration-300 group shadow-xl flex flex-col">
                <div className="flex justify-between items-start mb-3 md:mb-6">
                  <div>
                    <span className="text-[7px] md:text-[8px] font-black uppercase text-blue-400/80 tracking-widest">{getContinente(cidade.clima_bruto?.pais)}</span>
                    <h3 className="text-lg md:text-xl font-bold text-white mt-0.5 md:mt-1 drop-shadow-md group-hover:text-blue-300 transition-colors">{cidade.cidade}</h3>
                  </div>
                  <span className={`text-[9px] md:text-[10px] font-mono px-2 md:px-2.5 py-1 rounded-lg border shadow-inner flex items-center gap-1.5 ${horaLocal.isDia ? 'bg-amber-900/30 text-amber-200 border-amber-500/20' : 'bg-blue-900/30 text-blue-200 border-blue-500/20'}`}>
                    <span>{horaLocal.isDia ? '☀️' : '🌙'}</span> {horaLocal.texto}
                  </span>
                </div>
                
                <div className="text-3xl md:text-4xl font-light text-white mb-3 md:mb-6 flex items-center gap-2 md:gap-3 tracking-tighter drop-shadow-lg">
                  {formatarExibicao(cidade.clima_bruto?.temp ?? cidade.temperatura)}° 
                  <span className="text-xl md:text-2xl opacity-90 drop-shadow-md">{getIconeClima(cidade.clima_bruto?.chuva_prob)}</span>
                </div>

                <div className="mt-auto bg-black/30 p-3 md:p-4 rounded-xl md:rounded-2xl border border-white/5 flex items-center justify-between group-hover:border-white/10 transition-colors">
                  <div className="w-full">
                    <div className="flex justify-between items-end mb-1 md:mb-1.5">
                      <span className="block text-[7px] md:text-[8px] uppercase text-slate-500 font-bold tracking-wider">Viabilidade Outdoor</span>
                      <span className="text-[9px] md:text-[10px] font-black uppercase tracking-wider" style={{ color: cidade.turista?.viabilidade_outdoor?.cor || '#22c55e' }}>{cidade.turista?.viabilidade_outdoor?.nivel}</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full rounded-full" style={{ width: cidade.turista?.viabilidade_outdoor?.nivel === 'Alta' ? '100%' : (cidade.turista?.viabilidade_outdoor?.nivel === 'Média' ? '60%' : '25%'), backgroundColor: cidade.turista?.viabilidade_outdoor?.cor || '#22c55e' }} />
                    </div>
                  </div>
                </div>
              </div>
            )})}
          </div>
        )}
      </div>

      {visaoApresentacao === 'mapa' && (
        <div className="fixed bottom-8 right-4 md:bottom-8 md:right-8 z-[1000] animate-in fade-in duration-300">
          <button onClick={() => setMenuCamadasAberto(!menuCamadasAberto)} className="bg-[#0b1120]/90 backdrop-blur-xl border border-white/10 p-3.5 md:p-4 rounded-xl md:rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] flex items-center gap-2 md:gap-3 hover:bg-white/5 transition-all text-slate-300">
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-blue-500">Radar</span>
            <span className="text-xs">{menuCamadasAberto ? '✕' : '▾'}</span>
          </button>
          {menuCamadasAberto && (
            <div className="absolute bottom-full mb-3 right-0 flex flex-col gap-1 md:gap-1.5 bg-[#0b1120]/95 p-2 md:p-3 rounded-xl md:rounded-2xl border border-white/10 backdrop-blur-2xl shadow-2xl w-52 md:w-56 transition-all animate-in slide-in-from-bottom-2 duration-200">
              <span className="text-[7px] md:text-[8px] uppercase tracking-[0.2em] text-slate-500 font-black mb-1 md:mb-2 mt-1 px-2">Camadas Atmosféricas</span>
              <button onClick={() => {setCamadaRadar('precipitation_new'); setMenuCamadasAberto(false);}} className={`px-3 md:px-4 py-2.5 md:py-3 text-[9px] md:text-[10px] uppercase font-bold rounded-lg md:rounded-xl transition-all text-left flex items-center gap-2 md:gap-3 ${camadaRadar === 'precipitation_new' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:bg-white/5'}`}>🌧️ Nuvens & Chuva</button>
              <button onClick={() => {setCamadaRadar('temp_new'); setMenuCamadasAberto(false);}} className={`px-3 md:px-4 py-2.5 md:py-3 text-[9px] md:text-[10px] uppercase font-bold rounded-lg md:rounded-xl transition-all text-left flex items-center gap-2 md:gap-3 ${camadaRadar === 'temp_new' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'text-slate-400 hover:bg-white/5'}`}>🌡️ Calor Global</button>
              <button onClick={() => {setCamadaRadar('nenhuma'); setMenuCamadasAberto(false);}} className={`px-3 md:px-4 py-2.5 md:py-3 text-[9px] md:text-[10px] uppercase font-bold rounded-lg md:rounded-xl transition-all text-left ${camadaRadar === 'nenhuma' ? 'bg-slate-700 text-white shadow-inner' : 'text-slate-400 hover:bg-white/5'}`}>Apenas Fronteiras</button>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL BLINDADO RESPONSIVO ── */}
      {cidadeSelecionada && (
        <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300" onClick={fecharModal}>
          <div className="bg-[#0b1120]/95 backdrop-blur-2xl border-t sm:border border-white/10 w-full max-w-4xl rounded-t-[2.5rem] sm:rounded-[3rem] p-5 md:p-10 pb-20 sm:pb-10 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative h-[92vh] sm:h-auto sm:max-h-[90vh] overflow-y-auto no-scrollbar animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-4 duration-500" onClick={e => e.stopPropagation()}>
            
            <button onClick={fecharModal} className="absolute top-5 right-5 md:top-8 md:right-8 bg-black/30 md:bg-transparent text-slate-400 hover:text-white p-1.5 md:p-0 rounded-full transition-colors z-10 border border-white/5 md:border-transparent">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            
            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-5 mb-8 md:mb-10 pt-1 md:pt-0">
              <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none drop-shadow-md">{cidadeSelecionada.cidade}</h2>
              <span className={`text-[10px] md:text-xs font-mono px-3 md:px-4 py-1.5 md:py-2 rounded-xl border shadow-inner w-fit flex items-center gap-2 ${getHoraLocalInfo(cidadeSelecionada.clima_bruto?.timezone).isDia ? 'bg-amber-900/30 text-amber-200 border-amber-500/20' : 'bg-blue-900/30 text-blue-200 border-blue-500/20'}`}>
                <span>{getHoraLocalInfo(cidadeSelecionada.clima_bruto?.timezone).isDia ? '☀️' : '🌙'}</span> 
                {getHoraLocalInfo(cidadeSelecionada.clima_bruto?.timezone).texto}
              </span>
            </div>
            
            {/* LINHA 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10">
              <div className="bg-black/30 p-5 md:p-6 rounded-3xl border border-white/5 flex flex-col justify-start hover:border-white/10 transition-colors shadow-inner col-span-1 lg:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-xl shadow-inner border border-white/10" style={{ backgroundColor: `${cidadeSelecionada.turista?.viabilidade_outdoor?.cor}20`, color: cidadeSelecionada.turista?.viabilidade_outdoor?.cor }}>
                    {cidadeSelecionada.turista?.viabilidade_outdoor?.nivel === 'Alta' ? 'A' : (cidadeSelecionada.turista?.viabilidade_outdoor?.nivel === 'Média' ? 'M' : 'B')}
                  </div>
                  <div>
                    <span className="font-bold uppercase block tracking-widest text-slate-400 text-[8px] md:text-[10px]">Viabilidade Outdoor</span>
                    <span className="font-black uppercase text-sm md:text-base tracking-wide" style={{ color: cidadeSelecionada.turista?.viabilidade_outdoor?.cor }}>Nível {cidadeSelecionada.turista?.viabilidade_outdoor?.nivel}</span>
                  </div>
                </div>
                <p className="text-slate-300 text-xs md:text-sm leading-relaxed border-l-2 pl-3" style={{ borderColor: `${cidadeSelecionada.turista?.viabilidade_outdoor?.cor}50` }}>
                  {cidadeSelecionada.turista?.viabilidade_outdoor?.descricao}
                </p>
                
                <div className="mt-5 flex flex-wrap gap-2">
                  {cidadeSelecionada.turista?.vibe_tags?.map((tag, idx) => (
                    <span key={idx} className="bg-blue-900/20 text-blue-300 border border-blue-500/20 px-3 py-1.5 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-wider">{tag}</span>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-900/40 to-black/60 p-5 md:p-6 rounded-3xl border border-amber-500/40 relative overflow-hidden flex flex-col justify-between group shadow-[0_0_30px_rgba(245,158,11,0.08)] hover:shadow-[0_0_40px_rgba(245,158,11,0.2)] transition-all h-full">
                <div className="absolute -top-6 -right-6 text-7xl md:text-8xl opacity-5 transform rotate-12 group-hover:scale-110 group-hover:rotate-45 transition-transform duration-700 text-amber-500">✦</div>
                <div>
                  <h4 className="text-sm md:text-base font-black text-amber-400 mb-3 tracking-tight drop-shadow-md leading-snug">
                    {cidadeSelecionada.turista?.local_premium?.nome}
                  </h4>
                  <p className="text-amber-100/80 leading-relaxed font-medium italic text-[11px] md:text-xs">"{cidadeSelecionada.turista?.local_premium?.contexto}"</p>
                </div>
                {!cidadeSelecionada.turista?.local_premium?.nome.includes("✦") && (
                  <a href={getMapsLink(cidadeSelecionada.turista?.local_premium?.nome || '', cidadeSelecionada.cidade)} target="_blank" rel="noopener noreferrer" className="mt-5 bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 text-[9px] md:text-[10px] font-black uppercase tracking-wider px-4 md:px-5 py-2.5 md:py-3 rounded-xl border border-amber-500/30 w-full text-center transition-colors relative z-10 flex items-center justify-center gap-2 shadow-lg">
                    📍 Iniciar Rota
                  </a>
                )}
              </div>
            </div>

            {/* LINHA 2 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <div className="bg-black/30 p-5 md:p-6 rounded-3xl border border-white/5 flex flex-col justify-start hover:border-white/10 transition-colors shadow-inner md:col-span-1">
                <span className="font-bold uppercase block mb-4 tracking-widest text-blue-400 text-[8px] md:text-[10px]">
                  Checklist de Mala
                </span>
                <ul className="space-y-3">
                  {cidadeSelecionada.turista?.vestuario_checklist?.map((item, idx) => (
                    <li key={idx} className="text-slate-300 text-[11px] md:text-xs flex items-start gap-2">
                      <span className="text-blue-500 font-black">✓</span> <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CAIXA HÍBRIDA: GRÁFICO DIÁRIO / MÁQUINA DO TEMPO */}
              <div className="min-h-[16rem] w-full bg-black/40 rounded-3xl p-5 border border-white/5 shadow-inner md:col-span-2 flex flex-col relative overflow-hidden transition-all duration-300">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5 z-10 w-full">
                   <div className="flex flex-col gap-1 w-full sm:w-auto">
                     <p className="text-[8px] md:text-[10px] tracking-[0.3em] text-slate-500 font-bold uppercase">
                       {estadoMaquinaTempo === 'fechado' ? 'Projeção Térmica Diária' : 'Máquina do Tempo'}
                     </p>
                     {estadoMaquinaTempo === 'fechado' && (
                       <span className="text-[9px] md:text-[10px] text-slate-400 font-mono bg-white/5 px-2 md:px-3 py-1.5 rounded-lg border border-white/10 shadow-sm w-fit mt-1 sm:mt-0">
                         Mín {formatarExibicao(cidadeSelecionada.clima_bruto?.temp_min)}° | Máx {formatarExibicao(cidadeSelecionada.clima_bruto?.temp_max)}°
                       </span>
                     )}
                   </div>
                   
                   {estadoMaquinaTempo === 'fechado' ? (
                     <button onClick={() => setEstadoMaquinaTempo('setup')} className="w-full sm:w-auto text-[9px] md:text-[10px] text-amber-500/80 hover:text-amber-400 font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors bg-amber-500/10 px-3 py-2.5 sm:py-1.5 rounded-lg border border-amber-500/20">
                       🔒 Previsão Longo Prazo
                     </button>
                   ) : (
                     <button onClick={() => setEstadoMaquinaTempo('fechado')} className="w-full sm:w-auto text-[9px] md:text-[10px] text-slate-400 hover:text-white font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors bg-white/5 sm:bg-transparent px-3 py-2.5 sm:py-0 rounded-lg">
                       ✕ Voltar ao Hoje
                     </button>
                   )}
                </div>

                {estadoMaquinaTempo === 'fechado' && (
                  <ResponsiveContainer width="100%" height="85%">
                    <LineChart data={historico.map(p => ({ hora: p.time, temp: p[cidadeSelecionada.cidade] !== undefined ? Number(converterValor(p[cidadeSelecionada.cidade]).toFixed(1)) : null })).filter(p => p.temp !== null)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" strokeOpacity={0.05} vertical={false} />
                      <XAxis dataKey="hora" stroke="#475569" fontSize={9} tickMargin={5} axisLine={false} tickLine={false} />
                      <YAxis domain={['auto', 'auto']} stroke="#475569" fontSize={9} width={20} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0b1120', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 15px 30px -5px rgba(0, 0, 0, 0.7)' }} itemStyle={{ color: '#fff' }} />
                      <Line type="monotone" dataKey="temp" stroke={corDestaque} strokeWidth={3} md:strokeWidth={3.5} dot={{ r: 0 }} activeDot={{ r: 5, fill: corDestaque, stroke: '#0b1120', strokeWidth: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}

                {estadoMaquinaTempo === 'setup' && (
                  <div className="flex-1 flex flex-col justify-center animate-in fade-in duration-300">
                    <h4 className="text-white font-bold text-sm mb-4 text-center">Quando você planeja viajar?</h4>
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mb-4">
                      {MESES_ANO.map(mes => (
                        <button key={mes} onClick={() => trocarMes(mes)} className={`py-2 text-[10px] md:text-xs font-bold rounded-lg border transition-all ${mesSelecionado === mes ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-black/30 border-white/10 text-slate-400 hover:border-white/30'}`}>
                          {mes}
                        </button>
                      ))}
                    </div>
                    <button onClick={acionarMaquinaTempo} className="w-full bg-amber-600 hover:bg-amber-500 text-white font-black text-[10px] md:text-xs py-3 rounded-xl uppercase tracking-widest transition-colors shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                      Analisar Dados ↗
                    </button>
                  </div>
                )}

                {estadoMaquinaTempo === 'carregando' && (
                  <div className="flex-1 flex flex-col items-center justify-center animate-pulse">
                    <div className="w-6 h-6 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-3"></div>
                    <p className="text-amber-300/80 font-mono text-[9px] uppercase tracking-widest">Calculando histórico geográfico...</p>
                  </div>
                )}

                {estadoMaquinaTempo === 'pronto' && dossieAtual && (
                  <div className="flex-1 flex flex-col justify-center animate-in slide-in-from-bottom-2 duration-500 relative mt-2">
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                      <div className="bg-black/40 rounded-xl p-3 border border-white/5">
                        <span className="text-[8px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Temperatura Média</span>
                        <div className="flex items-end gap-1">
                          <span className="text-2xl font-light text-white">{dossieAtual.temp}°</span>
                          <span className="text-[10px] text-slate-400 mb-1">Mín {dossieAtual.min}° / Máx {dossieAtual.max}°</span>
                        </div>
                      </div>
                      <div className="bg-black/40 rounded-xl p-3 border border-white/5">
                        <span className="text-[8px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Risco de Precipitação</span>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-light text-white">{dossieAtual.chuva}%</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded text-center ${dossieAtual.chuva > 50 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                            {dossieAtual.chuva > 50 ? 'Alto' : 'Baixo'}
                          </span>
                        </div>
                      </div>
                      <div className="bg-black/40 rounded-xl p-3 border border-white/5 col-span-2 lg:col-span-1">
                        <span className="text-[8px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Fenômeno Histórico</span>
                        <span className={`text-sm font-bold uppercase ${dossieAtual.fenomeno.cor}`}>{dossieAtual.fenomeno.nome}</span>
                      </div>
                    </div>
                    
                    <div className="bg-amber-900/10 border-l-2 border-amber-500 p-3 rounded-r-xl">
                      <span className="text-[8px] text-amber-500 uppercase font-black tracking-widest block mb-1">Veredito do Equinox</span>
                      <p className="text-slate-300 text-[10px] md:text-xs leading-relaxed">{dossieAtual.veredito}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* LINHA 3: ROTEIRO IA COM LINKS FAST-TRACK */}
            <div className="mt-6 md:mt-8 w-full">
              {estadoRoteiroIA === 'fechado' && (
                <button onClick={() => setEstadoRoteiroIA('setup')} className="w-full relative overflow-hidden rounded-3xl p-1 bg-gradient-to-r from-blue-600/40 via-purple-500/40 to-amber-500/40 hover:from-blue-500/60 hover:via-purple-400/60 hover:to-amber-400/60 transition-all duration-500 group shadow-lg">
                  <div className="bg-[#0b1120] w-full h-full rounded-[1.35rem] p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 relative z-10 group-hover:bg-[#0b1120]/80 transition-colors">
                    <div className="text-left w-full sm:w-auto">
                      <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-amber-400 flex items-center gap-2 mb-1.5">
                        <span className="animate-pulse">✦</span> Equinox Premium
                      </span>
                      <h4 className="text-white font-bold text-sm md:text-base">Fadiga de decisão? Deixe a IA montar seu itinerário.</h4>
                    </div>
                    <div className="w-full sm:w-auto shrink-0 bg-white/10 text-white px-5 py-3 md:py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest border border-white/10 flex items-center justify-center gap-2 group-hover:bg-white/20 transition-all">
                      Gerar Roteiro <span>↗</span>
                    </div>
                  </div>
                </button>
              )}

              {estadoRoteiroIA === 'setup' && (
                <div className="w-full bg-[#0f172a] rounded-3xl border border-purple-500/30 p-6 md:p-8 animate-in slide-in-from-top-4 duration-300">
                  <h3 className="text-xl font-black text-white mb-6 tracking-tight">Configure sua Experiência</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
                    <button onClick={() => setPerfilViagem('mochilao')} className={`p-4 rounded-2xl border text-left transition-all ${perfilViagem === 'mochilao' ? 'border-purple-500 bg-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'border-white/10 bg-black/30 hover:border-white/20'}`}>
                      <span className="block text-xl mb-2">🎒</span>
                      <span className={`block font-bold text-sm ${perfilViagem === 'mochilao' ? 'text-purple-300' : 'text-slate-300'}`}>Mochilão Econômico</span>
                      <span className="text-[10px] text-slate-500 mt-1 block">Foco em transporte público, hostels, lado B da cidade e gratuidade.</span>
                    </button>
                    <button onClick={() => setPerfilViagem('equilibrado')} className={`p-4 rounded-2xl border text-left transition-all ${perfilViagem === 'equilibrado' ? 'border-purple-500 bg-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'border-white/10 bg-black/30 hover:border-white/20'}`}>
                      <span className="block text-xl mb-2">⚖️</span>
                      <span className={`block font-bold text-sm ${perfilViagem === 'equilibrado' ? 'text-purple-300' : 'text-slate-300'}`}>Turismo Equilibrado</span>
                      <span className="text-[10px] text-slate-500 mt-1 block">Mistura de atrações clássicas com pausas em cafés confortáveis.</span>
                    </button>
                    <button onClick={() => setPerfilViagem('luxo')} className={`p-4 rounded-2xl border text-left transition-all ${perfilViagem === 'luxo' ? 'border-purple-500 bg-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'border-white/10 bg-black/30 hover:border-white/20'}`}>
                      <span className="block text-xl mb-2">🥂</span>
                      <span className={`block font-bold text-sm ${perfilViagem === 'luxo' ? 'text-purple-300' : 'text-slate-300'}`}>Alto Padrão & Luxo</span>
                      <span className="text-[10px] text-slate-500 mt-1 block">Conforto máximo, locomoção privada e curadoria gastronômica exclusiva.</span>
                    </button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 justify-end">
                    <button onClick={() => setEstadoRoteiroIA('fechado')} className="w-full sm:w-auto px-6 py-3 text-xs font-bold text-slate-400 hover:text-white transition-colors border border-white/5 sm:border-transparent rounded-xl sm:rounded-none">Cancelar</button>
                    <button onClick={acionarIA} className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                      Sintetizar Roteiro
                    </button>
                  </div>
                </div>
              )}

              {estadoRoteiroIA === 'carregando' && (
                <div className="w-full bg-[#0f172a] rounded-3xl border border-purple-500/30 p-12 flex flex-col items-center justify-center animate-in fade-in duration-300">
                  <div className="w-8 h-8 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mb-4"></div>
                  <p className="text-purple-300 font-mono text-xs uppercase tracking-widest animate-pulse text-center">Cruzando dados atmosféricos com perfil selecionado...</p>
                </div>
              )}

              {estadoRoteiroIA === 'pronto' && (
                <div className="w-full bg-gradient-to-b from-[#0f172a] to-black/80 rounded-3xl border border-purple-500/30 p-6 md:p-8 relative overflow-hidden animate-in slide-in-from-bottom-4 duration-500 shadow-[0_0_40px_rgba(168,85,247,0.15)]">
                  <div className="absolute top-0 right-8 bg-purple-600/20 text-purple-300 text-[8px] md:text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-b-lg border-x border-b border-purple-500/30">
                    Premium Liberado (Beta)
                  </div>

                  <div className="mb-8">
                    <span className="text-purple-400 font-black uppercase block mb-2 tracking-widest text-[8px] md:text-[10px] flex items-center gap-2">
                      <span className="animate-pulse">✦</span> Roteiro Adaptativo ({perfilViagem.toUpperCase()})
                    </span>
                    <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">Itinerário Personalizado: {cidadeSelecionada.cidade}</h3>
                  </div>

                  <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 md:before:ml-3.5 before:-translate-x-px md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-purple-500/50 before:to-transparent">
                    <div className="relative pl-8 md:pl-10">
                      <div className="absolute left-0 top-1.5 w-5 h-5 md:w-7 md:h-7 bg-[#0f172a] border-2 border-purple-500 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(168,85,247,0.5)]">
                        <span className="text-[8px] md:text-[10px] font-black text-purple-300">1</span>
                      </div>
                      <h4 className="text-white font-bold text-sm md:text-base mb-1">Imersão Adaptativa (Outdoor)</h4>
                      <p className="text-slate-400 text-xs md:text-sm leading-relaxed mb-3">
                        {perfilViagem === 'mochilao' ? 'Inicie caminhando pelos bairros boêmios e utilize o transporte público local para cruzar as áreas centrais com baixo custo, fugindo das armadilhas para turistas.' : 
                         perfilViagem === 'luxo' ? 'Seu motorista particular o aguarda. Faça um tour guiado exclusivo pelas avenidas de alta costura, finalizando com um brunch reservado em um terraço panorâmico.' : 
                         'Inicie explorando os cartões postais a pé para sentir a cidade, com pausas estratégicas em cafeterias tradicionais para evitar a fadiga térmica.'}
                      </p>
                    </div>

                    <div className="relative pl-8 md:pl-10 opacity-80">
                      <div className="absolute left-0 top-1.5 w-5 h-5 md:w-7 md:h-7 bg-[#0f172a] border-2 border-slate-600 rounded-full flex items-center justify-center">
                        <span className="text-[8px] md:text-[10px] font-black text-slate-400">2</span>
                      </div>
                      <h4 className="text-white font-bold text-sm md:text-base mb-1">Aprofundamento (Indoor)</h4>
                      <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
                        {perfilViagem === 'mochilao' ? 'Aproveite os horários de entrada gratuita nos principais museus públicos e explore as feiras e mercados de rua para interagir com os nativos.' : 
                         perfilViagem === 'luxo' ? 'Tarde reservada para interiorização VIP: acesso sem filas a galerias de arte prestigiadas seguido de relaxamento em um spa 5 estrelas local.' : 
                         'Dia focado em museus de arte e galerias, com uma pausa prolongada em bistrôs para equilibrar o desgaste físico do dia anterior.'}
                      </p>
                    </div>

                    <div className="relative pl-8 md:pl-10 opacity-80">
                      <div className="absolute left-0 top-1.5 w-5 h-5 md:w-7 md:h-7 bg-[#0f172a] border-2 border-slate-600 rounded-full flex items-center justify-center">
                        <span className="text-[8px] md:text-[10px] font-black text-slate-400">3</span>
                      </div>
                      <h4 className="text-white font-bold text-sm md:text-base mb-1">A Experiência Principal</h4>
                      <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
                        {perfilViagem === 'mochilao' ? `Economia e Cultura: Pegue a rota mais acessível até as redondezas do ${cidadeSelecionada.turista?.local_premium?.nome}. Esqueça as reservas caras e busque as "hidden gems" nas ruas adjacentes.` : 
                         perfilViagem === 'luxo' ? `Culmine sua experiência com máxima sofisticação. Sua mesa VIP está garantida no ${cidadeSelecionada.turista?.local_premium?.nome}. Chegue no horário perfeito para desfrutar do ambiente: ${cidadeSelecionada.turista?.local_premium?.contexto}` : 
                         `Siga nossa curadoria premium. Garanta sua reserva com antecedência e culmine sua experiência com gastronomia de alto nível no ${cidadeSelecionada.turista?.local_premium?.nome}.`}
                      </p>
                    </div>
                  </div>

                  {/* ── BARRA FAST-TRACK (LINKS ACIONÁVEIS) ── */}
                  <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap gap-3">
                    <a href={`https://www.skyscanner.com.br/transporte/passagens-aereas/br/${cidadeSelecionada.cidade.toLowerCase()}`} target="_blank" rel="noopener noreferrer" className="bg-sky-600 hover:bg-sky-500 text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-colors">
                      ✈️ Passagens Aéreas
                    </a>
                    <a href={`https://www.booking.com/searchresults.pt-br.html?ss=${cidadeSelecionada.cidade}`} target="_blank" rel="noopener noreferrer" className="bg-blue-800 hover:bg-blue-700 text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-colors">
                      🏨 Hospedagem
                    </a>
                    <a href={`https://www.opentable.com/s?q=${cidadeSelecionada.turista?.local_premium?.nome} ${cidadeSelecionada.cidade}`} target="_blank" rel="noopener noreferrer" className="bg-rose-700 hover:bg-rose-600 text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-colors">
                      🍽️ Reservar Mesa
                    </a>
                  </div>

                  <button onClick={() => setEstadoRoteiroIA('fechado')} className="mt-8 text-slate-500 text-xs uppercase tracking-widest font-bold hover:text-white transition-colors flex items-center gap-2">
                    <span>✕</span> Fechar Roteiro
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}