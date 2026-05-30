@echo off
echo =======================================================
echo   Enviando Atualizacoes do ABBA Digital para a Nuvem
echo =======================================================
echo.

:: 1. Salvar alterações no Git
echo Stageando os arquivos...
call git add .
if %errorlevel% neq 0 (
  echo Erro ao preparar arquivos no Git.
  pause
  exit /b %errorlevel%
)

echo.
echo Criando o commit de atualizacao...
call git commit -m "Atualizacao automatica de recursos e layouts"
if %errorlevel% neq 0 (
  echo Nenhuma alteracao nova detectada para salvar ou erro no commit.
  echo Certifique-se de que fez alteracoes antes de rodar.
  echo.
)

echo.
echo Enviando para o GitHub...
call git push origin main
if %errorlevel% neq 0 (
  echo Erro ao enviar para o GitHub. Verifique sua conexao ou permissoes.
  pause
  exit /b %errorlevel%
)

echo.
echo =======================================================
echo  SINAL VERDE! SUAS ATUALIZACOES FORAM ENVIADAS!
echo =======================================================
echo  - GitHub atualizado com sucesso.
echo  - Vercel iniciando o deploy automatico em background.
echo  - Celulares (iOS/Android) e Programa de PC vao baixar
echo    as novidades automaticamente na proxima inicializacao!
echo =======================================================
echo.
pause
