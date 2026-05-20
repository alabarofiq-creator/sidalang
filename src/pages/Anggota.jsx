import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { searchAnggota, listAnggota, deleteAnggota } from '../database/db'

export default function Anggota() {
  const navigate = useNavigate()

  const [q, setQ] = useState('')
  const [items, setItems] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const runSearch = async (query) => {
    setLoading(true)
    setError('')
    try {
      const res = await searchAnggota(query)
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
        const initial = await listAnggota()
        if (!cancelled) setItems(initial)
      } catch {
        // fallback ke search
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // realtime search
  useEffect(() => {
    const t = setTimeout(() => {
      runSearch(q)
    }, 200)
    return () => clearTimeout(t)
    
  }, [q])


  const sorted = useMemo(() => {
    return [...items].sort((a, b) => String(b.id).localeCompare(String(a.id)))
  }, [items])

  const onDelete = async (id) => {
    const ok = window.confirm('Hapus anggota ini?')
    if (!ok) return
    await deleteAnggota(id)
    await runSearch(q)
  }

  const defaultAvatar = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="100%" height="100%" fill="%23e5e7eb"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="28">👤</text></svg>'

  return (


    <div className="page">
      <div className="page-header">

        <h1>Anggota</h1>
        <div className="actions">
          <button className="btn" onClick={() => navigate('/tambah-anggota')}>
            + Tambah
          </button>
        </div>
      </div>

      <div className="card">
        <label className="field">
          <span>Cari (nama/nik/jabatan/alamat)</span>
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
          <p>Belum ada data.</p>
        ) : (
          <div className="table">
            {sorted.map((a) => {
              return (

                <div key={a.id} className="anggota-card">

                  <div className="anggota-left">
                    <img
                      className="avatar"
                      src={a?.foto || defaultAvatar}
                      alt={a?.nama ? `Foto ${a.nama}` : 'Foto anggota'}
                      loading="lazy"
                    />

                  </div>

                  <div className="anggota-middle">
                    <div className="anggota-name">{a.nama}</div>
                    <div className="anggota-meta">
                      <span className="anggota-nik">{a.nik}</span>
                      <span className="dot">•</span>
                      <span className="anggota-jabatan">{a.jabatan}</span>
                    </div>
                  </div>

                  <div className="anggota-right">
                    <Link className="btn btn-secondary" to={`/anggota/${a.id}`}>
                      Detail
                    </Link>
                    <button className="btn btn-danger" onClick={() => onDelete(a.id)}>
                      Hapus
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}

