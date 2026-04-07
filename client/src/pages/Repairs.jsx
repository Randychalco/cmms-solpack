import { useState, useEffect } from 'react';
import { PenTool, Plus, Search, CheckCircle, Package, ArrowLeft, ArrowRight, Truck, Download } from 'lucide-react';
import api from '../api/axios';

const Repairs = () => {
    const [repairs, setRepairs] = useState([]);
    const [plants, setPlants] = useState([]);
    const [areas, setAreas] = useState([]);
    const [machines, setMachines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    // Modals state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
    const [selectedRepair, setSelectedRepair] = useState(null);

    // Form states
    const [formData, setFormData] = useState({
        plant_id: '',
        area_id: '',
        machine_id: '',
        part_name: '',
        issue_description: '',
        supplier_name: '',
        sent_date: new Date().toISOString().split('T')[0],
        expected_return_date: ''
    });

    const [receiveData, setReceiveData] = useState({
        return_date: new Date().toISOString().split('T')[0],
        repair_cost: '',
        repair_notes: ''
    });

    useEffect(() => {
        fetchRepairs();
        fetchPlants();
    }, []);

    const fetchRepairs = async () => {
        try {
            setLoading(true);
            const response = await api.get('/repairs');
            setRepairs(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching repairs:', err);
            setError('Error al cargar el historial de reparaciones.');
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

    const handleCreateRepair = async (e) => {
        e.preventDefault();
        try {
            await api.post('/repairs', formData);
            setIsCreateModalOpen(false);
            setFormData({
                plant_id: '',
                area_id: '',
                machine_id: '',
                part_name: '',
                issue_description: '',
                supplier_name: '',
                sent_date: new Date().toISOString().split('T')[0],
                expected_return_date: ''
            });
            fetchRepairs();
        } catch (err) {
            console.error('Error creating repair:', err);
            alert('Error al registrar la salida de reparación.');
        }
    };

    const handleReceiveRepair = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/repairs/${selectedRepair.id}/receive`, receiveData);
            setIsReceiveModalOpen(false);
            setSelectedRepair(null);
            setReceiveData({
                return_date: new Date().toISOString().split('T')[0],
                repair_cost: '',
                repair_notes: ''
            });
            fetchRepairs();
        } catch (err) {
            console.error('Error receiving repair:', err);
            alert('Error al registrar el retorno del repuesto.');
        }
    };

    const openReceiveModal = (repair) => {
        setSelectedRepair(repair);
        setIsReceiveModalOpen(true);
    };

    const handleExportExcel = async () => {
        try {
            const res = await api.get('/export/repairs', {
                params: {
                    status: filterStatus
                },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `reparaciones_${new Date().toISOString().slice(0, 10)}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            console.error('Error exportando a Excel:', error);
            alert('Hubo un error al exportar los datos.');
        }
    };

    const filteredRepairs = repairs.filter(repair => {
        const matchesStatus = filterStatus === 'ALL' || repair.status === filterStatus;
        const matchesSearch = searchTerm === '' ||
            repair.part_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            repair.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            repair.Machine?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    return (
        <div className="p-4 md:p-6 bg-slate-50 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <PenTool className="text-orange-500" />
                        Reparaciones Externas
                    </h1>
                    <p className="text-slate-500 mt-1">Control de repuestos y componentes enviados a reparar</p>
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
                        className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-700 transition"
                    >
                        <Plus size={20} />
                        Registrar Salida
                    </button>
                </div>
            </div>

            {error && <div className="bg-red-100 text-red-600 p-3 rounded mb-4">{error}</div>}

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
                    <button
                        onClick={() => setFilterStatus('ALL')}
                        className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium ${filterStatus === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        Todas
                    </button>
                    <button
                        onClick={() => setFilterStatus('ENVIADO')}
                        className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium ${filterStatus === 'ENVIADO' ? 'bg-orange-100 text-orange-700 border border-orange-300' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        En Proceso (Enviados)
                    </button>
                    <button
                        onClick={() => setFilterStatus('DEVUELTO')}
                        className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium ${filterStatus === 'DEVUELTO' ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        Devueltos
                    </button>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar pieza, máquina o taller..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                                <th className="p-4 font-bold border-b">Repuesto / Pieza</th>
                                <th className="p-4 font-bold border-b">Máquina</th>
                                <th className="p-4 font-bold border-b">Proveedor / Taller</th>
                                <th className="p-4 font-bold border-b">Fechas</th>
                                <th className="p-4 font-bold border-b text-center">Estado</th>
                                <th className="p-4 font-bold border-b text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-slate-500">Cargando registros...</td>
                                </tr>
                            ) : filteredRepairs.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-slate-500">No se encontraron registros de reparaciones.</td>
                                </tr>
                            ) : (
                                filteredRepairs.map(repair => (
                                    <tr key={repair.id} className="border-b hover:bg-slate-50 transition">
                                        <td className="p-4 font-mono text-xs text-slate-500">{repair.id.substring(0, 6)}</td>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800">{repair.part_name}</div>
                                            <div className="text-xs text-slate-500 max-w-xs truncate" title={repair.issue_description}>{repair.issue_description}</div>
                                        </td>
                                        <td className="p-4 text-sm text-slate-700">
                                            {repair.Machine?.name || `Máquina ID: ${repair.machine_id}`}
                                        </td>
                                        <td className="p-4 text-sm text-slate-700 font-medium">
                                            <div className="flex items-center gap-1"><Truck size={14} className="text-slate-400" /> {repair.supplier_name}</div>
                                        </td>
                                        <td className="p-4 text-xs text-slate-600">
                                            <div className="flex items-center gap-1 text-orange-600"><ArrowRight size={12} /> Enviado: {repair.sent_date}</div>
                                            {repair.return_date ? (
                                                <div className="flex items-center gap-1 text-emerald-600"><ArrowLeft size={12} /> Vuelto: {repair.return_date}</div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-slate-400"><ArrowLeft size={12} /> Esperado: {repair.expected_return_date || '-'}</div>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            {repair.status === 'ENVIADO' ? (
                                                <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-bold border border-orange-200">ENVIADO</span>
                                            ) : (
                                                <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full font-bold border border-emerald-200">DEVUELTO</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            {repair.status === 'ENVIADO' && (
                                                <button
                                                    onClick={() => openReceiveModal(repair)}
                                                    className="bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white px-3 py-1.5 rounded text-sm font-medium transition border border-emerald-200 hover:border-emerald-600 flex items-center gap-1 w-full justify-center"
                                                >
                                                    <CheckCircle size={14} /> Recibir
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

            {/* Create Repair Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
                        <div className="bg-orange-600 p-4 text-white flex justify-between items-center">
                            <h2 className="font-bold text-lg flex items-center gap-2"><PenTool size={20} /> Registrar Salida a Reparación</h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="hover:text-amber-200">&times;</button>
                        </div>
                        <form onSubmit={handleCreateRepair} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="md:col-span-2">
                                    <label className="block text-slate-700 font-bold mb-1 text-sm">Equipo Asociado (Obligatorio) *</label>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                        <select
                                            className="w-full border p-2 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                            value={formData.plant_id}
                                            onChange={e => setFormData({ ...formData, plant_id: e.target.value })}
                                        >
                                            <option value="">-- Seleccione Planta --</option>
                                            {plants.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                        <select
                                            className="w-full border p-2 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
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
                                            required
                                            className="w-full border p-2 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
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
                                    <label className="block text-slate-700 font-bold mb-1 text-sm">Nombre del Repuesto / Pieza *</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full border p-2 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                        placeholder="Ej: Motorreductor 5HP, Husillo principal..."
                                        value={formData.part_name}
                                        onChange={e => setFormData({ ...formData, part_name: e.target.value.toUpperCase() })}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-slate-700 font-bold mb-1 text-sm">Proveedor o Taller *</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full border p-2 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                        placeholder="Nombre del proveedor externo"
                                        value={formData.supplier_name}
                                        onChange={e => setFormData({ ...formData, supplier_name: e.target.value.toUpperCase() })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-700 font-bold mb-1 text-sm">Fecha de Envío *</label>
                                    <input
                                        required
                                        type="date"
                                        className="w-full border p-2 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                        value={formData.sent_date}
                                        onChange={e => setFormData({ ...formData, sent_date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-700 font-bold mb-1 text-sm">Retorno Estimado</label>
                                    <input
                                        type="date"
                                        className="w-full border p-2 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                        value={formData.expected_return_date}
                                        onChange={e => setFormData({ ...formData, expected_return_date: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-slate-700 font-bold mb-1 text-sm">Falla o Motivo de Reparación</label>
                                    <textarea
                                        rows="2"
                                        className="w-full border p-2 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                        placeholder="Descripción de lo que le pasó a la pieza o qué trabajo se encomendó..."
                                        value={formData.issue_description}
                                        onChange={e => setFormData({ ...formData, issue_description: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancelar</button>
                                <button type="submit" className="bg-orange-600 text-white px-6 py-2 rounded font-medium hover:bg-orange-700 transition">Guardar Registro</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Receive Repair Modal */}
            {isReceiveModalOpen && selectedRepair && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="bg-emerald-600 p-4 text-white flex justify-between items-center">
                            <h2 className="font-bold text-lg flex items-center gap-2"><CheckCircle size={20} /> Recibir Repuesto</h2>
                            <button onClick={() => setIsReceiveModalOpen(false)} className="hover:text-emerald-200">&times;</button>
                        </div>
                        <form onSubmit={handleReceiveRepair} className="p-6">
                            <p className="text-sm text-slate-600 mb-4 bg-slate-50 p-3 rounded border">
                                ¿Confirmar el regreso de <strong>{selectedRepair.part_name}</strong> que fue enviado a <strong>{selectedRepair.supplier_name}</strong>?
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-slate-700 font-bold mb-1 text-sm">Fecha de Retorno Real *</label>
                                    <input
                                        required
                                        type="date"
                                        className="w-full border p-2 rounded focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                        value={receiveData.return_date}
                                        onChange={e => setReceiveData({ ...receiveData, return_date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-700 font-bold mb-1 text-sm">Costo de Reparación (S/., opcional)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full border p-2 rounded focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                        placeholder="Ej: 150.00"
                                        value={receiveData.repair_cost}
                                        onChange={e => setReceiveData({ ...receiveData, repair_cost: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-700 font-bold mb-1 text-sm">Observaciones Adicionales</label>
                                    <textarea
                                        rows="2"
                                        className="w-full border p-2 rounded focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                        placeholder="Garantía recibida, notas sobre el trabajo realizado..."
                                        value={receiveData.repair_notes}
                                        onChange={e => setReceiveData({ ...receiveData, repair_notes: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setIsReceiveModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancelar</button>
                                <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded font-medium hover:bg-emerald-700 transition">Confirmar Retorno</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Repairs;
