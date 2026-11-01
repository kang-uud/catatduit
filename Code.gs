/**
 * ===================================================================
 * CATAT DO-IT - BACKEND GOOGLE APPS SCRIPT (GAS)
 * ===================================================================
 * Backend mandiri untuk aplikasi catatan sirkulasi keuangan Catat Do-It.
 * Setiap pengguna cukup menempelkan script ini ke Google Sheet miliknya.
 *
 * CARA PAKAI:
 * 1. Buat Google Spreadsheet baru di Google Drive (beri nama misal: "Buku Kas Catat Do-It").
 * 2. Buka menu: Ekstensi > Apps Script.
 * 3. Hapus semua kode yang ada, lalu salin dan tempel SELURUH isi file ini.
 * 4. Klik ikon Disket (Simpan).
 * 5. Klik tombol "Terapkan" (Deploy) > "Penerapan baru" (New deployment).
 * 6. Pilih jenis: "Aplikasi Web" (Web app).
 * 7. Konfigurasi:
 *    - Deskripsi: Catat Do-It API v1
 *    - Jalankan sebagai: Saya (Email Anda)
 *    - Siapa yang memiliki akses: Siapa saja (Anyone)
 * 8. Klik "Terapkan" (Deploy) dan berikan izin akses (Authorize access).
 * 9. Salin URL Aplikasi Web (berakhiran /exec) dan tempelkan ke aplikasi Catat Do-It!
 * ===================================================================
 */

// Inisialisasi Sheet otomatis jika belum tersedia
function getOrCreateSheet(ss, sheetName, headers) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (headers && headers.length > 0) {
      sheet.appendRow(headers);
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#2F6B4F");
      headerRange.setFontColor("#FFFFFF");
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

// Handler GET: Membaca transaksi, kategori, dan tabungan
function doGet(e) {
  try {
    const book = (e && e.parameter && e.parameter.book) ? e.parameter.book : 'keluarga';
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Transaksi
    const txSheet = getOrCreateSheet(ss, 'Transaksi_' + book, [
      'ID', 'Timestamp', 'Tanggal', 'Tipe', 'Kategori', 'Tabungan_ID', 'Jumlah', 'Catatan', 'InputOleh'
    ]);
    const txData = txSheet.getDataRange().getValues();
    const transaksi = [];
    if (txData.length > 1) {
      for (let i = 1; i < txData.length; i++) {
        const row = txData[i];
        if (!row[0]) continue;
        transaksi.push({
          ID: String(row[0]),
          Timestamp: row[1] ? String(row[1]) : '',
          Tanggal: row[2] instanceof Date ? Utilities.formatDate(row[2], Session.getScriptTimeZone(), 'yyyy-MM-dd') : String(row[2]),
          Tipe: String(row[3] || 'Keluar'),
          Kategori: String(row[4] || ''),
          Tabungan_ID: row[5] ? String(row[5]) : null,
          Jumlah: Number(row[6]) || 0,
          Catatan: String(row[7] || ''),
          InputOleh: String(row[8] || '')
        });
      }
    }

    // 2. Kategori
    const katSheet = getOrCreateSheet(ss, 'Kategori_' + book, ['Tipe', 'Nama']);
    const katData = katSheet.getDataRange().getValues();
    const kategori = [];
    if (katData.length > 1) {
      for (let i = 1; i < katData.length; i++) {
        const row = katData[i];
        if (!row[1]) continue;
        kategori.push({
          Tipe: String(row[0] || 'Keluar'),
          Nama: String(row[1])
        });
      }
    }

    // 3. Tabungan
    const tabSheet = getOrCreateSheet(ss, 'Tabungan_' + book, ['ID', 'Nama', 'TargetNominal', 'TargetTanggal']);
    const tabData = tabSheet.getDataRange().getValues();
    const tabungan = [];
    if (tabData.length > 1) {
      for (let i = 1; i < tabData.length; i++) {
        const row = tabData[i];
        if (!row[0]) continue;
        tabungan.push({
          ID: String(row[0]),
          Nama: String(row[1] || ''),
          TargetNominal: Number(row[2]) || null,
          TargetTanggal: row[3] instanceof Date ? Utilities.formatDate(row[3], Session.getScriptTimeZone(), 'yyyy-MM-dd') : String(row[3] || '')
        });
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'ok',
      transaksi: transaksi,
      kategori: kategori,
      tabungan: tabungan
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Handler POST: Sinkronisasi data masuk, update, dan hapus
function doPost(e) {
  try {
    const raw = e && e.postData ? e.postData.contents : '';
    const payload = JSON.parse(raw);
    const book = payload.book || 'keluarga';
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    const results = {
      transaksiSynced: [],
      kategoriSynced: [],
      transaksiDeleted: [],
      tabunganSynced: [],
      tabunganDeleted: []
    };

    // 1. Sinkronisasi Transaksi Baru/Update
    const txSheet = getOrCreateSheet(ss, 'Transaksi_' + book, [
      'ID', 'Timestamp', 'Tanggal', 'Tipe', 'Kategori', 'Tabungan_ID', 'Jumlah', 'Catatan', 'InputOleh'
    ]);
    const txData = txSheet.getDataRange().getValues();
    const existingTxIds = new Map();
    for (let i = 1; i < txData.length; i++) {
      if (txData[i][0]) existingTxIds.set(String(txData[i][0]), i + 1); // baris 1-indexed
    }

    if (payload.transaksiBaru && payload.transaksiBaru.length > 0) {
      payload.transaksiBaru.forEach(t => {
        const row = [
          t.id,
          t.timestamp || new Date().toISOString(),
          t.tanggal,
          t.tipe,
          t.kategori,
          t.tabunganId || '',
          t.jumlah,
          t.catatan || '',
          t.inputOleh || ''
        ];
        if (existingTxIds.has(String(t.id))) {
          const rowNum = existingTxIds.get(String(t.id));
          txSheet.getRange(rowNum, 1, 1, row.length).setValues([row]);
        } else {
          txSheet.appendRow(row);
        }
        results.transaksiSynced.push(t.id);
      });
    }

    // 2. Hapus Transaksi
    if (payload.transaksiHapus && payload.transaksiHapus.length > 0) {
      const deleteSet = new Set(payload.transaksiHapus.map(String));
      const currentRows = txSheet.getDataRange().getValues();
      for (let i = currentRows.length - 1; i >= 1; i--) {
        const id = String(currentRows[i][0]);
        if (deleteSet.has(id)) {
          txSheet.deleteRow(i + 1);
          results.transaksiDeleted.push(id);
        }
      }
    }

    // 3. Tambah Kategori Baru
    if (payload.kategoriBaru && payload.kategoriBaru.length > 0) {
      const katSheet = getOrCreateSheet(ss, 'Kategori_' + book, ['Tipe', 'Nama']);
      const katData = katSheet.getDataRange().getValues();
      const existingKat = new Set();
      for (let i = 1; i < katData.length; i++) {
        existingKat.add((katData[i][0] || '') + '|' + (katData[i][1] || ''));
      }
      payload.kategoriBaru.forEach(k => {
        const key = k.tipe + '|' + k.nama;
        if (!existingKat.has(key)) {
          katSheet.appendRow([k.tipe, k.nama]);
          existingKat.add(key);
        }
        results.kategoriSynced.push(k.nama);
      });
    }

    // 4. Tabungan Baru / Update
    const tabSheet = getOrCreateSheet(ss, 'Tabungan_' + book, ['ID', 'Nama', 'TargetNominal', 'TargetTanggal']);
    const tabData = tabSheet.getDataRange().getValues();
    const existingTabIds = new Map();
    for (let i = 1; i < tabData.length; i++) {
      if (tabData[i][0]) existingTabIds.set(String(tabData[i][0]), i + 1);
    }

    if (payload.tabunganBaru && payload.tabunganBaru.length > 0) {
      payload.tabunganBaru.forEach(s => {
        const row = [s.id, s.nama, s.targetNominal || '', s.targetTanggal || ''];
        if (existingTabIds.has(String(s.id))) {
          const rowNum = existingTabIds.get(String(s.id));
          tabSheet.getRange(rowNum, 1, 1, row.length).setValues([row]);
        } else {
          tabSheet.appendRow(row);
        }
        results.tabunganSynced.push(s.id);
      });
    }

    // 5. Hapus Tabungan
    if (payload.tabunganHapus && payload.tabunganHapus.length > 0) {
      const deleteTabSet = new Set(payload.tabunganHapus.map(String));
      const currentTabRows = tabSheet.getDataRange().getValues();
      for (let i = currentTabRows.length - 1; i >= 1; i--) {
        const id = String(currentTabRows[i][0]);
        if (deleteTabSet.has(id)) {
          tabSheet.deleteRow(i + 1);
          results.tabunganDeleted.push(id);
        }
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'ok',
      results: results
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
