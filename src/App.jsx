import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import RootLayout from './layouts/RootLayout'
import './App.css'
import './layouts/PageLayout.css'

import Anggota from './pages/Anggota'
import TambahAnggota from './pages/TambahAnggota'
import DetailAnggota from './pages/DetailAnggota'
import Lembaga from './pages/Lembaga'
import KategoriAnggota from './pages/KategoriAnggota'
import TambahJenisLembaga from './pages/TambahJenisLembaga'
import NotFound from './pages/NotFound'
import BackupRestore from './pages/BackupRestore'



function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <RootLayout>
              <Navigate to="/anggota" replace />
            </RootLayout>
          }
        />


        <Route
          path="/lembaga"
          element={
            <RootLayout>
              <Lembaga />
            </RootLayout>
          }
        />
        <Route
          path="/lembaga/:kategori"
          element={
            <RootLayout>
              <KategoriAnggota />
            </RootLayout>
          }
        />

        <Route
          path="/lembaga-jenis/tambah"
          element={
            <RootLayout>
              <TambahJenisLembaga />
            </RootLayout>
          }
        />

        <Route
          path="/anggota"
          element={
            <RootLayout>
              <Anggota />
            </RootLayout>
          }
        />

        <Route
          path="/tambah-anggota"
          element={
            <RootLayout>
              <TambahAnggota />
            </RootLayout>
          }
        />
        <Route
          path="/anggota/:id"
          element={
            <RootLayout>
              <DetailAnggota />
            </RootLayout>
          }
        />



        <Route
          path="/backup"
          element={
            <RootLayout>
              <BackupRestore />
            </RootLayout>
          }
        />

        <Route path="*" element={<RootLayout><NotFound /></RootLayout>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App





