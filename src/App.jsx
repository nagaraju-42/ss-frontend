import { useState } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { ChefHat, ClipboardList, LayoutDashboard, LogOut, Monitor, Settings, ShoppingBag, Navigation } from 'lucide-react';
import CustomerView from './components/CustomerView';
import KitchenView from './components/KitchenView';
import LoginView from './components/LoginView';
import MenuManager from './components/MenuManager';
import OwnerView from './components/OwnerView';
import QueueView from './components/QueueView';
import RiderView from './components/RiderView';

const ProtectedRoute = ({ children, allowedRoles, user }) => {
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/picker" replace />;
  return children;
};

const ROLE_COLORS = { OWNER: '#f59e0b', STAFF: '#3b82f6', PICKER: '#10b981' };

const NavBar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const logout = () => { onLogout(); navigate('/login'); };

  const NavLink = ({ to, icon, label, id }) => {
    const active = location.pathname === to;
    return (
      <Link
        to={to}
        id={id}
        className="nav-item"
        style={active ? {background:'rgba(245,158,11,0.12)',color:'#fbbf24',borderBottom:'2px solid #f59e0b'} : {}}
      >
        {icon} {label}
      </Link>
    );
  };

  return (
    <div
      className="sticky top-0 z-40"
      style={{background:'rgba(10,15,26,0.95)',backdropFilter:'blur(20px)',borderBottom:'1px solid rgba(255,255,255,0.07)'}}
    >
      <div className="max-w-7xl mx-auto flex items-center gap-1 px-3 py-2 overflow-x-auto" style={{scrollbarWidth:'none'}}>
        {/* Logo */}
        <div className="flex items-center gap-2 mr-3 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:'linear-gradient(135deg,#f59e0b,#d97706)'}}>
            <ShoppingBag size={14} color="#0a0f1a" />
          </div>
          <span className="text-xs font-black uppercase tracking-widest hidden sm:block" style={{color:'#f59e0b'}}>Softy Bakeries</span>
        </div>

        <NavLink to="/picker"  icon={<ClipboardList size={14}/>}   label="Picker"   id="nav-picker" />
        <NavLink to="/kitchen" icon={<ChefHat size={14}/>}         label="Kitchen"  id="nav-kitchen" />
        <NavLink to="/rider"   icon={<Navigation size={14}/>}      label="Rider"    id="nav-rider" />
        {user.role === 'OWNER' && (
          <>
            <NavLink to="/owner" icon={<LayoutDashboard size={14}/>} label="Dashboard" id="nav-owner" />
            <NavLink to="/menu"  icon={<Settings size={14}/>}        label="Menu"      id="nav-menu" />
          </>
        )}
        <Link to="/queue" target="_blank" className="nav-item" id="nav-queue">
          <Monitor size={14} /> Queue
        </Link>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2 pl-2 flex-shrink-0">
          <span
            className="text-xs font-black px-3 py-1.5 rounded-lg"
            style={{background:`${ROLE_COLORS[user.role]||'#f59e0b'}22`,color:ROLE_COLORS[user.role]||'#f59e0b',border:`1px solid ${ROLE_COLORS[user.role]||'#f59e0b'}44`}}
          >
            {user.username}
          </span>
          <button
            onClick={logout}
            className="p-2 rounded-xl"
            id="logout-btn"
            title="Logout"
            style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',color:'#f87171'}}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(() => {
    const s = sessionStorage.getItem('pastry_user');
    return s ? JSON.parse(s) : null;
  });

  const handleLogout = () => { sessionStorage.removeItem('pastry_user'); setUser(null); };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"      element={<CustomerView />} />
        <Route path="/queue" element={<QueueView />} />
        <Route path="/login" element={user ? <Navigate to="/picker" replace /> : <LoginView onLogin={setUser} />} />
        <Route path="/*" element={
          <>
            <NavBar user={user} onLogout={handleLogout} />
            <Routes>
              <Route path="/picker" element={
                <ProtectedRoute user={user} allowedRoles={['OWNER','STAFF','PICKER']}>
                  <KitchenView mode="picker" />
                </ProtectedRoute>
              } />
              <Route path="/kitchen" element={
                <ProtectedRoute user={user} allowedRoles={['OWNER','STAFF','PICKER']}>
                  <KitchenView mode="kitchen" />
                </ProtectedRoute>
              } />
              <Route path="/owner" element={
                <ProtectedRoute user={user} allowedRoles={['OWNER']}>
                  <OwnerView />
                </ProtectedRoute>
              } />
              <Route path="/menu" element={
                <ProtectedRoute user={user} allowedRoles={['OWNER']}>
                  <MenuManager />
                </ProtectedRoute>
              } />
              <Route path="/rider" element={
                <ProtectedRoute user={user} allowedRoles={['OWNER','STAFF','PICKER']}>
                  <RiderView />
                </ProtectedRoute>
              } />
            </Routes>
          </>
        } />
      </Routes>
    </BrowserRouter>
  );
}
