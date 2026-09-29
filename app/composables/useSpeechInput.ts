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
  'no-speech': 'We didn\'t hear anything. Tap the mic and try again.',
  'audio-capture': 'No microphone found. Type instead.'
}

function recognitionCtor(): SpeechRecognitionCtor | undefined {
  const w = window as unknown as SpeechWindow
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

// Dictation with the browser's built-in speech recognition. Not available in every browser.
export function useSpeechInput(onFinalText: (text: string) => void) {
  const supported = ref(false)
  const listening = ref(false)
  const error = ref<string | null>(null)
  let recognition: SpeechRecognitionLike | null = null

  onMounted(() => {
    supported.value = Boolean(recognitionCtor())
  })

  function start() {
    const Ctor = recognitionCtor()
    if (!Ctor) return
    error.value = null
    recognition = new Ctor()
    recognition.lang = 'en-US'
    recognition.continuous = true
    recognition.interimResults = false
    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result?.isFinal && result[0]) onFinalText(result[0].transcript.trim())
      }
    }
    recognition.onerror = (event) => {
      error.value = ERRORS[event.error] ?? 'Voice input stopped. Type instead.'
    }
    recognition.onend = () => {
      listening.value = false
    }
    recognition.start()
    listening.value = true
  }

  function stop() {
    recognition?.stop()
    listening.value = false
  }

  function toggle() {
    if (listening.value) stop()
    else start()
  }

  onBeforeUnmount(() => recognition?.stop())

  return { supported, listening, error, toggle, stop }
}
