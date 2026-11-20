import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt'],
  future: {
    compatibilityVersion: 4,
  },
  runtimeConfig: {
    public: {
      // Cognito User Pool — per-environment values, set on the ECS task (Terraform).
      // Staging: us-east-1_HRzV9UZSG / 6tlu6346rrctrk528604f28mu3
      // Production: us-east-1_E1MgyFXBb / 6pnoo4fkt42ubm0pi4gdi3t7fv
      cognitoUserPoolId: process.env.NUXT_PUBLIC_COGNITO_USER_POOL_ID,
      cognitoClientId: process.env.NUXT_PUBLIC_COGNITO_CLIENT_ID,
      cognitoRegion: process.env.NUXT_PUBLIC_COGNITO_REGION || 'us-east-1',
      // Feature flag: Cognito passwordless/magic-link login is NOT implemented yet
      // (no CUSTOM_CHALLENGE Lambda trigger wired to the pool — see MIGRATION_NOTES.md).
      // Keep false until that Lambda exists; the password flow is fully supported.
      // Public origin used in emailed magic links, e.g. https://energystacks.ai
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL,
      enableOtpLogin: process.env.NUXT_PUBLIC_ENABLE_OTP_LOGIN === 'true',
      // Base URL for news/media assets, served from S3 via CloudFront. Must
      // be NUXT_PUBLIC_-prefixed (not just ASSETS_BASE_URL) — Nuxt/Nitro only
      // re-applies env-var overrides to public runtimeConfig at server
      // startup for correctly-prefixed names; anything else read via a bare
      // process.env.X expression here gets statically inlined at build time
      // instead, so it silently stays whatever it was during `docker build`
      // (empty, in our case) no matter what's set on the running container.
      assetsBaseUrl: process.env.NUXT_PUBLIC_ASSETS_BASE_URL,
    }
  },
  routeRules: {
    // QA H1: there is no separate news index page; the homepage is the news list.
    '/news': { redirect: { to: '/', statusCode: 301 } },
    '/news/': { redirect: { to: '/', statusCode: 301 } },
  },
  vite: {
    plugins: [
      ...tailwindcss(),
    ],
  },
  nitro: {
    externals: {
      inline: ['pg']
    }
  },
  app: {
    head: {
      title: 'Energystacks - Petroleum News & Analysis',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: 'Stay updated with the latest petroleum news, technical takeaways, and industry impacts.' },
        { property: 'og:site_name', content: 'Energystacks' },
        { property: 'og:type', content: 'website' },
        { property: 'og:image', content: 'https://energystacks.ai/social-share.png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '627' },
        { property: 'og:image:type', content: 'image/png' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
      ]
    }
  },
  css: ['~/assets/css/main.css']
})
