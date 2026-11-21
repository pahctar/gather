# Decisions log

Inconsistencies between the brief (BRIEF.md), the lo-fi wireframes, and the Figma
frames, and how each was resolved. Newest entries at the bottom of each section.

Source priority: **Figma frames** (for the screens built so far) > **lo-fi** > **brief**,
except where the brief sets data, permission, or security rules.

## Scope (session 1)

- Only Log-in, Sign-up and Create profile (light + dark) are built. Home is unfinished
  in design, so after log-in users land on a placeholder "Welcome, <name>" page.

## Auth screens

| # | Inconsistency | Resolution |
|---|---|---|
| 1 | Lo-fi: Sign-up asks Name, Create profile asks Username. Figma: Sign-up asks **Username**, Create profile asks **Name**. Brief only mentions a display name. | Follow Figma. `username` = unique handle (used later for "add friend by username"). `Name` = `display_name` (required). |
| 2 | Create profile asks **Date of birth**; the brief doesn't mention it. | Stored on `profiles.date_of_birth`, **optional** (confirmed by product owner). Leave all three boxes empty, or fill all three with a real past date. Never visible to friends. |
| 3 | Brief requires a visible "At least 8 characters" hint; Figma Sign-up shows none. | Hint added under the Sign-up Password field (lo-fi also shows "password must be…"). |
| 4 | Figma Username placeholder reads "firstname". | Changed to "username". |
| 5 | Log-in link text renders as "Create on account" in the Figma screenshot, while the layer text is "Create an account". | Use "Create an account". |
| 6 | "Continue with Google" appears on all three screens; Google sign-in comes last per brief. | Rendered as a **disabled placeholder** (not clickable, with a "coming soon" title). |
| 7 | Username rules aren't specified anywhere. | 3–20 characters, lowercase letters, numbers and `_`. Unique, case-insensitive. |
| 8 | Checking username availability needs a pre-sign-in call, but "everyone must sign in". | A single `username_available(name)` function returns only true/false. Usernames will be searchable by friends later anyway. No other data is reachable before sign-in. |
| 9 | Welcome placeholder has no design. | Minimal page with "Welcome, <name>" and a Log out button (needed to test the flow). |
| 10 | Lo-fi Log-in shows "Forgot password?"; Figma doesn't. | **Deferred** (not built this session). Revisit when the Home design lands. |
| 11 | Supabase requires email confirmation by default. | Kept **on**. After Sign-up the user sees "Check your inbox"; Create profile opens after their first log-in. |

## Assets

| # | Issue | Resolution |
|---|---|---|
| A1 | The Figma SVG export of the Google "G" icon included canvas artefacts (a grey 20×20 backdrop, a 1440×1024 white page rect, and the component-set's dashed purple frame). | Those three elements were removed. The icon's own paths and masks are untouched. |
| A2 | The dark-mode "eye open" icon (Password Input [Dark] → enter [open], node 19:680) couldn't be exported: the Figma MCP Starter-plan call limit was reached. | `icon-eye-open-dark.svg` was made from the light icon using the exact rule every other dark icon in the file follows (fill `#2A2725` → `#F6F2F1`, group opacity 0.15). **TODO:** replace with a real export when the limit resets. |
| A3 | Button hover states (Button → Light/Dark/Primary [Hover]) couldn't be read for the same reason. Google button hover states were read: light hover = `#EAE2D3` fill; dark hover = lime 20% border. | Button hover uses a subtle brightness change until the real values can be read. **TODO.** |

## Tech

| # | Decision | Why |
|---|---|---|
| T1 | Tailwind CSS **v3** (not v4). | v4 needs Safari 16.4+; v3 works back to Safari 14. The brief requires Safari compatibility. |
| T2 | Comfortaa is self-hosted via `@fontsource/comfortaa` (500 + 700). | No third-party font request, works offline, consistent in Safari. |
| T3 | All Supabase requests go through `fetchWithTimeout` (15 s). Built on AbortController + setTimeout, not `AbortSignal.timeout`. | Brief: never hang on "Creating…". `AbortSignal.timeout` is missing in older Safari. |
| T4 | Light/dark uses Tailwind `darkMode: 'media'` (system setting only, no toggle). | Per product owner. |
| T5 | Figma assets that use SVG filters (logo, wordmarks, hero "gather", feature icons, avatar) are **inlined** as React components (`import X from './x.svg?react'`), not loaded with `<img>`. | Safari renders filtered SVGs inside `<img>` at low resolution, so the logo looked pixelated on Retina. Inline SVG renders crisp. The build only makes ids unique per file and drops Figma's root `style="display:block"`; the artwork itself is unchanged. |
