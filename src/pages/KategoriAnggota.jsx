import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deleteAnggota, getLembagaById, listAnggota, searchAnggota } from '../database/db'


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


export default function KategoriAnggota() {
  const { kategori } = useParams()
  const navigate = useNavigate()

  const [q, setQ] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const kategoriDecoded = decodeURIComponent(kategori ?? '')
  const [kategoriLabelDynamic, setKategoriLabelDynamic] = useState('')
  const kategoriLabel = kategoriLabelDynamic || labelFallback(kategoriDecoded)


  const runSearch = async (query) => {
    setLoading(true)
    setError('')
    try {
      const res = await searchAnggota(query, kategoriDecoded)
      setItems(res)
    } catch (e) {
      setError(e?.message ?? 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const lembaga = await getLembagaById(kategoriDecoded)
        if (!cancelled && lembaga?.label) setKategoriLabelDynamic(lembaga.label)

        const initial = await listAnggota()

        const filtered = initial.filter((a) =>
          String(a?.kategori ?? '').toLowerCase() === String(kategoriDecoded ?? '').toLowerCase(),
        )
        if (!cancelled) setItems(filtered)
      } catch {
        // fallback ke search
        if (!cancelled) runSearch('')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kategoriDecoded])

  useEffect(() => {
    const t = setTimeout(() => {
      runSearch(q)
    }, 200)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, kategoriDecoded])

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => String(b.id).localeCompare(String(a.id)))
  }, [items])

  const onDelete = async (id) => {
    const ok = window.confirm('Hapus anggota ini?')
    if (!ok) return
    await deleteAnggota(id)
    await runSearch(q)
  }

  const onTambah = () => {
    navigate(`/tambah-anggota?kategori=${encodeURIComponent(kategoriDecoded)}`)
  }


  return (
    <div className="page">
      <div className="page-header">
        <h1>{kategoriLabel}</h1>
        <div className="actions">
          <button className="btn" onClick={onTambah}>
            + Tambah
          </button>
        </div>
      </div>

      <div className="card">
        <label className="field">
          <span>Cari (nama/nik/jabatan/dusun/alamat/no hp/pendidikan/catatan)</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ketik untuk pencarian..."
          />
        </label>

        {error ? <p className="error">{error}</p> : null}

        {loading ? (
          <p>Memuat...</p>
        ) : sorted.length === 0 ? (
          <p>Belum ada data untuk kategori ini.</p>
        ) : (
          <div className="table">
            {sorted.map((a) => (
              <Link
                key={a.id}
                to={`/anggota/${a.id}`}
                className="row"
                style={{ cursor: 'pointer', textDecoration: 'none' }}
              >
                <div className="col">
                  <div className="title">{a.nama}</div>
                  <div className="sub">{a.nik}</div>
                </div>
                <div className="col right">
                  <div className="tag">{a.jabatan || '-'}</div>
                  <button
                    className="btn btn-danger"
                    style={{ padding: '8px 10px' }}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      onDelete(a.id)
                    }}
                  >
                    Hapus
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

