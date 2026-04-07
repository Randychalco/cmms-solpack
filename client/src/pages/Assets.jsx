import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Wrench, Search, Filter, MapPin, Tag, Box, ArrowRight, ShieldCheck, Cpu } from 'lucide-react';

const Assets = () => {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterPlant, setFilterPlant] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        brand: '',
        characteristics: '',
        category: '',
        plant_name: '',
        location: '',
        status: 'ACTIVE'
    });

    useEffect(() => {
        fetchAssets();
    }, [filterPlant]);

    const fetchAssets = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filterPlant) params.plant = filterPlant;

            const { data } = await api.get('/assets', { params });
            setAssets(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching assets:', error);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/assets', formData);
            setShowForm(false);
            setFormData({ name: '', code: '', brand: '', characteristics: '', category: '', plant_name: '', location: '', status: 'ACTIVE' });
            fetchAssets();
        } catch (error) {
            alert('Error creating asset');
        }
    };

    const filteredAssets = assets.filter(asset => {
        const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asset.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (asset.brand && asset.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (asset.characteristics && asset.characteristics.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesSearch;
    });

    return (
        <div className="p-6 max-w-7xl mx-auto pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-1">Inventario de Activos</h1>
                    <p className="text-slate-500 font-medium text-lg">Control técnico y gestión de equipos por planta</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="bg-blue-600 text-white px-6 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg active:scale-95 text-lg"
                    >
                        <Plus size={24} /> Registrar Activo
                    </button>
                </div>
            </header>

            {showForm && (
                <div className="bg-white p-8 rounded-3xl shadow-2xl border-4 border-slate-100 mb-8 animate-in fade-in slide-in-from-top-4">
                    <h2 className="text-2xl font-black mb-6 flex items-center gap-2 text-slate-800">
                        <Wrench className="text-blue-600" size={28} /> Datos del Nuevo Equipo
                    </h2>
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-black text-slate-500 uppercase tracking-widest mb-2">Nombre del Activo / Máquina</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border-4 border-slate-50 p-4 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-700 text-lg"
                                    placeholder="Ej: Extrusora Principal L1"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-black text-slate-500 uppercase tracking-widest mb-2">Planta</label>
                                <select
                                    className="w-full bg-slate-50 border-4 border-slate-50 p-4 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-black text-slate-700 text-lg appearance-none cursor-pointer"
                                    value={formData.plant_name}
                                    onChange={(e) => setFormData({ ...formData, plant_name: e.target.value })}
                                    required
                                >
                                    <option value="">Seleccionar Planta</option>
                                    <option value="RECICLAJE">RECICLAJE</option>
                                    <option value="STRETCH">STRETCH</option>
                                    <option value="CAST">CAST</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-black text-slate-500 uppercase tracking-widest mb-2">TAG / Código</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border-4 border-slate-50 p-4 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-mono font-black text-blue-600 text-lg uppercase"
                                    placeholder="EX-001"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-black text-slate-500 uppercase tracking-widest mb-2">Marca</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border-4 border-slate-50 p-4 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-700 text-lg"
                                    placeholder="Siemens, WEG, etc."
                                    value={formData.brand}
                                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-3">
                                <label className="block text-sm font-black text-slate-500 uppercase tracking-widest mb-2">Características Técnicas</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border-4 border-slate-50 p-4 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-700 text-lg"
                                    placeholder="Potencia, Capacidad, Modelo, Dimensiones..."
                                    value={formData.characteristics}
                                    onChange={(e) => setFormData({ ...formData, characteristics: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="bg-slate-100 text-slate-600 px-8 py-4 rounded-2xl font-black hover:bg-slate-200 transition-all text-lg"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black shadow-xl hover:bg-slate-800 transition-all active:scale-95 text-lg"
                            >
                                Guardar en Inventario
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filtros Premium */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row gap-6 items-center">
                <div className="flex-1 relative w-full">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
                    <input
                        type="text"
                        placeholder="Buscar por Nombre, Marca, Código o Característica..."
                        className="w-full pl-16 pr-6 py-5 rounded-2xl border-4 border-slate-50 focus:border-blue-500 focus:bg-white bg-slate-50 outline-none transition-all font-bold text-slate-700 text-lg"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <button
                        onClick={() => setFilterPlant('')}
                        className={`px-8 py-4 rounded-2xl font-black whitespace-nowrap transition-all text-sm tracking-widest uppercase ${!filterPlant ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                    >
                        Toda la Planta
                    </button>
                    <button
                        onClick={() => setFilterPlant('RECICLAJE')}
                        className={`px-8 py-4 rounded-2xl font-black whitespace-nowrap transition-all text-sm tracking-widest uppercase ${filterPlant === 'RECICLAJE' ? 'bg-green-600 text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                    >
                        Reciclaje
                    </button>
                    <button
                        onClick={() => setFilterPlant('STRETCH')}
                        className={`px-8 py-4 rounded-2xl font-black whitespace-nowrap transition-all text-sm tracking-widest uppercase ${filterPlant === 'STRETCH' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                    >
                        Stretch
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-40 bg-white rounded-[3rem] border-4 border-slate-50">
                    <div className="animate-spin rounded-full h-20 w-20 border-8 border-slate-100 border-t-blue-600 mb-6"></div>
                    <p className="text-slate-400 font-black text-xl animate-pulse uppercase tracking-widest">Sincronizando Inventario...</p>
                </div>
            ) : (
                <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b-4 border-slate-100">
                                    <th className="p-6 text-sm font-black text-slate-400 uppercase tracking-widest">Código</th>
                                    <th className="p-6 text-sm font-black text-slate-400 uppercase tracking-widest">Activo / Máquina</th>
                                    <th className="p-6 text-sm font-black text-slate-400 uppercase tracking-widest text-center">Planta</th>
                                    <th className="p-6 text-sm font-black text-slate-400 uppercase tracking-widest">Marca</th>
                                    <th className="p-6 text-sm font-black text-slate-400 uppercase tracking-widest">Características Técnicas</th>
                                    <th className="p-6 text-sm font-black text-slate-400 uppercase tracking-widest text-right">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredAssets.map(asset => (
                                    <tr key={asset.id} className="hover:bg-blue-50 transition-colors group cursor-default">
                                        <td className="p-6">
                                            <span className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl font-mono font-black text-sm uppercase border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                {asset.code}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <div className="font-black text-slate-900 text-lg uppercase leading-tight">{asset.name}</div>
                                            <div className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-tighter">{asset.category || 'Equipo Industrial'}</div>
                                        </td>
                                        <td className="p-6 text-center">
                                            <span className={`px-4 py-2 rounded-xl text-xs font-black tracking-widest uppercase shadow-sm border ${asset.plant_name === 'RECICLAJE' ? 'bg-green-50 text-green-700 border-green-100' :
                                                asset.plant_name === 'STRETCH' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                    'bg-slate-50 text-slate-500 border-slate-100'
                                                }`}>
                                                {asset.plant_name || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <div className="font-bold text-slate-700 uppercase">{asset.brand || '---'}</div>
                                        </td>
                                        <td className="p-6">
                                            <div className="font-medium text-slate-500 max-w-xs truncate text-sm" title={asset.characteristics}>
                                                {asset.characteristics || 'Sin especificaciones'}
                                            </div>
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <div className={`w-3 h-3 rounded-full ${asset.status === 'ACTIVE' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'} animate-pulse`}></div>
                                                <span className="text-xs font-black text-slate-700 uppercase tracking-widest">{asset.status === 'ACTIVE' ? 'Operativo' : 'Parado'}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredAssets.length === 0 && (
                        <div className="text-center py-32">
                            <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Box size={40} className="text-slate-200" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-300 uppercase tracking-widest">Inventario Vacío</h3>
                            <p className="text-slate-400 font-bold mt-2">No se encontraron activos registrados</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Assets;
