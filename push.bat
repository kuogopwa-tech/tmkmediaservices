@echo off
setlocal EnableExtensions EnableDelayedExpansion

echo ==========================================
echo  Push Script - Stage, Commit, Push
echo ==========================================

echo [1/5] Checking JavaScript syntax...
node --check server.js || (echo Syntax check failed: server.js & exit /b 1)
node --check lib\cloudinary.js || (echo Syntax check failed: lib\cloudinary.js & exit /b 1)
node --check public\main.js || (echo Syntax check failed: public\main.js & exit /b 1)
for /r api %%F in (*.js) do (
  node --check "%%F" || (echo Syntax check failed: %%F & exit /b 1)
)

echo [2/5] Staging all changes (including deletions)...
git add -A || (echo Failed to stage changes. & exit /b 1)

echo [3/5] Detecting current branch...
for /f "delims=" %%B in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set "BRANCH=%%B"
if not defined BRANCH (
  echo Failed to detect current branch.
  exit /b 1
)
echo Current branch: %BRANCH%

echo [4/5] Commit if there are staged changes...
git diff --cached --quiet
if %errorlevel%==0 (
  echo No changes to commit.
) else (
  echo Committing changes...
  git commit -m "auto update" || (echo Commit failed. & exit /b 1)
)

echo [5/5] Pushing to remote...
git rev-parse --abbrev-ref --symbolic-full-name @{u} >nul 2>nul
if %errorlevel%==0 (
  echo Upstream exists. Running: git push
  git push || (echo Push failed. & exit /b 1)
) else (
  echo No upstream set. Running: git push --set-upstream origin %BRANCH%
  git push --set-upstream origin %BRANCH% || (echo Push with upstream failed. & exit /b 1)
)

echo.
echo ✅ Done. All eligible changes have been pushed.
exit /b 0

