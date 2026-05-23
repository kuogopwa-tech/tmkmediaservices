@echo off
setlocal EnableExtensions

REM Stage everything (including deletions)
git add -A

REM Check if there is anything to commit
git diff --cached --quiet
if %errorlevel%==0 (
  echo No changes to commit.
) else (
  echo Committing changes...
  git commit -m "auto update" || exit /b 1
)

echo Pushing to remote...
git push
if %errorlevel% neq 0 (
  echo.
  echo Push failed. If your branch has no upstream set, run:
  echo   git push --set-upstream origin <branch>
  pause
  exit /b %errorlevel%
)

echo Done.
pause

