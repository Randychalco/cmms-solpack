import { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Wrench, Package, ClipboardList, Menu, X, LogOut, CheckSquare, Users, FileText, PenTool, ShoppingCart, Calendar, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const Layout = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [stockAlertCount, setStockAlertCount] = useState(0);
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const { data } = await api.get('/inventory/alerts');
                setStockAlertCount(data.length);
            } catch (e) {
                // silently ignore if fetch fails
            }
        };
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 5 * 60 * 1000); // every 5 min
        return () => clearInterval(interval);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { path: '/work-orders', label: 'Órdenes', icon: <ClipboardList size={20} /> },
        { path: '/assets', label: 'Activos', icon: <Wrench size={20} /> },
        {
            path: '/inventory', label: 'Inventario', icon: <Package size={20} />,
            badge: stockAlertCount > 0 ? stockAlertCount : null
        },
        { path: '/material-requests', label: 'Solicitudes', icon: <FileText size={20} /> },
        { path: '/checklists', label: 'Checklists', icon: <CheckSquare size={20} /> },
        { path: '/repairs', label: 'Reparaciones', icon: <PenTool size={20} /> },
        { path: '/preventive-history', label: 'Mantenimiento Preventivo', icon: <Calendar size={20} /> },
        { path: '/safety', label: 'Seguridad', icon: <ShieldAlert size={20} /> },
        { path: '/purchase-requests', label: 'Pedidos Compra', icon: <ShoppingCart size={20} /> },
    ];

    // Solo mostrar gestión de usuarios a administradores
    if (user?.role === 'admin') {
        navItems.push({ path: '/users', label: 'Usuarios', icon: <Users size={20} /> });
    }

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" onClick={() => setSidebarOpen(false)}></div>
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 font-bold text-xl border-b border-slate-700 flex justify-between items-center">
                    <span>CMMS Solpack</span>
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden"><X /></button>
                </div>

                <div className="p-4 border-b border-slate-700">
                    <div className="text-sm text-slate-400">Bienvenido,</div>
                    <div className="font-semibold">{user?.name}</div>
                    <div className="text-xs text-slate-500 uppercase">{user?.role}</div>
                </div>

                <nav className="mt-2 flex flex-col gap-1 p-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 p-3 rounded hover:bg-slate-800 ${location.pathname === item.path ? 'bg-slate-800 text-blue-400' : ''}`}
                            onClick={() => setSidebarOpen(false)}
                        >
                            {item.icon}
                            <span className="flex-1">{item.label}</span>
                            {item.badge && (
                                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center leading-tight">
                                    {item.badge}
                                </span>
                            )}
                        </Link>
                    ))}
                    <button onClick={handleLogout} className="flex items-center gap-3 p-3 rounded hover:bg-slate-800 text-red-400 mt-auto">
                        <LogOut size={20} /> Salir
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white shadow p-4 md:hidden flex items-center justify-between">
                    <div className="flex items-center">
                        <button onClick={() => setSidebarOpen(true)} className="p-2 mr-2"><Menu /></button>
                        <span className="font-bold">CMMS Solpack</span>
                    </div>
                </header>
                <main className="flex-1 overflow-auto p-4">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
