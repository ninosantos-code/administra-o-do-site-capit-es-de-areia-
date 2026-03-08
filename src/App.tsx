import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import PublicSite from './pages/PublicSite';
import AdminDashboard from './pages/AdminDashboard';
import { Anchor, Shield } from 'lucide-react';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-sand-50 text-sand-900 font-sans">
        <header className="bg-sand-900 text-sand-50 shadow-md sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2 text-xl font-serif font-bold tracking-wide">
              <Anchor className="w-6 h-6 text-ocean-500" />
              Capitães da Areia
            </Link>
            <nav>
              <Link to="/admin" className="flex items-center gap-2 text-sm font-medium hover:text-ocean-400 transition-colors">
                <Shield className="w-4 h-4" />
                Administração
              </Link>
            </nav>
          </div>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<PublicSite />} />
            <Route path="/admin" element={<div className="max-w-5xl mx-auto px-4 py-8"><AdminDashboard /></div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
