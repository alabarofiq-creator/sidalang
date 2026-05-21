import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Building2,
  Users,
  PlusCircle,
  DatabaseBackup,
  Menu,
} from 'lucide-react'

function useOnClickOutside(ref, handler) {
  useEffect(() => {
    function onPointerDown(e) {
      if (!ref.current) return
      if (ref.current.contains(e.target)) return
      handler(e)
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [ref, handler])
}

export default function RootLayout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()
  const mobileMenuRef = useRef(null)

  useEffect(() => {
    // Close mobile dropdown when route changes
    // Avoid lint warning: schedule update in microtask.
    queueMicrotask(() => setIsMobileMenuOpen(false))
  }, [location.pathname])

  useOnClickOutside(mobileMenuRef, () => setIsMobileMenuOpen(false))

  return (
    <div className="app">
      <header className="topbar">
        <Link className="brand" to="/">
          SIDALANG
        </Link>

        {/* Desktop nav */}
        <nav className="nav nav-desktop">
          <Link className="navlink" to="/lembaga">
            <Building2 className="navlink-icon" size={16} aria-hidden="true" />
            <span className="navlink-text">Lembaga</span>
          </Link>
          <Link className="navlink" to="/anggota">
            <Users className="navlink-icon" size={16} aria-hidden="true" />
            <span className="navlink-text">Anggota</span>
          </Link>
          <Link className="navlink" to="/tambah-anggota">
            <PlusCircle className="navlink-icon" size={16} aria-hidden="true" />
            <span className="navlink-text">Tambah</span>
          </Link>

          <Link className="navlink" to="/backup">
            <DatabaseBackup className="navlink-icon" size={16} aria-hidden="true" />
            <span className="navlink-text">Backup</span>
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="nav-toggle"
          aria-label={isMobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
          aria-expanded={isMobileMenuOpen}
          onClick={() => setIsMobileMenuOpen((v) => !v)}
        >
          <Menu className="nav-toggle-icon" size={20} aria-hidden="true" />
        </button>
      </header>

      {/* Mobile dropdown */}
      <div
        className={`mobile-menu-wrap ${isMobileMenuOpen ? 'open' : ''}`}
        aria-hidden={!isMobileMenuOpen}
      >
        <div className="mobile-menu" ref={mobileMenuRef}>
          <Link
            className="navlink navlink-mobile"
            to="/lembaga"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Building2 className="navlink-icon navlink-icon-mobile" size={18} aria-hidden="true" />
            <span className="navlink-text">Lembaga</span>
          </Link>
          <Link
            className="navlink navlink-mobile"
            to="/anggota"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Users className="navlink-icon navlink-icon-mobile" size={18} aria-hidden="true" />
            <span className="navlink-text">Anggota</span>
          </Link>
          <Link
            className="navlink navlink-mobile"
            to="/tambah-anggota"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <PlusCircle className="navlink-icon navlink-icon-mobile" size={18} aria-hidden="true" />
            <span className="navlink-text">Tambah</span>
          </Link>
          <Link
            className="navlink navlink-mobile"
            to="/backup"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <DatabaseBackup className="navlink-icon navlink-icon-mobile" size={18} aria-hidden="true" />
            <span className="navlink-text">Backup</span>
          </Link>
        </div>
      </div>

      <main className="container">{children}</main>

      <footer className="app-footer">
        <div className="creator-minimal" role="contentinfo" aria-label="Developer / Creator">
          <div className="creator-minimal-title">Developed by Rofiq Budi Santoso</div>

          <div className="creator-minimal-socials">
            <a
              className="creator-minimal-social"
              href="https://instagram.com/rofiiiqbs"
              target="_blank"
              rel="noreferrer"
            >
              <span className="creator-minimal-ig" aria-hidden="true">◉</span>
              <span className="creator-minimal-handle">@rofiiiqbs</span>
            </a>

            <a
              className="creator-minimal-social"
              href="https://tiktok.com/@rofiiiqbs"
              target="_blank"
              rel="noreferrer"
            >
              <span className="creator-minimal-tt" aria-hidden="true">♪</span>
              <span className="creator-minimal-handle">@rofiiiqbs</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}