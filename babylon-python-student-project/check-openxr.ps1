# Script de diagnostic OpenXR pour Meta Quest 3
# Vérifie si Oculus est défini comme runtime OpenXR actif

Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Diagnostic OpenXR pour Meta Quest 3" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Vérifier le registre Windows pour OpenXR runtime
$openXRPath = "HKLM:\SOFTWARE\Khronos\OpenXR\1"

Write-Host "🔍 Vérification du runtime OpenXR actif..." -ForegroundColor Yellow
Write-Host ""

try {
    if (Test-Path $openXRPath) {
        $activeRuntime = Get-ItemProperty -Path $openXRPath -Name "ActiveRuntime" -ErrorAction SilentlyContinue
        
        if ($activeRuntime) {
            $runtimePath = $activeRuntime.ActiveRuntime
            Write-Host "✅ Runtime OpenXR trouvé:" -ForegroundColor Green
            Write-Host "   $runtimePath" -ForegroundColor White
            Write-Host ""
            
            # Vérifier si c'est Oculus/Meta
            if ($runtimePath -like "*Oculus*" -or $runtimePath -like "*Meta*") {
                Write-Host "✅ Oculus/Meta est le runtime OpenXR actif - PARFAIT!" -ForegroundColor Green
            } else {
                Write-Host "⚠️  Le runtime actif n'est PAS Oculus/Meta" -ForegroundColor Yellow
                Write-Host ""
                Write-Host "🔧 SOLUTION:" -ForegroundColor Cyan
                Write-Host "   1. Ouvrez l'application Oculus/Meta Quest sur PC" -ForegroundColor White
                Write-Host "   2. Allez dans Paramètres > Général" -ForegroundColor White
                Write-Host "   3. Sous 'OpenXR Runtime', cliquez sur:" -ForegroundColor White
                Write-Host "      'Définir Oculus comme runtime OpenXR actif'" -ForegroundColor White
                Write-Host "   4. Redémarrez Chrome" -ForegroundColor White
            }
        } else {
            Write-Host "❌ Aucun runtime OpenXR actif trouvé" -ForegroundColor Red
            Write-Host ""
            Write-Host "🔧 SOLUTION:" -ForegroundColor Cyan
            Write-Host "   1. Installez/Réinstallez l'application Oculus/Meta Quest" -ForegroundColor White
            Write-Host "   2. Lancez l'application" -ForegroundColor White
            Write-Host "   3. Définissez Oculus comme runtime OpenXR actif" -ForegroundColor White
        }
    } else {
        Write-Host "❌ Clé de registre OpenXR non trouvée" -ForegroundColor Red
        Write-Host "   → OpenXR n'est pas installé sur ce système" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Erreur lors de la lecture du registre: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Vérification des processus Oculus/Meta" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Vérifier si les processus Oculus sont en cours d'exécution
$oculusProcesses = Get-Process | Where-Object { 
    $_.ProcessName -like "*Oculus*" -or 
    $_.ProcessName -like "*Meta*" -or 
    $_.ProcessName -like "*OVR*" 
}

if ($oculusProcesses) {
    Write-Host "✅ Processus Oculus/Meta détectés:" -ForegroundColor Green
    $oculusProcesses | ForEach-Object {
        Write-Host "   - $($_.ProcessName)" -ForegroundColor White
    }
} else {
    Write-Host "❌ Aucun processus Oculus/Meta en cours d'exécution" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 SOLUTION:" -ForegroundColor Cyan
    Write-Host "   1. Lancez l'application Oculus/Meta Quest depuis le bureau" -ForegroundColor White
    Write-Host "   2. Connectez votre Quest 3" -ForegroundColor White
    Write-Host "   3. Attendez que le casque affiche l'environnement Link" -ForegroundColor White
}

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Vérification de Chrome" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Vérifier si Chrome est en cours d'exécution
$chromeProcesses = Get-Process -Name "chrome" -ErrorAction SilentlyContinue

if ($chromeProcesses) {
    Write-Host "✅ Chrome est en cours d'exécution" -ForegroundColor Green
    Write-Host "   Nombre d'instances: $($chromeProcesses.Count)" -ForegroundColor White
    Write-Host ""
    Write-Host "⚠️  RECOMMANDATION:" -ForegroundColor Yellow
    Write-Host "   Après avoir configuré OpenXR, fermez TOUTES les fenêtres Chrome" -ForegroundColor White
    Write-Host "   et relancez-le pour que les changements prennent effet" -ForegroundColor White
} else {
    Write-Host "ℹ️  Chrome n'est pas en cours d'exécution" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Résumé et Actions Recommandées" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 CHECKLIST:" -ForegroundColor Yellow
Write-Host "   1. ⬜ Application Meta Quest lancée" -ForegroundColor White
Write-Host "   2. ⬜ Quest 3 connecté (câble ou Air Link)" -ForegroundColor White
Write-Host "   3. ⬜ Casque en mode Link (environnement visible)" -ForegroundColor White
Write-Host "   4. ⬜ Oculus défini comme runtime OpenXR" -ForegroundColor White
Write-Host "   5. ⬜ Chrome redémarré après config OpenXR" -ForegroundColor White
Write-Host "   6. ⬜ Flag chrome://flags/#webxr-incubations activé" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Page de test WebXR:" -ForegroundColor Cyan
Write-Host "   http://localhost:5000/test-webxr.html" -ForegroundColor White
Write-Host ""

# Proposer d'ouvrir la page de test
$response = Read-Host "Voulez-vous ouvrir la page de test WebXR maintenant? (o/n)"
if ($response -eq "o" -or $response -eq "O") {
    Start-Process "http://localhost:5000/test-webxr.html"
}
