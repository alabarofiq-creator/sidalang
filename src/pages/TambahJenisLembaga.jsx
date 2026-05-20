import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addLembaga, getLembagaById } from '../database/db'

function toSlug(input) {
  return String(input ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

export default function TambahJenisLembaga() {
  const navigate = useNavigate()

  const [nama, setNama] = useState('')
  const [slug, setSlug] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const slugSuggestion = useMemo(() => {
    return toSlug(nama)
  }, [nama])

  const syncSlugIfEmpty = () => {
    setSlug((prev) => {
      if (prev.trim()) return prev
      return slugSuggestion
    })
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      if (!String(nama ?? '').trim()) throw new Error('Nama lembaga wajib diisi')

      const finalSlug = toSlug(slugSuggestion || slug)
      if (!finalSlug) throw new Error('Slug/key tidak valid')

      const existed = await getLembagaById(finalSlug)
      if (existed) throw new Error('Jenis lembaga dengan slug itu sudah ada')

      await addLembaga({ id: finalSlug, label: String(nama).trim() })
      navigate(`/lembaga/${encodeURIComponent(finalSlug)}`)
    } catch (err) {
      setError(err?.message ?? 'Gagal menyimpan jenis lembaga')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Tambah Jenis Lembaga</h1>
        <div className="actions">
          <button className="btn btn-secondary" onClick={() => navigate('/lembaga')}>
            Kembali
          </button>
        </div>
      </div>

      <form className="card" onSubmit={onSubmit}>
        {error ? <p className="error">{error}</p> : null}

        <label className="field">
          <span>Nama Lembaga</span>
          <input
            value={nama}
            onChange={(e) => {
              setNama(e.target.value)
              // jika slug belum diisi user, auto update dari nama
              // agar UX cepat
              setTimeout(syncSlugIfEmpty, 0)
            }}
            placeholder="Contoh: Forum Pemuda"
          />
        </label>

        <label className="field">
          <span>Slug/Key (untuk URL)</span>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder={slugSuggestion || 'contoh: forum-pemuda'}
          />
<div style={{ marginTop: 6, fontSize: 13, color: 'var(--text-sub, #475569)' }}>
            Saran slug: <b>{slugSuggestion || '-'}</b>
          </div>
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

