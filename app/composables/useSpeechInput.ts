interface SpeechAlternative { transcript: string }
type SpeechResult = ArrayLike<SpeechAlternative> & { isFinal: boolean }
interface SpeechResultEvent { resultIndex: number, results: ArrayLike<SpeechResult> }
interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: SpeechResultEvent) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike
type SpeechWindow = { SpeechRecognition?: SpeechRecognitionCtor, webkitSpeechRecognition?: SpeechRecognitionCtor }

const ERRORS: Record<string, string> = {
  'not-allowed': 'Microphone access is blocked. Allow it in your browser settings, or type instead.',
  'service-not-allowed': 'Voice input is not allowed here. Type instead.',
  'no-speech': 'We didn\'t hear anything. Tap Speak and try again.',
  'audio-capture': 'No microphone found. Type instead.'
}

function recognitionCtor(): SpeechRecognitionCtor | undefined {
  const w = window as unknown as SpeechWindow
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

/**
 * Dictation with the browser's built-in speech recognition (not available in every browser).
 * `onText` receives the full text to show: what was already typed plus everything heard so far,
 * including the words still being recognised, so the text streams into the box while you speak.
 * `level` (0 to 1) follows the microphone volume for the recording meter.
 */
export function useSpeechInput(onText: (text: string) => void) {
  const supported = ref(false)
  const listening = ref(false)
  const error = ref<string | null>(null)
  const level = ref(0)
  const hasLevel = ref(false)

  let recognition: SpeechRecognitionLike | null = null
  let stream: MediaStream | null = null
  let audioContext: AudioContext | null = null
  let frame = 0

  onMounted(() => {
    supported.value = Boolean(recognitionCtor())
  })

  async function startMeter() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      audioContext.createMediaStreamSource(stream).connect(analyser)
      const data = new Uint8Array(analyser.frequencyBinCount)
      hasLevel.value = true
      const tick = () => {
        analyser.getByteTimeDomainData(data)
        let sum = 0
        for (const v of data) {
          const x = (v - 128) / 128
          sum += x * x
        }
        level.value = Math.min(1, Math.sqrt(sum / data.length) * 4)
        frame = requestAnimationFrame(tick)
      }
      tick()
    } catch {
      hasLevel.value = false
    }
  }

  function stopMeter() {
    cancelAnimationFrame(frame)
    stream?.getTracks().forEach(track => track.stop())
    void audioContext?.close()
    stream = null
    audioContext = null
    level.value = 0
    hasLevel.value = false
  }

  function start(baseText = '') {
    const Ctor = recognitionCtor()
    if (!Ctor) return
    const base = baseText.trim()
    error.value = null
    recognition = new Ctor()
    recognition.lang = 'en-US'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.onresult = (event) => {
      const spoken = Array.from(event.results, result => result[0]?.transcript ?? '')
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
      onText(base ? `${base} ${spoken}`.trim() : spoken)
    }
    recognition.onerror = (event) => {
      error.value = ERRORS[event.error] ?? 'Voice input stopped. Type instead.'
    }
    recognition.onend = () => {
      listening.value = false
      stopMeter()
    }
    recognition.start()
    listening.value = true
    void startMeter()
  }

  function stop() {
    recognition?.stop()
    listening.value = false
    stopMeter()
  }

  onBeforeUnmount(stop)

  return { supported, listening, error, level, hasLevel, start, stop }
}
