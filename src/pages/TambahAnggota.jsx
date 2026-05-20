import { useEffect, useMemo, useState } from 'react'

import { useNavigate, useSearchParams } from 'react-router-dom'
import { addAnggota, getLembagaList } from '../database/db'

const KATEGORI_LABEL_FALLBACK = {
  'kepala-desa': 'Kepala Desa',
  'perangkat-desa': 'Perangkat Desa',
  bpd: 'BPD',
  pkk: 'PKK',
  linmas: 'Linmas',
  kader: 'Kader',
  'rt-rw': 'RT/RW',
  'karang-taruna': 'Karang Taruna',
}

function labelFallback(kategori) {
  return KATEGORI_LABEL_FALLBACK[kategori] ?? kategori
}

export default function TambahAnggota() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const initialKategori = searchParams.get('kategori') ?? ''
  const initialLembagaId = searchParams.get('lembaga_id') ?? ''

  // Untuk kompatibilitas sementara: UI masih pakai 'kategori' sebagai value select
  // tapi DB layer sudah memakai field 'lembaga_id'.
  const [kategori, setKategori] = useState(initialLembagaId || initialKategori)

  const [nama, setNama] = useState('')
  const [nik, setNik] = useState('')
  const [jabatan, setJabatan] = useState('')
  const [dusun, setDusun] = useState('')
  const [alamat, setAlamat] = useState('')
  const [nomorHp, setNomorHp] = useState('')
  const [pendidikan, setPendidikan] = useState('')
  const [masaJabatan, setMasaJabatan] = useState('')
  const [fotoBase64, setFotoBase64] = useState('')
  const [fotoPreviewUrl, setFotoPreviewUrl] = useState('')

  const [catatan, setCatatan] = useState('')


  const [lembaga, setLembaga] = useState([])
  const [lembagaLoading, setLembagaLoading] = useState(true)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const lembagaOptions = useMemo(() => {
    // pastikan label tampil pakai label dari store
    return lembaga
      .map((x) => ({ id: x.id, label: x.nama }))
      .filter((x) => x.id)
  }, [lembaga])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLembagaLoading(true)
        const res = await getLembagaList()
        if (!cancelled) setLembaga(res)
      } catch {
        if (!cancelled) setLembaga([])
      } finally {
        if (!cancelled) setLembagaLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    return () => {
      if (fotoPreviewUrl) URL.revokeObjectURL(fotoPreviewUrl)
    }
  }, [fotoPreviewUrl])


  // Jika kategori awal belum ada di dropdown (atau belum dipilih), fallback label tetap ada

  const kategoriLabelFromStore = useMemo(() => {
    const found = lembagaOptions.find((x) => x.id === kategori)
    return found?.label
  }, [kategori, lembagaOptions])

  const finalKategoriLabel = kategoriLabelFromStore || labelFallback(kategori)

  const onSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (!nama.trim()) throw new Error('Nama wajib diisi')
      if (!kategori.trim()) throw new Error('Kategori wajib diisi')

      await addAnggota({
        lembaga_id: kategori,

        nama,
        nik,
        jabatan,
        dusun,
        alamat,
        nomor_hp: nomorHp,
        pendidikan,
        masa_jabatan: masaJabatan,
        foto: fotoBase64,
        catatan,
      })



      navigate(`/lembaga/${encodeURIComponent(kategori)}`)
    } catch (err) {
      setError(err?.message ?? 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Tambah Anggota</h1>
        <div className="actions">
          <button className="btn btn-secondary" onClick={() => navigate('/lembaga')}>
            Kembali
          </button>
        </div>
      </div>

      <form className="card" onSubmit={onSubmit}>
        {error ? <p className="error">{error}</p> : null}

        <label className="field">
          <span>Kategori</span>
          <select
            value={kategori}
            onChange={(e) => setKategori(e.target.value)}
            disabled={lembagaLoading}
            style={{
              backgroundColor: '#ffffff',
              color: '#000000',
              border: '1px solid #000000',
            }}
            className="w-full rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option
              value=""
              style={{
                backgroundColor: '#ffffff',
                color: '#000000',
              }}
            >
              -- Pilih kategori --
            </option>
            {lembagaOptions.map((x) => (
              <option
                key={x.id}
                value={x.id}
                style={{
                  backgroundColor: '#000000',
                  color: '#000000',
                }}
              >
                {x.label}
              </option>
            ))}
          </select>
          <div style={{ marginTop: 6, fontSize: 13, color: 'var(--text-sub, #475569)' }}>
            Dipilih: <b>{finalKategoriLabel || '-'}</b>
          </div>
        </label>

        <label className="field">
          <span>Nama</span>
          <input value={nama} onChange={(e) => setNama(e.target.value)} />
        </label>

        <label className="field">
          <span>NIK</span>
          <input value={nik} onChange={(e) => setNik(e.target.value)} />
        </label>

        <label className="field">
          <span>Jabatan</span>
          <input value={jabatan} onChange={(e) => setJabatan(e.target.value)} />
        </label>

        <label className="field">
          <span>Dusun</span>
          <input value={dusun} onChange={(e) => setDusun(e.target.value)} />
        </label>

        <label className="field">
          <span>Alamat</span>
          <input value={alamat} onChange={(e) => setAlamat(e.target.value)} />
        </label>

        <label className="field">
          <span>Nomor HP</span>
          <input value={nomorHp} onChange={(e) => setNomorHp(e.target.value)} />
        </label>

        <label className="field">
          <span>Pendidikan</span>
          <input value={pendidikan} onChange={(e) => setPendidikan(e.target.value)} />
        </label>

        <label className="field">
          <span>Masa Jabatan</span>
          <input value={masaJabatan} onChange={(e) => setMasaJabatan(e.target.value)} />
        </label>

        <label className="field">
          <span>Foto Profil (Galeri/Kamera)</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0]

              if (!file) return

              // Preview (UI)
              const url = URL.createObjectURL(file)
              setFotoPreviewUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev)
                return url
              })

              // Persist ke IndexedDB: base64 string
              const reader = new FileReader()
              reader.onload = () => {
                const result = reader.result
                if (typeof result === 'string') {
                  setFotoBase64(result)
                } else {
                  setFotoBase64('')
                }
              }
              reader.onerror = () => setFotoBase64('')
              reader.readAsDataURL(file)
            }}
          />
          {fotoPreviewUrl ? (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8 }}>
              <img
                src={fotoPreviewUrl}
                alt="Preview foto"
                style={{ border: '1px solid rgba(2, 6, 23, 0.18)', padding: 4, borderRadius: 6 }}
              />
              <span style={{ fontSize: 13, color: 'var(--text-sub, #475569)' }}>Preview</span>
            </div>
          ) : null}
        </label>

        <label className="field">
          <span>Catatan</span>
          <input value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Opsional" />
        </label>

        <div className="form-actions">
          <button className="btn" type="submit" disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
  )
}




