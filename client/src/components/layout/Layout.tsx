import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export function Layout() {
  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <Header />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
