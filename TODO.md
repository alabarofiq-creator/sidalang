# TODO

- [ ] Investigasi akar masalah error IndexedDB: `Version change transaction was aborted in upgradeneeded event handler`
- [x] Identifikasi file penyebab utama: `src/database/db.js` (handler `upgrade()`)
- [x] Perbaiki migrasi `oldVersion < 3` agar lebih aman terhadap abort transaction (hilangkan pattern async yang berisiko)

- [ ] Jalankan/refresh aplikasi dan pastikan DB upgrade tidak error

