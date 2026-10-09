# CLAUDE.md: pweb-ts-p01-2026 (Antrian Rumah Sakit)

Group practicum (Pemrograman Web, Modul 3), group of 3. Hospital queue app in **native TypeScript**, no frameworks/libraries/templates (no React, Vue, jQuery, Bootstrap, Tailwind).

## Links
- Module + soal: https://github.com/lab-kcks/Modul-Pemrograman-Website-2026/tree/main/modul-3
- Soal (Google Doc): https://docs.google.com/document/d/1F4USybprEsF8zWiG-qBH-2i1971NqvgZYj8BO95nRoI/edit
- Submit repo link: https://its.id/m/SubmitPemweb2026
- Repo must be public and named `pweb-ts-p01-2026`

## Deadlines
- Work due **Tue 13 Oct 2026, 23:59**
- Online demos from **14 Oct 2026**; every member must attend and explain their own parts
- Spec revisions are announced on Discord

## Commands
```bash
npm install            # first time after cloning
npx tsc --watch        # compile src/*.ts -> dist/*.js on save
# open the HTML files with VS Code Live Server
```
`dist/` is committed (graders run it via Live Server without compiling). Never edit `dist/` by hand.

## Structure
```
src/            TypeScript source (edit here)
  types.ts      SHARED CONTRACT
  storage.ts    SHARED CONTRACT
  auth.ts       SHARED CONTRACT
  tickets.ts    SHARED CONTRACT
  <page>.ts     one file per page
dist/           compiled JS (generated, committed)
login.html  index.html  operator.html  layar.html  ambil-antrian.html
tsconfig.json   (strict: true, rootDir src, outDir dist, module ES2020)
```
HTML loads scripts as `<script type="module" src="dist/<page>.js" defer></script>`. TS imports use the `.js` extension: `import { requireAuth } from "./auth.js"`. (Confirm module scripts are OK with the assistants on Discord.)

## Rules from the soal
- All code in `.ts`, compiled output linked with `defer`; `tsconfig.json` included
- All data persists in **Local Storage**: session (token, role, firstName), queue types, tickets
- Login: POST `https://dummyjson.com/auth/login`, role from the response. **moderator = admin**
- Test users: `https://dummyjson.com/users/filter?key=role&value=admin` and `...value=user`
- Public pages (no login): `layar.html`, `ambil-antrian.html`
- Protected: `index.html` (admin/moderator only), `operator.html` (any logged-in user). Otherwise redirect to `login.html`
- Ticket format: `A-001` (code + 3-digit number)
- Priority order: VIP / Disabilitas / Lansia before Normal
- Errors shown visually (try...catch); loading state on login
- Grading: Auth/functionality 35%, TypeScript + native architecture 25%, Local Storage + real-time 20%, features + UI/UX 20%. Bonus: UI effort, call audio

## Shared contract (do NOT change without telling the group)
Everyone works in isolation and integrates only through Local Storage in this shape.

```ts
type Role = "admin" | "moderator" | "user";
type Priority = "normal" | "lansia" | "disabilitas" | "vip";
type TicketStatus = "waiting" | "called" | "done" | "skipped";

interface Session   { token: string; role: Role; firstName: string; }
interface QueueType { code: string; name: string; active: boolean; lastNumber: number; } // code = 1 capital letter
interface Ticket    { id: string; code: string; number: number; priority: Priority; status: TicketStatus; createdAt: number; }
```
Local Storage keys: `session`, `queueTypes`, `tickets` (JSON).

Agreed conventions:
- `createTicket(code, priority)` (in `tickets.ts`) is the only way to make a ticket; it bumps `QueueType.lastNumber`
- Reset Antrian: clear `tickets` and set every `lastNumber` to 0
- Queue order: priority rank (vip > disabilitas > lansia > normal), then `createdAt`
- Lewati sets status `skipped` (not recalled)
- `layar.html` polls every 2-3s
- Regular `user` role redirects to `operator.html` after login

## Work split (pages are the soal's numbering)
| Owner | Pages |
|---|---|
| Ava | 1. `login.html`, 3. `operator.html` |
| Teammate A | 2. `index.html` (admin dashboard, queue-type CRUD, manual ticket) |
| Teammate B | 4. `layar.html`, 5. `ambil-antrian.html` |

(Edit this table if the split changes.)

Working rules:
- Only edit your own files; ask before touching the shared `src/` contract files
- Each person makes a seed snippet (fake session, queue types, tickets in Local Storage) so their page can be tested alone
- Own branch per person; merge to `main` by Mon 12 Oct night, leaving Tuesday for integration bugs

## Code style
- `strict` TypeScript, avoid `any`
- Native DOM APIs only; cast elements, e.g. `as HTMLInputElement`
- Minimal code, no features beyond the soal unless doing bonus items after the core works
