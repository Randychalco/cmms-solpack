import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Search, Layers, Calendar, Edit, Truck, CheckCircle, Package, Download, Trash2 } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const PurchaseRequests = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [plants, setPlants] = useState([]);
    const [areas, setAreas] = useState([]);
    const [machines, setMachines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    // Modals state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);

    // Form states
    const [formData, setFormData] = useState({
        plant_id: '',
        area_id: '',
        machine_id: '',
        part_name: '',
        part_number: '',
        quantity: 1,
        justification: '',
        priority: 'MEDIA',
        suggested_supplier: ''
    });

    const [statusData, setStatusData] = useState({
        status: '',
        po_number: ''
    });

    useEffect(() => {
        fetchRequests();
        fetchPlants();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const response = await api.get('/purchase-requests');
            setRequests(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching purchase requests:', err);
            setError('Error al cargar los pedidos de compra.');
        } finally {
            setLoading(false);
        }
    };

    const fetchPlants = async () => {
        try {
            const { data } = await api.get('/master/plants');
            setPlants(data);
        } catch (error) {
            console.error('Error fetching plants:', error);
        }
    };

    const fetchAreas = async (plantId) => {
        try {
            const { data } = await api.get(`/master/areas/${plantId}`);
            setAreas(data);
        } catch (error) {
            console.error('Error fetching areas:', error);
        }
    };

    const fetchMachines = async (areaId) => {
        try {
            const { data } = await api.get(`/master/machines/${areaId}`);
            setMachines(data);
        } catch (err) {
            console.error('Error fetching machines:', err);
        }
    };

    useEffect(() => {
        if (formData.plant_id) {
            fetchAreas(formData.plant_id);
            setFormData(prev => ({ ...prev, area_id: '', machine_id: '' }));
            setMachines([]);
        } else {
            setAreas([]);
            setMachines([]);
        }
    }, [formData.plant_id]);

    useEffect(() => {
        if (formData.area_id) {
            fetchMachines(formData.area_id);
            setFormData(prev => ({ ...prev, machine_id: '' }));
        } else {
            setMachines([]);
        }
    }, [formData.area_id]);

    const handleCreateRequest = async (e) => {
        e.preventDefault();
        try {
            await api.post('/purchase-requests', formData);
            setIsCreateModalOpen(false);
            setFormData({
                plant_id: '',
                area_id: '',
                machine_id: '',
                part_name: '',
                part_number: '',
                quantity: 1,
                justification: '',
                priority: 'MEDIA',
                suggested_supplier: ''
            });
            fetchRequests();
        } catch (err) {
            console.error('Error creating purchase request:', err);
            alert('Error al registrar el pedido de compra.');
        }
    };

    const handleUpdateStatus = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/purchase-requests/${selectedRequest.id}/status`, statusData);
            setIsStatusModalOpen(false);
            setSelectedRequest(null);
            setStatusData({ status: '', po_number: '' });
            fetchRequests();
        } catch (err) {
            console.error('Error updating purchase request status:', err);
            alert('Error al actualizar el estado del pedido.');
        }
    };

    const openStatusModal = (request) => {
        setSelectedRequest(request);
        setStatusData({
            status: request.status,
            po_number: request.po_number || ''
        });
        setIsStatusModalOpen(true);
    };

    const handleDeleteRequest = async (id, partName) => {
        if (user.role !== 'admin' && user.role !== 'supervisor') {
            alert('No tienes permisos para eliminar registros.');
            return;
        }

        if (window.confirm(`¿Estás seguro de que deseas eliminar el pedido de "${partName}"? Esta acción no se puede deshacer.`)) {
            try {
                await api.delete(`/purchase-requests/${id}`);
                setRequests(requests.filter(r => r.id !== id));
            } catch (err) {
                console.error('Error deleting purchase request:', err);
                alert('Error al eliminar el pedido de compra.');
            }
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDIENTE': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'APROBADO': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'COTIZADO': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'COMPRADO': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
            case 'RECIBIDO': return 'bg-green-100 text-green-800 border-green-200';
            case 'RECHAZADO': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'ALTA': return 'text-red-600 font-bold';
            case 'MEDIA': return 'text-yellow-600 font-bold';
            case 'BAJA': return 'text-green-600 font-bold';
            default: return 'text-slate-600';
        }
    };

    const handleExportExcel = async () => {
        try {
            const res = await api.get('/export/purchase-requests', {
                params: {
                    status: filterStatus
                },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `pedidos_compra_${new Date().toISOString().slice(0, 10)}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            console.error('Error exportando a Excel:', error);
            alert('Hubo un error al exportar los datos.');
        }
    };

    const filteredRequests = requests.filter(request => {
        const matchesStatus = filterStatus === 'ALL' || request.status === filterStatus;
        const matchesSearch = searchTerm === '' ||
            request.part_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            request.justification?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            request.Machine?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    return (
        <div className="p-4 md:p-6 bg-slate-50 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <ShoppingCart className="text-blue-600" />
                        Pedidos de Compra
                    </h1>
                    <p className="text-slate-500 mt-1">Gestión de solicitudes de repuestos y materiales nuevos</p>
                </div>
                <div className="flex gap-2 mt-4 md:mt-0">
                    <button
                        onClick={handleExportExcel}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 transition"
                    >
                        <Download size={20} />
                        <span className="hidden sm:inline">Exportar Excel</span>
                    </button>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
                    >
                        <Plus size={20} />
                        Nuevo Pedido
                    </button>
                </div>
            </div>

            {error && <div className="bg-red-100 text-red-600 p-3 rounded mb-4">{error}</div>}

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <button
                        onClick={() => setFilterStatus('ALL')}
                        className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium ${filterStatus === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setFilterStatus('PENDIENTE')}
                        className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium ${filterStatus === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        Pendientes
                    </button>
                    <button
                        onClick={() => setFilterStatus('COMPRADO')}
                        className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium ${filterStatus === 'COMPRADO' ? 'bg-indigo-100 text-indigo-700 border border-indigo-300' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        Comprados
                    </button>
                    <button
                        onClick={() => setFilterStatus('RECIBIDO')}
                        className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium ${filterStatus === 'RECIBIDO' ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        Recibidos
                    </button>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar repuesto, máquina..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-100 text-slate-600 uppercase text-xs">
                                <th className="p-4 font-bold border-b">ID</th>
                                <th className="p-4 font-bold border-b">Repuesto</th>
                                <th className="p-4 font-bold border-b">Cant.</th>
                                <th className="p-4 font-bold border-b">Máquina / Destino</th>
                                <th className="p-4 font-bold border-b">Prioridad</th>
                                <th className="p-4 font-bold border-b text-center">Estado</th>
                                <th className="p-4 font-bold border-b text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-slate-500">Cargando pedidos...</td>
                                </tr>
                            ) : filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-slate-500">No se encontraron pedidos de compra.</td>
                                </tr>
                            ) : (
                                filteredRequests.map(request => (
                                    <tr key={request.id} className="border-b hover:bg-slate-50 transition">
                                        <td className="p-4 font-mono text-xs text-slate-500" title={request.id}>{request.id.substring(0, 6)}</td>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800">{request.part_name}</div>
                                            <div className="text-xs text-slate-500">
                                                {request.part_number && <span className="mr-2">N/P: {request.part_number}</span>}
                                                {request.suggested_supplier && <span>Prov: {request.suggested_supplier}</span>}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center font-bold text-slate-700">{request.quantity}</td>
                                        <td className="p-4 text-sm text-slate-700">
                                            {request.Machine ? (
                                                <div className="flexflex-col">
                                                    <span className="font-semibold">{request.Machine.name}</span>
                                                    <span className="text-xs text-slate-400 block">{request.Machine.Area?.Plant?.name} &gt; {request.Machine.Area?.name}</span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 italic">No especificada</span>
                                            )}
                                        </td>
                                        <td className={`p-4 text-sm ${getPriorityColor(request.priority)}`}>
                                            {request.priority}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`text-xs px-2 py-1 rounded-full font-bold border ${getStatusColor(request.status)}`}>
                                                {request.status}
                                            </span>
                                            {request.po_number && (
                                                <div className="text-xs text-slate-500 mt-1 font-mono">OC: {request.po_number}</div>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex gap-2 justify-center">
                                                <button
                                                    onClick={() => openStatusModal(request)}
                                                    className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded text-sm font-medium transition border border-blue-200 hover:border-blue-600 flex items-center justify-center gap-1 flex-1"
                                                >
                                                    <Edit size={14} /> Gestionar
                                                </button>
                                                {(user.role === 'admin' || user.role === 'supervisor') && (
                                                    <button
                                                        onClick={() => handleDeleteRequest(request.id, request.part_name)}
                                                        className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-1.5 rounded transition-colors border border-red-100 hover:border-red-300"
                                                        title="Eliminar registro"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Request Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="bg-blue-600 p-4 text-white flex justify-between items-center shrink-0">
                            <h2 className="font-bold text-lg flex items-center gap-2"><ShoppingCart size={20} /> Nuevo Pedido de Compra</h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="hover:text-blue-200">&times;</button>
                        </div>
                        <div className="overflow-y-auto p-6">
                            <form id="create-request-form" onSubmit={handleCreateRequest}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-slate-700 font-bold mb-1 text-sm">Nombre del Repuesto / Material *</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            placeholder="Ej: Rodamiento SKF 6205, Contacto Auxiliar..."
                                            value={formData.part_name}
                                            onChange={e => setFormData({ ...formData, part_name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-700 font-bold mb-1 text-sm">Cantidad *</label>
                                        <input
                                            required
                                            type="number"
                                            min="1"
                                            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            value={formData.quantity}
                                            onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-700 font-bold mb-1 text-sm">Prioridad *</label>
                                        <select
                                            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            value={formData.priority}
                                            onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                        >
                                            <option value="BAJA">BAJA</option>
                                            <option value="MEDIA">MEDIA</option>
                                            <option value="ALTA">ALTA</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-slate-700 font-bold mb-1 text-sm">Equipo Destino (Opcional)</label>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                            <select
                                                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                value={formData.plant_id}
                                                onChange={e => setFormData({ ...formData, plant_id: e.target.value })}
                                            >
                                                <option value="">-- Seleccione Planta --</option>
                                                {plants.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </select>
                                            <select
                                                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100"
                                                value={formData.area_id}
                                                onChange={e => setFormData({ ...formData, area_id: e.target.value })}
                                                disabled={!formData.plant_id}
                                            >
                                                <option value="">-- Seleccione Área --</option>
                                                {areas.map(a => (
                                                    <option key={a.id} value={a.id}>{a.name}</option>
                                                ))}
                                            </select>
                                            <select
                                                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100"
                                                value={formData.machine_id}
                                                onChange={e => setFormData({ ...formData, machine_id: e.target.value })}
                                                disabled={!formData.area_id}
                                            >
                                                <option value="">-- Seleccione Máquina --</option>
                                                {machines.map(m => (
                                                    <option key={m.id} value={m.id}>{m.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-slate-700 font-bold mb-1 text-sm">Justificación de la Compra *</label>
                                        <textarea
                                            required
                                            rows="2"
                                            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            placeholder="Por qué se necesita, para qué OT, urgencia..."
                                            value={formData.justification}
                                            onChange={e => setFormData({ ...formData, justification: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-700 font-bold mb-1 text-sm">Número de Parte / Código</label>
                                        <input
                                            type="text"
                                            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            placeholder="SKU o Código fabricante"
                                            value={formData.part_number}
                                            onChange={e => setFormData({ ...formData, part_number: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-700 font-bold mb-1 text-sm">Proveedor Sugerido / Marca</label>
                                        <input
                                            type="text"
                                            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            placeholder="Marca preferida o proveedor habitual"
                                            value={formData.suggested_supplier}
                                            onChange={e => setFormData({ ...formData, suggested_supplier: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="p-4 border-t border-slate-200 flex justify-end gap-3 shrink-0 bg-slate-50">
                            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded">Cancelar</button>
                            <button type="submit" form="create-request-form" className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700 transition">Crear Pedido</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Manage Status Modal */}
            {isStatusModalOpen && selectedRequest && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="bg-slate-800 p-4 text-white flex justify-between items-center">
                            <h2 className="font-bold text-lg flex items-center gap-2"><Edit size={20} /> Gestionar Pedido</h2>
                            <button onClick={() => setIsStatusModalOpen(false)} className="hover:text-slate-300">&times;</button>
                        </div>
                        <form onSubmit={handleUpdateStatus} className="p-6">
                            <p className="text-sm text-slate-600 mb-4 bg-slate-50 p-3 rounded border">
                                Pedido: <strong>{selectedRequest.part_name}</strong> (Cant: {selectedRequest.quantity})
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-slate-700 font-bold mb-1 text-sm">Cambiar Estado</label>
                                    <select
                                        className="w-full border p-2 rounded focus:ring-2 focus:ring-slate-500 focus:outline-none"
                                        value={statusData.status}
                                        onChange={e => setStatusData({ ...statusData, status: e.target.value })}
                                    >
                                        <option value="PENDIENTE">PENDIENTE</option>
                                        <option value="APROBADO">APROBADO</option>
                                        <option value="COTIZADO">COTIZADO</option>
                                        <option value="COMPRADO">COMPRADO</option>
                                        <option value="RECIBIDO">RECIBIDO</option>
                                        <option value="RECHAZADO">RECHAZADO</option>
                                    </select>
                                </div>
                                {(statusData.status === 'COMPRADO' || statusData.status === 'RECIBIDO' || selectedRequest.po_number) && (
                                    <div>
                                        <label className="block text-slate-700 font-bold mb-1 text-sm">Número de Orden de Compra (OC)</label>
                                        <input
                                            type="text"
                                            className="w-full border p-2 rounded focus:ring-2 focus:ring-slate-500 focus:outline-none"
                                            placeholder="N° de PO interna"
                                            value={statusData.po_number}
                                            onChange={e => setStatusData({ ...statusData, po_number: e.target.value })}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setIsStatusModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancelar</button>
                                <button type="submit" className="bg-slate-800 text-white px-6 py-2 rounded font-medium hover:bg-slate-900 transition">Guardar Cambios</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PurchaseRequests;
