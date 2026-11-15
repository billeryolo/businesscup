# Voices every script in readings.json (Windows voices or ReadBuddy's Kokoro voice), sends each
# recording to the speech service, and saves both transcripts to out/<id>.json.
# Run from the repo root:  powershell -File speech/bakeoff/run.ps1 -AudioDir <folder for audio>
param([Parameter(Mandatory = $true)][string]$AudioDir)

$ErrorActionPreference = "Stop"
$envFile = Get-Content ".env.local" | Where-Object { $_ -match "^(SPEECH_URL|VOICE_URL|SPEECH_TOKEN)=" }
$cfg = @{}
foreach ($line in $envFile) { $k, $v = $line -split "=", 2; $cfg[$k] = $v.Trim() }
$headers = @{ authorization = "Bearer $($cfg.SPEECH_TOKEN)" }

Add-Type -AssemblyName System.Speech
New-Item -ItemType Directory -Force $AudioDir | Out-Null
New-Item -ItemType Directory -Force "speech/bakeoff/out" | Out-Null
$readings = Get-Content "speech/bakeoff/readings.json" -Raw -Encoding UTF8 | ConvertFrom-Json

foreach ($r in $readings) {
  if ($r.voice -like "sapi:*") {
    $parts = $r.voice -split ":"
    $file = Join-Path $AudioDir "$($r.id).wav"
    $s = New-Object System.Speech.Synthesis.SpeechSynthesizer
    $v = $s.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Name -like "*$($parts[1])*" } | Select-Object -First 1
    if ($v) { $s.SelectVoice($v.VoiceInfo.Name) }
    $s.Rate = [int]$parts[2]
    $s.SetOutputToWaveFile($file)
    $s.Speak($r.script)
    $s.Dispose()
    $type = "audio/wav"
  } else {
    $file = Join-Path $AudioDir "$($r.id).mp3"
    $body = @{ text = $r.script } | ConvertTo-Json
    Invoke-WebRequest -UseBasicParsing -Uri "$($cfg.VOICE_URL)/speak" -Method Post -Headers $headers -ContentType "application/json" -Body $body -OutFile $file -TimeoutSec 120
    $type = "audio/mpeg"
  }
  $res = Invoke-WebRequest -UseBasicParsing -Uri "$($cfg.SPEECH_URL)/transcribe" -Method Post -Headers $headers -ContentType $type -InFile $file -TimeoutSec 180
  [System.IO.File]::WriteAllText((Join-Path (Resolve-Path "speech/bakeoff/out") "$($r.id).json"), $res.Content)
  Write-Output "$($r.id): $((Get-Item $file).Length) bytes, transcribed"
}
