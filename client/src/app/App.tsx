import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { SettingsProvider } from '../context/SettingsContext'
import { Layout } from '../components/layout/Layout'
import { Dashboard } from '../pages/Dashboard'
import { DevicesPage } from '../pages/DevicesPage'
import { FilesPage } from '../pages/FilesPage'
import { TextPage } from '../pages/TextPage'
import { ClipboardPage } from '../pages/ClipboardPage'
import { ScreenPage } from '../pages/ScreenPage'
import { ActivityPage } from '../pages/ActivityPage'
import { SettingsPage } from '../pages/SettingsPage'
import { AboutPage } from '../pages/AboutPage'

function App() {
  return (
    <SettingsProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="devices" element={<DevicesPage />} />
            <Route path="files" element={<FilesPage />} />
            <Route path="text" element={<TextPage />} />
            <Route path="clipboard" element={<ClipboardPage />} />
            <Route path="screen" element={<ScreenPage />} />
            <Route path="activity" element={<ActivityPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="about" element={<AboutPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SettingsProvider>
  )
}

export default App
