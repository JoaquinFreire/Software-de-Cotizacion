@echo off
echo Iniciando Backend...
start cmd /k "cd Backend\Presentation && dotnet run"

echo Iniciando Frontend...
start cmd /k "cd frontend && npm start"

echo Todo iniciado 🚀
