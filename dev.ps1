# Full stack development. The launcher stops only the processes it starts.
Set-Location -LiteralPath $PSScriptRoot
npm run dev:full
exit $LASTEXITCODE
