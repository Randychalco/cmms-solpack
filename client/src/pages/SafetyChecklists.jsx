import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Trash, Save, Download, History, ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react';

const SafetyChecklists = () => {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTemplates();
    }, []);

    async function fetchTemplates() {
        try {
            setLoading(true);
            const { data } = await api.get('/checklists/templates');
            // Filter only safety templates
            setTemplates(data.filter(t => t.type === 'safety'));
        } catch (error) {
            console.error('Error fetching safety templates:', error);
        } finally {
            setLoading(false);
        }
    }

    const handleExport = async () => {
        try {
            const response = await api.get('/export/checklists?type=safety', {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const timestamp = new Date().toISOString().slice(0, 10);
            link.setAttribute('download', `safety_checklists_${timestamp}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error exportando:', error);
            alert('Error al exportar checklists de seguridad');
        }
    };

    if (loading) return <div className="p-8 text-center font-bold">Cargando Módulo de Seguridad...</div>;

    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-red-600 rounded-2xl shadow-lg shadow-red-200 text-white">
                        <ShieldAlert size={32} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Módulo de Seguridad</h1>
                        <p className="text-slate-500 mt-1 font-medium italic">Gestión de cumplimiento y control de riesgos operativos</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => navigate('/checklists/executions?type=safety')}
                        className="bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2 hover:bg-slate-800 transition-all hover:scale-105 font-bold"
                    >
                        <History size={20} /> Historial General
                    </button>
                    <button
                        onClick={handleExport}
                        className="bg-orange-600 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2 hover:bg-orange-700 transition-all hover:scale-105 font-bold"
                    >
                        <Download size={20} /> Exportar Seguridad
                    </button>
                </div>
            </div>

            {templates.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                    <AlertTriangle size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500 font-bold text-xl">No hay cartillas de seguridad configuradas.</p>
                </div>
            ) : (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {templates.map((template, idx) => {
                        let parsedItems = typeof template.items === 'string' ? JSON.parse(template.items) : template.items;
                        let sections = parsedItems.sections || [];
                        let totalItems = sections.reduce((acc, s) => acc + (s.items?.length || s.rows?.length || 0), 0);

                        return (
                            <div
                                key={template.id}
                                className="relative group bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 hover:shadow-2xl hover:border-red-100 transition-all duration-500 hover:-translate-y-2 overflow-hidden"
                            >
                                {/* Background Accent */}
                                <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-700 ${
                                    idx % 2 === 0 ? 'bg-red-600' : 'bg-orange-500'
                                }`}></div>

                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-6">
                                        <span className="text-[10px] font-black px-3 py-1 bg-red-100 text-red-700 rounded-full uppercase tracking-widest border border-red-200">
                                            {template.asset_category || 'GENERAL'}
                                        </span>
                                        <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold">
                                            <CheckCircle2 size={14} /> Activo
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-black text-slate-900 mb-4 leading-tight group-hover:text-red-700 transition-colors">
                                        {template.name}
                                    </h3>

                                    <div className="space-y-4 mb-8">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">Puntos Críticos</span>
                                            <span className="text-slate-900 font-black px-2 py-0.5 bg-slate-100 rounded-md">{totalItems}</span>
                                        </div>
                                        <div className="space-y-2">
                                            {sections.slice(0, 3).map((s, i) => (
                                                <div key={i} className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                                    <span className="truncate">{s.title.replace(/^\d+\.\s*/, '')}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => navigate(`/checklists/fill/${template.id}`)}
                                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-black text-sm transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-3 group/btn"
                                    >
                                        EJECUTAR INSPECCIÓN
                                        <ShieldAlert size={18} className="group-hover/btn:rotate-12 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Warning Banner */}
            <div className="mt-12 p-6 bg-red-50 border border-red-100 rounded-3xl flex items-start gap-4">
                <AlertTriangle className="text-red-600 flex-shrink-0" size={24} />
                <div>
                    <h4 className="text-red-800 font-black text-sm uppercase tracking-wider mb-1">Aviso de Seguridad</h4>
                    <p className="text-red-700/80 text-sm font-medium leading-relaxed">
                        Todos los incidentes o fallas críticas detectadas en estos checklists deben ser reportados inmediatamente al Supervisor de Seguridad y Salud en el Trabajo (SST) mediante una Orden de Trabajo de Emergencia.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SafetyChecklists;
