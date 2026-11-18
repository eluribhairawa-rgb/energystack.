# Development History Summary: Energy Stacks

This document recaps the major milestones and architectural shifts made during the development lifecycle.

## 📍 Stage 1: Foundation & UI
- Established the centered desktop layout and mobile-first design with Nuxt 4 + Tailwind 4.
- Built the persistent audio player with slide-up animations and Pinia-based state management.

## 📍 Stage 2: Data & Marketing
- Migrated to Supabase `news_articles` and implemented dual-Supabase support.
- Developed the secure RPC-based unsubscribe flow and responsive email templates.
- Added comprehensive 404/Error/Loading states to all major routes.

## 📍 Stage 3: Advanced Auth
- Implemented the Hybrid Auth flow (Password + Magic Link).
- Solved redirect loops and session loss issues by consolidating all auth logic into a single reactive store watcher.
- Added deep-link auto-play support with a specialized mobile gesture unlock overlay.

## 📍 Stage 4: Logic Synchronization & SEO (Completed)
- **SSR & SEO Mastery**: Re-engineered fetching using `useAsyncData` to ensure LinkedIn and other crawlers see images and headlines in the initial HTML.
- **Title Authority**: Created a centralized title controller in the layout that intelligentlty switches between "Now Playing" and page branding instantly.
- **Security Hardening**: Implemented the `/api/otp` proxy to mask "User not found" errors and added the "Absolute Wipe" logout strategy.
- **Onboarding Polish**: Fixed the "Success Flash" bug where expired links briefly showed a welcome message. Synchronized the `/api/onboard` flow for secure profile creation.
- **UI Consistency**: Restored centered profile layouts and standardized global toast notifications.

## 🐞 Critical Bug Resolutions
- **Stale State on Refresh**: Resolved by implementing a manual Base64 cookie sync for Supabase sessions.
- **Title Flicker**: Solved by making the browser tab title a reactive getter in the MiniPlayer, ensuring instant response to Play/Pause clicks.
- **Profile Redundancy**: Eliminated "Energystacks - Energystacks" duplicate titles by moving all names into a metadata-driven system.
- **Autoplay Block**: Bypassed by using a modal-based "User Gesture" unlock for all deep-linked audio.
