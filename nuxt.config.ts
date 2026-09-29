// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/ui', '@nuxt/image'],

  devtools: {
    enabled: true
  },

  app: {
    pageTransition: { name: 'page', mode: 'out-in' }
  },

  css: ['~/assets/css/main.css'],

  // Server-only. NUXT_* env vars override these (see .env.example).
  runtimeConfig: {
    apiBase: 'http://mockapi.pragvue.cz:8001',
    demoMode: false,
    // Demo tickets with the real model. Needs NUXT_LLM_API_KEY. Off by default (see server/utils/aiMode.ts).
    aiLive: false,
    llm: {
      provider: 'anthropic',
      baseUrl: 'https://api.anthropic.com',
      apiKey: '',
      model: 'claude-sonnet-5-5'
    }
  },

  compatibilityDate: '2026-06-30',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
