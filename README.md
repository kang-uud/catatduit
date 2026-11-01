# Catat Do-It 🪙✓
> **Catat Keuangan, Eksekusi Impianmu**  
> *Aplikasi pencatat sirkulasi keuangan mandiri (PWA), cepat, bebas biaya server, dan 100% aman terhubung ke Google Spreadsheet masing-masing.*

---

## 🌟 Keunggulan Catat Do-It
1. **Multi-User Bebas Konflik (1 Link untuk Semua Kawan):**
   * Menggunakan 1 deployment link Vercel yang sama.
   * Setiap pengguna/teman menghubungkan Google Spreadsheet & Apps Script (GAS) milik sendiri.
   * Data tidak bercampur, tidak ada database terpusat yang bisa bocor.
2. **Local-First & Offline-Ready:**
   * Tetap bisa mencatat transaksi saat offline.
   * Otomatis melakukan sinkronisasi ke Google Sheets saat internet kembali aktif.
3. **One-Click Auto Connect (`?gas=...`):**
   * Pengguna bisa membuka link dengan parameter `https://domain-anda.vercel.app/?gas=URL_GAS_MEREKA` untuk langsung tersambung otomatis tanpa repot salin-tempel.
4. **PWA (Progressive Web App):**
   * Bisa langsung di-install di layar utama (Home Screen) smartphone Android & iOS layaknya aplikasi native.

---

## 🚀 Panduan Setup Google Apps Script (Untuk Pengguna)

Hanya perlu dilakukan **1 kali**:

### Langkah 1: Buat Google Spreadsheet
1. Buka [Google Sheets](https://sheets.new) di peramban Anda.
2. Beri nama file, misalnya: **Buku Kas Catat Do-It**.

### Langkah 2: Pasang Kode Apps Script
1. Di Google Sheets, klik menu **Ekstensi (Extensions) > Apps Script**.
2. Hapus semua kode default di file `Code.gs`.
3. Salin seluruh isi file [`Code.gs`](./Code.gs) dari repositori ini dan tempelkan ke editor Apps Script.
4. Klik tombol **Simpan (Save)** (ikon disket).

### Langkah 3: Deploy (Terapkan) sebagai Web App
1. Klik tombol biru **Terapkan (Deploy) > Penerapan baru (New deployment)**.
2. Di sebelah kiri (roda gigi), pilih tipe **Aplikasi Web (Web app)**.
3. Isi konfigurasi:
   * **Deskripsi:** `Catat Do-It API v1`
   * **Jalankan sebagai (Execute as):** `Saya (email Anda)`
   * **Siapa yang memiliki akses (Who has access):** `Siapa saja (Anyone)` *(Wajib dipilih agar aplikasi web di Vercel dapat berkomunikasi)*
4. Klik **Terapkan (Deploy)**.
5. Klik **Beri Akses (Authorize Access)** dan pilih akun Google Anda. *(Jika muncul peringatan Google belum memverifikasi, klik Advanced / Lanjutan > Buka Catat Do-It (tidak aman))*.
6. Salin **URL Aplikasi Web** yang berakhiran `/exec`.

### Langkah 4: Buka Aplikasi & Tempel URL
1. Buka aplikasi **Catat Do-It** di browser atau HP Anda.
2. Masukkan nama Anda dan tempelkan URL Web App yang tadi disalin.
3. Klik **Simpan & Hubungkan**.
4. Selesai! Spreadsheet Anda otomatis membuat lembar `Transaksi_keluarga`, `Kategori_keluarga`, dan `Tabungan_keluarga`.

---

## 🌐 Deploy ke Vercel

Karena aplikasi ini berarsitektur murni static single-page app (HTML/CSS/JS):
1. Buat repository baru di GitHub (misal `catat-do-it`).
2. Masukkan seluruh file dari folder ini (`index.html`, `manifest.json`, `icon.png`, `Code.gs`, `README.md`).
3. Buka dashboard [Vercel](https://vercel.com/) > **Add New Project** > Import repository GitHub tadi.
4. Klik **Deploy** tanpa konfigurasi khusus.
5. Link Vercel Anda siap dibagikan ke teman-teman!

---

*Dibuat dengan ❤️ untuk kemudahan pengelolaan finansial mandiri.*
