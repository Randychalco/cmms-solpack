import { useState, useEffect } from 'react';
import { PackageOpen, Plus, Search, CheckCircle2, XCircle, Clock, FileEdit, Trash2, Download } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const MaterialRequests = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('Todos');

    // Create Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [fullInventory, setFullInventory] = useState([]);

    // Equipment State
    const [plants, setPlants] = useState([]);
    const [areas, setAreas] = useState([]);
    const [machines, setMachines] = useState([]);

    const [selectedPlant, setSelectedPlant] = useState('');
    const [selectedArea, setSelectedArea] = useState('');
    const [selectedMachine, setSelectedMachine] = useState('');

    const [inventoryKeyword, setInventoryKeyword] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [requestNotes, setRequestNotes] = useState('');

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await api.get('/material-requests');
            setRequests(res.data);
        } catch (error) {
            console.error('Error fetching material requests:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch full inventory when modal opens
    useEffect(() => {
        if (isCreateModalOpen && fullInventory.length === 0) {
            fetchFullInventory();
        }
    }, [isCreateModalOpen]);

    const fetchFullInventory = async () => {
        try {
            const res = await api.get('/inventory');
            setFullInventory(res.data);

            // Also fetch plants when modal opens for equipment selection
            const plantsRes = await api.get('/master/plants');
            setPlants(plantsRes.data);
        } catch (error) {
            console.error('Error fetching inventory or plants:', error);
        }
    };

    // Handle cascade dropdowns for Equipment
    useEffect(() => {
        if (selectedPlant) {
            api.get(`/master/areas/${selectedPlant}`).then(res => setAreas(res.data));
            setSelectedArea('');
            setMachines([]);
            setSelectedMachine('');
        }
    }, [selectedPlant]);

    useEffect(() => {
        if (selectedArea) {
            api.get(`/master/machines/${selectedArea}`).then(res => setMachines(res.data));
            setSelectedMachine('');
        }
    }, [selectedArea]);


    // Instant local search
    useEffect(() => {
        if (!inventoryKeyword.trim()) {
            setSearchResults([]);
            return;
        }

        const term = inventoryKeyword.toLowerCase();
        const filtered = fullInventory.filter(item =>
            (item.sku && item.sku.toLowerCase().includes(term)) ||
            (item.description && item.description.toLowerCase().includes(term)) ||
            (item.code && item.code.toLowerCase().includes(term)) ||
            (item.name && item.name.toLowerCase().includes(term))
        );

        // Map to standard format if needed (since API might return code/name instead of sku/description depending on backend mapping)
        const standardizedResults = filtered.map(item => ({
            id: item.id,
            sku: item.code || item.sku,
            description: item.name || item.description,
            quantity: item.current_stock || item.quantity,
            unit_measure: item.unit_measure
        }));

        setSearchResults(standardizedResults.slice(0, 20)); // Limit to 20 for performance
    }, [inventoryKeyword, fullInventory]);

    const handleAddItem = (item) => {
        if (!selectedItems.find(i => i.id === item.id)) {
            setSelectedItems([...selectedItems, { ...item, quantity_requested: 1 }]);
        }
    };

    const handleItemQuantityChange = (id, newQuantity) => {
        setSelectedItems(items => items.map(item =>
            item.id === id ? { ...item, quantity_requested: parseInt(newQuantity) || 1 } : item
        ));
    };

    const handleRemoveItem = (id) => {
        setSelectedItems(items => items.filter(item => item.id !== id));
    };

    const handleSubmitRequest = async (e) => {
        e.preventDefault();
        if (selectedItems.length === 0) return alert('Debes agregar al menos un ítem.');

        try {
            const payload = {
                items: selectedItems.map(i => ({
                    id: i.id,
                    sku: i.sku,
                    description: i.description,
                    quantity_requested: i.quantity_requested,
                    unit_measure: i.unit_measure
                })),
                machine_id: selectedMachine || null, // Optional if they don't select one
                notes: requestNotes
            };

            await api.post('/material-requests', payload);
            setIsCreateModalOpen(false);
            setSelectedItems([]);
            setRequestNotes('');
            setInventoryKeyword('');
            setSearchResults([]);
            setSelectedPlant('');
            setSelectedArea('');
            setSelectedMachine('');
            fetchRequests();
        } catch (error) {
            console.error('Error creating request:', error);
            const errorMsg = error.response?.data?.message || error.response?.data || error.message || 'Error desconocido';
            alert(`Error al crear la solicitud: ${errorMsg}`);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Seguro que deseas eliminar esta solicitud?')) {
            try {
                await api.delete(`/material-requests/${id}`);
                fetchRequests();
            } catch (error) {
                console.error('Error deleting request:', error);
            }
        }
    };

    const handleExportExcel = async () => {
        try {
            const res = await api.get('/export/material-requests', {
                params: { status: filterStatus === 'Todos' ? undefined : filterStatus },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `solicitudes_materiales_${new Date().toISOString().slice(0, 10)}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error exportando a Excel:', error);
            alert('Hubo un error al exportar los datos.');
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'En Proceso': return <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 flex items-center gap-1"><Clock size={12} /> En Proceso</span>;
            case 'Asignado': return <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex items-center gap-1"><FileEdit size={12} /> Asignado a OT</span>;
            case 'Completado': return <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center gap-1"><CheckCircle2 size={12} /> Completado</span>;
            case 'Rechazado': return <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 flex items-center gap-1"><XCircle size={12} /> Rechazado</span>;
            default: return <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
        }
    };

    const filteredRequests = requests.filter(req => {
        const matchesSearch = req.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.user_name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'Todos' || req.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <PackageOpen className="text-indigo-600" size={32} />
                        Solicitudes de Materiales
                    </h1>
                    <p className="text-slate-500 mt-1">Gestiona los requerimientos de almacén antes de la OT.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleExportExcel}
                        className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl hover:bg-emerald-700 transition font-medium shadow-md hover:shadow-lg"
                    >
                        <Download size={20} />
                        <span className="hidden sm:inline">Exportar Excel</span>
                    </button>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition font-medium shadow-md hover:shadow-lg"
                    >
                        <Plus size={20} />
                        <span>Nueva Solicitud</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between bg-slate-50/50">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por notas o usuario..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="border border-slate-300 rounded-xl px-4 py-2 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        <option value="Todos">Todos los estados</option>
                        <option value="En Proceso">En Proceso</option>
                        <option value="Asignado">Asignado a OT</option>
                        <option value="Completado">Completado</option>
                        <option value="Rechazado">Rechazado</option>
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600 uppercase tracking-wider">
                                <th className="p-4">ID</th>
                                <th className="p-4">Usuario</th>
                                <th className="p-4">Equipo Destino</th>
                                <th className="p-4">SKU</th>
                                <th className="p-4">Descripción</th>
                                <th className="p-4 text-center">Cant. Solicitada</th>
                                <th className="p-4">Estado</th>
                                <th className="p-4">Fecha</th>
                                <th className="p-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {loading ? (
                                <tr><td colSpan="6" className="text-center p-8 text-slate-500">Cargando solicitudes...</td></tr>
                            ) : filteredRequests.length === 0 ? (
                                <tr><td colSpan="6" className="text-center p-8 text-slate-500">No se encontraron solicitudes.</td></tr>
                            ) : (
                                filteredRequests.map(req => (
                                    <tr key={req.id} className="hover:bg-slate-50 transition">
                                        <td className="p-4 font-mono text-xs text-slate-500">
                                            {req.id.substring(0, 8).toUpperCase()}...
                                        </td>
                                        <td className="p-4 font-medium text-slate-800">
                                            {req.user_name || 'Desconocido'}
                                        </td>
                                        <td className="p-4 text-sm text-slate-600">
                                            {req.machine_name ? (
                                                <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md text-xs font-semibold">
                                                    {req.machine_name}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 italic text-xs">No especificado</span>
                                            )}
                                        </td>
                                        <td className="p-4 align-top">
                                            <div className="space-y-3">
                                                {req.items && req.items.map((item, idx) => (
                                                    <div key={idx} className="h-8 flex items-center font-mono text-slate-500 text-xs font-semibold">
                                                        {item.sku}
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-4 align-top">
                                            <div className="space-y-3">
                                                {req.items && req.items.map((item, idx) => (
                                                    <div key={idx} className="h-8 flex items-center text-slate-600 text-sm truncate max-w-[200px]" title={item.description}>
                                                        {item.description}
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-4 align-top text-center">
                                            <div className="space-y-3">
                                                {req.items && req.items.map((item, idx) => (
                                                    <div key={idx} className="h-8 flex items-center justify-center">
                                                        <div className="text-indigo-600 font-bold bg-white border border-slate-200 rounded-lg py-1 px-4 inline-block shadow-sm">
                                                            {item.quantity_requested}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {getStatusBadge(req.status)}
                                            {req.wo_id && (
                                                <div className="text-xs text-slate-400 mt-1">OT ID vinculada</div>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm text-slate-600">
                                            {new Date(req.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-center">
                                            {(req.status === 'En Proceso' || user?.role === 'admin') && (
                                                <button
                                                    onClick={() => handleDelete(req.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                    title="Eliminar Solicitud"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Plus className="text-indigo-600" />
                                Nueva Solicitud de Materiales
                            </h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition p-1">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">

                            {/* Equipment Selection Section */}
                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-slate-700">Equipo Asociado (Opcional)</label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <select
                                        value={selectedPlant}
                                        onChange={(e) => setSelectedPlant(e.target.value)}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                    >
                                        <option value="">-- Seleccione Planta --</option>
                                        {plants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                    <select
                                        disabled={!selectedPlant}
                                        value={selectedArea}
                                        onChange={(e) => setSelectedArea(e.target.value)}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm disabled:bg-slate-50 disabled:text-slate-400"
                                    >
                                        <option value="">-- Seleccione Área --</option>
                                        {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                    </select>
                                    <select
                                        disabled={!selectedArea}
                                        value={selectedMachine}
                                        onChange={(e) => setSelectedMachine(e.target.value)}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm disabled:bg-slate-50 disabled:text-slate-400"
                                    >
                                        <option value="">-- Seleccione Máquina --</option>
                                        {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Inventory Search Section */}
                            <div className="space-y-3 pt-2 border-t border-slate-100">
                                <label className="text-sm font-semibold text-slate-700">Buscar Material en Inventario</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={inventoryKeyword}
                                        onChange={(e) => setInventoryKeyword(e.target.value)}
                                        placeholder="Ingrese SKU o descripción para buscar automáticamente..."
                                        className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                    {/* Buscar button removed since search is automatic */}
                                </div>

                                {searchResults.length > 0 && (
                                    <div className="mt-2 text-sm border border-slate-200 rounded-xl overflow-hidden shadow-sm max-h-48 overflow-y-auto bg-slate-50">
                                        {searchResults.map(item => (
                                            <div key={item.id} className="p-3 border-b last:border-0 hover:bg-white flex justify-between items-center transition cursor-pointer" onClick={() => handleAddItem(item)}>
                                                <div>
                                                    <span className="font-bold text-slate-700">{item.sku}</span> - {item.description}
                                                    <div className="text-xs text-slate-500 mt-0.5">Stock actual: {item.quantity} {item.unit_measure}</div>
                                                </div>
                                                <button type="button" className="text-xs font-semibold px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg shrink-0">
                                                    Agregar
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Selected Items Section */}
                            {selectedItems.length > 0 && (
                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-slate-700">Materiales Seleccionados</label>
                                    <div className="rounded-xl border border-indigo-100 overflow-hidden text-sm">
                                        <table className="w-full text-left">
                                            <thead className="bg-indigo-50 text-indigo-800">
                                                <tr>
                                                    <th className="p-3 font-semibold">SKU</th>
                                                    <th className="p-3 font-semibold">Descripción</th>
                                                    <th className="p-3 font-semibold w-32">Cant. Solicitada</th>
                                                    <th className="p-3 font-semibold w-16 text-center"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-indigo-50 bg-white">
                                                {selectedItems.map(item => (
                                                    <tr key={item.id}>
                                                        <td className="p-3 font-medium text-slate-700">{item.sku}</td>
                                                        <td className="p-3 text-slate-600 truncate max-w-[200px]" title={item.description}>{item.description}</td>
                                                        <td className="p-3">
                                                            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1 w-24">
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    value={item.quantity_requested}
                                                                    onChange={(e) => handleItemQuantityChange(item.id, e.target.value)}
                                                                    className="w-full bg-transparent text-center outline-none font-semibold text-slate-800"
                                                                />
                                                            </div>
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-slate-400 hover:text-red-500 p-1">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Notes Section */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Notas Adicionales (Opcional)</label>
                                <textarea
                                    value={requestNotes}
                                    onChange={(e) => setRequestNotes(e.target.value)}
                                    placeholder="Justificación, área de destino o indicaciones..."
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                                />
                            </div>

                        </div>

                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-xl transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSubmitRequest}
                                disabled={selectedItems.length === 0}
                                className={`px-6 py-2.5 rounded-xl font-bold transition shadow-sm ${selectedItems.length > 0 ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}
                            >
                                Generar Solicitud
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MaterialRequests;
