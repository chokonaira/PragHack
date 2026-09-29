<script setup lang="ts">
withDefaults(defineProps<{
  placeholder?: string
  submitLabel?: string
  autofocus?: boolean
  examples?: string[]
  rows?: number
}>(), {
  placeholder: 'For example: my laptop keeps shutting down since yesterday\'s update, three times this morning.',
  submitLabel: 'Create with AI',
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

function toggleVoice() {
  if (voice.listening.value) voice.stop()
  else voice.start(text.value)
}

function submit() {
  voice.stop()
  if (text.value.trim()) emit('submit')
}
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
      :placeholder="voice.listening.value ? 'Listening. Start speaking…' : placeholder"
      @keydown.meta.enter.prevent="submit"
      @keydown.ctrl.enter.prevent="submit"
    />

    <div
      v-if="voice.listening.value"
      class="flex items-center gap-3 px-3 pb-2"
      role="status"
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
    <p
      v-else-if="voice.error.value"
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
        :icon="voice.listening.value ? 'i-lucide-square' : 'i-lucide-mic'"
        :aria-pressed="voice.listening.value"
        @click="toggleVoice"
      >
        {{ voice.listening.value ? 'Stop' : 'Speak' }}
      </UButton>
      <UButton
        v-for="example in examples"
        :key="example"
        size="xs"
        color="neutral"
        variant="soft"
        @click="text = example"
      >
        {{ example }}
      </UButton>
    </div>

    <div class="flex items-center justify-between gap-3 px-2 pb-1 pt-2">
      <slot name="secondary" />
      <UButton
        class="ms-auto"
        size="lg"
        icon="i-lucide-sparkles"
        :disabled="!text.trim()"
        @click="submit"
      >
        {{ submitLabel }}
      </UButton>
    </div>
  </div>
</template>
