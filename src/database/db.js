import { openDB } from 'idb'

const DB_NAME = 'sidalang-db'
const DB_VERSION = 3

const STORE_ANGGOTA = 'anggota'
const STORE_LEMBAGA = 'lembaga'

// DB target:
// lembaga: { id, nama, icon, created_at }
// anggota: { id, nama, lembaga_id, jabatan, dusun, alamat, nomor_hp, pendidikan, masa_jabatan, foto, catatan, created_at }

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  blocked() {
    // Ini dipanggil ketika versi DB diblokir oleh koneksi lain.
    // Tidak throw; biarkan aplikasi retry/refresh.
    try {
      console.warn('[IndexedDB] blocked() - another connection is blocking upgrade')
    } catch {
      // ignore
    }

  },

  blocking() {
    try {
      console.warn('[IndexedDB] blocking() - closing other connections to upgrade')
    } catch {
      // ignore
    }

  },

  terminated() {

    try {
      console.warn('[IndexedDB] terminated() - connection closed')
    } catch {
      // ignore
    }
  },

  upgrade(db, oldVersion, transaction) {
    // UPGRADE HANDLER: harus sinkron dan tanpa async/Promise custom.
    // Hindari pola yang memicu:
    // "Version change transaction was aborted in upgradeneeded event handler"


    function ensureStore(storeName, keyPath) {
      if (db.objectStoreNames.contains(storeName)) {
        return transaction.objectStore(storeName)
      }
      return db.createObjectStore(storeName, { keyPath })
    }

    function ensureIndex(store, indexName, keyPath, options = undefined) {
      // cek sebelum create untuk mencegah DuplicateError
      if (!store.indexNames.contains(indexName)) {
        store.createIndex(indexName, keyPath, options)
      }
    }

    // STORE: lembaga
    const lembagaStore = ensureStore(STORE_LEMBAGA, 'id')
    ensureIndex(lembagaStore, 'nama', 'nama', { unique: false })

    // STORE: anggota
    const anggotaStore = ensureStore(STORE_ANGGOTA, 'id')
    ensureIndex(anggotaStore, 'nama', 'nama', { unique: false })
    ensureIndex(anggotaStore, 'nik', 'nik', { unique: false })
    ensureIndex(anggotaStore, 'jabatan', 'jabatan', { unique: false })
    ensureIndex(anggotaStore, 'lembaga_id', 'lembaga_id', { unique: false })
    ensureIndex(anggotaStore, 'dusun', 'dusun', { unique: false })

    // Migration v2 -> v3: mapping label/kategori => nama/lembaga_id
    // Tetap lakukan sinkron-first: gunakan low-level request tanpa membuat Promise.
    if (oldVersion < 3) {
      // lembaga
      const lembagaReq = lembagaStore.getAll()
      lembagaReq.onsuccess = (e) => {
        const lembagaItems = e?.target?.result ?? []
        for (const item of lembagaItems) {
          const id = normalizeLembagaId(item?.id ?? '')
          if (!id) continue

          const nama = item?.nama ?? item?.label ?? ''
          const icon = item?.icon ?? ''
          const created_at = item?.created_at ?? item?.createdAt ?? Date.now()

          lembagaStore.put({
            ...item,
            id,
            nama: String(nama).trim(),
            icon: String(icon ?? '').trim(),
            created_at,
          })
        }
      }
      lembagaReq.onerror = () => {
        // Biarkan openDB gagal (fallback delete akan menangkap dari luar)
      }

      // anggota
      const anggotaReq = anggotaStore.getAll()
      anggotaReq.onsuccess = (e) => {
        const anggotaItems = e?.target?.result ?? []
        for (const item of anggotaItems) {
          const lembaga_id = normalizeLembagaId(item?.lembaga_id ?? item?.kategori ?? '')
          if (!lembaga_id) continue

          const created_at = item?.created_at ?? item?.createdAt ?? Date.now()

          anggotaStore.put({
            ...item,
            lembaga_id,
            created_at,
          })
        }
      }
      anggotaReq.onerror = () => {
        // Biarkan openDB gagal (fallback delete akan menangkap dari luar)
      }
    }

    return undefined
  },
})





function normalizeText(value) {
  return String(value ?? '').trim().toLowerCase()
}

function normalizeLembagaId(id) {
  return String(id ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function normalizeFoto(foto) {
  // kompatibel untuk data lama yang menyimpan string ''
  if (foto === '' || foto === undefined) return null
  if (foto === null) return null

  // Target: simpan base64 string (hasil FileReader.readAsDataURL)
  // Jika yang masuk bukan string, fallback: biarkan null agar tidak rusak.
  // (UI akan pakai fallback avatar jika foto null)
  if (typeof foto !== 'string') return null

  return foto
}




async function ensureDummyData() {

  const db = await dbPromise

  // seed lembaga jika kosong
  const lembagaCount = await db.count(STORE_LEMBAGA)
  if (lembagaCount === 0) {
    const seed = [
      { id: 'kepala-desa', nama: 'Kepala Desa', icon: '👤' },
      { id: 'perangkat-desa', nama: 'Perangkat Desa', icon: '👥' },
      { id: 'bpd', nama: 'BPD', icon: '🏛️' },
      { id: 'pkk', nama: 'PKK', icon: '👩‍🧒' },
      { id: 'linmas', nama: 'Linmas', icon: '🛡️' },
      { id: 'kader', nama: 'Kader', icon: '👥' },
      { id: 'rt-rw', nama: 'RT/RW', icon: '🏘️' },
      { id: 'karang-taruna', nama: 'Karang Taruna', icon: '💪' },
    ]

    const tx = db.transaction(STORE_LEMBAGA, 'readwrite')
    for (const item of seed) {
      await tx.store.add({
        id: item.id,
        nama: item.nama,
        icon: item.icon ?? '',
        created_at: Date.now(),
      })
    }
    await tx.done
  }

  const anggotaCount = await db.count(STORE_ANGGOTA)
  if (anggotaCount > 0) return

  // seed dummy anggota lama (best-effort) ke struktur baru
  const now = Date.now()
  const dummy = [
    {
      id: `${now}-kepala-1`,
      lembaga_id: 'kepala-desa',
      nama: 'Bambang Prasetyo',
      nik: '3201010101010101',
      jabatan: 'Kepala Desa',
      dusun: 'Dusun 1',
      alamat: 'Kp. Melati No. 10',
      nomor_hp: '081234567890',
      pendidikan: 'S1',
      masa_jabatan: '2023-2029',
      foto: '',
      catatan: '',
      created_at: Date.now(),
    },
    {
      id: `${now}-perangkat-1`,
      lembaga_id: 'perangkat-desa',
      nama: 'Siti Aminah',
      nik: '3201010101010102',
      jabatan: 'Sekretaris Desa',
      dusun: 'Dusun 2',
      alamat: 'Jl. Kenanga No. 22',
      nomor_hp: '081234567891',
      pendidikan: 'SMA',
      masa_jabatan: '2023-2029',
      foto: '',
      catatan: '',
      created_at: Date.now(),
    },
    {
      id: `${now}-perangkat-2`,
      lembaga_id: 'perangkat-desa',
      nama: 'Ahmad Fauzi',
      nik: '3201010101010103',
      jabatan: 'Kaur Keuangan',
      dusun: 'Dusun 3',
      alamat: 'Desa Sukamaju',
      nomor_hp: '081234567892',
      pendidikan: 'S1 Akuntansi',
      masa_jabatan: '2023-2029',
      foto: '',
      catatan: '',
      created_at: Date.now(),
    },
    {
      id: `${now}-bpd-1`,
      lembaga_id: 'bpd',
      nama: 'Rahmat Hidayat',
      nik: '3201010101010201',
      jabatan: 'Ketua BPD',
      dusun: 'Dusun 1',
      alamat: 'Kp. Melati No. 1',
      nomor_hp: '081234567893',
      pendidikan: 'SMA',
      masa_jabatan: '2024-2029',
      foto: '',
      catatan: '',
      created_at: Date.now(),
    },
    {
      id: `${now}-pkk-1`,
      lembaga_id: 'pkk',
      nama: 'Nurul Aisyah',
      nik: '3201010101010301',
      jabatan: 'Ketua PKK',
      dusun: 'Dusun 2',
      alamat: 'Jl. Kenanga No. 5',
      nomor_hp: '081234567894',
      pendidikan: 'D3',
      masa_jabatan: '2024-2029',
      foto: '',
      catatan: '',
      created_at: Date.now(),
    },
    {
      id: `${now}-linmas-1`,
      lembaga_id: 'linmas',
      nama: 'Wahyudi',
      nik: '3201010101010401',
      jabatan: 'Koordinator Linmas',
      dusun: 'Dusun 3',
      alamat: 'Desa Sukamaju',
      nomor_hp: '081234567895',
      pendidikan: 'SMA',
      masa_jabatan: '2024-2026',
      foto: '',
      catatan: '',
      created_at: Date.now(),
    },
  ]

  const tx = db.transaction(STORE_ANGGOTA, 'readwrite')
  for (const item of dummy) {
    await tx.store.add(item)
  }
  await tx.done
}

export async function addAnggota(data) {
  await ensureDummyData()
  const db = await dbPromise

  const toSave = {
    id: data?.id ?? createId(),
    nama: data?.nama ?? '',
    lembaga_id: normalizeLembagaId(data?.lembaga_id ?? data?.kategori ?? ''),
    jabatan: data?.jabatan ?? '',
    dusun: data?.dusun ?? '',
    alamat: data?.alamat ?? '',
    nomor_hp: data?.nomor_hp ?? '',
    pendidikan: data?.pendidikan ?? '',
    masa_jabatan: data?.masa_jabatan ?? '',
    foto: normalizeFoto(data?.foto),
    catatan: data?.catatan ?? '',
    nik: data?.nik ?? '',
    created_at: data?.created_at ?? Date.now(),
  }


  await db.add(STORE_ANGGOTA, toSave)
  return toSave
}

export async function getAnggota(id) {
  await ensureDummyData()
  const db = await dbPromise
  return db.get(STORE_ANGGOTA, id)
}

export async function updateAnggota(id, patch) {
  await ensureDummyData()
  const db = await dbPromise

  const current = await db.get(STORE_ANGGOTA, id)
  if (!current) throw new Error('Anggota not found')

  const updated = {
    ...current,
    ...(patch ?? {}),
    id,
    lembaga_id: patch?.lembaga_id
      ? normalizeLembagaId(patch?.lembaga_id)
      : current?.lembaga_id,
    created_at: current?.created_at ?? Date.now(),
  }

  await db.put(STORE_ANGGOTA, updated)
  return updated
}

export async function deleteAnggota(id) {
  await ensureDummyData()
  const db = await dbPromise
  await db.delete(STORE_ANGGOTA, id)
}

function matchesQuery(a, q) {
  const nama = normalizeText(a?.nama)
  const nik = normalizeText(a?.nik)
  const jabatan = normalizeText(a?.jabatan)
  const dusun = normalizeText(a?.dusun)
  const alamat = normalizeText(a?.alamat)
  const nomorHp = normalizeText(a?.nomor_hp)
  const pendidikan = normalizeText(a?.pendidikan)
  const masaJabatan = normalizeText(a?.masa_jabatan)
  const catatan = normalizeText(a?.catatan)

  return (
    nama.includes(q) ||
    nik.includes(q) ||
    jabatan.includes(q) ||
    dusun.includes(q) ||
    alamat.includes(q) ||
    nomorHp.includes(q) ||
    pendidikan.includes(q) ||
    masaJabatan.includes(q) ||
    catatan.includes(q)
  )
}

// realtime search (case-insensitive)
export async function searchAnggota(query, lembagaId = null) {
  await ensureDummyData()
  const db = await dbPromise

  const q = normalizeText(query)
  const k = lembagaId ? normalizeLembagaId(lembagaId) : null

  const all = await db.getAll(STORE_ANGGOTA)
  const filtered = k ? all.filter((a) => normalizeLembagaId(a?.lembaga_id) === k) : all

  if (!q) return filtered
  return filtered.filter((a) => matchesQuery(a, q))
}

export async function listAnggota() {
  await ensureDummyData()
  const db = await dbPromise
  return db.getAll(STORE_ANGGOTA)
}

export async function listAnggotaByLembagaId(lembagaId) {
  await ensureDummyData()
  const db = await dbPromise
  const k = normalizeLembagaId(lembagaId)
  const all = await db.getAll(STORE_ANGGOTA)
  return all.filter((a) => normalizeLembagaId(a?.lembaga_id) === k)
}

export async function countAnggotaByLembagaId(lembagaId) {
  await ensureDummyData()
  const list = await listAnggotaByLembagaId(lembagaId)
  return list.length
}

// LEMBAGA CRUD
export async function addLembaga(data) {
  await ensureDummyData()
  const db = await dbPromise

  const toSave = {
    id: normalizeLembagaId(data?.id),
    nama: String(data?.nama ?? data?.label ?? '').trim(),
    icon: String(data?.icon ?? '').trim(),
    created_at: Date.now(),
  }

  if (!toSave.id) throw new Error('Slug/id lembaga tidak valid')
  if (!toSave.nama) throw new Error('Nama lembaga wajib diisi')

  const existed = await db.get(STORE_LEMBAGA, toSave.id)
  if (existed) throw new Error('Jenis lembaga sudah ada')

  await db.add(STORE_LEMBAGA, toSave)
  return toSave
}

export async function updateLembaga(id, patch) {
  await ensureDummyData()
  const db = await dbPromise

  const current = await db.get(STORE_LEMBAGA, normalizeLembagaId(id))
  if (!current) throw new Error('Lembaga not found')

  const updated = {
    ...current,
    ...patch,
    id: normalizeLembagaId(id),
    nama: patch?.nama ?? patch?.label ?? current?.nama,
    icon: patch?.icon ?? current?.icon,
  }

  await db.put(STORE_LEMBAGA, updated)
  return updated
}

export async function deleteLembaga(id) {
  await ensureDummyData()
  const db = await dbPromise
  const lembagaId = normalizeLembagaId(id)

  // (Best-effort) hapus anggota terkait agar tidak menggantung.
  const anggota = await listAnggotaByLembagaId(lembagaId)
  const txA = db.transaction(STORE_ANGGOTA, 'readwrite')
  for (const a of anggota) {
    await txA.store.delete(a.id)
  }
  await txA.done

  await db.delete(STORE_LEMBAGA, lembagaId)
}

export async function getLembagaById(id) {
  await ensureDummyData()
  const db = await dbPromise
  const lembagaId = normalizeLembagaId(id)
  return db.get(STORE_LEMBAGA, lembagaId)
}

export async function getLembagaList() {
  await ensureDummyData()
  const db = await dbPromise
  const all = await db.getAll(STORE_LEMBAGA)
  return all
    .map((x) => ({
      ...x,
      id: normalizeLembagaId(x?.id),
      nama: String(x?.nama ?? x?.label ?? '').trim(),
      icon: String(x?.icon ?? '').trim(),
    }))
    .filter((x) => x.id && x.nama)
    .sort((a, b) => String(a.nama).localeCompare(String(b.nama)))
}



function normalizeBackupLembagaItem(item) {
  const id = normalizeLembagaId(item?.id ?? item?.slug ?? item?.key ?? '')
  return {
    ...item,
    id,
    nama: String(item?.nama ?? item?.label ?? '').trim(),
    icon: String(item?.icon ?? '').trim(),
    created_at: item?.created_at ?? item?.createdAt ?? Date.now(),
  }
}


function normalizeBackupAnggotaItem(item) {
  // Important: foto is base64 string (or '' / null)
  const lembaga_id = normalizeLembagaId(item?.lembaga_id ?? item?.kategori ?? '')
  const foto = normalizeFoto(item?.foto)

  return {
    ...item,
    id: String(item?.id ?? '').trim(),
    nama: String(item?.nama ?? '').trim(),
    lembaga_id,
    jabatan: String(item?.jabatan ?? '').trim(),
    dusun: String(item?.dusun ?? '').trim(),
    alamat: String(item?.alamat ?? '').trim(),
    nomor_hp: String(item?.nomor_hp ?? '').trim(),
    pendidikan: String(item?.pendidikan ?? '').trim(),
    masa_jabatan: String(item?.masa_jabatan ?? '').trim(),
    foto,
    catatan: String(item?.catatan ?? '').trim(),
    nik: String(item?.nik ?? '').trim(),
    created_at: item?.created_at ?? item?.createdAt ?? Date.now(),
  }
}


export async function backupAllData() {
  await ensureDummyData()
  const db = await dbPromise

  const lembaga = await db.getAll(STORE_LEMBAGA)
  const anggota = await db.getAll(STORE_ANGGOTA)

  // Keep as-is so base64 foto remains untouched
  const exported_at = new Date().toISOString().slice(0, 10)

  return {
    lembaga,
    anggota,
    exported_at,
  }
}

export async function restoreAllData(payload) {
  await ensureDummyData()
  const db = await dbPromise

  if (!payload || typeof payload !== 'object') {
    throw new Error('Format backup tidak valid')
  }

  const { lembaga, anggota } = payload

  if (!Array.isArray(lembaga) || !Array.isArray(anggota)) {
    throw new Error('Backup harus berisi lembaga[] dan anggota[]')
  }

  // Normalize first (so we can validate before touching DB)
  const normalizedLembaga = lembaga.map(normalizeBackupLembagaItem)
  const normalizedAnggota = anggota.map(normalizeBackupAnggotaItem)

  // Basic validation to avoid corrupt restore
  if (normalizedLembaga.some((x) => !x.id || !x.nama)) {
    // Allow empty? Not expected; treat as error to prevent broken relasi.
    throw new Error('Data lembaga pada backup tidak valid')
  }

  if (normalizedAnggota.some((x) => !x.id || !x.lembaga_id)) {
    throw new Error('Data anggota pada backup tidak valid')
  }

  // Ensure no duplicates by clearing first, then add with keyPath.
  const tx = db.transaction([STORE_LEMBAGA, STORE_ANGGOTA], 'readwrite')
  const lembagaStore = tx.objectStore(STORE_LEMBAGA)
  const anggotaStore = tx.objectStore(STORE_ANGGOTA)

  // Clear both stores first
  await Promise.all([lembagaStore.clear(), anggotaStore.clear()])

  // Insert lembaga first so relation lembaga_id is valid for UI consistency
  for (const l of normalizedLembaga) {
    await lembagaStore.put({
      ...l,
      id: normalizeLembagaId(l.id),
      nama: String(l.nama ?? '').trim(),
      icon: String(l.icon ?? '').trim(),
      created_at: l.created_at ?? Date.now(),
    })
  }

  for (const a of normalizedAnggota) {
    await anggotaStore.put({
      ...a,
      id: String(a.id).trim(),
      lembaga_id: normalizeLembagaId(a.lembaga_id),
      foto: normalizeFoto(a.foto),
      nama: String(a.nama ?? '').trim(),
      created_at: a.created_at ?? Date.now(),
    })
  }

  await tx.done
}



