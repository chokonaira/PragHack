// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/ui', '@nuxt/image'],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  // Server-only. NUXT_API_BASE overrides it (see .env.example). T-02 adds the rest.
  runtimeConfig: {
    apiBase: 'http://mockapi.pragvue.cz:8001'
  },

  app: {
    pageTransition: { name: 'page', mode: 'out-in' }
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
