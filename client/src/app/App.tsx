import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ensureAuthToken } from '../services/api'
import { SettingsProvider } from '../context/SettingsContext'
import { WsProvider } from '../context/WsContext'
import { ActivityProvider } from '../context/ActivityContext'
import { ToastProvider } from '../context/ToastContext'
import { TargetProvider } from '../context/TargetContext'
import { ToastContainer } from '../components/common/ToastContainer'
import { TransferConsentModal } from '../components/common/TransferConsentModal'
import { Layout } from '../components/layout/Layout'
import { Dashboard } from '../pages/Dashboard'
import { ConnectPage } from '../pages/ConnectPage'
import { QRPairPage } from '../pages/QRPairPage'
import { DevicesPage } from '../pages/DevicesPage'
import { FilesPage } from '../pages/FilesPage'
import { TextPage } from '../pages/TextPage'
import { ClipboardPage } from '../pages/ClipboardPage'
import { ScreenPage } from '../pages/ScreenPage'
import { ActivityPage } from '../pages/ActivityPage'
import { SettingsPage } from '../pages/SettingsPage'
import { AboutPage } from '../pages/AboutPage'

function App() {
  useEffect(() => {
    ensureAuthToken()
  }, [])

  return (
    <SettingsProvider>
      <ActivityProvider>
        <WsProvider>
          <TargetProvider>
            <ToastProvider>
              <ToastContainer />
              <TransferConsentModal />
              <BrowserRouter>
              <Routes>
                <Route path="/pair/qr" element={<QRPairPage />} />
                <Route path="/" element={<Layout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="connect" element={<ConnectPage />} />
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
          </ToastProvider>
        </TargetProvider>
      </WsProvider>
    </ActivityProvider>
  </SettingsProvider>
)
}

export default App
