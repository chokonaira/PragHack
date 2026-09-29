<script setup lang="ts">
import type { StatusId } from '../../shared/types'

const props = withDefaults(defineProps<{
  status: StatusId
  compact?: boolean
  times?: Partial<Record<StatusId, string>>
}>(), {
  compact: false,
  times: () => ({})
})

const stops: Array<{ id: StatusId, label: string }> = [
  { id: 'new', label: 'Received' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'resolved', label: 'Resolved' }
]

const current = computed(() => stops.findIndex(s => s.id === props.status))
const currentLabel = computed(() => stops[current.value]?.label ?? '')
const isResolved = computed(() => props.status === 'resolved')

function nodeState(index: number) {
  if (index < current.value || (index === current.value && isResolved.value)) return 'done'
  if (index === current.value) return 'current'
  return 'upcoming'
}
</script>

<template>
  <div
    class="flex items-center"
    :class="compact ? 'gap-3' : 'w-full'"
  >
    <ol
      class="flex items-center"
      :class="compact ? 'w-32 shrink-0' : 'w-full'"
      aria-label="Ticket progress"
    >
      <li
        v-for="(stop, i) in stops"
        :key="stop.id"
        class="flex items-center"
        :class="i < stops.length - 1 ? 'flex-1' : ''"
        :aria-current="nodeState(i) === 'current' ? 'step' : undefined"
      >
        <div
          class="flex flex-col"
          :class="compact ? '' : 'items-start gap-2'"
        >
          <span
            class="relative flex shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-(--motion-base)"
            :class="[
              compact ? 'size-3.5' : 'size-6',
              nodeState(i) === 'upcoming'
                ? 'border-accented bg-default'
                : isResolved && i === current
                  ? 'border-success bg-success'
                  : 'border-primary bg-primary'
            ]"
          >
            <span
              v-if="nodeState(i) === 'current'"
              class="absolute inset-0 rounded-full bg-primary motion-safe:animate-flow-pulse"
              aria-hidden="true"
            />
            <UIcon
              v-if="nodeState(i) === 'done' && !compact"
              name="i-lucide-check"
              class="size-3.5 text-inverted"
              aria-hidden="true"
            />
            <span
              v-else-if="nodeState(i) === 'current' && !compact"
              class="relative size-2 rounded-full bg-inverted"
              aria-hidden="true"
            />
          </span>
          <span
            v-if="!compact"
            class="text-sm"
            :class="nodeState(i) === 'upcoming' ? 'text-muted' : 'font-medium text-highlighted'"
          >
            {{ stop.label }}
          </span>
          <span
            v-if="!compact && times[stop.id]"
            class="-mt-1.5 text-xs text-muted"
          >
            {{ times[stop.id] }}
          </span>
        </div>
        <span
          v-if="i < stops.length - 1"
          class="mx-1.5 h-0.5 flex-1 rounded-full transition-colors duration-(--motion-slow)"
          :class="[
            i < current ? 'bg-primary' : 'bg-accented',
            compact ? '' : '-mt-9'
          ]"
          aria-hidden="true"
        />
        <span class="sr-only">{{ stop.label }}</span>
      </li>
    </ol>
    <span
      v-if="compact"
      class="text-sm font-medium text-highlighted"
    >
      {{ currentLabel }}
    </span>
  </div>
</template>
