# Soal Praktikum Modul 3: Antrian Rumah Sakit

Pengerjaan sesuai dengan materi yang telah diajarkan pada modul dan mengikuti requirement yang ada.

Sebagai pengembang *front-end*, Anda diminta untuk membangun aplikasi antrian sederhana secara interaktif dari awal (*native from scratch*). Aplikasi ini terdiri dari lima halaman utama: Halaman Dashboard Antrian, Halaman Operator untuk Antrian, Ambil Antrian, dan Halaman Antrian Aktif.

## Ilustrasi Alur
Pengunjung rumah sakit dapat mengambil nomor antrian sendiri melalui halaman **Ambil Antrian**, dan tiket langsung masuk ke antrian tanpa perlu persetujuan admin. Apabila pengunjung tidak membawa ponsel atau ponselnya rusak, admin dapat membantu menerbitkan tiket secara manual melalui **Dashboard Admin**. Operator kemudian memanggil tiket sesuai urutan prioritas, dan nomor yang sedang dipanggil tampil di **Layar Antrian**.

---

## Ketentuan Website

1. **Wajib Native**: Dibuat murni tanpa *framework* atau *library* JavaScript/CSS apa pun (seperti React, Vue, jQuery, Bootstrap, Tailwind, dll) serta dilarang menggunakan *template*.
2. **TypeScript & Compilation Workflow**: 
   - Kode program wajib ditulis dalam TypeScript (`.ts`). 
   - Hasil kompilasi berupa JavaScript (`.js`) dihubungkan ke HTML menggunakan atribut `defer` (misal: `<script src="dist/login.js" defer></script>`). 
   - Sertakan file `tsconfig.json` dalam *repository*.

## API Endpoints yang Digunakan
- **Autentikasi POST Login**: `https://dummyjson.com/auth/login` (Mengirimkan *payload* `username` dan `password` untuk menerima `accessToken`).
- **Filter Pengguna per Role**: 
  - `https://dummyjson.com/users/filter?key=role&value=admin`
  - `https://dummyjson.com/users/filter?key=role&value=user` 
  *(untuk referensi data uji pengguna).*

## Penyimpanan Persistensi (Local Storage)
Seluruh data sesi otentikasi (token, role, nama pengguna), data master Jenis Antrian, dan daftar Tiket Antrian wajib disimpan di `Local Storage` agar data tidak hilang saat browser direfresh.

---

## Spesifikasi Fitur & Halaman

### 1. Halaman Login (`login.html`)
- **Fungsi**: Mengakses Dashboard Admin dan Panel Operator. Layar Kiosk tidak memerlukan login.
- **Akun Uji**: Gunakan akun uji dari `dummyjson.com/users` (contoh username/password tercantum di sana).
- **Form Login**: Input *username* dan *password* dengan indikator *loading state* saat verifikasi berlangsung.
- **Autentikasi & Validasi Role**: 
  - Mengirim request `POST` ke API dummyjson.
  - Role pengguna ditentukan berdasarkan respons server (`admin`, `moderator`, atau `user`). 
  - Apabila role berupa `moderator`, perlakuan hak akses disamakan dengan role `admin`.
- **Session Storage / Local Storage**: Menyimpan token, role, dan `firstName` ke Local Storage setelah otentikasi berhasil.
- **Error Handling**: Menampilkan pesan kesalahan visual jika kredensial salah atau koneksi jaringan gagal (menggunakan `try...catch`).
- **Auto Redirect Berdasarkan Role**: 
  - Pengguna kategori **Admin/Moderator** diarahkan ke `index.html` (Dashboard Admin).
  - Pengguna kategori **User biasa** diarahkan ke `operator.html` atau `ambil-antrian.html`.
- **Akses Publik**: Halaman `layar.html` dan `ambil-antrian.html` bersifat publik dan dapat diakses langsung tanpa login.

---

### 2. Halaman Dashboard Admin (`index.html`)
- **Proteksi Halaman (Auth Guard & Role Guard)**: Halaman ini tidak boleh diakses jika pengguna belum login atau role bukan admin/moderator. Jika tidak memenuhi syarat, lakukan *redirect* paksa kembali ke `login.html`.
- **Navigation Bar**: Menampilkan nama pengguna aktif, role, serta tombol Logout (menghapus Local Storage sesi dan mengarahkan ke halaman login).
- **Manajemen Jenis Antrian (CRUD & Aturan Validasi)**:
  - Membuat jenis antrian baru dengan input **Kode** (1 huruf kapital, misal 'C') dan **Nama Layanan**. Sistem harus menolak jika terjadi duplikasi kode/nama (*case-insensitive*).
  - Fitur **Aktifkan/Nonaktifkan** jenis antrian. Jenis yang nonaktif tidak dapat dipilih saat pengambilan tiket baru.
  - Fitur **Hapus** jenis antrian dan **Reset Antrian** (mengosongkan seluruh antrian aktif dan mengembalikan urutan nomor tiket ke awal).
- **Penerbitan Tiket Manual**: Form pembuatan tiket antrian manual dengan pilihan Jenis Antrian dan Tingkat Prioritas (Normal, Lansia, Disabilitas, VIP).

---

### 3. Halaman Operator (`operator.html`)
- **Proteksi Halaman (Auth Guard)**: Memastikan pengguna telah terotentikasi. Jika belum login, *redirect* paksa ke `login.html`.
- **Panel Penganggilan Antrian**:
  - Menampilkan nomor tiket yang sedang dipanggil (status: *Dipanggil*) dan tiket berikutnya berdasarkan antrian urut prioritas (**VIP / Disabilitas / Lansia** lebih didahulukan daripada **Normal**).
  - **Tombol Panggil Berikutnya**: Mengubah tiket aktif sebelumnya menjadi *Selesai* (Done) dan memanggil tiket antrian berikutnya.
  - **Tombol Lewati**: Memindahkan tiket yang tidak hadir ke akhir antrian atau menandainya sebagai *Dilewati*.
  - **Tombol Selesai**: Menutup tiket yang sedang dipanggil tanpa otomatis memanggil antrian berikutnya.

---

### 4. Halaman Layar Antrian (`layar.html`)
- **Akses Publik & Tampilan Real-time**: Halaman publik untuk menampilkan nomor antrian yang sedang dipanggil di layar monitor utama. Mengolah pembaruan data secara otomatis (*polling interval* 2-3 detik) tanpa *reload* halaman.
- **Panel Layar**: Menyediakan kartu informasi untuk setiap jenis antrian aktif beserta status nomor dipanggil dan jumlah antrian tersisa dalam antrean.
- **Fitur Layar Penuh (Full Screen)**: Sediakan tombol *toggle* Layar Penuh menggunakan JavaScript Fullscreen API.

---

### 5. Halaman Ambil Antrian (`ambil-antrian.html`)
- **Layanan Self-Service Pengunjung**: Halaman publik tempat pengunjung memilih jenis antrian dan tingkat prioritas (Normal, Lansia, Disabilitas, VIP).
- **Format Nomor Tiket**: Nomor tiket dicetak dengan format `Kode-Nomor 3 Digit` (contoh: `A-001`, `B-012`).
- **Pembaruan Otomatis**: Penambahan jenis antrian baru di dashboard admin akan otomatis muncul di halaman ini tanpa perlu memuat ulang halaman secara manual.

---

## Panduan Teknis TypeScript & Penilaian

- **Kompilasi TypeScript**: Jalankan pengompilasi TypeScript (`tsc --watch`) untuk menghasilkan JavaScript di direktori output (misal `dist/`). Pastikan proyek dapat dijalankan langsung menggunakan Live Server.
- **Rubrik Penilaian**:
  1. Fungsionalitas & Alur Auth (**35%**)
  2. Kesesuaian TypeScript & Arsitektur Native (**25%**)
  3. Manajemen Local Storage & Real-time Update (**20%**)
  4. Kelengkapan Fitur & UI/UX (**20%**)
- **Nilai Tambahan (Bonus)**: Diberikan kepada kelompok yang memberikan *effort* lebih pada desain antarmuka, respon suara/audio panggilan antrian, atau fitur pendukung lainnya berbasis HTML/CSS/TS murni.