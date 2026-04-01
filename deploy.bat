@echo off
echo.
echo ========================================
echo   ISLA TECNOLOGICA - Deploy Script
echo ========================================
echo.

:: Ir al frontend y compilar React
echo [1/4] Compilando React...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: npm run build fallo
    pause
    exit /b 1
)
echo React compilado correctamente!
echo.

:: Volver a la raiz
cd ..

:: Copiar build a static
echo [2/4] Copiando build a backend/static...
xcopy /E /Y /Q frontend\build\* backend\src\main\resources\static\
if %errorlevel% neq 0 (
    echo ERROR: No se pudo copiar el build
    pause
    exit /b 1
)
echo Build copiado correctamente!
echo.

:: Git add y commit
echo [3/4] Subiendo a GitHub...
git add .
set /p mensaje="Escribe el mensaje del commit: "
git commit -m "%mensaje%"
echo.

:: Git push
echo [4/4] Haciendo push a Railway...
git push origin main
echo.

echo ========================================
echo   Deploy completado exitosamente!
echo   Railway comenzara el deploy en breve.
echo ========================================
echo.
pause