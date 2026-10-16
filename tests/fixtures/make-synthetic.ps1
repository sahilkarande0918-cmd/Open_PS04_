# Builds tests/fixtures/synthetic-lesson.mp4: a SYNTHETIC screen recording (Windows SAPI voice +
# FFmpeg-drawn code). Pipeline smoke test only; it is not Hinglish and not a real class.
Add-Type -AssemblyName System.Speech
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$s.Rate = 0
$s.SetOutputToWaveFile("$PSScriptRoot\synthetic-voice.wav")
$s.Speak("Okay, so now we will write a custom hook. Inside the use effect, we create an abort controller and call fetch. When the component unmounts, the cleanup function aborts the request. This is important when you deploy this app with Docker on Kubernetes, because the JSON response can arrive after the component is gone. In Spring we would use at the rate autowired instead. That is the whole idea.")
$s.Dispose()
