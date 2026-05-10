import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Trash, Save, Download, History } from 'lucide-react';

const Checklists = () => {
    const navigate = useNavigate();
    const [activeModule, setActiveModule] = useState('EXTRUSION_2'); // Default module
    const [activeSubModuleCintas, setActiveSubModuleCintas] = useState('CINTAS_IMPRESORAS'); // Default sub-module for CINTAS
    const [activeSubModuleBeier, setActiveSubModuleBeier] = useState('BEIER_EXPRIMIDOR'); // Default sub-module for LINEA BEIER
    // Modules list
    const modules = [
        { id: 'EXTRUSION_2', label: 'EXTRUSIÓN' }, // Changed ID directly to match the templates
        { id: 'REBOBINADO', label: 'REBOBINADO' },
        { id: 'PREESTIRADO', label: 'PREESTIRADO' },
        { id: 'CINTAS', label: 'CINTAS' },
        { id: 'LINEA_BEIER', label: 'LÍNEA BEIER' },
        { id: 'PELETIZADORA', label: 'PELETIZADORA' }
    ];

    // Sub-modules for CINTAS
    const cintasSubModules = [
        { id: 'CINTAS_IMPRESORAS', label: 'IMPRESORAS DE CINTA' },
        { id: 'CINTAS_CORTADORAS', label: 'CORTADORAS DE CINTA' },
    ];

    // Sub-modules for LÍNEA BEIER
    const lineaBeierSubModules = [
        { id: 'BEIER_EXPRIMIDOR', label: 'EXPRIMIDOR' },
        { id: 'BEIER_FAJA', label: 'FAJA TRANSPORTADORA' },
        { id: 'BEIER_HUSILLO', label: 'HUSILLO TRANSPORTADOR' },
        { id: 'BEIER_LAVADORA_FRICCION', label: 'LAVADORA DE FRICCIÓN' },
        { id: 'BEIER_MOLINO', label: 'MOLINO LINDNER' },
        { id: 'BEIER_TRITURADORA', label: 'TRITURADORA WEIMA' },
        { id: 'BEIER_TINA', label: 'TINA DE LAVADO' },
        { id: 'BEIER_SOPLADOR', label: 'SOPLADOR' },
        { id: 'BEIER_SILO', label: 'SILO DE ALMACENAMIENTO' },
    ];

    // Get the active category for filtering templates
    const getActiveCategory = () => {
        if (activeModule === 'CINTAS') return activeSubModuleCintas;
        if (activeModule === 'LINEA_BEIER') return activeSubModuleBeier;
        return activeModule;
    };

    const [templates, setTemplates] = useState([]);

    useEffect(() => {
        fetchTemplates();
    }, []);

    async function fetchTemplates() {
        try {
            const { data } = await api.get('/checklists/templates');
            setTemplates(data);
        } catch (error) {
            console.error('Error fetching templates:', error);
        }
    }



    const handleExport = async (format = 'summary') => {
        try {
            const urlEndpoint = format === 'database' ? '/export/checklists?format=database' : '/export/checklists';
            const response = await api.get(urlEndpoint, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const timestamp = new Date().toISOString().slice(0, 10);
            const fileName = format === 'database' ? `database_checklists_${timestamp}.xlsx` : `checklists_${timestamp}.xlsx`;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error exportando:', error);
            alert('Error al exportar checklists');
        }
    };

    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Plantillas de Control</h1>
                    <p className="text-slate-500 mt-1">Selecciona un módulo para gestionar sus checklists</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => navigate('/checklists/executions?type=maintenance')}
                        className="bg-indigo-600 text-white px-4 md:px-5 py-2 md:py-2.5 rounded-xl shadow-lg flex items-center gap-2 hover:bg-indigo-700 transition-all hover:scale-105"
                    >
                        <History size={18} /> <span className="hidden md:inline font-semibold">Ver Historial</span>
                    </button>
                    <button
                        onClick={() => handleExport('database')}
                        className="bg-blue-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 hover:bg-blue-700 transition-all hover:scale-105"
                        title="Exportar todos los datos de checklists en formato tabla para BD"
                    >
                        <Download size={18} /> <span className="hidden md:inline font-semibold">Exportar DB</span>
                    </button>
                    <button
                        onClick={() => handleExport('summary')}
                        className="bg-green-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-green-700 transition-all font-semibold"
                        title="Exportar resumen del historial"
                    >
                        <Download size={18} /> <span className="hidden md:inline">Exportar Resumen</span>
                    </button>
                </div>
            </div>

            {/* Module Tabs - Premium Pills */}
            <div className="flex overflow-x-auto pb-4 space-x-2 mb-3 scrollbar-hide">
                {modules.map(module => (
                    <button
                        key={module.id}
                        onClick={() => {
                            setActiveModule(module.id);
                            let cat = module.id;
                            if (module.id === 'CINTAS') cat = activeSubModuleCintas;
                            if (module.id === 'LINEA_BEIER') cat = activeSubModuleBeier;
                            // setNewTemplate logic removed for brevity as it's handled in modal or not used
                        }}
                        className={`px-6 py-3 font-bold rounded-2xl whitespace-nowrap transition-all duration-300 ${activeModule === module.id
                            ? 'bg-slate-900 text-white shadow-xl scale-105 ring-2 ring-offset-2 ring-slate-900'
                            : 'bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-700 shadow-sm border border-slate-200'
                            }`}
                    >
                        {module.label}
                    </button>
                ))}
            </div>

            {/* Sub-Tabs for LÍNEA BEIER */}
            {activeModule === 'LINEA_BEIER' && (
                <div className="flex overflow-x-auto space-x-2 mb-6 pl-2 pb-2 scrollbar-hide">
                    {lineaBeierSubModules.map(sub => (
                        <button
                            key={sub.id}
                            onClick={() => {
                                setActiveSubModuleBeier(sub.id);
                            }}
                            className={`px-5 py-2 font-semibold rounded-xl whitespace-nowrap transition-all duration-200 text-sm ${activeSubModuleBeier === sub.id
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-white text-slate-500 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200'
                                }`}
                        >
                            {sub.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Sub-Tabs for CINTAS */}
            {activeModule === 'CINTAS' && (
                <div className="flex space-x-2 mb-6 pl-2">
                    {cintasSubModules.map(sub => (
                        <button
                            key={sub.id}
                            onClick={() => {
                                setActiveSubModuleCintas(sub.id);
                            }}
                            className={`px-5 py-2 font-semibold rounded-xl whitespace-nowrap transition-all duration-200 text-sm ${activeSubModuleCintas === sub.id
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-white text-slate-500 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200'
                                }`}
                        >
                            {sub.label}
                        </button>
                    ))}
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {templates
                    .filter(t => {
                        // Filter by type
                        if (t.type && t.type !== 'maintenance') return false;
                        
                        if (activeModule === 'EXTRUSION_2') {
                            return ['EXTRUSION_2_SML1', 'EXTRUSION_2_SML2', 'EXTRUSION_2_EREMA1', 'EXTRUSION_2_EREMA2'].includes(t.asset_category);
                        }
                        return t.asset_category === getActiveCategory();
                    })
                    .sort((a, b) => a.name.localeCompare(b.name)) // Ensure alphabetical sorting
                    .map((template, idx) => {
                        // Try to safely parse items if needed
                        let parsedItems = typeof template.items === 'string' ? JSON.parse(template.items) : template.items;
                        let isMatrix = template.layout === 'sml2_matrix';
                        let itemsCount = isMatrix ? (parsedItems?.sections ? parsedItems.sections.length : 0) : (Array.isArray(parsedItems) ? parsedItems.length : 0);
                        let previewItems = isMatrix ? (parsedItems?.sections || []).map(s => ({ label: s.title })) : (Array.isArray(parsedItems) ? parsedItems : []);

                        return (
                            <div
                                key={template.id}
                                className={`relative group rounded-3xl p-6 overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${idx % 3 === 0 ? 'bg-gradient-to-br from-indigo-900 to-slate-900' :
                                    idx % 3 === 1 ? 'bg-gradient-to-br from-slate-900 to-gray-800' :
                                        'bg-gradient-to-br from-purple-900 to-indigo-900'
                                    }`}
                            >
                                {/* Glass overlay effect */}
                                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>

                                {/* Decorative Circle */}
                                <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white opacity-10 blur-xl group-hover:scale-150 transition-transform duration-700"></div>

                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm ${idx % 3 === 0 ? 'bg-indigo-500/20 text-indigo-200' :
                                            idx % 3 === 1 ? 'bg-blue-500/20 text-blue-200' :
                                                'bg-purple-500/20 text-purple-200'
                                            }`}>
                                            {template.asset_category}
                                        </span>
                                        <button className="text-white/40 hover:text-white transition-colors bg-black/20 p-2 rounded-full backdrop-blur-md">
                                            <Trash size={16} />
                                        </button>
                                    </div>

                                    <h3 className="text-2xl font-bold text-white mb-2 leading-tight">{template.name}</h3>
                                    <p className="text-white/60 text-sm mb-6 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                                        Activo
                                    </p>

                                    <div className="bg-black/20 rounded-xl p-4 backdrop-blur-md border border-white/5">
                                        <p className="text-xs font-bold text-white/50 mb-3 uppercase tracking-wider">{isMatrix ? 'Secciones' : 'Puntos de Control'} ({itemsCount})</p>
                                        <ul className="space-y-2">
                                            {previewItems.slice(0, 3).map((item, i) => (
                                                <li key={i} className="flex items-center text-sm text-white/80">
                                                    <div className="w-4 h-4 rounded-full border border-white/30 mr-3 flex items-center justify-center">
                                                        <div className="w-2 h-2 rounded-full bg-white/50"></div>
                                                    </div>
                                                    <span className="truncate">{item.label}</span>
                                                </li>
                                            ))}
                                            {itemsCount > 3 && (
                                                <li className="text-xs text-white/40 pl-7 italic">+ {itemsCount - 3} puntos adicionales</li>
                                            )}
                                        </ul>
                                    </div>

                                    <button
                                        onClick={() => navigate(`/checklists/fill/${template.id}`)}
                                        className="w-full mt-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-colors shadow-lg flex items-center justify-center gap-2 group-hover:scale-[1.02]"
                                    >
                                        Llenar Checklist <span className="group-hover:translate-x-1 transition-transform">→</span>
                                    </button>
                                </div>
                            </div>
                        )
                    })}
            </div>
        </div>
    );
};

export default Checklists;
