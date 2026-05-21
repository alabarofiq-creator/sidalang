import { useMemo, useRef, useState } from 'react'
import { backupAllData, restoreAllData } from '../database/db'

function useToast() {
  const [toasts, setToasts] = useState([])

  const push = (type, message) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3200)
  }

  const ToastHost = () => (
    <div className="toast-host" aria-live="polite" aria-relevant="additions">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`} role="status">
          {t.message}
        </div>
      ))}
    </div>
  )

  return { push, ToastHost }
}

function formatISODateYYYYMMDD(d = new Date()) {
  return new Date(d).toISOString().slice(0, 10)
}

function downloadJson(filename, dataObj) {
  const blob = new Blob([JSON.stringify(dataObj, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()

  setTimeout(() => URL.revokeObjectURL(url), 0)
}

function validateBackupPayload(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('Format backup tidak valid')

  const lembaga = payload.lembaga
  const anggota = payload.anggota
  const exported_at = payload.exported_at

  if (!Array.isArray(lembaga) || !Array.isArray(anggota)) {
    throw new Error('Backup harus berisi lembaga[] dan anggota[]')
  }

  // exported_at optional (tapi file format diminta)
  if (exported_at !== undefined && typeof exported_at !== 'string') {
    throw new Error('exported_at harus string (YYYY-MM-DD)')
  }
}

export default function BackupRestore() {
  const fileRef = useRef(null)
  const [loadingBackup, setLoadingBackup] = useState(false)
  const [loadingRestore, setLoadingRestore] = useState(false)
  const [error, setError] = useState('')
  const { push, ToastHost } = useToast()

  const disabled = loadingBackup || loadingRestore

  const backupFilename = useMemo(() => {
    return `backup-sidalang-${formatISODateYYYYMMDD()}.json`
  }, [])

  const onBackup = async () => {
    setError('')
    if (disabled) return

    setLoadingBackup(true)
    try {
      const data = await backupAllData()
      downloadJson(backupFilename, data)
      push('success', 'Backup berhasil')
    } catch (e) {
      setError(e?.message ?? 'Gagal melakukan backup')
      push('error', 'Backup gagal')
    } finally {
      setLoadingBackup(false)
    }
  }

  const onPickFile = async (file) => {
    if (!file) return
    setError('')
    if (disabled) return

    let parsed
    try {
      const text = await file.text()
      parsed = JSON.parse(text)
      validateBackupPayload(parsed)
    } catch (e) {
      setError(e?.message ?? 'File JSON tidak valid')
      push('error', 'Restore gagal')
      return
    }

    const ok = window.confirm('Restore akan mengganti seluruh data lama. Lanjutkan?')
    if (!ok) return

    setLoadingRestore(true)
    try {
      await restoreAllData(parsed)
      push('success', 'Restore berhasil')
      // reset input so same file can be selected again
      if (fileRef.current) fileRef.current.value = ''
    } catch (e) {
      setError(e?.message ?? 'Gagal melakukan restore')
      push('error', 'Restore gagal')
    } finally {
      setLoadingRestore(false)
    }
  }

  return (
    <div className="page">
      <style>{`
        .backup-grid{display:grid;grid-template-columns:1fr;gap:12px}
        .backup-actions{display:flex;gap:10px;flex-wrap:wrap}
        .toast-host{position:fixed;bottom:18px;left:50%;transform:translateX(-50%);z-index:1000;display:flex;flex-direction:column;gap:10px;max-width:92vw}
        .toast{padding:12px 14px;border-radius:14px;border:1px solid var(--border);box-shadow:var(--shadow);font-weight:800;background:rgba(255,255,255,0.92);color:var(--text-h)}
        .toast.success{border-color:rgba(5,150,105,0.35);background:rgba(5,150,105,0.10)}
        .toast.error{border-color:rgba(220,38,38,0.35);background:rgba(220,38,38,0.10)}
        .file-input{padding:0}
        @media (max-width:520px){.backup-actions{flex-direction:column;align-items:stretch}.backup-actions .btn{width:100%}}
      `}</style>

      <div className="page-header">
        <h1>Backup & Restore</h1>
        <div className="actions">
          <button
            className="btn btn-secondary"
            onClick={() => (window.location.href = '/anggota')}
            disabled={disabled}
          >
            Kembali
          </button>
        </div>
      </div>

      <div className="card">
        {error ? <p className="error">{error}</p> : null}

        <div className="backup-grid">
          <div>
            <h2 style={{ marginBottom: 10 }}>Backup Data</h2>
            <div className="backup-actions">
              <button className="btn" onClick={onBackup} disabled={loadingBackup}>
                {loadingBackup ? 'Membuat backup...' : '⤓ Backup Data'}
              </button>
            </div>
            <p style={{ marginTop: 10, color: 'var(--text-sub, #475569)', fontSize: 13, fontWeight: 750 }}>
              File JSON berisi semua data pada store: lembaga & anggota (termasuk foto base64).
            </p>
          </div>

          <div style={{ height: 1, background: 'rgba(203,213,225,0.55)', margin: '10px 0' }} />

          <div>
            <h2 style={{ marginBottom: 10 }}>Restore Data</h2>
            <div className="backup-actions">
              <input
                ref={fileRef}
                className="file-input"
                type="file"
                accept="application/json,.json"
                disabled={loadingRestore || loadingBackup}
                onChange={(e) => onPickFile(e.target.files?.[0])}
              />

              <button
                className="btn btn-secondary"
                onClick={() => fileRef.current?.click()}
                disabled={loadingRestore || loadingBackup}
              >
                ⤒ Restore Data
              </button>
            </div>

            <p style={{ marginTop: 10, color: 'var(--text-sub, #475569)', fontSize: 13, fontWeight: 750 }}>
              Restore akan mengganti seluruh data lama. Pastikan backup yang dipilih benar.
            </p>
          </div>
        </div>
      </div>

      <ToastHost />
    </div>
  )
}

