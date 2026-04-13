import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Plus, Search, Filter, Download, Upload, Trash2, Calendar, HardDrive, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PreventiveOrdersList = () => {
    const [executions, setExecutions] = useState([]);
    const [filteredExecutions, setFilteredExecutions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL'); // ALL, PENDIENTE, EN_PROGRESO, COMPLETADO
    const [allMachines, setAllMachines] = useState([]);
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            setLoading(true);
            const [eRes, mRes] = await Promise.all([
                api.get('/preventive/executions'),
                api.get('/master/machines')
            ]);
            setExecutions(eRes.data);
            setFilteredExecutions(eRes.data);
            setAllMachines(mRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    }

    useEffect(() => {
        if (filter === 'ALL') {
            setFilteredExecutions(executions);
        } else {
            setFilteredExecutions(executions.filter(e => e.status === filter));
        }
    }, [filter, executions]);
    
    const handleExport = async () => {
        try {
            const response = await api.get('/export/preventive-orders', {
                params: { status: filter },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const timestamp = new Date().toISOString().slice(0, 10);
            link.setAttribute('download', `preventivos_${timestamp}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error exportando:', error);
            alert('Error al exportar preventivos');
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm('¿Estás seguro de eliminar esta orden preventiva?')) return;

        try {
            await api.delete(`/preventive/executions/${id}`);
            fetchData();
        } catch (error) {
            console.error('Error deleting execution:', error);
            alert('Error al eliminar la orden preventiva');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDIENTE': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'EN_PROGRESO': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'COMPLETADO': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const resolveMachineTitle = (exe) => {
        if (exe.Machine?.name) return exe.Machine.name;
        if (exe.machine_ids && Array.isArray(exe.machine_ids)) {
            const names = exe.machine_ids.map(id => {
                const m = allMachines.find(am => am.id === id);
                return m ? m.name : 'Unknown';
            }).filter(n => n !== 'Unknown');
            if (names.length > 1) return `${names[0]} + ${names.length - 1} más`;
            return names[0] || 'Equipo General';
        }
        return 'Equipo de Mantenimiento';
    };

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Mantenimiento Preventivo</h1>
                    <p className="text-slate-500 text-sm">Listado y seguimiento de órdenes preventivas ejecutadas</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => navigate('/preventive-plans')}
                        className="bg-white text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-slate-50 transition-all font-semibold shadow-sm"
                    >
                        <Settings size={18} /> <span className="hidden md:inline">Plan Maestro</span>
                    </button>
                    <button
                        onClick={handleExport}
                        className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-emerald-700 transition-all font-bold shadow-lg shadow-emerald-900/10"
                    >
                        <Download size={18} /> <span className="hidden md:inline">Exportar</span>
                    </button>
                    <button
                        onClick={() => navigate('/preventive/new')}
                        className="bg-blue-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-900/10 transition-all font-bold"
                    >
                        <Plus size={20} /> <span className="hidden md:inline font-bold">Nueva Orden</span>
                    </button>
                </div>
            </div>

            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                {['ALL', 'PENDIENTE', 'EN_PROGRESO', 'COMPLETADO'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-5 py-2 rounded-full text-xs font-black transition-all ${
                            filter === status 
                            ? 'bg-slate-800 text-white shadow-md' 
                            : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-400'
                        }`}
                    >
                        {status === 'ALL' ? 'TODOS' : status.replace('_', ' ')}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-center py-20 flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-slate-400 font-medium">Cargando registros...</span>
                </div>
            ) : filteredExecutions.length > 0 ? (
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {filteredExecutions.map((exe) => (
                        <div 
                            key={exe.id} 
                            className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:border-blue-300 transition-all cursor-pointer relative overflow-hidden group" 
                            onClick={() => navigate(`/preventive/execution/${exe.id}`)}
                        >
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="text-[10px] font-black tracking-widest text-slate-400 bg-slate-50 px-2 py-0.5 rounded border mb-1 inline-block">
                                        #PV-{exe.id}
                                    </span>
                                    <h3 className="font-black text-slate-800 text-base leading-tight group-hover:text-blue-700 transition-colors">
                                        {resolveMachineTitle(exe)}
                                    </h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border tracking-tight ${getStatusColor(exe.status)} shadow-sm`}>
                                        {exe.status}
                                    </span>
                                    {user?.role === 'admin' && (
                                        <button
                                            onClick={(e) => handleDelete(e, exe.id)}
                                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Eliminar Orden"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            <p className="text-xs text-slate-600 mb-5 line-clamp-2 italic font-medium">
                                {exe.action_performed || 'Sin descripción técnica registrada...'}
                            </p>

                            <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-100 pt-4 font-bold">
                                <div className="flex items-center gap-2">
                                    <HardDrive size={14} className="text-slate-300" />
                                    <span>{exe.Plant?.name || 'General'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} className="text-slate-300" />
                                    <span>{new Date(exe.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 font-bold">No se encontraron órdenes preventivas</p>
                </div>
            )}
        </div>
    );
};

export default PreventiveOrdersList;
