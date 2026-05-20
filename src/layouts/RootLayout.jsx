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
        </nav>

      </header>

      <main className="container">{children}</main>
    </div>
  )
}

