import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="page">
      <div className="page-header">
        <h1>Halaman tidak ditemukan</h1>
        <div className="actions">
          <button className="btn btn-secondary" onClick={() => navigate('/anggota')}>
            Kembali ke Anggota
          </button>
        </div>
      </div>
      <div className="card">
        <p>URL yang Anda buka tidak tersedia.</p>
      </div>
    </div>
  )
}

