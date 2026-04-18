import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import AddData from './pages/AddData'
import Segments from './pages/Segments'
import Recommendations from './pages/Recommendations'

export default function App() {
  return (
    <BrowserRouter>
      <div className="bg-background text-on-surface font-sans antialiased overflow-hidden flex h-screen">
        <Sidebar />
        <main className="flex-1 flex flex-col h-full ml-[260px] overflow-hidden">
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="/add-data"         element={<AddData />} />
            <Route path="/segments"         element={<Segments />} />
            <Route path="/recommendations"  element={<Recommendations />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
