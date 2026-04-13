import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { 
    Calendar, Clock, Save, ArrowLeft, 
    User, Users, Settings, Package, HardDrive, 
    AlertTriangle, CheckCircle, Activity 
} from 'lucide-react';
import SignaturePad from '../components/SignaturePad';

const ACTIVITY_CODES = [
    { code: 'LIM', label: 'Limpieza', color: 'bg-emerald-100 text-emerald-800' },
    { code: 'CAM', label: 'Cambio', color: 'bg-teal-100 text-teal-800' },
    { code: 'RI', label: 'Inspección', color: 'bg-blue-100 text-blue-800' },
    { code: 'RL', label: 'Lubricación', color: 'bg-amber-100 text-amber-800' },
    { code: 'NEU', label: 'Neumático', color: 'bg-sky-100 text-sky-800' },
    { code: 'HID', label: 'Hidráulico', color: 'bg-cyan-100 text-cyan-800' },
    { code: 'MEC', label: 'Mecánico', color: 'bg-slate-50 text-slate-600' },
    { code: 'ELE', label: 'Eléctrico', color: 'bg-yellow-100 text-yellow-800' }
];

const NewPreventiveOrder = () => {
    const navigate = useNavigate();
    const [plants, setPlants] = useState([]);
    const [areas, setAreas] = useState([]);
    const [allMachines, setAllMachines] = useState([]);
    const [filteredMachines, setFilteredMachines] = useState([]);
    const [subMachines, setSubMachines] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newTaskDescription, setNewTaskDescription] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        plant_id: '',
        area_id: '',
        machine_id: '',
        sub_machine_id: '',
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
        technician_signature: '',
        supervisor_signature: '',
        tasks: [],
        spare_results: [],
        general_observations: ''
    });

    // Sub-form for spares
    const [newSpareId, setNewSpareId] = useState('');
    const [newSpareQty, setNewSpareQty] = useState(1);
    const [spareSearch, setSpareSearch] = useState('');
    const [showSpareDropdown, setShowSpareDropdown] = useState(false);
    const [selectedSpare, setSelectedSpare] = useState(null);

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
        setFormData({ ...formData, area_id: areaId, machine_id: '', sub_machine_id: '', machine_ids: [] });
        const filtered = allMachines.filter(m => m.area_id === parseInt(areaId));
        setFilteredMachines(filtered);
        setSubMachines([]);
    };

    const handleMachineChange = async (machineId) => {
        setFormData({ ...formData, machine_id: machineId, sub_machine_id: '', machine_ids: machineId ? [parseInt(machineId)] : [] });
        if (!machineId) {
            setSubMachines([]);
            return;
        }
        try {
            const { data } = await api.get(`/master/sub-machines/${machineId}`);
            setSubMachines(data);
        } catch (err) {
            console.error(err);
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

    const addTask = () => {
        if (!newTaskDescription.trim()) return;
        setFormData({
            ...formData,
            tasks: [...formData.tasks, {
                id: Date.now(),
                description: newTaskDescription.trim(),
                status: 'Pendiente',
                comment: '',
                assigned_technicians: []
            }]
        });
        setNewTaskDescription('');
    };

    const removeTask = (id) => {
        setFormData({
            ...formData,
            tasks: formData.tasks.filter(t => t.id !== id)
        });
    };

    const updateTaskStatus = (id, newStatus) => {
        setFormData({
            ...formData,
            tasks: formData.tasks.map(t => t.id === id ? { ...t, status: newStatus } : t)
        });
    };

    const updateTaskComment = (id, newComment) => {
        setFormData({
            ...formData,
            tasks: formData.tasks.map(t => t.id === id ? { ...t, comment: newComment } : t)
        });
    };

    const toggleTaskTechnician = (taskId, techName) => {
        setFormData({
            ...formData,
            tasks: formData.tasks.map(t => {
                if (t.id !== taskId) return t;
                const current = t.assigned_technicians || [];
                const updated = current.includes(techName)
                    ? current.filter(tn => tn !== techName)
                    : [...current, techName];
                return { ...t, assigned_technicians: updated };
            })
        });
    };



    const addSpare = () => {
        if (!selectedSpare) return;
        setFormData({
            ...formData,
            spare_results: [...formData.spare_results, {
                id: Date.now(),
                inventory_id: selectedSpare.id,
                name: selectedSpare.name,
                expected_quantity: parseInt(newSpareQty),
                used_quantity: parseInt(newSpareQty)
            }]
        });
        setSelectedSpare(null);
        setSpareSearch('');
        setNewSpareQty(1);
        setShowSpareDropdown(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.machine_id) return alert('Seleccione un equipo');
        
        try {
            setSaving(true);
            const cleanedData = Object.fromEntries(
                Object.entries(formData).map(([key, value]) => [key, value === '' ? null : value])
            );
            const payload = {
                ...cleanedData,
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
                            <label className="block text-sm font-semibold mb-1 text-slate-700">Planta</label>
                            <select 
                                className="w-full border p-2.5 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                                value={formData.plant_id}
                                onChange={e => handlePlantChange(e.target.value)}
                            >
                                <option value="">Seleccione Planta...</option>
                                {plants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1 text-slate-700">Área</label>
                            <select 
                                className="w-full border p-2.5 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                                value={formData.area_id}
                                onChange={e => handleAreaChange(e.target.value)}
                                disabled={!formData.plant_id}
                            >
                                <option value="">Seleccione Área...</option>
                                {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        </div>

                        {/* Traditional Selection (Mirror Order of Work) */}
                        <div>
                            <label className="block text-sm font-semibold mb-1 text-slate-700">Equipo</label>
                            <select 
                                className="w-full border p-2.5 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                                value={formData.machine_id}
                                onChange={e => handleMachineChange(e.target.value)}
                                disabled={!formData.area_id}
                            >
                                <option value="">Seleccione Equipo...</option>
                                {filteredMachines.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-1 text-slate-700">Sub-Equipo</label>
                            <select 
                                className="w-full border p-2.5 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.sub_machine_id}
                                onChange={e => setFormData({ ...formData, sub_machine_id: e.target.value })}
                                disabled={!formData.machine_id}
                            >
                                <option value="">Seleccione Sub-Equipo...</option>
                                {subMachines.map(sm => (
                                    <option key={sm.id} value={sm.id}>{sm.name}</option>
                                ))}
                            </select>
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

                        <div className="col-span-1 md:col-span-3 grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                        </div>


                    </div>
                </section>

                {/* SECCION 3: PERSONAL RESPONSABLE */}
                <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-indigo-800">
                        <Users size={20} /> 3. Personal Responsable
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-semibold mb-2">Técnicos Responsables (Varios)</label>
                            <div className="border p-4 rounded-lg bg-slate-50 max-h-48 overflow-y-auto grid grid-cols-1 gap-2">
                                {technicians.map(t => (
                                    <button 
                                        key={t.id} 
                                        type="button"
                                        onClick={() => toggleTechnician(t.name)}
                                        className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-sm transition-all w-full text-left ${
                                            formData.responsible_technicians.includes(t.name) 
                                            ? 'bg-blue-50 border-blue-400 text-blue-700 font-bold' 
                                            : 'bg-white border-slate-200 text-slate-500'
                                        }`}
                                    >
                                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${formData.responsible_technicians.includes(t.name) ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                                        <span className="truncate">{t.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* SECCION 4: PLANIFICACIÓN DE ACTIVIDADES */}
                <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-violet-800">
                        <CheckCircle size={20} /> 4. Planificación de Actividades
                    </h2>
                    
                    <div className="flex gap-2 mb-6">
                        <input 
                            type="text"
                            placeholder="Describa una actividad planificada..."
                            className="flex-1 border p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                            value={newTaskDescription}
                            onChange={(e) => setNewTaskDescription(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTask())}
                        />
                        <button 
                            type="button"
                            onClick={addTask}
                            className="bg-violet-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-violet-700 transition-colors"
                        >
                            AGREGAR
                        </button>
                    </div>

                    <div className="space-y-3">
                        {formData.tasks.length === 0 ? (
                            <div className="text-center py-10 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
                                <Activity className="mx-auto mb-2 opacity-20" size={40} />
                                <p>No hay actividades agregadas aún.</p>
                            </div>
                        ) : (
                            formData.tasks.map((task) => (
                                <div key={task.id} className="flex flex-col gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:border-violet-300 transition-colors group">
                                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                                        <div className="flex-1 font-medium text-slate-700">
                                            {task.description}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <select 
                                                className={`text-xs font-bold px-3 py-1.5 rounded-lg border focus:ring-2 focus:ring-violet-500 outline-none transition-colors ${
                                                    task.status === 'Pendiente' ? 'bg-slate-100 text-slate-600 border-slate-300' :
                                                    task.status === 'Observado' ? 'bg-amber-100 text-amber-700 border-amber-300' :
                                                    'bg-emerald-100 text-emerald-700 border-emerald-300'
                                                }`}
                                                value={task.status}
                                                onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                                            >
                                                <option value="Pendiente">PENDIENTE</option>
                                                <option value="Observado">OBSERVADO</option>
                                                <option value="Finalizado">FINALIZADO</option>
                                            </select>
                                            <button 
                                                type="button"
                                                onClick={() => removeTask(task.id)}
                                                className="text-red-400 hover:text-red-600 p-1.5 transition-colors"
                                                title="Eliminar actividad"
                                            >
                                                <ArrowLeft className="rotate-45" size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    {task.status === 'Observado' && (
                                        <input 
                                            type="text"
                                            placeholder="Describa la observación detectada..."
                                            className="w-full text-xs p-2 bg-amber-50 border border-amber-100 rounded-lg focus:ring-1 focus:ring-amber-400 outline-none"
                                            value={task.comment || ''}
                                            onChange={(e) => updateTaskComment(task.id, e.target.value)}
                                        />
                                    )}

                                    {/* ASIGNACIÓN DE TÉCNICOS POR ACTIVIDAD */}
                                    <div className="mt-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight mb-2 px-1">Asignar Técnicos:</p>
                                        <div className="flex flex-wrap gap-1.5 p-1">
                                            {formData.responsible_technicians.length === 0 ? (
                                                <p className="text-[10px] text-slate-400 italic">Seleccione técnicos en la Sección 3 primero</p>
                                            ) : (
                                                formData.responsible_technicians.map((techName) => (
                                                    <button
                                                        key={techName}
                                                        type="button"
                                                        onClick={() => toggleTaskTechnician(task.id, techName)}
                                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black border transition-all ${
                                                            (task.assigned_technicians || []).includes(techName)
                                                            ? 'bg-indigo-600 border-indigo-700 text-white shadow-md'
                                                            : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-300'
                                                        }`}
                                                    >
                                                        {techName}
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>


                {/* SECCION 5: RECAMBIOS Y MATERIALES */}
                <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-amber-800">
                        <Package size={20} /> 5. Recambios y Materiales Usados
                    </h2>
                    <div className="mb-4">
                        <div className="flex gap-2 items-start">
                            {/* Search box with dropdown */}
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    placeholder="🔍 Buscar material por nombre o código..."
                                    className="w-full border p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 outline-none bg-white"
                                    value={spareSearch}
                                    onChange={(e) => {
                                        setSpareSearch(e.target.value);
                                        setShowSpareDropdown(true);
                                        setSelectedSpare(null);
                                    }}
                                    onFocus={() => setShowSpareDropdown(true)}
                                    onBlur={() => setTimeout(() => setShowSpareDropdown(false), 150)}
                                />
                                {/* Selected badge */}
                                {selectedSpare && (
                                    <div className="mt-1 flex items-center gap-2">
                                        <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full border border-amber-300">
                                            ✓ {selectedSpare.name} (Stock: {selectedSpare.stock ?? selectedSpare.current_stock ?? '?'})
                                        </span>
                                        <button type="button" onClick={() => { setSelectedSpare(null); setSpareSearch(''); }} className="text-red-400 text-xs hover:text-red-600">✕</button>
                                    </div>
                                )}
                                {/* Dropdown results */}
                                {showSpareDropdown && spareSearch.trim().length > 0 && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-52 overflow-y-auto">
                                        {inventory
                                            .filter(i => 
                                                i.name?.toLowerCase().includes(spareSearch.toLowerCase()) ||
                                                i.code?.toLowerCase().includes(spareSearch.toLowerCase())
                                            )
                                            .slice(0, 15)
                                            .map(i => (
                                                <button
                                                    key={i.id}
                                                    type="button"
                                                    onMouseDown={() => {
                                                        setSelectedSpare(i);
                                                        setSpareSearch(i.name);
                                                        setShowSpareDropdown(false);
                                                    }}
                                                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-amber-50 border-b border-slate-100 last:border-0 flex justify-between items-center gap-2"
                                                >
                                                    <span className="font-medium text-slate-700">{i.name}</span>
                                                    <span className="text-xs text-slate-400 shrink-0">{i.code} · Stock: {i.stock ?? i.current_stock ?? '?'}</span>
                                                </button>
                                            ))
                                        }
                                        {inventory.filter(i =>
                                            i.name?.toLowerCase().includes(spareSearch.toLowerCase()) ||
                                            i.code?.toLowerCase().includes(spareSearch.toLowerCase())
                                        ).length === 0 && (
                                            <div className="px-4 py-3 text-sm text-slate-400 italic">Sin resultados para "{spareSearch}"</div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <input 
                                type="number" className="w-20 border p-2.5 rounded-lg text-sm" min="1"
                                value={newSpareQty}
                                onChange={e => setNewSpareQty(e.target.value)}
                            />
                            <button type="button" onClick={addSpare} disabled={!selectedSpare} className="bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white px-4 py-2.5 rounded-lg font-bold transition-colors">REGISTRAR</button>
                        </div>
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
