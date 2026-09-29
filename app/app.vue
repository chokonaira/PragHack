<script setup lang="ts">
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})

const { openWith } = useNewRequest()
const { data: mode } = useFetch<{ mode: 'demo' | 'live' }>('/api/mode')

const title = 'TicketFlow AI'
const description = 'Describe a problem in your own words. AI turns it into a request and keeps you posted.'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description
})
</script>

<template>
  <UApp>
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-default focus:px-3 focus:py-2 focus:text-sm focus:ring-2 focus:ring-primary"
    >
      Skip to content
    </a>

    <header class="sticky top-0 z-40 border-b border-default bg-default/85 backdrop-blur">
      <UContainer class="flex h-16 items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <NuxtLink
            to="/"
            class="-ms-1 rounded-md p-1 focus-visible:outline-2 focus-visible:outline-primary"
            aria-label="TicketFlow home"
          >
            <AppLogo />
          </NuxtLink>
          <UBadge
            v-if="mode?.mode === 'demo'"
            color="neutral"
            variant="subtle"
            size="sm"
          >
            Demo data
          </UBadge>
        </div>

        <nav
          class="flex items-center gap-1"
          aria-label="Main"
        >
          <UButton
            to="/"
            color="neutral"
            variant="ghost"
            class="hidden sm:inline-flex"
          >
            My requests
          </UButton>
          <UButton
            icon="i-lucide-plus"
            @click="openWith()"
          >
            New request
          </UButton>
          <UColorModeButton />
        </nav>
      </UContainer>
    </header>

    <UMain id="main">
      <NuxtPage />
    </UMain>

    <NewRequestModal />

    <footer class="mt-24 border-t border-default py-8 text-sm text-muted">
      <UContainer>
        TicketFlow AI, built for the PragVue Hackathon 2026.
      </UContainer>
    </footer>
  </UApp>
</template>
