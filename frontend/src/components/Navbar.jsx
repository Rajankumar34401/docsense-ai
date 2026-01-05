// src/components/Navbar.jsx
import { Link } from 'react-router-dom';

export default function Navbar({ user, logout }) {
  return (
    <nav className="h-16 bg-white border-b flex justify-between items-center px-8 shadow-sm">
      <h1 className="text-xl font-black text-blue-600 tracking-tighter italic">OPSMIND AI</h1>
      <div className="flex items-center gap-6 text-sm font-bold text-gray-600">
        <Link to="/" className="hover:text-blue-600">CHAT</Link>
        {user?.role === 'admin' && <Link to="/admin" className="hover:text-blue-600">ADMIN</Link>}
        <button onClick={logout} className="text-red-500 border border-red-200 px-4 py-1 rounded-lg hover:bg-red-50">Logout</button>
      </div>
    </nav>
  );
}