import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, CheckCircle, Search, Plus, Download, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '../context/AuthContext';

const MaintenanceNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterStatus, setFilterStatus] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    
    const { user } = useAuth();

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const url = filterStatus ? `/notifications?status=${filterStatus}` : '/notifications';
            const { data } = await api.get(url);
            setNotifications(data);
            setError(null);
        } catch (err) {
            console.error('Error fetching notifications:', err);
            setError('Error al cargar los avisos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [filterStatus]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDIENTE': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'PROCESADO': return 'bg-green-100 text-green-800 border-green-200';
            case 'RECHAZADO': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getPriorityIcon = (priority) => {
        switch (priority) {
            case 'CRITICO': return <AlertTriangle size={16} className="text-red-500 mr-1" />;
            case 'ALTO': return <AlertTriangle size={16} className="text-orange-500 mr-1" />;
            case 'MEDIO': return <Clock size={16} className="text-yellow-500 mr-1" />;
            case 'BAJO': return <CheckCircle size={16} className="text-green-500 mr-1" />;
            default: return null;
        }
    };

    const filteredNotifications = notifications.filter(notif => 
        notif.notification_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notif.Machine?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notif.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleExportExcel = () => {
        const dataToExport = filteredNotifications.map(notif => ({
            'ID Aviso': notif.notification_number,
            'Fecha': new Date(notif.created_at).toLocaleDateString(),
            'Hora': new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            'Planta': notif.Plant?.name || '',
            'Área': notif.Area?.name || '',
            'Máquina': notif.Machine?.name || '',
            'Sub-Máquina': notif.SubMachine?.name || '',
            'Descripción': notif.description,
            'Prioridad': notif.priority,
            'Estado': notif.status,
            'Solicitante': notif.User?.username || '',
            'OT Asociada': notif.WorkOrder?.ticket_number || 'N/A'
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Avisos');
        XLSX.writeFile(wb, `Avisos_Mantenimiento_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleDelete = async (id, notificationNumber) => {
        if (user.role !== 'admin' && user.role !== 'supervisor') {
            alert('No tienes permisos para eliminar registros.');
            return;
        }

        if (window.confirm(`¿Estás seguro de que deseas eliminar el aviso ${notificationNumber}? Esta acción no se puede deshacer.`)) {
            try {
                await api.delete(`/notifications/${id}`);
                setNotifications(notifications.filter(n => n.id !== id));
            } catch (err) {
                console.error('Error deleting notification:', err);
                alert('Error al eliminar el aviso');
            }
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Avisos de Mantenimiento</h1>
                    <p className="text-slate-500 text-sm">Gestión de reportes de fallas de producción</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handleExportExcel}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center shadow-sm transition-colors"
                    >
                        <Download size={20} className="mr-2" /> Exportar a Excel
                    </button>
                    <Link to="/notifications/new" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center shadow-sm transition-colors">
                        <Plus size={20} className="mr-2" /> Nuevo Aviso
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
                <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between gap-4 bg-slate-50">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por ID, equipo o descripción..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            className="border border-slate-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="">Todos los Estados</option>
                            <option value="PENDIENTE">Pendientes</option>
                            <option value="PROCESADO">Procesados (OT Generada)</option>
                            <option value="RECHAZADO">Rechazados</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-slate-500">Cargando avisos...</div>
                ) : error ? (
                    <div className="p-8 text-center text-red-500">{error}</div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                        No se encontraron avisos que coincidan con los filtros.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-100 text-slate-600 text-sm uppercase tracking-wider">
                                    <th className="p-4 border-b font-semibold">ID</th>
                                    <th className="p-4 border-b font-semibold">Fecha</th>
                                    <th className="p-4 border-b font-semibold">Equipo</th>
                                    <th className="p-4 border-b font-semibold">Descripción</th>
                                    <th className="p-4 border-b font-semibold">Prioridad</th>
                                    <th className="p-4 border-b font-semibold">Estado</th>
                                    <th className="p-4 border-b font-semibold">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredNotifications.map((notif) => (
                                    <tr key={notif.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 font-mono text-sm text-slate-700 font-medium">
                                            {notif.notification_number}
                                        </td>
                                        <td className="p-4 text-sm text-slate-600">
                                            {new Date(notif.created_at).toLocaleDateString()} <br/>
                                            <span className="text-xs text-slate-400">{new Date(notif.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm font-semibold text-slate-800">{notif.Machine?.name || 'N/A'}</div>
                                            <div className="text-xs text-slate-500">{notif.Area?.name || ''}</div>
                                        </td>
                                        <td className="p-4 max-w-xs">
                                            <p className="text-sm text-slate-600 truncate" title={notif.description}>
                                                {notif.description}
                                            </p>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center text-sm font-medium">
                                                {getPriorityIcon(notif.priority)}
                                                {notif.priority}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(notif.status)}`}>
                                                {notif.status}
                                            </span>
                                            {notif.WorkOrder && (
                                                <div className="mt-1 text-xs text-blue-600 font-mono">
                                                    <Link to={`/work-orders/${notif.WorkOrder.id}`} className="hover:underline">
                                                        {notif.WorkOrder.ticket_number}
                                                    </Link>
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                <Link 
                                                    to={`/notifications/${notif.id}`}
                                                    className="text-blue-600 hover:text-blue-900 text-sm font-medium bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors inline-block"
                                                >
                                                    Ver Detalles
                                                </Link>
                                                {(user.role === 'admin' || user.role === 'supervisor') && (
                                                    <button 
                                                        onClick={() => handleDelete(notif.id, notif.notification_number)}
                                                        className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-1.5 rounded-lg transition-colors"
                                                        title="Eliminar registro"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MaintenanceNotifications;
