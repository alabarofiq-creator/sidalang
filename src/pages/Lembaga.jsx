import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { countAnggotaByLembagaId, getLembagaList } from '../database/db'

const DEFAULT_KATEGORI = [
  { key: 'kepala-desa', label: 'Kepala Desa', icon: '👨‍💼' },
  { key: 'perangkat-desa', label: 'Perangkat Desa', icon: '👥' },
  { key: 'bpd', label: 'BPD', icon: '🏛️' },
  { key: 'pkk', label: 'PKK', icon: '👩‍🧑‍🤝‍🧑' },
  { key: 'linmas', label: 'Linmas', icon: '🛡️' },
  { key: 'kader', label: 'Kader', icon: '🧑‍⚕️' },
  { key: 'rt-rw', label: 'RT/RW', icon: '🏘️' },
  { key: 'karang-taruna', label: 'Karang Taruna', icon: '💪' },
]

export default function Lembaga() {
  const navigate = useNavigate()

  const [lembaga, setLembaga] = useState([])
  const [anggotaCountByLembaga, setAnggotaCountByLembaga] = useState(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        setError('')
        const res = await getLembagaList()
        if (cancelled) return
        setLembaga(res)
      } catch (e) {
        if (cancelled) return
        setError(e?.message ?? 'Gagal memuat daftar lembaga')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const counts = new Map()
        const keys = new Set(DEFAULT_KATEGORI.map((d) => d.key))
        for (const x of lembaga) keys.add(x.id)

        for (const k of keys) {
          const c = await countAnggotaByLembagaId(k)
          counts.set(k, c)
        }

        if (!cancelled) setAnggotaCountByLembaga(counts)
      } catch {
        if (!cancelled) setAnggotaCountByLembaga(new Map())
      }

    })()

    return () => {
      cancelled = true
    }
  }, [lembaga])

  const combined = useMemo(() => {
    const byId = new Map()

    for (const d of DEFAULT_KATEGORI) {
      byId.set(d.key, { key: d.key, label: d.label, icon: d.icon || '🏛️' })
    }

    // override jika ada data lembaga di DB (pakai icon & nama dari DB)
    for (const x of lembaga) {
      byId.set(x.id, {
        key: x.id,
        label: x.nama,
        icon: x.icon || byId.get(x.id)?.icon || '🏛️',
      })
    }

    return Array.from(byId.values()).map((item) => ({
      ...item,
      jumlahAnggota: anggotaCountByLembaga.get(item.key) ?? 0,
    }))
  }, [lembaga, anggotaCountByLembaga])

  return (
    <div className="page">
      <div className="page-header">
        <h1>Lembaga</h1>
        <div className="actions">
          <button className="btn btn-secondary" onClick={() => navigate('/anggota')}>
            Semuanya
          </button>
          <button className="btn" onClick={() => navigate('/lembaga-jenis/tambah')}>
            + Jenis Lembaga
          </button>
        </div>
      </div>

      <div className="card">
<p style={{ margin: 0, color: 'var(--text-sub, #475569)' }}>
          Pilih kategori lembaga untuk melihat dan mengelola daftar anggotanya.
        </p>

        {loading ? <p style={{ marginTop: 14 }}>Memuat...</p> : null}
        {error ? <p className="error">{error}</p> : null}

        <div
          className="lmb-grid"
          style={{ marginTop: 14, display: loading ? 'none' : undefined }}
        >
          {combined.map((k) => (
            <Link
              key={k.key}
              className="lmb-card"
              to={`/lembaga/${encodeURIComponent(k.key)}`}
              style={{ cursor: 'pointer', textDecoration: 'none' }}
            >
              <div className="lmb-icon" aria-hidden="true">
                {k.icon || '🏛️'}
              </div>

              <div className="lmb-main">
                <div className="lmb-name">{k.label}</div>
                <div className="lmb-sub">{k.jumlahAnggota} Anggota</div>
              </div>

              <div className="lmb-action">
                <span className="tag">Lihat</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

