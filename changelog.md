# Changelog - EQUINOX

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [1.0.0-beta] - 2026-05-01
### Adicionado
- Implementação inicial do layout em *Glassmorphism* com design "Infinito".
- Tela de *Splash* (Onboarding) com fade dinâmico.
- Fundo em `radial-gradient` para profundidade imersiva.
- Slogan "O mundo mapeado em sensações" integrado ao UI.
- Modal Premium com projeção térmica detalhada via gráficos (Recharts).
- Menu retrátil de "Camadas Atmosféricas" (Calor e Precipitação).

### Alterado
- Foco exclusivo no nicho de **Turismo** (Removida a divisão com "Proprietário").
- Mapa migrado de componente isolado para *Background Absoluto* (`z-index: 0`).
- Sistema de filtros otimizado (Pesquisa textual + Dropdown de Continentes flutuante).
- Otimização massiva de responsividade (Mobile First) no Header, Barra de Busca e Modal.
- Cards de destino redesenhados para proporção harmônica em telas pequenas.

### Corrigido
- Loop de renderização do mapa Leaflet solucionado via `chaveAtualizacaoMapa`.
- Correção crítica: Clique no país no mapa agora filtra corretamente os cards correspondentes na lista.
- Elementos flutuantes blindados para não transbordarem da tela (overflow ajustado).

## [1.1.0-beta] - 2026-05-01
### Adicionado
- **Arquitetura de API Segura (Deno):** Transição de script estático para servidor HTTP contínuo (`Deno.serve`) operando em background via rotina *Cron* (60 lotes/hora).
- **Blindagem de Infraestrutura:** Implementação de CORS estrito e Rate Limiting (rastreamento de IP para bloqueio automático após 60 requisições/minuto), protegendo a chave da OpenWeather.
- **Ponte Vite (Proxy):** Configuração de rota interna no `vite.config.js` para contornar bloqueios de *Mixed Content* em túneis HTTPS (Cloudflare).
- **Motor Semântico de Boutique:** Substituição de textos genéricos por arrays de dados estruturados cruzando Clima, Latitude e Arquétipo Cultural (Urbano Clássico, Tropical, Alpino, etc).
- **Termômetro de Viabilidade Outdoor:** Algoritmo que cruza temperatura extrema, chuva e vento para gerar um índice acionável de mobilidade (Alta/Média/Baixa) com barra de progresso visual.
- **Curadoria Universal (Caixa Âmbar):** Criação de um *Fallback* Procedural. Destinos sem curadoria manual agora recebem roteiros premium estilizados baseados na condição atmosférica da hora.
- **Identificação Visual de Fuso Horário:** Cálculo automático de dia/noite (06h às 18h) com injeção de ícones (☀️/🌙) ao lado do formato 24h.

### Alterado
- **Reestruturação de Filtros:** Subdivisão granular do mapa global (ex: "Europa Mediterrânea", "Escandinávia", "América do Sul") para maior precisão geográfica.
- **Lógica de Ordenação Híbrida:** A tela inicial agora ancora uma vitrine fixa de destaque (Paris, Roma, Madrid, Tóquio). O restante do grid é ordenado alfabeticamente (A-Z) para previsibilidade visual.
- **Refatoração UI/UX Modal Premium:** Substituição de parágrafos longos por Checklists de Mala escaneáveis e Tags dinâmicas de Vibe Noturna.
- **Fixação do Radar:** Botão de camadas atmosféricas migrado para posicionamento absoluto (bottom-right) e atrelado exclusivamente à Visão Livre do mapa, corrigindo bugs no mobile.

[v1.2.0-beta] - 2026-05-02 (A Batalha de Madrugada)

✨ Funcionalidades & UI

Upgrade de Motor: Migração completa e bem-sucedida para o Tailwind CSS v4 (Arquitetura moderna baseada em @import "tailwindcss" e variáveis CSS).

Design Premium: Implementação de barra de rolagem (Scrollbar) customizada em todo o sistema (::-webkit-scrollbar), alinhada com a estética "Dark Luxury" do Equinox.

Viabilidade Outdoor: Refinamento dos indicadores de viabilidade (Alta/Média/Baixa) com cores de alerta no dashboard global.

🐛 Correções de Bugs (Hotfixes)

[HOTFIX] Resolvido o loop de corrupção do cache HMR do Vite e PostCSS que causava perda total de estilos (O "Limbo do Node").

[HOTFIX] Corrigido o bloqueio de tráfego externo (Erro 502 Bad Gateway) no Cloudflared Tunnel adicionando a flag de liberação --host no servidor local.

[HOTFIX] Resolvido o bug de renderização do ícone de clima de Paris que exibia um artefato visual (bloco branco) devido a fallback de fonte/SVG.