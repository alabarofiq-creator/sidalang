Catatan migrasi DB IndexedDB SIDALANG

Sebelum refactor:
- DB_VERSION = 2
- store lembaga: { id, label, createdAt }
- store anggota: { id, kategori, nama, ... }

Sesudah target:
- DB_VERSION akan dinaikkan (mis. 3)
- store lembaga: { id, nama, icon, created_at }
- store anggota: { id, lembaga_id, ... }

Strategi migrasi:
- Saat upgrade DB_VERSION:
  - Jika store lembaga lama masih ada field `label`:
    - mapping label -> nama
  - Jika store anggota masih punya field `kategori`:
    - buat/update record lembaga berdasarkan kategori-kategori dummy lama (slugisasi)
    - set anggota.lembaga_id = kategori lama (slug id lembaga)
    - hapus/biarkan field kategori (opsional)

Catatan:
- Ensure dummy data juga harus menyesuaikan data struktur baru.
- Semua fungsi pencarian/filter harus memakai lembaga_id bukan kategori.

