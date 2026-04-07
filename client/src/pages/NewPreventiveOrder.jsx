import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { 
    Calendar, Clock, Save, ArrowLeft, 
    User, Users, Settings, Package, HardDrive, 
    AlertTriangle, CheckCircle, Activity 
} from 'lucide-react';

const ACTIVITY_CODES = [
    { code: 'RC', label: 'Limpieza / Cambio', color: 'bg-emerald-100 text-emerald-800' },
    { code: 'RI', label: 'Inspección', color: 'bg-blue-100 text-blue-800' },
    { code: 'RL', label: 'Lubricación', color: 'bg-amber-100 text-amber-800' },
    { code: 'MP', label: 'Mantenimiento Preventivo', color: 'bg-indigo-100 text-indigo-800' },
    { code: 'GR', label: 'Granulador / Otros', color: 'bg-slate-100 text-slate-800' },
    { code: 'MEC', label: 'Mecánico', color: 'bg-slate-50 text-slate-600' },
    { code: 'ELE', label: 'Eléctrico', color: 'bg-yellow-100 text-yellow-800' }
];

const NewPreventiveOrder = () => {
    const navigate = useNavigate();
    const [plants, setPlants] = useState([]);
    const [areas, setAreas] = useState([]);
    const [allMachines, setAllMachines] = useState([]);
    const [filteredMachines, setFilteredMachines] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [allStandardTasks, setAllStandardTasks] = useState([]); // Master list for current machines
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [taskSearch, setTaskSearch] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        plant_id: '',
        area_id: '',
        machine_ids: [], // Array for Reciclaje, will have 1 element for Stretch
        equipment_condition: 'OPERATIVO',
        criticality: 'BAJA',
        action_performed: '',
        planning_groups: [],
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        start_time: '08:00',
        end_time: '16:00',
        responsible_technicians: [],
        leader_technician_name: '',
        supervisor_name: '',
        tasks: [],
        spare_results: [],
        general_observations: ''
    });

    // Sub-form for tasks
    const [newTaskCode, setNewTaskCode] = useState('MEC');
    const [newTaskDesc, setNewTaskDesc] = useState('');

    // Sub-form for spares
    const [newSpareId, setNewSpareId] = useState('');
    const [newSpareQty, setNewSpareQty] = useState(1);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const [pRes, mRes, uRes, iRes] = await Promise.all([
                api.get('/master/plants'),
                api.get('/master/machines'),
                api.get('/users'),
                api.get('/inventory')
            ]);
            setPlants(pRes.data);
            setAllMachines(mRes.data);
            setTechnicians(uRes.data.filter(u => u.role === 'technician' || u.role === 'admin'));
            setInventory(iRes.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handlePlantChange = async (plantId) => {
        setFormData({ ...formData, plant_id: plantId, area_id: '', machine_ids: [] });
        if (!plantId) {
            setAreas([]);
            setFilteredMachines([]);
            return;
        }
        try {
            const { data } = await api.get(`/master/areas/${plantId}`);
            setAreas(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAreaChange = (areaId) => {
        setFormData({ ...formData, area_id: areaId, machine_ids: [] });
        const filtered = allMachines.filter(m => m.areaId === parseInt(areaId));
        setFilteredMachines(filtered);
    };

    const isReciclaje = () => {
        const selectedPlant = plants.find(p => p.id === parseInt(formData.plant_id));
        return selectedPlant?.name?.toUpperCase()?.includes('RECICLAJE');
    };

    const toggleMachine = (id) => {
        const idInt = parseInt(id);
        if (isReciclaje()) {
            const current = formData.machine_ids;
            if (current.includes(idInt)) {
                setFormData({ ...formData, machine_ids: current.filter(m => m !== idInt) });
            } else {
                setFormData({ ...formData, machine_ids: [...current, idInt] });
            }
        } else {
            setFormData({ ...formData, machine_ids: [idInt] });
        }
    };

    const togglePlanningGroup = (code) => {
        const current = formData.planning_groups;
        if (current.includes(code)) {
            setFormData({ ...formData, planning_groups: current.filter(c => c !== code) });
        } else {
            setFormData({ ...formData, planning_groups: [...current, code] });
        }
    };

    const toggleTechnician = (name) => {
        const current = formData.responsible_technicians;
        if (current.includes(name)) {
            setFormData({ ...formData, responsible_technicians: current.filter(t => t !== name) });
        } else {
            setFormData({ ...formData, responsible_technicians: [...current, name] });
        }
    };

    // --- Technical Task Library Effects ---
    useEffect(() => {
        if (formData.machine_ids.length > 0) {
            fetchStandardTasks();
        } else {
            setAllStandardTasks([]);
        }
    }, [formData.machine_ids]);

    const fetchStandardTasks = async () => {
        try {
            // Fetch tasks for ALL selected machines and merge them unique by description
            const promises = formData.machine_ids.map(id => api.get(`/master/standard-tasks/${id}`));
            const results = await Promise.all(promises);
            
            let combined = [];
            results.forEach(res => {
                combined = [...combined, ...res.data];
            });

            // Unique by description to avoid duplicates across machines
            const unique = [];
            const seen = new Set();
            combined.forEach(t => {
                if (!seen.has(t.task_description)) {
                    unique.push(t);
                    seen.add(t.task_description);
                }
            });

            setAllStandardTasks(unique);
        } catch (err) {
            console.error('Error fetching standard tasks:', err);
        }
    };

    const toggleStandardTask = (standardTask) => {
        const isSelected = formData.tasks.some(t => t.task_description === standardTask.task_description);
        
        if (isSelected) {
            setFormData({
                ...formData,
                tasks: formData.tasks.filter(t => t.task_description !== standardTask.task_description)
            });
        } else {
            const newTask = {
                id: Date.now() + Math.random(),
                task_code: standardTask.task_code,
                task_description: standardTask.task_description,
                checked: false,
                observation: ''
            };
            setFormData({
                ...formData,
                tasks: [...formData.tasks, newTask]
            });
        }
    };

    const selectAllTasks = () => {
        const newTasks = allStandardTasks.map(st => ({
            id: Date.now() + Math.random(),
            task_code: st.task_code,
            task_description: st.task_description,
            checked: false,
            observation: ''
        }));
        
        // Merge with existing (avoid duplicates)
        const currentDescs = new Set(formData.tasks.map(t => t.task_description));
        const filteredNew = newTasks.filter(t => !currentDescs.has(t.task_description));
        
        setFormData({
            ...formData,
            tasks: [...formData.tasks, ...filteredNew]
        });
    };

    const addTask = () => {
        if (!newTaskDesc.trim()) return;
        setFormData({
            ...formData,
            tasks: [...formData.tasks, {
                id: Date.now(),
                task_code: newTaskCode,
                task_description: newTaskDesc,
                checked: false,
                observation: ''
            }]
        });
        setNewTaskDesc('');
    };

    const addSpare = () => {
        if (!newSpareId) return;
        const spare = inventory.find(i => i.id === parseInt(newSpareId));
        if (!spare) return;

        setFormData({
            ...formData,
            spare_results: [...formData.spare_results, {
                id: Date.now(),
                inventory_id: spare.id,
                name: spare.name,
                expected_quantity: parseInt(newSpareQty),
                used_quantity: parseInt(newSpareQty)
            }]
        });
        setNewSpareId('');
        setNewSpareQty(1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.machine_ids.length === 0) return alert('Seleccione al menos un equipo');
        
        try {
            setSaving(true);
            const payload = {
                ...formData,
                task_results: formData.tasks 
            };
            await api.post('/preventive/executions', payload);
            alert('Orden Preventiva Creada con Éxito');
            navigate('/preventive-plans');
        } catch (err) {
            console.error(err);
            alert('Error al crear la orden');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8">Cargando formulario...</div>;

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-black mb-4">
                <ArrowLeft size={20} /> Volver
            </button>

            <header className="mb-8 border-b pb-4">
                <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                    <Settings className="text-blue-600" /> Nueva Orden de Mantenimiento Preventivo
                </h1>
                <p className="text-gray-500 mt-2 italic">Registro técnico oficial para rutina programada</p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-8 pb-20">
                
                {/* SECCION 1: UBICACION Y EQUIPO */}
                <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-blue-800">
                        <HardDrive size={20} /> 1. Ubicación y Equipo(s)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold mb-1">Planta</label>
                            <select 
                                className="w-full border p-2.5 rounded-lg bg-slate-50"
                                required
                                value={formData.plant_id}
                                onChange={e => handlePlantChange(e.target.value)}
                            >
                                <option value="">Seleccione Planta...</option>
                                {plants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1">Área</label>
                            <select 
                                className="w-full border p-2.5 rounded-lg bg-slate-50"
                                required
                                value={formData.area_id}
                                onChange={e => handleAreaChange(e.target.value)}
                                disabled={!formData.plant_id}
                            >
                                <option value="">Seleccione Área...</option>
                                {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-semibold mb-2">Equipos Disponibles ({isReciclaje() ? 'Selección Múltiple' : 'Selección Única'})</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {filteredMachines.map(m => (
                                    <div 
                                        key={m.id}
                                        onClick={() => toggleMachine(m.id)}
                                        className={`cursor-pointer p-3 rounded-lg border text-sm font-medium transition-all ${
                                            formData.machine_ids.includes(m.id) 
                                            ? 'bg-blue-600 border-blue-700 text-white shadow-md' 
                                            : 'bg-white border-slate-200 hover:border-blue-300 text-slate-700'
                                        }`}
                                    >
                                        {m.name}
                                    </div>
                                ))}
                                {filteredMachines.length === 0 && <p className="text-sm text-gray-400 italic">No hay equipos para esta área</p>}
                            </div>
                        </div>
                    </div>
                </section>

                {/* SECCION 2: DATOS DE OPERACION */}
                <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-emerald-800">
                        <Activity size={20} /> 2. Detalles de la Operación
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-semibold mb-1">Clase de Orden</label>
                            <input className="w-full border p-2.5 rounded-lg bg-slate-100 font-bold" value="MANTENIMIENTO PREVENTIVO" readOnly />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1">Condición del Equipo</label>
                            <select 
                                className="w-full border p-2.5 rounded-lg bg-slate-50"
                                value={formData.equipment_condition}
                                onChange={e => setFormData({...formData, equipment_condition: e.target.value})}
                            >
                                <option value="OPERATIVO">OPERATIVO</option>
                                <option value="OPERATIVO PARCIAL">OPERATIVO PARCIAL</option>
                                <option value="NO OPERATIVO">NO OPERATIVO</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1">Criticidad</label>
                            <select 
                                className="w-full border p-2.5 rounded-lg bg-slate-50"
                                value={formData.criticality}
                                onChange={e => setFormData({...formData, criticality: e.target.value})}
                            >
                                <option value="BAJA">BAJA</option>
                                <option value="MEDIA">MEDIA</option>
                                <option value="ALTA">ALTA</option>
                                <option value="CRITICA">CRITICA</option>
                            </select>
                        </div>
                        
                        <div className="col-span-1 md:col-span-3">
                            <label className="block text-sm font-semibold mb-2">Grupo de Planificación (Selección Múltiple)</label>
                            <div className="flex flex-wrap gap-2">
                                {ACTIVITY_CODES.map(c => (
                                    <button 
                                        key={c.code}
                                        type="button"
                                        onClick={() => togglePlanningGroup(c.code)}
                                        className={`px-4 py-2 rounded-full border text-xs font-bold transition-all ${
                                            formData.planning_groups.includes(c.code)
                                            ? 'bg-slate-800 border-black text-white'
                                            : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        {c.code} - {c.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-1 flex items-center gap-1"><Calendar size={14}/> Fecha Inicio</label>
                            <input type="date" className="w-full border p-2 rounded" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1 flex items-center gap-1"><Clock size={14}/> Hora Inicio</label>
                            <input type="time" className="w-full border p-2 rounded" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1 flex items-center gap-1"><Calendar size={14}/> Fecha Término</label>
                            <input type="date" className="w-full border p-2 rounded" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1 flex items-center gap-1"><Clock size={14}/> Hora Término</label>
                            <input type="time" className="w-full border p-2 rounded" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} />
                        </div>

                        <div className="col-span-1 md:col-span-3">
                            <label className="block text-sm font-semibold mb-1">Acción Realizada</label>
                            <textarea 
                                className="w-full border p-3 rounded-lg" 
                                rows="3"
                                placeholder="Describa el trabajo técnico efectuado..."
                                value={formData.action_performed}
                                onChange={e => setFormData({...formData, action_performed: e.target.value})}
                            />
                        </div>
                    </div>
                </section>

                {/* SECCION 3: ACTIVIDADES TÉCNICAS (PROTOCOLO) */}
                <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-lg font-bold flex items-center gap-2 text-blue-800">
                                <CheckCircle size={20} /> 3. Protocolo de Actividades (Catálogo Técnico)
                            </h2>
                            <p className="text-xs text-slate-500 ml-7">Seleccione las actividades realizadas según el manual del equipo</p>
                        </div>
                        {allStandardTasks.length > 0 && (
                            <button 
                                type="button" 
                                onClick={selectAllTasks}
                                className="text-xs bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg font-bold text-blue-700 border border-blue-200 transition-colors"
                            >
                                MARCAR TODA LA RUTINA
                            </button>
                        )}
                    </div>

                    {formData.machine_ids.length === 0 ? (
                        <div className="p-12 border-2 border-dashed border-slate-100 rounded-2xl text-center text-slate-400 bg-slate-50/50">
                            <Settings className="mx-auto mb-3 opacity-20" size={40} />
                            <p className="font-medium italic">Seleccione un equipo para desplegar su protocolo técnico oficial</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Selector Desplegable Abierto (Grouped Checklist) */}
                            <div className="grid grid-cols-1 gap-6">
                                {ACTIVITY_CODES.map(codeGroup => {
                                    // Filter tasks that belong to this code or start with this code (like RC-01)
                                    const tasksInGroup = allStandardTasks.filter(st => 
                                        st.task_code === codeGroup.code || 
                                        st.task_code.startsWith(codeGroup.code + '-')
                                    );
                                    
                                    if (tasksInGroup.length === 0) return null;

                                    return (
                                        <div key={codeGroup.code} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                            <div className={`px-4 py-2 text-xs font-black uppercase tracking-widest flex justify-between items-center ${codeGroup.color}`}>
                                                <span>{codeGroup.label}</span>
                                                <span className="bg-white/20 px-2 py-0.5 rounded-full">{tasksInGroup.length}</span>
                                            </div>
                                            <div className="grid grid-cols-1 divide-y divide-slate-100">
                                                {tasksInGroup.map(st => {
                                                    const isSelected = formData.tasks.some(t => t.task_description === st.task_description);
                                                    return (
                                                        <div 
                                                            key={st.id} 
                                                            onClick={() => toggleStandardTask(st)}
                                                            className={`flex items-start gap-4 p-4 cursor-pointer transition-all hover:bg-slate-50 relative group ${isSelected ? 'bg-blue-50/30' : ''}`}
                                                        >
                                                            <div className={`mt-0.5 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                                                                isSelected 
                                                                ? 'bg-blue-600 border-blue-600 shadow-sm' 
                                                                : 'bg-white border-slate-300 group-hover:border-blue-400'
                                                            }`}>
                                                                {isSelected && <CheckCircle size={14} className="text-white" />}
                                                            </div>
                                                            <div className="flex-1">
                                                                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded border mb-1 inline-block ${
                                                                    isSelected ? 'bg-blue-100 border-blue-200 text-blue-700' : 'bg-slate-100 border-slate-200 text-slate-500'
                                                                }`}>
                                                                    {st.task_code}
                                                                </span>
                                                                <p className={`text-sm leading-relaxed ${isSelected ? 'text-blue-900 font-bold' : 'text-slate-700'}`}>
                                                                    {st.task_description}
                                                                </p>
                                                            </div>
                                                            {isSelected && (
                                                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.5)]"></div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Buscador de tareas (por si es muy largo) */}
                            <div className="relative max-w-md mx-auto">
                                <input 
                                    type="text"
                                    className="w-full border-2 border-slate-100 p-2.5 pl-10 rounded-full text-sm bg-slate-50 focus:border-blue-400 focus:bg-white outline-none transition-all"
                                    placeholder="¿No encuentras una tarea? Busca aquí..."
                                    value={taskSearch}
                                    onChange={e => setTaskSearch(e.target.value)}
                                />
                                <Settings className="absolute left-3.5 top-3 text-slate-400" size={16} />
                            </div>

                            {/* Tareas Seleccionadas / Personalizadas */}
                            <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl">
                                <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-blue-400">
                                    <Package size={18} /> Resumen del Protocolo ({formData.tasks.length} Seleccionadas)
                                </h3>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                    {formData.tasks.map(t => (
                                        <div key={t.id} className="flex items-center gap-3 p-2 bg-white/5 border border-white/10 rounded-lg group">
                                            <span className="w-12 text-[10px] font-black text-blue-400 border border-blue-400/30 px-1 rounded text-center">
                                                {t.task_code}
                                            </span>
                                            <span className="flex-1 text-xs font-medium text-slate-300">{t.task_description}</span>
                                            <button 
                                                type="button" 
                                                onClick={() => setFormData({...formData, tasks: formData.tasks.filter(x => x.id !== t.id)})} 
                                                className="text-red-400 hover:text-red-300 px-2 font-bold text-xs"
                                            >
                                                ELIMINAR
                                            </button>
                                        </div>
                                    ))}
                                    {formData.tasks.length === 0 && (
                                        <p className="text-xs text-slate-500 italic text-center py-4 bg-white/5 rounded-lg border border-dashed border-white/10">
                                            Debe seleccionar actividades del catálogo superior
                                        </p>
                                    )}
                                </div>

                                {/* Campo para tarea extra fuera de catálogo */}
                                <div className="mt-6 flex gap-2">
                                    <select 
                                        className="bg-white/10 border border-white/20 p-2 rounded-xl font-bold text-xs w-24 text-white"
                                        value={newTaskCode}
                                        onChange={e => setNewTaskCode(e.target.value)}
                                    >
                                        {ACTIVITY_CODES.map(c => <option key={c.code} value={c.code} className="text-slate-800">{c.code}</option>)}
                                    </select>
                                    <input 
                                        className="flex-1 bg-white/10 border border-white/20 p-2 rounded-xl text-sm text-white placeholder-slate-500 focus:bg-white/20 outline-none"
                                        placeholder="Registrar tarea extraordinaria..."
                                        value={newTaskDesc}
                                        onChange={e => setNewTaskDesc(e.target.value)}
                                    />
                                    <button 
                                        type="button" 
                                        onClick={addTask}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-bold text-xs shadow-lg shadow-blue-900/20"
                                    >
                                        AÑADIR EXTRA
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                {/* SECCION 4: PERSONAL RESPONSABLE */}
                <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-indigo-800">
                        <Users size={20} /> 4. Personal Responsable
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold mb-2">Técnicos Responsables (Varios)</label>
                            <div className="border p-4 rounded-lg bg-slate-50 max-h-48 overflow-y-auto grid grid-cols-1 gap-2">
                                {technicians.map(t => (
                                    <div 
                                        key={t.id} 
                                        onClick={() => toggleTechnician(t.name)}
                                        className={`flex items-center gap-2 p-2 rounded border cursor-pointer text-sm ${
                                            formData.responsible_technicians.includes(t.name) 
                                            ? 'bg-blue-50 border-blue-400 text-blue-700 font-bold' 
                                            : 'bg-white border-slate-200'
                                        }`}
                                    >
                                        <div className={`w-3 h-3 rounded-full ${formData.responsible_technicians.includes(t.name) ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                                        {t.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-1 flex items-center gap-2"><User size={14}/> Técnico Líder</label>
                                <input 
                                    className="w-full border p-2.5 rounded-lg"
                                    placeholder="Nombre del técnico a cargo"
                                    value={formData.leader_technician_name}
                                    onChange={e => setFormData({...formData, leader_technician_name: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1 flex items-center gap-2"><User size={14}/> Supervisor / Encargado</label>
                                <input 
                                    className="w-full border p-2.5 rounded-lg"
                                    placeholder="Supervisor de turno"
                                    value={formData.supervisor_name}
                                    onChange={e => setFormData({...formData, supervisor_name: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* SECCION 5: RECAMBIOS Y MATERIALES */}
                <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-amber-800">
                        <Package size={20} /> 5. Recambios y Materiales Usados
                    </h2>
                    <div className="flex gap-2 mb-4">
                        <select 
                            className="flex-1 border p-2.5 rounded-lg text-sm bg-white"
                            value={newSpareId}
                            onChange={e => setNewSpareId(e.target.value)}
                        >
                            <option value="">Seleccione material del inventario...</option>
                            {inventory.map(i => (
                                <option key={i.id} value={i.id}>{i.code} - {i.name} (Stock: {i.stock})</option>
                            ))}
                        </select>
                        <input 
                            type="number" className="w-20 border p-2 rounded" min="1"
                            value={newSpareQty}
                            onChange={e => setNewSpareQty(e.target.value)}
                        />
                        <button type="button" onClick={addSpare} className="bg-amber-600 text-white px-4 py-2 rounded font-bold">REGISTRAR</button>
                    </div>
                    <div className="space-y-2">
                        {formData.spare_results.map(s => (
                            <div key={s.id} className="flex justify-between items-center bg-amber-50 border border-amber-200 p-3 rounded text-sm">
                                <div className="font-medium text-amber-900">
                                    {s.name} - <span className="font-bold">Cantidad: {s.used_quantity}</span>
                                </div>
                                <button type="button" onClick={() => setFormData({...formData, spare_results: formData.spare_results.filter(x => x.id !== s.id)})} className="text-red-600 font-bold">Eliminar</button>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-3 text-sm text-blue-800 italic">
                        <AlertTriangle size={18} /> El stock de estos materiales se descontará permanentemente al CERRAR el mantenimiento.
                    </div>
                </section>

                <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex justify-end gap-3 z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.1)]">
                    <button type="button" onClick={() => navigate(-1)} className="px-6 py-2 rounded-lg border border-slate-300 font-bold text-slate-600 hover:bg-slate-50">Cancelar</button>
                    <button 
                        type="submit" 
                        disabled={saving}
                        className="bg-blue-700 hover:bg-blue-800 text-white px-10 py-2 rounded-lg font-bold shadow-lg transition-transform active:scale-95 disabled:opacity-50"
                    >
                        {saving ? 'GUARDANDO...' : 'CREAR ORDEN PREVENTIVA'}
                    </button>
                </div>

            </form>
        </div>
    );
};

export default NewPreventiveOrder;
