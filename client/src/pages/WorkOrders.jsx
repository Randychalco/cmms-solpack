import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Plus, Search, Filter, Download, Upload, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ImportModal from '../components/ImportModal';
import { useAuth } from '../context/AuthContext';

const WorkOrders = () => {
    const [workOrders, setWorkOrders] = useState([]);
    const [filteredPOs, setFilteredPOs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL'); // ALL, OPEN, CLOSED
    const [showImportModal, setShowImportModal] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        fetchWorkOrders();
    }, []);

    async function fetchWorkOrders() {
        try {
            const { data } = await api.get('/work-orders');
            setWorkOrders(data);
            setFilteredPOs(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching work orders:', error);
            setLoading(false);
        }
    }

    useEffect(() => {
        if (filter === 'ALL') {
            setFilteredPOs(workOrders);
        } else {
            setFilteredPOs(workOrders.filter(wo => wo.status === filter));
        }
    }, [filter, workOrders]);

    const handleExport = async () => {
        try {
            const response = await api.get('/export/work-orders', {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const timestamp = new Date().toISOString().slice(0, 10);
            link.setAttribute('download', `ordenes_trabajo_${timestamp}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error exportando:', error);
            alert('Error al exportar órdenes de trabajo');
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm('¿Estás seguro de eliminar esta orden de trabajo?')) return;

        try {
            await api.delete(`/work-orders/${id}`);
            fetchWorkOrders();
        } catch (error) {
            console.error('Error deleting work order:', error);
            alert('Error al eliminar la orden de trabajo');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'ABIERTA': return 'bg-blue-100 text-blue-800';
            case 'EN_PROCESO': return 'bg-yellow-100 text-yellow-800';
            case 'PENDIENTE_MATERIALES': return 'bg-orange-100 text-orange-800';
            case 'CERRADA': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Órdenes de Trabajo</h1>
                <div className="flex gap-2">
                    <button
                        onClick={handleExport}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
                    >
                        <Download size={20} /> <span className="hidden md:inline">Exportar</span>
                    </button>
                    {user?.role === 'admin' && (
                        <button
                            onClick={() => setShowImportModal(true)}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700"
                        >
                            <Upload size={20} /> <span className="hidden md:inline">Importar</span>
                        </button>
                    )}
                    <button
                        onClick={() => navigate('/work-orders/new')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
                    >
                        <Plus size={20} /> <span className="hidden md:inline">Nueva OT</span>
                    </button>
                </div>
            </div>

            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {['ALL', 'ABIERTA', 'EN_PROCESO', 'CERRADA'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${filter === status ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border'}`}
                    >
                        {status === 'ALL' ? 'Todos' : status.replace('_', ' ')}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-center py-10">Cargando...</div>
            ) : filteredPOs.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredPOs.map((wo) => (
                        <div key={wo.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/work-orders/${wo.id}`)}>
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <span className="text-xs font-bold text-slate-500">#{wo.ticket_number}</span>
                                    <h3 className="font-bold text-slate-800">{wo.Machine?.name || 'Equipo General'}</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(wo.status)}`}>
                                        {wo.status.replace('_', ' ')}
                                    </span>
                                    {user?.role === 'admin' && (
                                        <button
                                            onClick={(e) => handleDelete(e, wo.id)}
                                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                                            title="Eliminar OT"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <p className="text-sm text-slate-600 mb-3 line-clamp-2">{wo.failure_description || 'Sin descripción'}</p>
                            <div className="flex justify-between items-center text-xs text-slate-500 border-t pt-3">
                                <span>{wo.Plant?.name} - {wo.Area?.name}</span>
                                <span>{new Date(wo.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 text-slate-500">No hay órdenes de trabajo encontradas</div>
            )}

            <ImportModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onSuccess={() => {
                    fetchWorkOrders();
                }}
                title="Carga Masiva de OTs"
                uploadUrl="/import/work-orders"
                templateUrl="/import/template/work-orders"
                templateName="plantilla_ots.xlsx"
            />
        </div>
    );
};

export default WorkOrders;
