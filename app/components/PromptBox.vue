<script setup lang="ts">
withDefaults(defineProps<{
  placeholder?: string
  submitLabel?: string
  autofocus?: boolean
  examples?: string[]
  rows?: number
}>(), {
  placeholder: 'For example: my laptop keeps shutting down since yesterday\'s update, three times this morning.',
  submitLabel: 'Continue',
  autofocus: false,
  examples: () => [],
  rows: 3
})

const text = defineModel<string>({ required: true })
const emit = defineEmits<{ submit: [] }>()

const voice = useSpeechInput((full) => {
  text.value = full
})

const bars = [0.55, 0.85, 1, 0.75, 0.5]

function barHeight(factor: number) {
  return `${Math.max(4, Math.round(voice.level.value * 26 * factor))}px`
}

async function toggleVoice() {
  if (voice.state.value === 'idle') voice.start(text.value)
  else if (voice.state.value === 'listening') await voice.stop()
}

async function submit() {
  if (voice.active.value) await voice.stop()
  if (text.value.trim()) emit('submit')
}

const micLabel = computed(() => ({ idle: 'Speak', starting: 'Starting…', listening: 'Stop', stopping: 'Finishing…' })[voice.state.value])
</script>

<template>
  <div
    class="rounded-xl border bg-default p-2 shadow-sm transition-[border-color,box-shadow] duration-(--motion-base)"
    :class="voice.listening.value ? 'border-error ring-4 ring-error/15' : 'border-default focus-within:border-primary'"
  >
    <UTextarea
      v-model="text"
      variant="none"
      autoresize
      :rows="rows"
      :maxrows="8"
      size="lg"
      class="w-full"
      aria-label="Describe your problem"
      :autofocus="autofocus"
      :readonly="voice.active.value"
      :placeholder="voice.listening.value ? 'Listening. Start speaking…' : placeholder"
      @input="voice.captured.value = false"
      @keydown.meta.enter.prevent="submit"
      @keydown.ctrl.enter.prevent="submit"
    />

    <div
      class="min-h-0 px-3"
      role="status"
    >
      <div
        v-if="voice.state.value === 'starting'"
        class="flex items-center gap-2 pb-2 text-sm text-toned"
      >
        <UIcon
          name="i-lucide-loader-circle"
          class="size-4 motion-safe:animate-spin"
          aria-hidden="true"
        />
        Starting the microphone. Allow access if your browser asks.
      </div>
      <div
        v-else-if="voice.state.value === 'listening'"
        class="flex items-center gap-3 pb-2"
      >
        <span
          class="flex h-7 items-center gap-1"
          aria-hidden="true"
        >
          <span
            v-for="(factor, i) in bars"
            :key="i"
            class="w-1 rounded-full bg-error"
            :class="voice.hasLevel.value ? 'transition-[height] duration-75' : 'h-6 origin-center motion-safe:animate-voice-bar'"
            :style="voice.hasLevel.value ? { height: barHeight(factor) } : { animationDelay: `${i * 120}ms` }"
          />
        </span>
        <span class="text-sm font-medium text-error">Listening. Tap Stop when you're done.</span>
      </div>
      <div
        v-else-if="voice.state.value === 'stopping'"
        class="pb-2 text-sm text-toned"
      >
        Finishing up…
      </div>
      <div
        v-else-if="voice.captured.value"
        class="flex items-center gap-2 pb-2 text-sm text-success"
      >
        <UIcon
          name="i-lucide-circle-check"
          class="size-4"
          aria-hidden="true"
        />
        Got it. Edit the text if you like, then continue.
      </div>
    </div>
    <p
      v-if="voice.error.value"
      class="px-3 pb-2 text-sm text-error"
      role="alert"
    >
      {{ voice.error.value }}
    </p>

    <div class="flex flex-wrap items-center gap-2 px-2 pb-1">
      <UButton
        v-if="voice.supported.value"
        :color="voice.listening.value ? 'error' : 'neutral'"
        :variant="voice.listening.value ? 'solid' : 'outline'"
        size="sm"
        class="max-sm:min-h-11 max-sm:px-4"
        :icon="voice.state.value === 'listening' ? 'i-lucide-square' : 'i-lucide-mic'"
        :loading="voice.state.value === 'starting' || voice.state.value === 'stopping'"
        :disabled="voice.state.value === 'starting' || voice.state.value === 'stopping'"
        :aria-pressed="voice.listening.value"
        @click="toggleVoice"
      >
        {{ micLabel }}
      </UButton>
      <UButton
        v-for="example in examples"
        :key="example"
        size="xs"
        color="neutral"
        variant="soft"
        class="max-sm:min-h-10 max-sm:px-3.5 max-sm:text-sm"
        :disabled="voice.active.value"
        @click="text = example"
      >
        {{ example }}
      </UButton>
    </div>

    <div class="flex items-center justify-between gap-3 px-2 pb-1 pt-2">
      <slot name="secondary" />
      <UButton
        class="ms-auto max-sm:min-h-11"
        size="lg"
        :disabled="!text.trim() || voice.state.value === 'starting'"
        @click="submit"
      >
        {{ submitLabel }}
      </UButton>
    </div>
  </div>
</template>
