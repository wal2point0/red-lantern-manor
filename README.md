Voice Restaurant project with voice menu, cart, and admin management.

## Pages
- `src/pages/index.html` - public store front with voice ordering.
- `src/pages/admin-login.html` - dedicated admin login form.
- `src/pages/admin-dashboard.html` - dedicated admin dashboard for creating items and viewing orders.

## File structure
- `src/pages/` HTML pages
- `src/js/` JavaScript files (`script.js`, `admin.js`, `data-store.js`, `backend-config.js`)
- `src/css/` Stylesheet (`style.css`)
- `src/assets/` static assets (`audio/`, `fonts/`, `images/`)

## Shared data across browsers (optional backend)

By default, the app uses browser `localStorage`, so data is per-browser only.

To share menu/orders across browsers, configure Supabase:

1. Create `menu_items` and `orders` tables in Supabase.
2. Open `src/js/backend-config.js`.
3. Set:
	- `supabaseUrl`
	- `anonKey`
4. Keep table names as default (`menu_items`, `orders`) or update them.

When configured, storefront and admin pages will read/write via Supabase REST, with local fallback if backend is unavailable.

## Optional iPhone Safari voice upgrade (cloud STT)

If Safari voice recognition quality is poor on iPhone, you can route voice transcription through a server endpoint:

1. Open `src/js/backend-config.js`.
2. Set `sttProxyUrl` to your speech-to-text proxy endpoint.
3. Keep the proxy responsible for provider secrets (Deepgram/Google/Azure/etc.).

Recommended function secrets:

- `DEEPGRAM_API_KEY` (required)
- `SUPABASE_ANON_KEY` (recommended)
- `ALLOWED_ORIGINS` (optional CSV allowlist, e.g. `https://yourdomain.com,http://localhost:3000`)

Expected proxy response JSON:

- `{ "text": "add two dumplings" }` or
- `{ "transcript": "add two dumplings" }`

When `sttProxyUrl` is configured on iPhone Safari:

- Voice input captures short audio clips client-side.
- The clip is sent to your proxy for transcription.
- Returned text is processed by the existing command parser.
- If cloud transcription fails, the app falls back to browser recognition.

Note: no custom STT bearer token is required in frontend config.

## Admin flow
1. Open `admin-login.html`.
2. Login with valid admin credentials.
3. On success, redirects to `admin-dashboard.html`.
4. Logout returns to login page.

## Notes
- `admin.html` is kept as a redirect path for legacy compatibility.
- Admin session is stored in `sessionStorage.isAdminLoggedIn`.
- `admin.js` contains admin dashboard functionality and guard logic.
- Default admin credentials are hardcoded for demo only; in production use secure auth and encrypted storage.

## Project checklist
- See `CHECKLIST.md` for the practical launch and handoff checklist.
