import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { usePremiumAI } from '../hooks/usePremiumAI.ts'; // <-- Ajustado para a exigência do Deno

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

export default function ModalPremium({
  cidadeSelecionada, curadoriaAtual, fecharModal, t,
  abaMobileAtiva, setAbaMobileAtiva,
  estadoMaquinaTempo, setEstadoMaquinaTempo,
  mesSelecionado, trocarMes, acionarMaquinaTempo,
  formatarExibicao, getHoraLocalInfo, getContinente,
  dadosGraficoSeguros, MESES_ANO, corDestaque,
  dossieHistorico
}: ModalPremiumProps) {

  // Instanciando o Cérebro da IA
  const {
    estadoRoteiroIA,
    perfilViagem,
    setPerfilViagem,
    dossieAtual,
    gerarDossiePremium,
    resetarIA
  } = usePremiumAI();

  if (!cidadeSelecionada || !curadoriaAtual) return null;

  // Encapsulando a chamada da API
  const handleGerarGuia = () => {
    gerarDossiePremium(
      cidadeSelecionada.cidade, 
      cidadeSelecionada.clima_bruto?.pais || 'Desconhecido', 
      cidadeSelecionada.clima_bruto?.temp ?? cidadeSelecionada.temperatura ?? 20
    );
  };

  // Limpa a IA e fecha o modal simultaneamente
  const handleFecharModal = () => {
    resetarIA();
    fecharModal();
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-3 md:p-8 animate-in fade-in duration-300">
      
      {/* 1. OVERLAY INVISÍVEL */}
      <div className="absolute inset-0 z-0 bg-black/10 backdrop-blur-sm" onClick={handleFecharModal} />

      {/* 2. CONTROLES GLOBAIS DO MODAL */}
      <div className="absolute top-4 right-4 md:top-8 md:right-8 z-[6000] flex flex-col items-end gap-4 pointer-events-none">
        
        <button 
          onClick={handleFecharModal}
          className="pointer-events-auto px-4 py-3 md:px-6 md:py-4 bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 hover:border-red-500/50 rounded-full flex items-center gap-3 shadow-2xl text-white transition-all group hover:bg-red-500/10"
        >
          <span className="text-red-500 text-xl leading-none group-hover:scale-110 transition-transform">✕</span> 
          <span className="hidden md:block font-black text-[10px] md:text-xs tracking-widest uppercase">{t.fecharPainel}</span>
        </button>

        <div className="pointer-events-auto md:hidden inline-flex bg-black/60 backdrop-blur-md rounded-full p-1 border border-white/10 shadow-xl fixed top-4 left-1/2 -translate-x-1/2">
           <button type="button" onClick={() => setAbaMobileAtiva('panorama')} className={`px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${abaMobileAtiva === 'panorama' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}>
             {t.panorama}
           </button>
           <button type="button" onClick={() => setAbaMobileAtiva('premium')} className={`px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${abaMobileAtiva === 'premium' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400'}`}>
             {t.premium}
           </button>
        </div>
      </div>

      {/* 3. O CONTEÚDO REAL DO MODAL */}
      <div className="w-full max-w-7xl h-full max-h-[96vh] md:max-h-[90vh] flex flex-col lg:flex-row gap-6 md:gap-8 pt-20 md:pt-0 relative z-10 pointer-events-none">
        
        {/* CARD 1: RELATÓRIO TÉCNICO E CLIMÁTICO */}
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
              
              {/* SETUP DA IA */}
              {(estadoRoteiroIA === 'fechado' || estadoRoteiroIA === 'setup') && (
                <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-5 shadow-inner">
                  <h4 className="text-slate-300 text-[10px] font-black uppercase tracking-widest mb-4 text-center">1. Selecione o Perfil de IA</h4>
                  
                  <div className="grid grid-cols-3 gap-2 md:gap-3 mb-5">
                    <button onClick={() => setPerfilViagem('mochilao')} className={`py-3.5 rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all backdrop-blur-md border ${perfilViagem === 'mochilao' ? 'bg-blue-500/20 border-blue-500/50 text-blue-300 shadow-lg' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'}`}>🎒 Mochilão</button>
                    <button onClick={() => setPerfilViagem('equilibrado')} className={`py-3.5 rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all backdrop-blur-md border ${perfilViagem === 'equilibrado' ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-lg' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'}`}>⚖️ Híbrido</button>
                    <button onClick={() => setPerfilViagem('luxo')} className={`py-3.5 rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all backdrop-blur-md border ${perfilViagem === 'luxo' ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-lg' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'}`}>🥂 Luxo</button>
                  </div>

                  <button type="button" onClick={handleGerarGuia} className="w-full py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-[0_0_15px_rgba(255,255,255,0.05)] transition-all flex items-center justify-center gap-2 group">
                    <span className="text-purple-400 group-hover:animate-pulse">✨</span> 2. Consultoria de Itinerário IA
                  </button>
                </div>
              )}

              {/* TRATAMENTO DE ERRO DA IA */}
              {estadoRoteiroIA === 'erro' && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-3xl p-6 text-center animate-in zoom-in-95 duration-300 shadow-inner">
                  <span className="text-3xl mb-3 block animate-bounce">⚠️</span>
                  <h4 className="text-red-400 text-[11px] font-black uppercase tracking-widest mb-2">Sistemas Sobrecarregados</h4>
                  <p className="text-slate-300 text-[10px] md:text-xs leading-relaxed mb-5">
                    Nossos servidores estão mapeando muitos destinos agora. Aguarde uns instantes e tente novamente.
                  </p>
                  <button onClick={resetarIA} className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm">
                    Reiniciar Consulta
                  </button>
                </div>
              )}

              {/* CARREGAMENTO DA IA */}
              {estadoRoteiroIA === 'carregando' && (
                <div className="bg-white/[0.02] border border-blue-500/20 rounded-3xl p-8 shadow-inner flex flex-col items-center justify-center min-h-[200px] animate-in zoom-in-95 duration-300">
                  <div className="relative w-12 h-12 mb-5">
                    <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-blue-400 rounded-full border-t-transparent animate-spin"></div>
                    <div className="absolute inset-2 bg-blue-500/20 rounded-full animate-pulse"></div>
                  </div>
                  <h4 className="text-blue-400 text-[11px] font-black uppercase tracking-widest animate-pulse mb-1">
                    Decodificando {cidadeSelecionada.cidade}
                  </h4>
                  <p className="text-slate-400 text-[10px] uppercase tracking-wider font-mono">Matriz: Perfil {perfilViagem}</p>
                </div>
              )}

              {/* RESULTADO DA IA */}
              {estadoRoteiroIA === 'pronto' && dossieAtual && (
                <div className="bg-white/[0.02] border border-purple-500/20 rounded-3xl backdrop-blur-sm p-6 shadow-inner space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  
                  {/* VIBE LOCAL */}
                  <div>
                    <h4 className="text-blue-400 text-[10px] font-bold uppercase tracking-wider mb-2">Vibe Local</h4>
                    <p className="text-slate-200 text-sm italic leading-relaxed">"{dossieAtual.vibe_local}"</p>
                  </div>
                  
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                  
                  {/* NOVO: RADAR DE CUSTO FINANCEIRO */}
                  {dossieAtual.custos && (
                    <div className="animate-in fade-in duration-500">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-blue-400 text-[10px] font-bold uppercase tracking-wider">Radar de Custo (USD)</h4>
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
                          <span className="text-lg mb-1 drop-shadow-md">☕</span>
                          <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Café</span>
                          <span className="text-[11px] font-mono text-emerald-300 font-bold">{dossieAtual.custos.cafe}</span>
                        </div>
                        <div className="bg-black/30 border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-inner hover:bg-white/5 transition-colors">
                          <span className="text-lg mb-1 drop-shadow-md">🍽️</span>
                          <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Refeição</span>
                          <span className="text-[11px] font-mono text-emerald-300 font-bold">{dossieAtual.custos.refeicao}</span>
                        </div>
                        <div className="bg-black/30 border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-inner hover:bg-white/5 transition-colors">
                          <span className="text-lg mb-1 drop-shadow-md">🚕</span>
                          <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Trajeto</span>
                          <span className="text-[11px] font-mono text-emerald-300 font-bold">{dossieAtual.custos.transporte}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                  <div>
                    <h4 className="text-purple-400 text-[10px] font-bold uppercase tracking-wider mb-3">O Segredo Premium</h4>
                    <div className="space-y-2">{dossieAtual.segredo_premium?.map((dica: string, idx: number) => (<p key={idx} className="text-slate-200 text-[13px] leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5 shadow-sm">{dica}</p>))}</div>
                  </div>
                  <div>
                    <h4 className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider mb-3">Dress Code Local</h4>
                    <div className="flex flex-col gap-2">{dossieAtual.vestuario_sugerido?.map((roupa: string, idx: number) => (<div key={idx} className="text-slate-300 text-[13px] flex items-center gap-3 bg-white/5 px-4 py-3 rounded-xl border border-white/5 shadow-sm"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></div><span className="leading-snug">{roupa}</span></div>))}</div>
                  </div>
                  <div>
                    <h4 className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider mb-3">Na Mala (Indispensável)</h4>
                    <div className="flex flex-wrap gap-2">{dossieAtual.itens_indispensaveis?.map((item: string, i: number) => (<span key={i} className="bg-black/40 border border-white/10 text-slate-300 text-[11px] px-4 py-1.5 rounded-full shadow-sm">{item}</span>))}</div>
                  </div>
                  <button onClick={resetarIA} className="w-full mt-4 py-3.5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 text-[10px] font-bold uppercase tracking-widest rounded-2xl transition-all shadow-sm">
                    Ocultar Guia Inteligente
                  </button>
                </div>
              )}

              {/* GRÁFICO HISTÓRICO */}
              <div className="bg-white/[0.02] rounded-3xl p-6 border border-white/5 flex flex-col shadow-inner">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">{t.previsaoHora}</span>
                  <span className="text-[9px] text-slate-300 font-mono bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 shadow-sm">
                    Min {formatarExibicao(cidadeSelecionada.clima_bruto?.temp_min)}° | Max {formatarExibicao(cidadeSelecionada.clima_bruto?.temp_max)}°
                  </span>
                </div>
                <div className="w-full h-[180px] mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart margin={{ top: 20, right: 10, left: -20, bottom: 0 }} data={dadosGraficoSeguros}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" strokeOpacity={0.03} vertical={false} />
                      <XAxis dataKey="hora" stroke="#94a3b8" fontSize={10} tickMargin={10} axisLine={false} tickLine={false} />
                      <YAxis domain={['auto', 'auto']} stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(tick) => `${tick}°`} />
                      <Tooltip contentStyle={{ backgroundColor: '#0b1120', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} itemStyle={{ color: '#fff' }} formatter={(value: any) => [`${value}°`, 'Temperatura']} labelStyle={{ color: '#94a3b8', marginBottom: '4px' }} />
                      <Line isAnimationActive={true} type="monotone" dataKey="temp" stroke={corDestaque} strokeWidth={3} dot={{ r: 4, fill: '#0b1120', stroke: corDestaque, strokeWidth: 2 }} activeDot={{ r: 7, fill: corDestaque, stroke: '#0b1120', strokeWidth: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
        </div>

        {/* CARD 2: FERRAMENTAS PREMIUM E ACIONÁVEIS */}
        <div className={`pointer-events-auto ${abaMobileAtiva === 'premium' ? 'flex' : 'hidden'} md:flex flex-1 bg-gradient-to-b from-[#1a1c2e] to-[#0b1120] border border-purple-500/20 rounded-[2.5rem] p-6 md:p-10 flex-col overflow-y-auto no-scrollbar shadow-2xl relative pb-24 md:pb-10`}>
          
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg w-fit mb-8 shadow-md">
            <span className="animate-pulse text-amber-400">✦</span> {t.premiumModo}
          </div>

          {/* HOTSPOT */}
          <div className="min-h-[180px] shrink-0 bg-gradient-to-br from-amber-900/20 to-black/50 p-8 rounded-[2rem] border border-amber-500/20 relative overflow-hidden group mb-6 shadow-lg">
            <div className="absolute -top-6 -right-6 text-7xl md:text-8xl opacity-5 transform rotate-12 group-hover:scale-110 group-hover:rotate-45 transition-transform duration-700">✦</div>
            {estadoRoteiroIA === 'pronto' && dossieAtual?.hotspot ? (
              <div className="animate-in fade-in duration-500 relative z-10">
                <h3 className="text-amber-400 font-black italic text-lg uppercase tracking-wider mb-2 flex items-center gap-2">📍 {dossieAtual.hotspot.nome}</h3>
                <p className="text-slate-300 text-sm leading-relaxed italic">"{dossieAtual.hotspot.descricao}"</p>
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dossieAtual.hotspot.nome + ' ' + cidadeSelecionada.cidade)}`} target="_blank" rel="noopener noreferrer" className="w-full mt-5 block text-center py-3.5 border border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-black font-black text-[10px] uppercase tracking-widest rounded-xl transition-all">Visualizar Localização</a>
              </div>
            ) : (
              <div className="opacity-50 relative z-10">
                <h3 className="text-amber-400 font-black italic text-lg uppercase tracking-wider mb-2 flex items-center gap-2">HOTSPOT OCULTO</h3>
                <p className="text-slate-300 text-sm leading-relaxed italic">"Ative a Consultoria de Itinerário IA para revelar a principal recomendação para {cidadeSelecionada.cidade}."</p>
              </div>
            )}
          </div>

          {/* MÁQUINA DO TEMPO */}
          <div className="space-y-4 mb-auto flex flex-col shrink-0">
             <div className="bg-black/40 border border-white/5 rounded-[2rem] overflow-hidden shadow-inner transition-all duration-300">
               <button type="button" onClick={() => setEstadoMaquinaTempo((prev: any) => prev === 'fechado' ? 'setup' : 'fechado')} className="w-full p-6 md:p-8 hover:bg-amber-900/10 transition-all flex items-center justify-between group">
                  <div className="text-left">
                    <span className="text-amber-500 text-[8px] md:text-[9px] font-black uppercase tracking-widest block mb-1.5">Dados Históricos</span>
                    <span className="text-white text-sm md:text-base font-bold uppercase tracking-tight group-hover:text-amber-400 transition-colors">{t.previsaoSazonal}</span>
                  </div>
                  <span className={`bg-white/5 p-4 rounded-2xl text-white group-hover:bg-amber-500/20 transition-transform duration-300 border border-white/5 ${estadoMaquinaTempo !== 'fechado' ? 'rotate-90 text-amber-400' : ''}`}>⏳</span>
               </button>
               
               {estadoMaquinaTempo !== 'fechado' && (
                 <div className="p-6 md:p-8 border-t border-white/5 bg-black/20 animate-in slide-in-from-top-2">
                    {estadoMaquinaTempo === 'setup' && (
                      <>
                        <span className="text-slate-400 text-[9px] font-bold uppercase tracking-widest block mb-4 text-center">Selecione o Mês Base</span>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-6">
                          {MESES_ANO.map(mes => (
                            <button type="button" key={mes} onClick={() => trocarMes(mes)} className={`py-3 text-[10px] md:text-xs font-bold rounded-xl border transition-all ${mesSelecionado === mes ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-md' : 'bg-black/30 border-white/10 text-slate-400 hover:border-white/30 hover:text-white'}`}>{mes}</button>
                          ))}
                        </div>
                        <button onClick={acionarMaquinaTempo} className="w-full bg-amber-600 hover:bg-amber-500 text-white font-black text-[10px] py-4 rounded-xl uppercase tracking-widest transition-all shadow-lg hover:shadow-amber-500/40">{t.analisarMes}</button>
                      </>
                    )}
                    {estadoMaquinaTempo === 'carregando' && (
                      <div className="py-10 flex flex-col items-center justify-center">
                        <div className="w-8 h-8 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-4"></div>
                        <p className="text-amber-400 font-mono text-[10px] uppercase tracking-widest animate-pulse text-center">Inspecionando registros climáticos...</p>
                      </div>
                    )}
                    {estadoMaquinaTempo === 'pronto' && dossieHistorico && (
                      <div className="animate-in fade-in">
                        <div className="bg-black/30 p-5 rounded-2xl border border-white/5 mb-5 shadow-inner">
                          <div className="flex justify-between items-center mb-5 border-b border-white/5 pb-4">
                            <div><span className="text-[8px] md:text-[9px] text-slate-500 uppercase font-black tracking-widest block mb-1">Temp Média</span><span className="text-3xl text-white font-light tracking-tighter">{dossieHistorico.temp}°</span></div>
                            <div className="text-right"><span className="text-[8px] md:text-[9px] text-slate-500 uppercase font-black tracking-widest block mb-1">Chuva</span><span className={`text-xl font-black px-2 py-0.5 rounded-lg ${dossieHistorico.chuva > 50 ? 'bg-red-500/20 text-red-400 border border-red-500/20' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'}`}>{dossieHistorico.chuva}%</span></div>
                          </div>
                          <div className="bg-white/5 p-3 rounded-xl border border-white/5 mb-3 flex items-center justify-between"><span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Fenômeno Histórico</span><span className={`text-[10px] font-black uppercase tracking-wider ${dossieHistorico.fenomeno.cor}`}>{dossieHistorico.fenomeno.nome}</span></div>
                          <p className="text-slate-300 text-[10px] md:text-[11px] leading-relaxed pt-2 font-medium">{dossieHistorico.veredito}</p>
                        </div>
                        <button onClick={() => setEstadoMaquinaTempo('setup')} className="text-slate-400 hover:text-white text-[10px] font-bold uppercase tracking-widest w-full text-center flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 py-3.5 rounded-xl transition-colors border border-white/5">{t.voltarHoje}</button>
                      </div>
                    )}
                 </div>
               )}
             </div>
          </div>

          {/* FAST TRACK LINKS */}
          <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-2 lg:grid-cols-3 gap-3 shrink-0">
             <a href={`https://www.skyscanner.com.br/transporte/passagens-aereas/br/${cidadeSelecionada.cidade.toLowerCase()}`} target="_blank" rel="noopener noreferrer" className="bg-white/5 hover:bg-white/10 text-white px-3 md:px-4 py-4 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center justify-center border border-white/10 transition-colors shadow-sm">{t.voos}</a>
             <a href={`https://www.booking.com/searchresults.pt-br.html?ss=${cidadeSelecionada.cidade}`} target="_blank" rel="noopener noreferrer" className="bg-white/5 hover:bg-white/10 text-white px-3 md:px-4 py-4 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center justify-center border border-white/10 transition-colors shadow-sm">{t.hoteis}</a>
             <a href={`https://www.opentable.com/s?q=${cidadeSelecionada.turista?.local_premium?.nome} ${cidadeSelecionada.cidade}`} target="_blank" rel="noopener noreferrer" className="bg-rose-700/20 hover:bg-rose-700/30 text-rose-300 px-3 md:px-4 py-4 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center justify-center border border-rose-500/30 transition-colors shadow-sm col-span-2 lg:col-span-1">{t.mesa}</a>
          </div>

        </div>
      </div>
    </div>
  );
}