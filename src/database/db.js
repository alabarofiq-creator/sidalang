import { openDB } from 'idb'

const DB_NAME = 'sidalang-db'
const DB_VERSION = 3

const STORE_ANGGOTA = 'anggota'
const STORE_LEMBAGA = 'lembaga'

// DB target:
// lembaga: { id, nama, icon, created_at }
// anggota: { id, nama, lembaga_id, jabatan, dusun, alamat, nomor_hp, pendidikan, masa_jabatan, foto, catatan, created_at }

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db, oldVersion, transaction) {
    // Helper untuk memastikan index dibuat hanya jika belum ada (menghindari DuplicateError)
    function ensureIndex(store, name, keyPath, options = { unique: false }) {
      if (!store.indexNames.contains(name)) {
        store.createIndex(name, keyPath, options)
      }
    }

    // STORE ANGGOTA
    let anggotaStore
    if (!db.objectStoreNames.contains(STORE_ANGGOTA)) {
      const created = db.createObjectStore(STORE_ANGGOTA, { keyPath: 'id' })
      ensureIndex(created, 'nama', 'nama', { unique: false })
      ensureIndex(created, 'nik', 'nik', { unique: false })
      ensureIndex(created, 'jabatan', 'jabatan', { unique: false })
      ensureIndex(created, 'lembaga_id', 'lembaga_id', { unique: false })
      ensureIndex(created, 'dusun', 'dusun', { unique: false })
      anggotaStore = created
    } else {
      anggotaStore = transaction.objectStore(STORE_ANGGOTA)
      // Pastikan index yang dibutuhkan ada walaupun store sudah ada
      ensureIndex(anggotaStore, 'nama', 'nama', { unique: false })
      ensureIndex(anggotaStore, 'nik', 'nik', { unique: false })
      ensureIndex(anggotaStore, 'jabatan', 'jabatan', { unique: false })
      ensureIndex(anggotaStore, 'lembaga_id', 'lembaga_id', { unique: false })
      ensureIndex(anggotaStore, 'dusun', 'dusun', { unique: false })
    }

    // STORE LEMBAGA
    let lembagaStore
    if (!db.objectStoreNames.contains(STORE_LEMBAGA)) {
      const created = db.createObjectStore(STORE_LEMBAGA, { keyPath: 'id' })
      ensureIndex(created, 'nama', 'nama', { unique: false })
      lembagaStore = created
    } else {
      lembagaStore = transaction.objectStore(STORE_LEMBAGA)
      ensureIndex(lembagaStore, 'nama', 'nama', { unique: false })
    }

    // Migration dari versi lama
    if (oldVersion < 3) {
      // Catatan: Handler `upgrade()` di `idb` tidak selalu di-parse sebagai async.
      // Pakai Promise-based yang memastikan semua request put selesai sebelum upgrade handler selesai.

      const lembagaReq = lembagaStore.getAll()
      const anggotaReq = anggotaStore.getAll()

      return Promise.all([lembagaReq, anggotaReq]).then(([lembagaItems, anggotaItems]) => {
        const puts = []

        // update lembaga
        for (const item of lembagaItems) {
          const nama = item?.nama ?? item?.label ?? ''
          const icon = item?.icon ?? ''
          const created_at = item?.created_at ?? item?.createdAt ?? Date.now()
          const id = normalizeLembagaId(item?.id ?? '')
          if (!id) continue

          puts.push(
            lembagaStore.put({
              ...item,
              id,
              nama: String(nama).trim(),
              icon: String(icon ?? ''),
              created_at,
            })
          )
        }

        // update anggota
        for (const item of anggotaItems) {
          const lembaga_id = normalizeLembagaId(item?.lembaga_id ?? item?.kategori ?? '')
          if (!lembaga_id) continue

          const created_at = item?.created_at ?? item?.createdAt ?? Date.now()

          puts.push(
            anggotaStore.put({
              ...item,
              lembaga_id,
              created_at,
              // kategori dibiarkan (opsional) untuk kompatibilitas data lama
            })
          )
        }

        return Promise.all(puts)
      })
    }


    // Jika tidak migrate, biarkan upgrade selesai normal.
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

