import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { deleteAnggota, getAnggota, getLembagaById, updateAnggota } from '../database/db'


const KATEGORI_LABEL = {
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
  return KATEGORI_LABEL[kategori] ?? kategori
}


export default function DetailAnggota() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [data, setData] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setError('')
      try {
        const res = await getAnggota(id)
        if (!cancelled) setData(res ?? null)
      } catch (e) {
        if (!cancelled) setError(e?.message ?? 'Gagal memuat')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  const lembagaId = String(data?.lembaga_id ?? '')
  const [lembagaLabelDynamic, setLembagaLabelDynamic] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const lembaga = await getLembagaById(lembagaId)
        if (!cancelled && lembaga?.nama) setLembagaLabelDynamic(lembaga.nama)
        // fallback jika field yang tersimpan bukan `nama`
        if (!cancelled && lembaga?.label) setLembagaLabelDynamic(lembaga.label)
      } catch {
        // fallback
      }
    })()
    return () => {
      cancelled = true
    }
  }, [lembagaId])

  const kategoriLabel = lembagaLabelDynamic || labelFallback(lembagaId)

  const defaultAvatar =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><rect width="100%" height="100%" fill="%23e5e7eb"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="24">👤</text></svg>'


  const onChange = (patch) => {

    setData((prev) => (prev ? { ...prev, ...patch } : prev))
  }

  const onSave = async (e) => {
    e.preventDefault()
    if (!data) return
    setSaving(true)
    setError('')
    try {
      if (!String(data.nama ?? '').trim()) throw new Error('Nama wajib diisi')
      if (!String(data.lembaga_id ?? '').trim()) throw new Error('Kategori wajib diisi')
      await updateAnggota(id, data)
      navigate(`/lembaga/${encodeURIComponent(data.lembaga_id)}`)

    } catch (err) {
      setError(err?.message ?? 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async () => {
    const ok = window.confirm('Hapus anggota ini?')
    if (!ok) return
    setError('')
    try {
      await deleteAnggota(id)
      navigate(lembagaId ? `/lembaga/${encodeURIComponent(lembagaId)}` : '/lembaga')

    } catch (e) {
      setError(e?.message ?? 'Gagal menghapus')
    }
  }

  if (!data) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>Detail Anggota</h1>
          <div className="actions">
            <button className="btn btn-secondary" onClick={() => navigate('/lembaga')}>
              Kembali
            </button>
          </div>
        </div>
        <div className="card">{error ? <p className="error">{error}</p> : <p>Memuat...</p>}</div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Detail Anggota</h1>
        <div className="actions">
          <button
            className="btn btn-secondary"
            onClick={() => navigate(lembagaId ? `/lembaga/${encodeURIComponent(lembagaId)}` : '/lembaga')}
          >
            Kembali
          </button>

          <button className="btn btn-danger" onClick={onDelete}>
            Hapus
          </button>
        </div>
      </div>

      <form className="card" onSubmit={onSave}>
        {error ? <p className="error">{error}</p> : null}

        <label className="field">
          <span>Kategori</span>
          <input value={kategoriLabel} readOnly />
        </label>


        <label className="field">
          <span>Nama</span>
          <input value={data.nama} onChange={(e) => onChange({ nama: e.target.value })} />
        </label>

        <label className="field">
          <span>NIK</span>
          <input value={data.nik} onChange={(e) => onChange({ nik: e.target.value })} />
        </label>

        <label className="field">
          <span>Jabatan</span>
          <input value={data.jabatan} onChange={(e) => onChange({ jabatan: e.target.value })} />
        </label>

        <label className="field">
          <span>Dusun</span>
          <input value={data.dusun} onChange={(e) => onChange({ dusun: e.target.value })} />
        </label>

        <label className="field">
          <span>Alamat</span>
          <input value={data.alamat} onChange={(e) => onChange({ alamat: e.target.value })} />
        </label>

        <label className="field">
          <span>Nomor HP</span>
          <input
            value={data.nomor_hp}
            onChange={(e) => onChange({ nomor_hp: e.target.value })}
          />
        </label>

        <label className="field">
          <span>Pendidikan</span>
          <input
            value={data.pendidikan}
            onChange={(e) => onChange({ pendidikan: e.target.value })}
          />
        </label>

        <label className="field">
          <span>Masa Jabatan</span>
          <input
            value={data.masa_jabatan}
            onChange={(e) => onChange({ masa_jabatan: e.target.value })}
          />
        </label>

        <label className="field">
          <span>Foto Profil (Galeri/Kamera)</span>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0]

              if (!file) return

              const reader = new FileReader()
              reader.onload = () => {
                const result = reader.result
                if (typeof result === 'string') {
                  onChange({ foto: result })
                } else {
                  onChange({ foto: '' })
                }
              }
              reader.onerror = () => onChange({ foto: '' })
              reader.readAsDataURL(file)
            }}


          />
          <div style={{ marginTop: 8 }}>
            <img
              src={data?.foto || defaultAvatar}
              alt={data?.nama ? `Foto ${data.nama}` : 'Foto anggota'}
              className="avatar"
              style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 60 }}
            />

          </div>
        </label>



        <label className="field">
          <span>Catatan</span>
          <input value={data.catatan} onChange={(e) => onChange({ catatan: e.target.value })} />
        </label>

        <div className="form-actions">
          <button className="btn" type="submit" disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </div>
  )
}


