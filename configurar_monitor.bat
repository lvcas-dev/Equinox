@echo off
:: Define o nome da tarefa
set "NOME_TAREFA=MonitorClimaExtraEnvios"

:: Define o caminho do seu projeto (ajuste se necessário)
set "CAMINHO_PROJETO=%~dp0"

:: Cria a tarefa no Agendador de Tarefas do Windows
:: /SC HOURLY: Roda a cada hora
:: /TR: Comando que será executado (usando o deno task que criamos)
schtasks /create /tn "%NOME_TRAREFA%" /tr "wscript.exe \"%CAMINHO_PROJETO%rodar_silencioso.vbs\"" /sc HOURLY /rl HIGHEST /f
echo Tarefa "%NOME_TAREFA%" criada com sucesso!
