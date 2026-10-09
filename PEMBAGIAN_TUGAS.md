# Pembagian Tugas — Antrian Rumah Sakit

Aplikasi antrian rumah sakit dengan **TypeScript native** (tanpa framework/library/template). Semua data disimpan di **Local Storage**, jadi halaman saling terhubung lewat Local Storage saja.

- **Deadline pengerjaan:** Selasa **13 Oktober 2026, 23:59**
- **Merge ke `main`:** paling lambat **Senin 12 Oktober malam** (Selasa untuk perbaikan bug integrasi)
- **Demo online:** mulai **14 Oktober 2026**. Setiap anggota wajib hadir dan menjelaskan bagian masing-masing.
- Revisi soal diumumkan di Discord.

## Pembagian halaman

| Pemilik | Halaman | Status |
|---|---|---|
| Ava | 1. `login.html`, 3. `operator.html` | Selesai (siap dites bersama) |
| Teman A | 2. `index.html` (dashboard admin) | Belum |
| Teman B | 4. `layar.html`, 5. `ambil-antrian.html` | Belum |

## Cara menjalankan

```bash
npm install          # sekali saja setelah clone
npx tsc --watch      # kompilasi src/*.ts -> dist/*.js saat disimpan
```

Buka file HTML dengan **Live Server** (VS Code). Folder `dist/` **di-commit** karena penilai menjalankan lewat Live Server tanpa kompilasi. **Jangan edit `dist/` manual.**

Di HTML, script dimuat sebagai module:

```html
<script type="module" src="dist/<halaman>.js" defer></script>
```

Import antar file TypeScript memakai ekstensi `.js`: `import { requireAuth } from "./auth.js";`

## File bersama (kontrak) di `src/`

Sudah ditulis, **jangan diubah tanpa memberi tahu grup**. Pakai fungsi-fungsi ini, jangan menulis ulang.

| File | Isi |
|---|---|
| `types.ts` | Tipe `Role`, `Priority`, `TicketStatus`, `Session`, `QueueType`, `Ticket`, dan `PRIORITY_RANK` |
| `storage.ts` | `getSession/saveSession/clearSession`, `getQueueTypes/saveQueueTypes`, `getTickets/saveTickets` |
| `auth.ts` | `login()`, `requireAuth(allowed?)`, `logout()`, `isAdmin(role)` |
| `tickets.ts` | `createTicket(code, priority)`, `sortQueue(tickets)`, `resetQueue()` |

Key Local Storage: `session`, `queueTypes`, `tickets` (JSON).

```ts
type Role = "admin" | "moderator" | "user";
type Priority = "normal" | "lansia" | "disabilitas" | "vip";
type TicketStatus = "waiting" | "called" | "done" | "skipped";

interface Session   { token: string; role: Role; firstName: string; }
interface QueueType { code: string; name: string; active: boolean; lastNumber: number; } // code = 1 huruf kapital
interface Ticket    { id: string; code: string; number: number; priority: Priority; status: TicketStatus; createdAt: number; }
```

### Aturan yang disepakati

- Tiket **hanya** dibuat lewat `createTicket(code, priority)`. Fungsi ini menaikkan `lastNumber` dan menghasilkan id `A-001`. Jangan membuat tiket manual dengan cara lain.
- Urutan antrian: prioritas (**vip > disabilitas > lansia > normal**), lalu `createdAt`. Pakai `sortQueue()`.
- **Reset Antrian** = `resetQueue()`: kosongkan `tickets`, semua `lastNumber` jadi 0.
- **Lewati** mengubah status jadi `skipped` (tidak dipanggil lagi).
- `moderator` diperlakukan sama dengan `admin` → pakai `isAdmin(role)`.
- `createTicket` melempar `Error` kalau jenis antrian tidak ada atau tidak aktif. Tangkap dengan `try...catch` dan tampilkan pesannya.
- Error harus tampil secara visual di halaman (bukan hanya `console.log`).

## Yang harus dikerjakan

### Teman A — `index.html` (Dashboard Admin)

File: `index.html`, `src/index.ts`

- [ ] **Auth + role guard:** `requireAuth(...)` hanya untuk admin/moderator (`isAdmin`). Selain itu redirect ke `login.html`.
- [ ] **Navbar:** nama pengguna aktif, role, dan tombol **Logout** (`logout()`).
- [ ] **Tambah jenis antrian:** input Kode (**1 huruf kapital**, mis. `C`) dan Nama Layanan. **Tolak duplikat** kode/nama (case-insensitive). Awal: `active: true`, `lastNumber: 0`.
- [ ] **Aktifkan/Nonaktifkan** jenis antrian (jenis nonaktif tidak bisa dipilih saat ambil tiket).
- [ ] **Hapus** jenis antrian.
- [ ] **Reset Antrian** → `resetQueue()` (beri konfirmasi).
- [ ] **Tiket manual:** form pilih Jenis Antrian + Prioritas (Normal, Lansia, Disabilitas, VIP) → `createTicket()`.
- [ ] Daftar jenis antrian + tiket tampil rapi, perubahan langsung terlihat.

Catatan: kalau belum ada jenis antrian sama sekali, halaman lain tidak punya data. Pertimbangkan membuat 1–2 jenis awal agar demo mudah.

### Teman B — `layar.html` dan `ambil-antrian.html`

Keduanya **publik** (tanpa login, tanpa `requireAuth`).

**`layar.html`** — file: `layar.html`, `src/layar.ts`
- [ ] Kartu untuk **setiap jenis antrian aktif**: nomor yang sedang dipanggil (`status: "called"`) dan jumlah yang masih menunggu (`waiting`).
- [ ] **Polling tiap 2–3 detik** (`setInterval`) supaya update tanpa reload.
- [ ] Tombol **Layar Penuh** (Fullscreen API: `requestFullscreen` / `exitFullscreen`).
- [ ] Bonus: suara/audio saat nomor dipanggil (Web Speech API atau `Audio`).

**`ambil-antrian.html`** — file: `ambil-antrian.html`, `src/ambilAntrian.ts`
- [ ] Pilih jenis antrian (hanya yang `active`) dan prioritas (Normal, Lansia, Disabilitas, VIP).
- [ ] Ambil tiket → `createTicket()` → tampilkan nomor `A-001` ke pengunjung.
- [ ] Jenis antrian baru dari dashboard admin **muncul otomatis** tanpa reload (polling atau event `storage`).
- [ ] Tampilkan pesan error kalau gagal.

### Ava — `login.html` dan `operator.html` (selesai)

**Login (`src/login.ts`)**
- POST ke `https://dummyjson.com/auth/login`, role diambil dari `/auth/me` (respons login tidak memuat role).
- Loading state di tombol, pesan error visual (`try...catch`), sesi disimpan ke Local Storage.
- Admin/moderator → `index.html`; `user` → `operator.html`.
- Jika sudah login, muncul pilihan **Lanjutkan** / **Logout** (tidak redirect otomatis).

**Operator (`src/operator.ts`)**
- Guard untuk semua user yang sudah login, pilih jenis antrian lewat dropdown.
- Menampilkan tiket yang sedang dipanggil, tiket berikutnya, dan daftar tunggu urut prioritas.
- **Panggil Berikutnya** (tiket aktif → `done`, panggil berikutnya), **Lewati** (`skipped`), **Selesai** (tutup tanpa memanggil berikutnya).
- Memuat ulang data tiap 2 detik dan saat Local Storage berubah.

## Akun uji (dummyjson)

| Role | Username | Password | Tujuan setelah login |
|---|---|---|---|
| admin | `emilys` | `emilyspass` | `index.html` |
| moderator | `oliviaw` | `oliviawpass` | `index.html` |
| user | `averyp` | `averyppass` | `operator.html` |

Daftar lengkap: `https://dummyjson.com/users/filter?key=role&value=admin` dan `...value=user`.

## Menguji halaman sendiri (seed)

Setiap orang membuat snippet seed (sesi palsu, jenis antrian, tiket) agar halamannya bisa dites sendiri. Contoh ada di `seed-operator.js`: tempel isinya di Console browser (origin yang sama dengan Live Server), lalu buka halaman.

## Aturan kerja

- Hanya edit file milik sendiri; **tanya dulu** sebelum mengubah file kontrak di `src/` (`types.ts`, `storage.ts`, `auth.ts`, `tickets.ts`).
- Satu branch per orang, merge ke `main` maksimal **Senin 12 Oktober malam**.
- Commit `dist/` (hasil `npx tsc`) sebelum merge. Jangan commit `node_modules/`.
- TypeScript `strict`, hindari `any`, DOM native saja (cast elemen, mis. `as HTMLInputElement`).
- Jangan menambah fitur di luar soal sebelum fitur inti selesai (bonus boleh sesudahnya).

## Checklist integrasi (Senin–Selasa)

- [ ] Ambil tiket di `ambil-antrian.html` → muncul di `operator.html` dan `layar.html`.
- [ ] Operator memanggil tiket → nomor tampil di `layar.html` dalam 2–3 detik.
- [ ] Tambah jenis antrian di dashboard → muncul di halaman ambil antrian tanpa reload.
- [ ] Nonaktifkan jenis antrian → hilang dari pilihan ambil antrian dan dropdown operator.
- [ ] Reset Antrian saat halaman lain terbuka tidak membuat error.
- [ ] Login admin/moderator → dashboard, login user → operator; akses tanpa login diarahkan ke `login.html`.
- [ ] Repo publik, `dist/` ter-commit, `tsconfig.json` ada, link dikumpulkan di https://its.id/m/SubmitPemweb2026.

## Nilai (rubrik)

Fungsionalitas & alur auth 35% · TypeScript & arsitektur native 25% · Local Storage & real-time 20% · Kelengkapan fitur & UI/UX 20%. Bonus: desain antarmuka, audio panggilan.
