<script setup lang="ts">
import AiCard from './AiCard.vue'
import type { CreateMeta, StructuredTicket, Ticket, TicketTypeCode } from '../../shared/types'

const { open, seed, lastCreated } = useNewRequest()
const toast = useToast()

type Step = 'describe' | 'thinking' | 'review'
const step = ref<Step>('describe')
const text = ref('')
const suggestion = ref<StructuredTicket | null>(null)
const aiFailed = ref(false)
const thinkingStep = ref(0)
const creating = ref(false)
const createError = ref<string | null>(null)
const attempted = ref(false)

const form = reactive({
  summary: '',
  description: '',
  ticketType: 'incident' as TicketTypeCode,
  location: ''
})

const { data: meta } = useFetch<CreateMeta>('/api/create-meta', { server: false, lazy: true })
const locations = computed(() => meta.value?.locations ?? [])

const typeItems = [
  { label: 'Something is broken', value: 'incident' },
  { label: 'I need something', value: 'request' }
]

const thinkingSteps = ['Understanding what happened', 'Structuring the request', 'Choosing the location']
const examples = ['My laptop keeps shutting down', 'I can\'t log in', 'The printer is offline']

const impactLabel = { low: 'Low impact', medium: 'Medium impact', high: 'High impact' } as const
const impactIcon = { low: 'i-lucide-arrow-down', medium: 'i-lucide-minus', high: 'i-lucide-triangle-alert' } as const

const voice = useSpeechInput((spoken) => {
  text.value = text.value ? `${text.value} ${spoken}` : spoken
})

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

function reset() {
  step.value = 'describe'
  suggestion.value = null
  aiFailed.value = false
  createError.value = null
  attempted.value = false
  thinkingStep.value = 0
  Object.assign(form, { summary: '', description: '', ticketType: 'incident', location: '' })
}

watch(open, (isOpen) => {
  if (isOpen) {
    reset()
    text.value = seed.value
    if (text.value) run()
  } else {
    voice.stop()
  }
})

async function run() {
  const value = text.value.trim()
  if (!value) return
  voice.stop()
  step.value = 'thinking'
  thinkingStep.value = 0
  aiFailed.value = false
  const ticker = setInterval(() => {
    if (thinkingStep.value < thinkingSteps.length - 1) thinkingStep.value++
  }, 650)
  const started = Date.now()
  try {
    const result = await $fetch<StructuredTicket>('/api/ai/structure-ticket', { method: 'POST', body: { text: value } })
    suggestion.value = result
    form.summary = result.summary
    form.description = result.description
    form.ticketType = result.ticketType ?? 'incident'
    form.location = result.location ?? ''
  } catch {
    aiFailed.value = true
    suggestion.value = null
    form.summary = ''
    form.description = value
  }
  if (!reducedMotion()) await pause(Math.max(0, 1700 - (Date.now() - started)))
  clearInterval(ticker)
  thinkingStep.value = thinkingSteps.length
  if (!reducedMotion()) await pause(300)
  step.value = 'review'
}

function fillManually() {
  suggestion.value = null
  aiFailed.value = false
  form.description = text.value.trim()
  step.value = 'review'
}

async function create() {
  attempted.value = true
  if (!form.summary.trim() || !form.location) return
  creating.value = true
  createError.value = null
  try {
    const ticket = await $fetch<Ticket>('/api/tickets', {
      method: 'POST',
      body: { summary: form.summary, description: form.description, location: form.location, ticketType: form.ticketType }
    })
    lastCreated.value = ticket.key
    await refreshNuxtData('tickets')
    open.value = false
    toast.add({ title: 'Request created', description: `${ticket.key} is on the list.`, icon: 'i-lucide-circle-check', color: 'success' })
  } catch {
    createError.value = 'We couldn\'t create the request. Your text is still here, try again.'
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="New request"
    description="Tell us what happened. We'll do the paperwork."
    :ui="{ content: 'sm:max-w-xl' }"
  >
    <template #body>
      <Transition
        name="step"
        mode="out-in"
      >
        <div
          v-if="step === 'describe'"
          key="describe"
          class="space-y-4"
        >
          <div class="relative">
            <UTextarea
              v-model="text"
              autofocus
              autoresize
              :rows="4"
              :maxrows="9"
              size="xl"
              class="w-full"
              aria-label="Describe your problem"
              placeholder="For example: my laptop keeps shutting down since yesterday's update, three times this morning."
              @keydown.meta.enter.prevent="run"
              @keydown.ctrl.enter.prevent="run"
            />
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <UButton
              v-if="voice.supported.value"
              :color="voice.listening.value ? 'error' : 'neutral'"
              :variant="voice.listening.value ? 'soft' : 'outline'"
              size="sm"
              icon="i-lucide-mic"
              :aria-pressed="voice.listening.value"
              @click="voice.toggle()"
            >
              {{ voice.listening.value ? 'Listening, tap to stop' : 'Speak' }}
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
          <p
            v-if="voice.error.value"
            class="text-sm text-error"
            role="alert"
          >
            {{ voice.error.value }}
          </p>

          <div class="flex flex-wrap items-center justify-between gap-3 pt-2">
            <UButton
              color="neutral"
              variant="link"
              class="-ms-2.5"
              @click="fillManually"
            >
              Fill it in manually
            </UButton>
            <UButton
              size="lg"
              icon="i-lucide-sparkles"
              :disabled="!text.trim()"
              @click="run"
            >
              Create with AI
            </UButton>
          </div>
        </div>

        <div
          v-else-if="step === 'thinking'"
          key="thinking"
          class="py-4"
          aria-live="polite"
        >
          <p class="mb-5 max-w-prose rounded-lg bg-muted px-4 py-3 text-sm text-default">
            {{ text }}
          </p>
          <ol class="space-y-3">
            <li
              v-for="(label, i) in thinkingSteps"
              :key="label"
              class="flex items-center gap-3 text-base transition-colors duration-(--motion-base)"
              :class="i <= thinkingStep ? 'text-highlighted' : 'text-muted'"
            >
              <UIcon
                v-if="i < thinkingStep"
                name="i-lucide-circle-check"
                class="size-5 text-secondary"
                aria-hidden="true"
              />
              <span
                v-else-if="i === thinkingStep"
                class="relative flex size-5 items-center justify-center"
                aria-hidden="true"
              >
                <span class="absolute size-3 rounded-full bg-secondary motion-safe:animate-flow-pulse" />
                <span class="relative size-2.5 rounded-full bg-secondary" />
              </span>
              <span
                v-else
                class="size-5 rounded-full border-2 border-accented"
                aria-hidden="true"
              />
              {{ label }}
            </li>
          </ol>
        </div>

        <div
          v-else
          key="review"
          class="space-y-4"
        >
          <UAlert
            v-if="aiFailed"
            color="warning"
            variant="subtle"
            title="We couldn't read that automatically"
            description="Fill in the details below and create the request as usual."
          />

          <component
            :is="suggestion ? AiCard : 'div'"
            v-bind="suggestion ? { title: 'Review your request', demo: suggestion.source === 'demo' } : {}"
          >
            <div class="space-y-4">
              <UFormField
                label="Title"
                required
                :error="attempted && !form.summary.trim() ? 'Add a short title' : undefined"
              >
                <UInput
                  v-model="form.summary"
                  class="w-full"
                  maxlength="255"
                />
              </UFormField>
              <UFormField label="What happened">
                <UTextarea
                  v-model="form.description"
                  class="w-full"
                  autoresize
                  :rows="3"
                  :maxrows="8"
                />
              </UFormField>
              <div class="grid gap-4 sm:grid-cols-2">
                <UFormField label="Type">
                  <USelect
                    v-model="form.ticketType"
                    :items="typeItems"
                    class="w-full"
                  />
                </UFormField>
                <UFormField
                  label="Location"
                  required
                  :error="attempted && !form.location ? 'Choose a location' : undefined"
                >
                  <USelect
                    v-model="form.location"
                    :items="locations"
                    placeholder="Choose a location"
                    class="w-full"
                  />
                </UFormField>
              </div>

              <p
                v-if="suggestion"
                class="flex items-center gap-2 text-sm text-default"
              >
                <UIcon
                  :name="impactIcon[suggestion.impact]"
                  class="size-4"
                  aria-hidden="true"
                />
                {{ impactLabel[suggestion.impact] }}
              </p>
              <div v-if="suggestion?.missingInfo.length">
                <p class="text-sm font-medium text-highlighted">
                  Adding this helps support
                </p>
                <ul class="mt-1 space-y-1 text-sm text-default">
                  <li
                    v-for="q in suggestion.missingInfo"
                    :key="q"
                    class="flex items-start gap-2"
                  >
                    <UIcon
                      name="i-lucide-circle-help"
                      class="mt-0.5 size-4 shrink-0 text-warning"
                      aria-hidden="true"
                    />
                    {{ q }}
                  </li>
                </ul>
              </div>
            </div>
          </component>

          <p
            v-if="createError"
            class="text-sm text-error"
            role="alert"
          >
            {{ createError }}
          </p>

          <div class="flex items-center justify-between gap-3 pt-1">
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-arrow-left"
              @click="step = 'describe'"
            >
              Back
            </UButton>
            <UButton
              size="lg"
              :loading="creating"
              @click="create"
            >
              Create request
            </UButton>
          </div>
        </div>
      </Transition>
    </template>
  </UModal>
</template>
