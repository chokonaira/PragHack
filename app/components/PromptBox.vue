<script setup lang="ts">
const props = withDefaults(defineProps<{
  placeholder?: string
  submitLabel?: string
  autofocus?: boolean
  examples?: string[]
  rows?: number
  label?: string
  loading?: boolean
  capturedHint?: string
  maxLength?: number
}>(), {
  placeholder: 'For example: my laptop keeps shutting down since yesterday\'s update, three times this morning.',
  submitLabel: 'Continue',
  autofocus: false,
  examples: () => [],
  rows: 3,
  label: 'Describe your problem',
  loading: false,
  capturedHint: 'Got it. Edit the text if you like, then continue.',
  maxLength: undefined
})

const text = defineModel<string>({ required: true })
const emit = defineEmits<{ submit: [] }>()

const voice = useSpeechInput((full) => {
  text.value = full
})

const bars = [0.55, 0.85, 1, 0.75, 0.5]

function barHeight(factor: number) {
  return `${Math.max(4, Math.round(voice.level.value * 20 * factor))}px`
}

async function toggleVoice() {
  if (voice.state.value === 'idle') voice.start(text.value)
  else if (voice.state.value === 'listening') await voice.stop()
}

async function submit() {
  if (props.loading) return
  if (voice.active.value) await voice.stop()
  if (text.value.trim()) emit('submit')
}

const micLabel = computed(() => ({ idle: 'Speak', starting: 'Starting…', listening: 'Stop', stopping: 'Finishing…' })[voice.state.value])
</script>

<template>
  <div
    class="rounded-2xl border bg-default p-2 shadow-sm transition-[border-color,box-shadow,background-color] duration-(--motion-base)"
    :class="voice.listening.value ? 'border-error/50 bg-error/[0.03] ring-4 ring-error/10' : 'border-default focus-within:border-primary'"
  >
    <UTextarea
      v-model="text"
      variant="none"
      autoresize
      :rows="rows"
      :maxrows="8"
      size="lg"
      class="w-full"
      :aria-label="label"
      :autofocus="autofocus"
      :readonly="voice.active.value || loading"
      :maxlength="maxLength"
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
      <span
        v-else-if="voice.state.value === 'listening'"
        class="sr-only"
      >Listening. Tap Stop when you're done.</span>
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
        {{ capturedHint }}
      </div>
    </div>
    <p
      v-if="voice.error.value"
      class="px-3 pb-2 text-sm text-error"
      role="alert"
    >
      {{ voice.error.value }}
    </p>

    <div class="flex flex-wrap items-center gap-x-2 gap-y-2 px-3 pb-2 pt-1">
      <UButton
        v-if="voice.supported.value"
        :color="voice.listening.value ? 'error' : 'neutral'"
        :variant="voice.listening.value ? 'solid' : 'outline'"
        size="lg"
        class="rounded-full px-4 max-sm:min-h-11"
        :class="voice.listening.value ? 'motion-safe:animate-rec-pulse' : ''"
        :ui="voice.listening.value ? { leadingIcon: 'size-3.5 fill-current' } : undefined"
        :icon="voice.state.value === 'listening' ? 'i-lucide-square' : 'i-lucide-mic'"
        :loading="voice.state.value === 'starting' || voice.state.value === 'stopping'"
        :disabled="loading || voice.state.value === 'starting' || voice.state.value === 'stopping'"
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
      <div
        v-if="voice.listening.value"
        class="flex items-center gap-2.5 ps-1 text-sm font-medium text-error"
        aria-hidden="true"
      >
        <span class="flex h-6 items-center gap-[3px]">
          <span
            v-for="(factor, i) in bars"
            :key="i"
            class="w-[3px] rounded-full bg-error"
            :class="voice.hasLevel.value ? 'transition-[height] duration-75' : 'h-5 origin-center motion-safe:animate-voice-bar'"
            :style="voice.hasLevel.value ? { height: barHeight(factor) } : { animationDelay: `${i * 120}ms` }"
          />
        </span>
        Listening…
      </div>
      <slot name="secondary" />
      <div class="ms-auto flex items-center gap-3">
        <span
          v-if="maxLength && text.length > maxLength * 0.85"
          class="text-sm"
          :class="text.length > maxLength ? 'text-error' : 'text-muted'"
          role="status"
        >{{ text.length }} / {{ maxLength }}</span>
        <UButton
          class="rounded-full px-5 max-sm:min-h-11"
          size="lg"
          :loading="loading"
          :disabled="!text.trim() || loading || Boolean(maxLength && text.length > maxLength) || voice.state.value === 'starting'"
          @click="submit"
        >
          {{ submitLabel }}
        </UButton>
      </div>
    </div>
  </div>
</template>
