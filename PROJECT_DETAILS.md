# Project Details: Energy Stacks Webapp

A high-performance petroleum news web application built with Nuxt 4 and Supabase, featuring persistent audio, SSR-driven SEO, and secure hybrid authentication.

## 🚀 Technical Stack
- **Framework**: Nuxt 4 (Universal Rendering / SSR Enabled)
- **Styling**: Tailwind CSS 4 (Vite-first configuration)
- **Backend**: Supabase (Auth, Database, Storage)
- **State Management**: Pinia
- **Icons**: Lucide Vue Next
- **Data Source**: Dynamic server-side fetching from Supabase `news_articles`.

## 🏗️ Architecture & Features

### 1. Audio Engine (Persistent & Native)
- **Continuous Playback**: Managed via `stores/news.ts`. Automatically advances through the `audioList`.
- **Interstitial Voice**: Plays a "Next News" prompt between tracks (stored in Supabase Storage).
- **Persistence**: `MiniPlayer` is mounted in the global layout; audio persists across all navigations.
- **Native Integration**: Full support for **Web Media Session API** (Lock screen controls and metadata).
- **Autoplay Compliance**: `?play=ID` deep links trigger a "Play Today" overlay, unlocking audio via a required user gesture.

### 2. Intelligent Browser Tab Titles
- **Active Priority**: If audio is playing, the tab is locked to `"Now Playing: [Headline]"`.
- **Reactive Revert**: The moment audio is paused, the tab instantly reverts to the professional brand name (e.g., `"Energystacks - Profile"`).
- **News Headlines**: News detail pages display only the article headline to maximize visibility and professionalism.

### 3. SEO & Social Sharing
- **Server-Side Rendering (SSR)**: Both Home and Detail pages use `useAsyncData` for instant first-paints and full SEO coverage.
- **LinkedIn Integration**: Uses `useServerSeoMeta` to bake high-resolution banners and article descriptions into the initial HTML for perfect social previews.

### 4. High-Security Authentication
- **OTP Proxy**: All Magic Link requests route through `/api/otp` to prevent email enumeration (returns 200 OK even if user doesn't exist).
- **Manual Cookie Sync**: Uses a Base64 sync strategy to keep `sb-[ref]-auth-token` active for 1 year, ensuring refresh tokens work across refreshes.
- **Verified Onboarding**: Profiles are created via a private `/api/onboard` server hook after email confirmation, bypassing RLS for initial setup.
- **Absolute Wipe Logout**: A destructive logout strategy that clears `localStorage`, `sessionStorage`, and all variations of Supabase cookies instantly.

### 5. Marketing & UI
- **Daily Digest**: Responsive HTML template (`resources/email_templates/daily_digest.html`).
- **Secure Unsubscribe**: Two-step flow using signed tokens and a `SECURITY DEFINER` RPC function.
- **Global Toasts**: Professional "inserting-style" notifications at the top of the content area for auth events.

## 📊 Database Schema (Key Tables)
- **`profiles`**: User metadata, content preferences, and subscription status.
- **`news_articles`**: Title, HTML description, audio/banner URLs, and source attribution.
- **`unsubscribe_tokens`**: Single-use UUID tokens for secure unsubscription.
