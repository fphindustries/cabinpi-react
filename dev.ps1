# CabinPi React Development Script
# Runs the full development stack: build, functions server, and Vite dev server
# Press Ctrl+C to stop all processes

# Set console to UTF-8 to handle special characters properly
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "🚀 Starting CabinPi React Development Environment..." -ForegroundColor Cyan
Write-Host ""

# Store background jobs
$wranglerJob = $null
$viteJob = $null

# Cleanup function
function Stop-AllJobs {
    Write-Host "`n🛑 Stopping all processes..." -ForegroundColor Yellow

    # Stop background jobs
    if ($script:wranglerJob) {
        Stop-Job $script:wranglerJob -ErrorAction SilentlyContinue
        Remove-Job $script:wranglerJob -Force -ErrorAction SilentlyContinue
    }
    if ($script:viteJob) {
        Stop-Job $script:viteJob -ErrorAction SilentlyContinue
        Remove-Job $script:viteJob -Force -ErrorAction SilentlyContinue
    }

    # Kill any remaining node processes on our ports
    Get-NetTCPConnection -LocalPort 5173,8788 -ErrorAction SilentlyContinue |
        ForEach-Object {
            Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
        }

    Write-Host "✅ All processes stopped" -ForegroundColor Green
}

# Register Ctrl+C handler
$null = Register-EngineEvent -SourceIdentifier PowerShell.Exiting -SupportEvent -Action {
    Stop-AllJobs
}

try {
    # Step 1: Build the project
    Write-Host "📦 Step 1/3: Building project..." -ForegroundColor Yellow
    npm run build

    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build failed!" -ForegroundColor Red
        exit 1
    }

    Write-Host "✅ Build complete" -ForegroundColor Green
    Write-Host ""

    # Step 2: Start Wrangler Pages Functions server in background
    Write-Host "⚡ Step 2/3: Starting Wrangler Pages Functions server (port 8788)..." -ForegroundColor Yellow

    $script:wranglerJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        & npm run dev:functions
    }

    # Wait for Wrangler to be ready (check port 8788)
    Write-Host "   Waiting for Wrangler server to be ready..." -ForegroundColor Gray
    $timeout = 30
    $elapsed = 0
    while ($elapsed -lt $timeout) {
        Start-Sleep -Seconds 1
        $elapsed++

        $connection = Get-NetTCPConnection -LocalPort 8788 -ErrorAction SilentlyContinue
        if ($connection) {
            Write-Host "✅ Wrangler server ready on http://localhost:8788" -ForegroundColor Green
            break
        }

        # Check if job failed
        if ($script:wranglerJob.State -ne 'Running') {
            Write-Host "❌ Wrangler server failed to start!" -ForegroundColor Red
            Receive-Job $script:wranglerJob
            Stop-AllJobs
            exit 1
        }
    }

    if ($elapsed -ge $timeout) {
        Write-Host "❌ Wrangler server timeout!" -ForegroundColor Red
        Stop-AllJobs
        exit 1
    }

    Write-Host ""

    # Step 3: Start Vite dev server in background
    Write-Host "🔥 Step 3/3: Starting Vite dev server (port 5173)..." -ForegroundColor Yellow

    $script:viteJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        & npm run dev
    }

    # Wait for Vite to be ready (check port 5173)
    Write-Host "   Waiting for Vite server to be ready..." -ForegroundColor Gray
    $timeout = 30
    $elapsed = 0
    while ($elapsed -lt $timeout) {
        Start-Sleep -Seconds 1
        $elapsed++

        $connection = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
        if ($connection) {
            Write-Host "✅ Vite dev server ready on http://localhost:5173" -ForegroundColor Green
            break
        }

        # Check if job failed
        if ($script:viteJob.State -ne 'Running') {
            Write-Host "❌ Vite server failed to start!" -ForegroundColor Red
            Receive-Job $script:viteJob
            Stop-AllJobs
            exit 1
        }
    }

    if ($elapsed -ge $timeout) {
        Write-Host "❌ Vite server timeout!" -ForegroundColor Red
        Stop-AllJobs
        exit 1
    }

    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "✨ Development environment ready!" -ForegroundColor Green
    Write-Host ""
    Write-Host "  🌐 Frontend:  http://localhost:5173" -ForegroundColor Cyan
    Write-Host "  ⚡ Backend:   http://localhost:8788" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  📝 Press Ctrl+C to stop all processes and view logs" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""

    # Keep script running and monitor processes
    while ($true) {
        Start-Sleep -Seconds 2

        # Check if jobs are still running
        if ($script:wranglerJob.State -ne 'Running') {
            Write-Host "⚠️  Wrangler server stopped unexpectedly!" -ForegroundColor Red
            Write-Host "`n--- Wrangler Logs ---" -ForegroundColor Yellow
            Receive-Job $script:wranglerJob
            Stop-AllJobs
            exit 1
        }

        if ($script:viteJob.State -ne 'Running') {
            Write-Host "⚠️  Vite server stopped unexpectedly!" -ForegroundColor Red
            Write-Host "`n--- Vite Logs ---" -ForegroundColor Yellow
            Receive-Job $script:viteJob
            Stop-AllJobs
            exit 1
        }
    }
}
catch {
    Write-Host "`n❌ Error occurred: $_" -ForegroundColor Red
    Stop-AllJobs
    exit 1
}
finally {
    # Cleanup on script exit (Ctrl+C or error)
    Write-Host "`n--- Final Logs ---" -ForegroundColor Cyan

    if ($script:wranglerJob) {
        Write-Host "`n[Wrangler Output]" -ForegroundColor Magenta
        Receive-Job $script:wranglerJob -ErrorAction SilentlyContinue
    }

    if ($script:viteJob) {
        Write-Host "`n[Vite Output]" -ForegroundColor Blue
        Receive-Job $script:viteJob -ErrorAction SilentlyContinue
    }

    Stop-AllJobs
}
