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
| 12 | Figma has no error states. | Field errors appear under the field in 12px bold; the field border turns red. Form-level errors (wrong password, timeout) appear as a banner above the button. Error red is not in the palette: `#B3261E` (light) and `#F2A99E` (dark), both WCAG AA on the card colours. |
| 13 | Extra messages beyond the approved draft were needed for edge cases. | "Can't reach the server. Check your connection and try again." (offline), "Too many attempts. Wait a minute and try again." (Supabase rate limit), "Gather isn't connected to Supabase yet…" (missing .env.local), "Something went wrong. Please try again." (anything unexpected). All messages live in `src/lib/messages.ts`. |
| 14 | Welcome needs a name, but profiles (display name) arrive in step 4. | Until then it shows the username saved at sign-up, falling back to the email. |
| 15 | "Create an account" needs a destination before Sign-up exists (step 3). | Temporary placeholder page in step 2; replaced by the real Sign-up page in step 3. |
| 16 | Figma Sign-up has no way back to Log-in. | Added "Already have an account? Log-in" under the Google button, mirroring the Log-in page. Easy to remove if not wanted. |
| 17 | Can a username be changed later? Not specified. | Not for now: the database only lets users change name, date of birth, avatar and availability date. Revisit with the Account page. |
| 18 | Sign-up is designed for 1440px wide only. | From 1280px wide: the Figma layout (hero + scattered feature cards left, card right). Narrower: heading, card, then the three feature cards stacked and unrotated. Below 400px the card text is slightly smaller so it fits (360px cards on a 343px-wide column). |
| 19 | The Sign-up card is taller than in Figma (716px vs 660px). | Because of the "At least 8 characters" hint (#3) and the Log-in link (#16). Everything else keeps the Figma spacing. |
| 20 | What does Sign-up do if "Confirm email" is turned off in Supabase? | It signs the user in straight away and goes to Welcome. With it on (our setting), it shows "Check your inbox". |
| 21 | An existing email: Supabase hides whether an address is registered (it returns a user with no identities, and sends no email). | Detected and shown as "An account with this email already exists." under the email field. |
| 22 | Sign-up can fail inside the database if someone grabs the same username between our check and the sign-up. | The page re-checks and shows "That username is taken." |
| 23 | Avatar handling isn't specified beyond "optional avatar". | The photo is chosen with the edit badge and previewed at once, but only uploaded when "Let's gather!" is pressed (no stray files if the user leaves). It is centre-cropped to a 512×512 JPEG in the browser, which also strips photo metadata such as location. Accepted: JPG, PNG, WebP up to 5 MB (same limits on the storage bucket). On iPhone, HEIC photos are converted to JPEG by Safari automatically. |
| 24 | Who can see avatars? | The `avatars` bucket is public-read: anyone with the exact URL can view the image (friends will need it later). Only the owner can upload, replace or delete files in their folder. |
| 25 | Date of birth boxes. | Digits only; DD and MM jump to the next box when full; Backspace in an empty box goes back. |
| 26 | What happens if the profile can't be loaded after log-in? Not designed. | A card with the reason ("Couldn't load your profile.", the timeout/offline message, or, for developers, "The profiles table is missing. Run the Supabase migrations (see README).") plus "Try again" and "Log out". |
| 27 | Routing around Create profile. | Signed-in users without a name always land on Create profile. Once it's done, /create-profile redirects to Welcome (editing comes with the Account page). |

## Assets

| # | Issue | Resolution |
|---|---|---|
| A1 | The Figma SVG export of the Google "G" icon included canvas artefacts (a grey 20×20 backdrop, a 1440×1024 white page rect, and the component-set's dashed purple frame). | Those three elements were removed. The icon's own paths and masks are untouched. |
| A2 | The dark-mode "eye open" icon (Password Input [Dark] → enter [open], node 19:680) couldn't be exported: the Figma MCP Starter-plan call limit was reached. | `icon-eye-open-dark.svg` was made from the light icon using the exact rule every other dark icon in the file follows (fill `#2A2725` → `#F6F2F1`, group opacity 0.15). **TODO:** replace with a real export when the limit resets. |
| A5 | Card side padding was 31px, making fields 404px wide instead of Figma's 400px. | Fixed to 33px: fields are 400px wide and centred (as in the dark frames; the light frames have them 2px off-centre). |
| A4 | The "or" divider lines are 182px-wide SVGs in Figma, too wide for phone screens. | Drawn with CSS using the exact values from the SVGs (2px, round caps, Bokara / Whisper White at 25%), so they shrink with the card. |
| A3 | Button hover states (Button → Light/Dark/Primary [Hover]) couldn't be read for the same reason. Google button hover states were read: light hover = `#EAE2D3` fill; dark hover = lime 20% border. | Button hover uses a subtle brightness change until the real values can be read. **TODO.** |

## Tech

| # | Decision | Why |
|---|---|---|
| T1 | Tailwind CSS **v3** (not v4). | v4 needs Safari 16.4+; v3 works back to Safari 14. The brief requires Safari compatibility. |
| T2 | Comfortaa is self-hosted via `@fontsource/comfortaa` (500 + 700). | No third-party font request, works offline, consistent in Safari. |
| T3 | All Supabase requests go through `fetchWithTimeout` (15 s). Built on AbortController + setTimeout, not `AbortSignal.timeout`. | Brief: never hang on "Creating…". `AbortSignal.timeout` is missing in older Safari. |
| T4 | Light/dark uses Tailwind `darkMode: 'media'` (system setting only, no toggle). | Per product owner. |
| T6 | Database tests (pgTAP) run against a small stand-in for Supabase's `auth` schema and roles (`supabase/tests/local/supabase-shim.sql`) so they work on plain Postgres without Docker. The same test file runs with `supabase test db`. | Lets the RLS rules be verified here and in CI. The shim is never applied to a real project. |
| T5 | Figma assets that use SVG filters (logo, wordmarks, hero "gather", feature-card icons, avatar, avatar edit badge) ship as **3× PNGs**, rendered from the exact Figma SVGs by `npm run assets:rasterize` (scripts/rasterize-assets.cjs). Each is rendered at **12× and downscaled to 3×** (supersampling). The source SVGs stay in `src/assets/figma/`. Field icons, dividers, the Google icon and swirl backgrounds stay SVG. | Figma's inner-shadow export builds a hard 0/1 alpha mask (`hardAlpha`) from the shape, which throws away edge anti-aliasing, so the shapes have jagged edges in **every** browser. Safari also renders filters at low resolution. Attempts that didn't fix it: inlining the SVG, and a plain 3× render. Supersampling turns the jagged steps into smooth edges. If the logo is later redrawn without filter effects (e.g. shading as gradient fills), it can go back to plain SVG. `swirl-profile-*` are soft blurs where this doesn't show, so they stay SVG. |
