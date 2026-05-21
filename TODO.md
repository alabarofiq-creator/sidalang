# TODO - HARD FIX TOTAL IndexedDB (src/database/db.js)

## Step 1
- [x] Inspect current IndexedDB init/openDB code in src/database/db.js
- [x] Inspect db migration notes
- [x] Identify unsafe patterns in upgrade handler (async/Promise, duplicate store/index creation)

## Step 2
- [x] Rewrite upgrade/openDB logic with synchronous, no async/Promise inside upgrade
- [x] Add store existence checks before createObjectStore
- [x] Add index existence checks before createIndex
- [x] Add safety handlers: blocked(), blocking(), terminated()
- [ ] Correct version handling and bump DB_VERSION to required value


## Step 3
- [ ] Add migration failure fallback: indexedDB.deleteDatabase('sidalang-db') only on total migration failure

## Step 4
- [ ] Run app build/test and sanity checks:
  - [ ] refresh browser
  - [ ] reload app
  - [ ] backup/restore
  - [ ] tambah anggota
  - [ ] deploy build

