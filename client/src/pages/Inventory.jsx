import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Package, Edit, X, Search, Download, Upload, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import ImportModal from '../components/ImportModal';
import { useAuth } from '../context/AuthContext';

const Inventory = () => {
    const [items, setItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [alertFilter, setAlertFilter] = useState('todos');
    const [showForm, setShowForm] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        current_stock: 0,
        min_stock: 0,
        cost: 0,
        location: ''
    });
    const { user } = useAuth();

    useEffect(() => {
        fetchInventory();
    }, []);

    async function fetchInventory() {
        try {
            const { data } = await api.get('/inventory');
            setItems(data);
        } catch (error) {
            console.error('Error fetching inventory:', error);
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/inventory/${editingId}`, formData);
                alert('Ítem actualizado correctamente');
            } else {
                await api.post('/inventory', formData);
                alert('Ítem creado correctamente');
            }
            setShowForm(false);
            setEditingId(null);
            setFormData({ name: '', code: '', current_stock: 0, min_stock: 0, cost: 0, location: '' });
            fetchInventory();
        } catch (error) {
            console.error(error);
            alert('Error al guardar el ítem');
        }
    };

    const handleEdit = (item) => {
        setFormData({
            name: item.name,
            code: item.code,
            current_stock: item.current_stock,
            min_stock: item.min_stock,
            cost: item.cost,
            location: item.location || ''
        });
        setEditingId(item.id);
        setShowForm(true);
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData({ name: '', code: '', current_stock: 0, min_stock: 0, cost: 0, location: '' });
    };

    const handleExport = async () => {
        try {
            const response = await api.get('/export/inventory', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const timestamp = new Date().toISOString().slice(0, 10);
            link.setAttribute('download', `inventario_${timestamp}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error exportando:', error);
            alert('Error al exportar inventario');
        }
    };

    const getAlertLevel = (item) => {
        if (item.current_stock === 0) return 'sin_stock';
        if (item.current_stock <= item.min_stock) return 'bajo';
        return 'ok';
    };

    const sinStockItems = items.filter(i => i.current_stock === 0);
    const bajoMinimoItems = items.filter(i => i.current_stock > 0 && i.current_stock <= i.min_stock);
    const totalAlertas = sinStockItems.length + bajoMinimoItems.length;

    const filteredItems = items.filter(item => {
        const matchesSearch =
            item.code.toUpperCase().includes(searchTerm) ||
            item.name.toUpperCase().includes(searchTerm);
        const level = getAlertLevel(item);
        const matchesAlert = alertFilter === 'todos' || alertFilter === level;
        return matchesSearch && matchesAlert;
    });

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Inventario</h1>
                <div className="flex gap-2">
                    <button onClick={handleExport} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700">
                        <Download size={20} /> <span className="hidden md:inline">Exportar</span>
                    </button>
                    {user?.role === 'admin' && (
                        <button onClick={() => setShowImportModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700">
                            <Upload size={20} /> <span className="hidden md:inline">Importar</span>
                        </button>
                    )}
                    <button
                        onClick={() => {
                            setEditingId(null);
                            setFormData({ name: '', code: '', current_stock: 0, min_stock: 0, cost: 0, location: '' });
                            setShowForm(!showForm);
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
                    >
                        {showForm ? <X size={20} /> : <Plus size={20} />}
                        <span className="hidden md:inline">{showForm ? 'Cancelar' : 'Nuevo Ítem'}</span>
                    </button>
                </div>
            </div>

            {/* ALERT BANNER */}
            {totalAlertas > 0 && (
                <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle size={20} className="text-red-600" />
                        <span className="font-bold text-red-800">
                            Alertas de Inventario — {totalAlertas} ítem(s) requieren atención
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {sinStockItems.length > 0 && (
                            <button
                                onClick={() => setAlertFilter(alertFilter === 'sin_stock' ? 'todos' : 'sin_stock')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-semibold text-sm transition-all ${
                                    alertFilter === 'sin_stock'
                                        ? 'bg-red-600 border-red-600 text-white shadow'
                                        : 'bg-white border-red-400 text-red-700 hover:bg-red-50'
                                }`}
                            >
                                <AlertCircle size={16} />
                                {sinStockItems.length} Sin Stock
                            </button>
                        )}
                        {bajoMinimoItems.length > 0 && (
                            <button
                                onClick={() => setAlertFilter(alertFilter === 'bajo' ? 'todos' : 'bajo')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-semibold text-sm transition-all ${
                                    alertFilter === 'bajo'
                                        ? 'bg-orange-500 border-orange-500 text-white shadow'
                                        : 'bg-white border-orange-400 text-orange-700 hover:bg-orange-50'
                                }`}
                            >
                                <AlertTriangle size={16} />
                                {bajoMinimoItems.length} Bajo Mínimo
                            </button>
                        )}
                        {alertFilter !== 'todos' && (
                            <button
                                onClick={() => setAlertFilter('todos')}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-gray-300 text-gray-600 bg-white hover:bg-gray-50 text-sm font-semibold transition-all"
                            >
                                <CheckCircle size={16} />
                                Ver todos
                            </button>
                        )}
                    </div>
                </div>
            )}

            {showForm && (
                <div className="bg-white p-6 rounded-lg shadow-md mb-6 border-l-4 border-blue-500">
                    <h2 className="text-xl font-bold mb-4 text-slate-800">{editingId ? 'Editar Ítem' : 'Nuevo Ítem'}</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-gray-700 font-bold mb-2">Descripción</label>
                                <input type="text" className="w-full border p-2 rounded" value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-bold mb-2">SKU</label>
                                <input type="text" className="w-full border p-2 rounded" value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })} required />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-bold mb-2">Stock Actual</label>
                                <input type="number" className="w-full border p-2 rounded" value={formData.current_stock}
                                    onChange={(e) => setFormData({ ...formData, current_stock: parseInt(e.target.value) })} required />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-bold mb-2">Stock Mínimo</label>
                                <input type="number" className="w-full border p-2 rounded" value={formData.min_stock}
                                    onChange={(e) => setFormData({ ...formData, min_stock: parseInt(e.target.value) })} required />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-bold mb-2">Costo Unitario</label>
                                <input type="number" step="0.01" className="w-full border p-2 rounded" value={formData.cost}
                                    onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })} required />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-bold mb-2">Ubicación</label>
                                <input type="text" className="w-full border p-2 rounded" value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={handleCancel} className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600">
                                Cancelar
                            </button>
                            <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
                                {editingId ? 'Actualizar' : 'Guardar'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b bg-gray-50">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={20} className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar por SKU o Descripción..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
                        />
                    </div>
                </div>

                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mínimo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Costo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredItems.map(item => {
                            const level = getAlertLevel(item);
                            const rowBg =
                                level === 'sin_stock' ? 'bg-red-50 hover:bg-red-100' :
                                level === 'bajo' ? 'bg-orange-50 hover:bg-orange-100' :
                                'hover:bg-gray-50';
                            return (
                                <tr key={item.id} className={`transition-colors ${rowBg}`}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.code}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700">
                                        <div className="flex items-center gap-2">
                                            {level === 'sin_stock' && <AlertCircle size={14} className="text-red-500 shrink-0" />}
                                            {level === 'bajo' && <AlertTriangle size={14} className="text-orange-500 shrink-0" />}
                                            {item.name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full ${
                                            level === 'sin_stock' ? 'bg-red-200 text-red-900' :
                                            level === 'bajo' ? 'bg-orange-200 text-orange-900' :
                                            'bg-green-100 text-green-800'
                                        }`}>
                                            {level === 'sin_stock' && <span>⛔</span>}
                                            {level === 'bajo' && <span>⚠️</span>}
                                            {level === 'ok' && <span>✓</span>}
                                            &nbsp;{item.current_stock}
                                            {level === 'sin_stock' && ' — Sin Stock'}
                                            {level === 'bajo' && ' — Bajo Mínimo'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.min_stock}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.cost}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.location}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleEdit(item)}
                                            className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 p-2 rounded-full hover:bg-indigo-100 transition-colors" title="Editar">
                                            <Edit size={18} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredItems.length === 0 && (
                            <tr>
                                <td colSpan={7} className="text-center py-10 text-gray-400">
                                    <Package size={40} className="mx-auto mb-2 opacity-30" />
                                    No se encontraron ítems
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <ImportModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onSuccess={() => fetchInventory()}
                title="Carga Masiva de Inventario"
                uploadUrl="/import/inventory"
                templateUrl="/import/template/inventory"
                templateName="plantilla_inventario.xlsx"
            />
        </div>
    );
};

export default Inventory;
