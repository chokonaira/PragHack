interface SpeechAlternative { transcript: string }
type SpeechResult = ArrayLike<SpeechAlternative> & { isFinal: boolean }
interface SpeechResultEvent { resultIndex: number, results: ArrayLike<SpeechResult> }
interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  onstart: (() => void) | null
  onresult: ((event: SpeechResultEvent) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike
type SpeechWindow = { SpeechRecognition?: SpeechRecognitionCtor, webkitSpeechRecognition?: SpeechRecognitionCtor }

export type VoiceState = 'idle' | 'starting' | 'listening' | 'stopping'

const ERRORS: Record<string, string> = {
  'not-allowed': 'Microphone access is blocked. Allow it in your browser settings, or type instead.',
  'service-not-allowed': 'Voice input is not allowed here. Type instead.',
  'no-speech': 'We didn\'t hear anything. Tap Speak and try again.',
  'audio-capture': 'No microphone found. Type instead.',
  'network': 'Voice input needs a connection. Check it and try again, or type instead.'
}

const STOP_TIMEOUT_MS = 2000

function recognitionCtor(): SpeechRecognitionCtor | undefined {
  const w = window as unknown as SpeechWindow
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

/**
 * Dictation with the browser's built-in speech recognition (not available in every browser).
 *
 * States: idle, starting (waiting for the microphone), listening, stopping (collecting the last words).
 * `onText` receives the full text to show: what was already typed plus everything heard so far,
 * including words still being recognised, so the text streams into the box while you speak.
 * `level` (0 to 1) follows the microphone volume for the recording meter.
 * `stop()` resolves once the last words have arrived, so callers can safely continue.
 */
export function useSpeechInput(onText: (text: string) => void) {
  const supported = ref(false)
  const state = ref<VoiceState>('idle')
  const error = ref<string | null>(null)
  const level = ref(0)
  const hasLevel = ref(false)
  const captured = ref(false)
  const active = computed(() => state.value !== 'idle')
  const listening = computed(() => state.value === 'listening')

  let recognition: SpeechRecognitionLike | null = null
  let stream: MediaStream | null = null
  let audioContext: AudioContext | null = null
  let frame = 0
  let lastTick = 0
  let session = 0
  let heardText = false
  let waiters: Array<() => void> = []

  onMounted(() => {
    supported.value = Boolean(recognitionCtor())
  })

  async function startMeter(id: number) {
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (id !== session || state.value !== 'listening') {
        media.getTracks().forEach(track => track.stop())
        return
      }
      stream = media
      audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      audioContext.createMediaStreamSource(media).connect(analyser)
      const data = new Uint8Array(analyser.frequencyBinCount)
      hasLevel.value = true
      const tick = (now: number) => {
        if (now - lastTick > 50) {
          lastTick = now
          analyser.getByteTimeDomainData(data)
          let sum = 0
          for (const v of data) {
            const x = (v - 128) / 128
            sum += x * x
          }
          level.value = Math.min(1, Math.sqrt(sum / data.length) * 4)
        }
        frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
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

  function finish() {
    stopMeter()
    captured.value = heardText && !error.value
    state.value = 'idle'
    recognition = null
    const pending = waiters
    waiters = []
    pending.forEach(resolve => resolve())
  }

  function start(baseText = '') {
    const Ctor = recognitionCtor()
    if (!Ctor || state.value !== 'idle') return
    const base = baseText.trim()
    const id = ++session
    error.value = null
    captured.value = false
    heardText = false

    const rec = new Ctor()
    recognition = rec
    rec.lang = 'en-US'
    rec.continuous = true
    rec.interimResults = true
    rec.onstart = () => {
      if (id !== session || state.value !== 'starting') return
      state.value = 'listening'
      void startMeter(id)
    }
    rec.onresult = (event) => {
      if (id !== session) return
      const spoken = Array.from(event.results, result => result[0]?.transcript ?? '')
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
      if (spoken) heardText = true
      onText(base ? `${base} ${spoken}`.trim() : spoken)
    }
    rec.onerror = (event) => {
      if (id !== session || event.error === 'aborted') return
      error.value = ERRORS[event.error] ?? 'Voice input stopped. Type instead.'
    }
    rec.onend = () => {
      if (id !== session) return
      finish()
    }

    state.value = 'starting'
    try {
      rec.start()
    } catch {
      error.value = 'We couldn\'t start the microphone. Try again.'
      finish()
    }
  }

  function stop(): Promise<void> {
    if (state.value === 'idle') return Promise.resolve()
    return new Promise((resolve) => {
      waiters.push(resolve)
      if (state.value !== 'stopping') {
        state.value = 'stopping'
        stopMeter()
        try {
          recognition?.stop()
        } catch {
          finish()
          return
        }
      }
      const id = session
      setTimeout(() => {
        if (id === session && state.value === 'stopping') finish()
      }, STOP_TIMEOUT_MS)
    })
  }

  onBeforeUnmount(() => {
    session++
    try {
      recognition?.abort()
    } catch {
      // already stopped
    }
    recognition = null
    stopMeter()
    state.value = 'idle'
    waiters.forEach(resolve => resolve())
    waiters = []
  })

  return { supported, state, active, listening, error, level, hasLevel, captured, start, stop }
}
