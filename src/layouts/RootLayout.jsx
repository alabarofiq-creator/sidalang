import { Link } from 'react-router-dom'

export default function RootLayout({ children }) {
  return (
    <div className="app">
      <header className="topbar">
        <Link className="brand" to="/">
          SIDALANG
        </Link>
        <nav className="nav">
          <Link className="navlink" to="/lembaga">
            Lembaga
          </Link>
          <Link className="navlink" to="/anggota">
            Anggota
          </Link>
          <Link className="navlink" to="/tambah-anggota">
            Tambah
          </Link>

          <Link className="navlink" to="/backup">
            Backup & Restore
          </Link>
        </nav>


      </header>

      <main className="container">{children}</main>

      <footer className="app-footer">
        <div className="creator-card" role="contentinfo" aria-label="Developer / Creator">
          <div className="creator-title">👨‍💻 Developed by Rofiq Budi Santoso</div>

          <div className="creator-socials">
            <a
              className="creator-social"
              href="https://instagram.com/rofiiiqbs"
              target="_blank"
              rel="noreferrer"
            >
              <span className="creator-social-icon" aria-hidden="true">
                📸
              </span>
              <span className="creator-social-meta">Instagram</span>
              <span className="creator-social-handle">@rofiiiqbs</span>
            </a>

            <a
              className="creator-social"
              href="https://tiktok.com/@rofiiiqbs"
              target="_blank"
              rel="noreferrer"
            >
              <span className="creator-social-icon" aria-hidden="true">
                🎵
              </span>
              <span className="creator-social-meta">TikTok</span>
              <span className="creator-social-handle">@rofiiiqbs</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}


