import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { usePremiumAI } from '../hooks/usePremiumAI.ts';

interface ModalPremiumProps {
  cidadeSelecionada: {
    cidade: string;
    temperatura?: number;
    clima_bruto?: {
      temp?: number;
      temp_min?: number;
      temp_max?: number;
      timezone?: number;
      pais?: string;
    };
    turista?: {
      local_premium?: { nome: string };
    };
  };
  curadoriaAtual: Record<string, unknown> | null;
  fecharModal: () => void;
  t: Record<string, string>;
  abaMobileAtiva: 'panorama' | 'premium';
  setAbaMobileAtiva: (aba: 'panorama' | 'premium') => void;
  estadoMaquinaTempo: 'fechado' | 'setup' | 'carregando' | 'pronto';
  setEstadoMaquinaTempo: (val: string | Function) => void;
  mesSelecionado: string;
  trocarMes: (mes: string) => void;
  acionarMaquinaTempo: () => void;
  formatarExibicao: (temp?: number) => string;
  getHoraLocalInfo: (timezone?: number) => { texto: string; isDia: boolean };
  getContinente: (paisIso?: string) => string;
  dadosGraficoSeguros: { hora: string; temp: number }[];
  MESES_ANO: string[];
  corDestaque: string;
  dossieHistorico: {
    temp: number;
    chuva: number;
    fenomeno: { nome: string; cor: string };
    veredito: string;
  } | null;
}
const handleFecharModal = () => {
    resetarIA();
    fecharModal();
  };

  // NOVO: Dicionário para forçar a busca do Pinterest em inglês e evitar memes
  const mapMesIngles: Record<string, string> = {
    'Jan': 'January', 'Fev': 'February', 'Mar': 'March', 'Abr': 'April',
    'Mai': 'May', 'Jun': 'June', 'Jul': 'July', 'Ago': 'August',
    'Set': 'September', 'Out': 'October', 'Nov': 'November', 'Dez': 'December'
  };

export default function ModalPremium({
  cidadeSelecionada, curadoriaAtual, fecharModal, t,
  abaMobileAtiva, setAbaMobileAtiva,
  estadoMaquinaTempo, setEstadoMaquinaTempo,
  mesSelecionado, trocarMes, acionarMaquinaTempo,
  formatarExibicao, getHoraLocalInfo, getContinente,
  dadosGraficoSeguros, MESES_ANO, corDestaque,
  dossieHistorico
}: ModalPremiumProps) {

  const {
    estadoRoteiroIA,
    perfilViagem,
    setPerfilViagem,
    dossieAtual,
    gerarDossiePremium,
    resetarIA,
    estadoVibe,          // <-- NOVO
    vibeFotografica,     // <-- NOVO
    gerarVibeHistoricaIA,// <-- NOVO
    resetarVibe          // <-- NOVO
  } = usePremiumAI();

  if (!cidadeSelecionada || !curadoriaAtual) return null;

  const handleGerarGuia = () => {
    gerarDossiePremium(
      cidadeSelecionada.cidade, 
      cidadeSelecionada.clima_bruto?.pais || 'Desconhecido', 
      cidadeSelecionada.clima_bruto?.temp ?? cidadeSelecionada.temperatura ?? 20
    );
  };

  const handleFecharModal = () => {
    resetarIA();
    fecharModal();
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-3 md:p-8 animate-in fade-in duration-300">
      
      <div className="absolute inset-0 z-0 bg-black/10 backdrop-blur-sm" onClick={handleFecharModal} />

            {/* CONTROLES GLOBAIS */}
            {/* Botão Fechar (Desktop e Mobile - Canto Superior Direito) */}
            <div className="absolute top-4 right-4 md:top-6 md:right-6 z-[6000] pointer-events-none">
              <button 
                onClick={handleFecharModal}
                className="pointer-events-auto w-10 h-10 md:w-12 md:h-12 bg-[#0f172a]/60 backdrop-blur-xl border border-white/10 hover:border-white/30 rounded-full flex items-center justify-center shadow-2xl text-slate-400 hover:text-white transition-all group hover:bg-white/10"
              >
                <span className="text-lg md:text-xl font-light leading-none group-hover:scale-110 transition-transform">✕</span> 
              </button>
            </div>

            {/* Seletor de Abas (Apenas Mobile - Centralizado) */}
            <div className="pointer-events-auto md:hidden inline-flex bg-black/60 backdrop-blur-md rounded-full p-1 border border-white/10 shadow-xl fixed top-4 left-1/2 -translate-x-1/2 z-[6000]">
                <button type="button" onClick={() => setAbaMobileAtiva('panorama')} className={`px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${abaMobileAtiva === 'panorama' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}>
                  {t.panorama}
                </button>
                <button type="button" onClick={() => setAbaMobileAtiva('premium')} className={`px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${abaMobileAtiva === 'premium' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400'}`}>
                  {t.premium}
                </button>
            </div>

      <div className="w-full max-w-7xl h-full max-h-[96vh] md:max-h-[90vh] flex flex-col lg:flex-row gap-6 md:gap-8 pt-20 md:pt-0 relative z-10 pointer-events-none">
        
        {/* COLUNA ESQUERDA: PANORAMA */}
        <div className={`pointer-events-auto ${abaMobileAtiva === 'panorama' ? 'flex' : 'hidden'} md:flex flex-1 bg-[#0f172a]/90 border border-white/10 rounded-[2.5rem] p-6 md:p-10 flex-col overflow-y-auto no-scrollbar shadow-2xl relative overflow-hidden transform transition-all duration-500 ease-out origin-bottom`}>
            
            <div className="flex justify-between items-start mb-8 border-b border-white/5 pb-8 relative z-10">
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

            <div className="space-y-6 pb-20 md:pb-0">
              {/* IA SETUP */}
              {(estadoRoteiroIA === 'fechado' || estadoRoteiroIA === 'setup') && (
                <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-5 shadow-inner">
                  <h4 className="text-slate-300 text-[10px] font-black uppercase tracking-widest mb-4 text-center">1. Perfil de IA</h4>
                  <div className="grid grid-cols-3 gap-2 md:gap-3 mb-5">
                    <button onClick={() => setPerfilViagem('mochilao')} className={`py-3.5 rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all backdrop-blur-md border ${perfilViagem === 'mochilao' ? 'bg-blue-500/20 border-blue-500/50 text-blue-300 shadow-lg' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'}`}>🎒 Mochilão</button>
                    <button onClick={() => setPerfilViagem('equilibrado')} className={`py-3.5 rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all backdrop-blur-md border ${perfilViagem === 'equilibrado' ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-lg' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'}`}>⚖️ Híbrido</button>
                    <button onClick={() => setPerfilViagem('luxo')} className={`py-3.5 rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all backdrop-blur-md border ${perfilViagem === 'luxo' ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-lg' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'}`}>🥂 Luxo</button>
                  </div>
                  <button type="button" onClick={handleGerarGuia} className="w-full py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 group">
                    <span className="text-purple-400 group-hover:animate-pulse">✨</span> 2. Consultoria de Itinerário IA
                  </button>
                </div>
              )}

              {estadoRoteiroIA === 'carregando' && (
                <div className="bg-white/[0.02] border border-blue-500/20 rounded-3xl p-8 shadow-inner flex flex-col items-center justify-center min-h-[200px] animate-in zoom-in-95 duration-300">
                  <div className="relative w-12 h-12 mb-5">
                    <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-blue-400 rounded-full border-t-transparent animate-spin"></div>
                  </div>
                  <h4 className="text-blue-400 text-[11px] font-black uppercase tracking-widest animate-pulse mb-1">Decodificando {cidadeSelecionada.cidade}</h4>
                  <p className="text-slate-400 text-[10px] uppercase tracking-wider font-mono">Matriz: Perfil {perfilViagem}</p>
                </div>
              )}

              {estadoRoteiroIA === 'pronto' && dossieAtual && (
                <div className="bg-white/[0.02] border border-purple-500/20 rounded-3xl p-6 shadow-inner space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div>
                    <h4 className="text-blue-400 text-[10px] font-bold uppercase tracking-wider mb-2">Vibe Local</h4>
                    <p className="text-slate-200 text-sm italic leading-relaxed">"{dossieAtual.vibe_local}"</p>
                  </div>

                  <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                  {/* RADAR DE CUSTO */}
                  {dossieAtual.custos && (
                    <div className="animate-in fade-in duration-500">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-blue-400 text-[10px] font-bold uppercase tracking-wider">Radar de Custo (Moeda Local)</h4>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border shadow-sm ${
                          dossieAtual.custos.nivel === 'Baixo' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                          dossieAtual.custos.nivel === 'Moderado' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                          'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}>
                          Nível: {dossieAtual.custos.nivel}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-black/30 border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-inner hover:bg-white/5 transition-colors">
                          <span className="text-lg mb-1">☕</span>
                          <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Café</span>
                          <span className="text-[11px] font-mono text-white font-bold">{dossieAtual.custos.cafe}</span>
                        </div>
                        <div className="bg-black/30 border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-inner hover:bg-white/5 transition-colors">
                          <span className="text-lg mb-1">🍽️</span>
                          <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Refeição</span>
                          <span className="text-[11px] font-mono text-white font-bold">{dossieAtual.custos.refeicao}</span>
                        </div>
                        <div className="bg-black/30 border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-inner hover:bg-white/5 transition-colors">
                          <span className="text-lg mb-1">🚕</span>
                          <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Trajeto</span>
                          <span className="text-[11px] font-mono text-white font-bold">{dossieAtual.custos.transporte}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                  <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-5"></div>

                  <div className="shrink-0 animate-in fade-in duration-500 delay-150">
                    <h4 className="text-purple-400 text-[10px] font-bold uppercase tracking-wider mb-3">O Segredo Premium</h4>
                    <div className="space-y-2">
                      {dossieAtual.segredo_premium?.map((dica: string, idx: number) => (
                        <p key={idx} className="text-slate-200 text-[13px] leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5 shadow-sm">{dica}</p>
                      ))}
                    </div>
                  </div>

                  <div className="shrink-0 animate-in fade-in duration-500 delay-200">
                    <h4 className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider mb-3">Dress Code Local</h4>
                    <div className="flex flex-col gap-2">
                      {dossieAtual.vestuario_sugerido?.map((roupa: string, idx: number) => (
                        <div key={idx} className="text-slate-300 text-[13px] flex items-center gap-3 bg-white/5 px-4 py-3 rounded-xl border border-white/5 shadow-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></div>
                          <span className="leading-snug">{roupa}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="shrink-0 animate-in fade-in duration-500 delay-300">
                    <h4 className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider mb-3">Na Mala (Indispensável)</h4>
                    <div className="flex flex-wrap gap-2">
                      {dossieAtual.itens_indispensaveis?.map((item: string, i: number) => (
                        <span key={i} className="bg-black/40 border border-white/10 text-slate-300 text-[11px] px-4 py-1.5 rounded-full shadow-sm">{item}</span>
                      ))}
                    </div>
                  </div>

                  <button onClick={resetarIA} className="w-full mt-4 py-3 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 text-[10px] font-bold uppercase tracking-widest rounded-2xl transition-all">Ocultar Guia Inteligente</button>
                </div>
              )}

              {/* GRÁFICO */}
              <div className="bg-white/[0.02] rounded-3xl p-6 border border-white/5 shadow-inner">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 block mb-6">{t.previsaoHora}</span>
                <div className="w-full h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart margin={{ top: 20, right: 10, left: -20, bottom: 0 }} data={dadosGraficoSeguros}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" strokeOpacity={0.03} vertical={false} />
                      <XAxis dataKey="hora" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                      <YAxis domain={['auto', 'auto']} stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(tick) => `${tick}°`} />
                      <Tooltip contentStyle={{ backgroundColor: '#0b1120', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} />
                      <Line type="monotone" dataKey="temp" stroke={corDestaque} strokeWidth={3} dot={{ r: 4, fill: '#0b1120', stroke: corDestaque, strokeWidth: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
        </div>

        {/* COLUNA DIREITA: PREMIUM */}
        <div className={`pointer-events-auto ${abaMobileAtiva === 'premium' ? 'flex' : 'hidden'} md:flex flex-1 bg-gradient-to-b from-[#1a1c2e] to-[#0b1120] border border-purple-500/20 rounded-[2.5rem] p-6 md:p-10 flex-col overflow-y-auto no-scrollbar shadow-2xl relative pb-24 md:pb-10`}>
          
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg w-fit mb-8">
            <span className="animate-pulse text-amber-400">✦</span> {t.premiumModo}
          </div>

                    {/* HOTSPOT */}
          <div className="min-h-[160px] shrink-0 bg-gradient-to-br from-amber-900/20 to-black/50 p-8 rounded-[2rem] border border-amber-500/20 relative overflow-hidden group mb-6 shadow-lg">
            {estadoRoteiroIA === 'pronto' && dossieAtual?.hotspot ? (
              <div className="animate-in fade-in duration-500 relative z-10">
                <h3 className="text-amber-400 font-black italic text-lg uppercase tracking-wider mb-2">📍 {dossieAtual.hotspot.nome}</h3>
                <p className="text-slate-300 text-sm italic leading-relaxed">"{dossieAtual.hotspot.descricao}"</p>
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dossieAtual.hotspot.nome + ' ' + cidadeSelecionada.cidade)}`} target="_blank" rel="noopener noreferrer" className="w-full mt-5 block text-center py-3.5 border border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-black font-black text-[10px] uppercase tracking-widest rounded-xl transition-all">Localização</a>
              </div>
            ) : (
              <div className="opacity-50 relative z-10 text-center py-4">
                <h3 className="text-amber-400 font-black text-lg uppercase tracking-wider mb-2">HOTSPOT OCULTO</h3>
                <p className="text-slate-300 text-sm italic leading-relaxed">Ative o Premium para revelar recomendações exclusivas.</p>
              </div>
            )}
          </div>

          {/* RADAR DE EVENTOS (NA CIDADE AGORA) */}
          {estadoRoteiroIA === 'pronto' && dossieAtual?.evento_sazonal && (
            <div className="bg-gradient-to-r from-blue-900/10 to-transparent border border-blue-500/20 rounded-[2rem] p-6 md:p-8 mb-6 shadow-inner animate-in fade-in slide-in-from-right-4 duration-500 delay-100">
              <div className="flex items-center justify-between mb-5">
                <h4 className="text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  Na Cidade Agora
                </h4>
              </div>
              <div className="flex items-start gap-4 md:gap-5">
                <div className="text-4xl md:text-5xl drop-shadow-lg shrink-0 transform hover:scale-110 transition-transform cursor-default">
                  {dossieAtual.evento_sazonal.icone}
                </div>
                <div>
                  <h3 className="text-white font-bold text-base uppercase tracking-tight mb-1">{dossieAtual.evento_sazonal.nome}</h3>
                  <p className="text-slate-300 text-[13px] leading-relaxed italic">"{dossieAtual.evento_sazonal.vibe}"</p>
                </div>
              </div>
            </div>
          )}

          {/* MONITOR DE BUROCRACIA (NOVO) */}
          {estadoRoteiroIA === 'pronto' && dossieAtual?.burocracia && (
            <div className="bg-black/30 border border-white/5 rounded-[2rem] p-6 md:p-8 mb-6 shadow-inner animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-slate-300 text-[10px] font-black uppercase tracking-[0.2em]">Monitor de Burocracia (Passaporte BR)</h4>
                <span className="text-white opacity-40">🛂</span>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">🛡️</div>
                  <div>
                    <span className="text-[8px] uppercase text-blue-400 font-black tracking-widest block mb-1">Visto & Fronteira</span>
                    <p className="text-white text-[13px] leading-snug">{dossieAtual.burocracia.visto_fronteira}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">🏥</div>
                  <div>
                    <span className="text-[8px] uppercase text-emerald-400 font-black tracking-widest block mb-1">Saúde & Vacinas</span>
                    <p className="text-white text-[13px] leading-snug">{dossieAtual.burocracia.saude_vacinas}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0 border border-rose-500/20">⚖️</div>
                  <div>
                    <span className="text-[8px] uppercase text-rose-400 font-black tracking-widest block mb-1">Alerta Legal</span>
                    <p className="text-white text-[13px] leading-snug">{dossieAtual.burocracia.alerta_legal}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20">🔌</div>
                  <div>
                    <span className="text-[8px] uppercase text-amber-400 font-black tracking-widest block mb-1">Setup Logístico</span>
                    <p className="text-white text-[13px] leading-snug">{dossieAtual.burocracia.setup_logistico}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MÁQUINA DO TEMPO */}
          <div className="bg-black/40 border border-white/5 rounded-[2rem] overflow-hidden shadow-inner transition-all duration-300 shrink-0">
             <button type="button" onClick={() => setEstadoMaquinaTempo((prev: any) => prev === 'fechado' ? 'setup' : 'fechado')} className="w-full p-6 md:p-8 hover:bg-amber-900/10 transition-all flex items-center justify-between group">
                <div className="text-left">
                  <span className="text-amber-500 text-[8px] md:text-[9px] font-black uppercase tracking-widest block mb-1.5">Dados Históricos</span>
                  <span className="text-white text-sm md:text-base font-bold uppercase group-hover:text-amber-400 transition-colors">{t.previsaoSazonal}</span>
                </div>
                <span className={`bg-white/5 p-4 rounded-2xl text-white transition-transform duration-300 ${estadoMaquinaTempo !== 'fechado' ? 'rotate-90' : ''}`}>⏳</span>
             </button>
             
             {estadoMaquinaTempo !== 'fechado' && (
               <div className="p-6 md:p-8 border-t border-white/5 bg-black/20 animate-in slide-in-from-top-2">
                  {estadoMaquinaTempo === 'setup' && (
                    <>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-6">
                        {MESES_ANO.map(mes => (
                          <button type="button" key={mes} onClick={() => trocarMes(mes)} className={`py-3 text-[10px] font-bold rounded-xl border transition-all ${mesSelecionado === mes ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-black/30 border-white/10 text-slate-400 hover:border-white/30 hover:text-white'}`}>{mes}</button>
                        ))}
                      </div>
                      <button 
                        onClick={() => {
                          acionarMaquinaTempo();
                          gerarVibeHistoricaIA(cidadeSelecionada.cidade, mesSelecionado);
                        }} 
                        className="w-full bg-amber-600 hover:bg-amber-500 text-white font-black text-[10px] py-4 rounded-xl uppercase tracking-widest transition-all shadow-md"
                      >
                        {t.analisarMes}
                      </button>                    </>
                  )}
                  {estadoMaquinaTempo === 'pronto' && dossieHistorico && (
                    <div className="animate-in fade-in">
                      <div className="bg-black/30 p-5 rounded-2xl mb-5 shadow-inner">
                        <div className="flex justify-between items-center mb-5 border-b border-white/5 pb-4">
                          <div><span className="text-[8px] text-slate-500 uppercase font-black tracking-widest block mb-1">Temp Média</span><span className="text-3xl text-white font-light">{dossieHistorico.temp}°</span></div>
                          <div className="text-right"><span className="text-[8px] text-slate-500 uppercase font-black tracking-widest block mb-1">Chuva</span><span className={`text-xl font-black px-2 py-0.5 rounded-lg ${dossieHistorico.chuva > 50 ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>{dossieHistorico.chuva}%</span></div>
                        </div>
                        <p className="text-slate-400 text-[11px] leading-relaxed italic">{dossieHistorico.veredito}</p>
                        
                        {estadoVibe === 'carregando' && (
                          <div className="mt-4 pt-4 border-t border-white/5 text-center">
                            <span className="text-amber-500/50 italic text-[10px] animate-pulse">Revelando fotografias da época...</span>
                          </div>
                        )}
                        {estadoVibe === 'pronto' && vibeFotografica && (
                          <div className="mt-4 pt-4 border-t border-amber-500/10 relative flex flex-col items-center">
                            <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#0b1120] px-3 text-[8px] text-amber-500/70 uppercase tracking-widest font-black rounded-full border border-amber-500/10">Cinematografia</span>
                            <p className="text-amber-100/90 text-[13px] leading-relaxed italic text-center pt-3 mb-4">"{vibeFotografica}"</p>
                            
                            <a 
                              href={`https://br.pinterest.com/search/pins/?q=${encodeURIComponent(cidadeSelecionada.cidade + ' ' + (mapMesIngles[mesSelecionado] || mesSelecionado) + ' aesthetic photography')}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-full text-[9px] text-amber-400 hover:text-amber-300 uppercase font-black tracking-widest transition-colors shadow-sm"
                            >
                              <span>📸</span> Moodboard Visual
                            </a>
                          </div>
                        )}
                      </div>
                      
                      {/* NOVO: UX Resolvida com dupla opção de navegação */}
                      <div className="flex gap-2 w-full">
                        <button 
                          onClick={() => {
                            setEstadoMaquinaTempo('setup');
                            resetarVibe();
                          }} 
                          className="flex-1 text-slate-400 hover:text-white text-[9px] font-bold uppercase tracking-widest py-3.5 rounded-xl border border-white/5 hover:bg-white/5 transition-colors"
                        >
                          Escolher Outro Mês
                        </button>
                        <button 
                          onClick={() => {
                            setEstadoMaquinaTempo('fechado');
                            resetarVibe();
                          }} 
                          className="flex-1 text-slate-400 hover:text-white text-[9px] font-bold uppercase tracking-widest py-3.5 rounded-xl border border-white/5 hover:bg-white/5 transition-colors"
                        >
                          Fechar Histórico
                        </button>
                      </div>

                    </div>
                  )}
               </div>
             )}
          </div>

          {/* FAST TRACK LINKS */}
          <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-2 lg:grid-cols-3 gap-3 shrink-0">
             <a href={`https://www.skyscanner.com.br/transporte/passagens-aereas/br/${cidadeSelecionada.cidade.toLowerCase()}`} target="_blank" rel="noopener noreferrer" className="bg-white/5 hover:bg-white/10 text-white px-3 py-4 rounded-xl text-[9px] font-black uppercase tracking-widest text-center border border-white/10 transition-colors">{t.voos}</a>
             <a href={`https://www.booking.com/searchresults.pt-br.html?ss=${cidadeSelecionada.cidade}`} target="_blank" rel="noopener noreferrer" className="bg-white/5 hover:bg-white/10 text-white px-3 py-4 rounded-xl text-[9px] font-black uppercase tracking-widest text-center border border-white/10 transition-colors">{t.hoteis}</a>
             <a href={`https://www.opentable.com/s?q=${cidadeSelecionada.turista?.local_premium?.nome} ${cidadeSelecionada.cidade}`} target="_blank" rel="noopener noreferrer" className="bg-white/5 hover:bg-white/10 text-white px-3 py-4 rounded-xl text-[9px] font-black uppercase tracking-widest text-center border border-white/10 transition-colors col-span-2 lg:col-span-1">{t.mesa}</a>
          </div>

        </div>
      </div>
    </div>
  );
}