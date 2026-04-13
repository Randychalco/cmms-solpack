import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

const PreventiveExecutionEdit = () => {
    const { id } = useParams();
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

    const [formData, setFormData] = useState({
        plant_id: '',
        area_id: '',
        machine_id: '',
        sub_machine_id: '',
        equipment_condition: 'OPERATIVO',
        criticality: 'BAJA',
        action_performed: '',
        planning_groups: [],
        start_date: '',
        end_date: '',
        start_time: '',
        end_time: '',
        responsible_technicians: [],
        leader_technician_name: '',
        supervisor_name: '',
        technician_signature: '',
        supervisor_signature: '',
        tasks: [],
        spare_results: [],
        general_observations: '',
        status: ''
    });

    const [newSpareId, setNewSpareId] = useState('');
    const [newSpareQty, setNewSpareQty] = useState(1);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [pRes, mRes, uRes, iRes, eRes] = await Promise.all([
                api.get('/master/plants'),
                api.get('/master/machines'),
                api.get('/users'),
                api.get('/inventory'),
                api.get(`/preventive/executions/${id}`)
            ]);

            const exe = eRes.data;
            setPlants(pRes.data);
            setAllMachines(mRes.data);
            setTechnicians(uRes.data.filter(u => u.role === 'technician' || u.role === 'admin'));
            setInventory(iRes.data);

            // Fetch areas for the plant
            if (exe.plant_id) {
                const aRes = await api.get(`/master/areas/${exe.plant_id}`);
                setAreas(aRes.data);
                const filtered = mRes.data.filter(m => m.area_id === parseInt(exe.area_id));
                setFilteredMachines(filtered);
            }

            // Fetch submachines for the execution machine
            if (exe.machine_id) {
                const smRes = await api.get(`/master/sub-machines/${exe.machine_id}`);
                setSubMachines(smRes.data);
            }

            setFormData({
                plant_id: exe.plant_id || '',
                area_id: exe.area_id || '',
                machine_id: exe.machine_id || '',
                sub_machine_id: exe.sub_machine_id || '',
                machine_ids: exe.machine_ids || [],
                equipment_condition: exe.equipment_condition || 'OPERATIVO',
                criticality: exe.criticality || 'BAJA',
                action_performed: exe.action_performed || '',
                planning_groups: exe.planning_groups || [],
                start_date: exe.start_date || '',
                end_date: exe.end_date || '',
                start_time: exe.start_time || '',
                end_time: exe.end_time || '',
                responsible_technicians: exe.responsible_technicians || [],
                leader_technician_name: exe.leader_technician_name || '',
                supervisor_name: exe.supervisor_name || '',
                technician_signature: exe.technician_signature || '',
                supervisor_signature: exe.supervisor_signature || '',
                tasks: (exe.task_results || []).map((t, idx) => ({
                    ...t,
                    id: t.id || `task-${idx}-${Date.now()}`,
                    description: t.description || t.task_description,
                    assigned_technicians: t.assigned_technicians || []
                })),
                spare_results: exe.spare_results || [],
                general_observations: exe.general_observations || '',
                status: exe.status
            });

            setLoading(false);
        } catch (err) {
            console.error(err);
            alert('Error cargando datos de la orden');
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
        } catch (err) { console.error(err); }
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

    const toggleTechnician = (name) => {
        const current = formData.responsible_technicians || [];
        if (current.includes(name)) {
            setFormData({ ...formData, responsible_technicians: current.filter(t => t !== name) });
        } else {
            setFormData({ ...formData, responsible_technicians: [...current, name] });
        }
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

    const handleSubmit = async (e, forceComplete = false) => {
        if (e) e.preventDefault();
        try {
            setSaving(true);
            
            // Clean simple fields but preserve arrays/objects
            const updateData = {};
            for (const [key, value] of Object.entries(formData)) {
                if (key === 'tasks') continue; // Don't send the frontend-only 'tasks' key
                updateData[key] = (value === '') ? null : value;
            }

            // Ensure task_results is updated from the frontend 'tasks' state
            updateData.task_results = formData.tasks;
            
            if (forceComplete) {
                updateData.status = 'COMPLETADO';
            }

            await api.put(`/preventive/executions/${id}`, updateData);
            alert(forceComplete ? 'Orden Finalizada con Éxito' : 'Orden Actualizada con Éxito');
            navigate(`/preventive/execution/${id}`);
        } catch (err) {
            console.error(err);
            alert('Error al actualizar la orden: ' + (err.response?.data?.message || err.message));
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8">Cargando formulario de edición...</div>;

    const isCompleted = formData.status === 'COMPLETADO';

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-black mb-4">
                <ArrowLeft size={20} /> Volver a Detalles
            </button>

            <header className="mb-8 border-b pb-4 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Settings className="text-blue-600" /> Editar Orden Preventiva #{id}
                    </h1>
                    <p className="text-gray-500 mt-2">Modificación de datos básicos y configuración de la orden</p>
                </div>
                {isCompleted && (
                    <div className="bg-amber-100 border border-amber-200 text-amber-800 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                        <AlertTriangle size={18}/> ORDEN FINALIZADA: Use con precaución
                    </div>
                )}
            </header>

            <form onSubmit={handleSubmit} className="space-y-8 pb-32">
                
                {/* 1. UBICACION */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-black mb-4 flex items-center gap-2 text-blue-900">
                        <HardDrive size={20} /> 1. Ubicación y Equipos
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Planta</label>
                            <select className="w-full border p-3 rounded-xl bg-slate-50 font-bold" value={formData.plant_id} onChange={e => handlePlantChange(e.target.value)}>
                                <option value="">Seleccione Planta...</option>
                                {plants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Área</label>
                            <select className="w-full border p-3 rounded-xl bg-slate-50 font-bold" value={formData.area_id} onChange={e => handleAreaChange(e.target.value)} disabled={!formData.plant_id}>
                                <option value="">Seleccione Área...</option>
                                {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        </div>

                        {/* Traditional Selection (Mirror Order of Work) */}
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1 font-bold">Equipo</label>
                            <select 
                                className="w-full border p-3 rounded-xl bg-slate-50 font-bold"
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
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1 font-bold">Sub-Equipo</label>
                            <select 
                                className="w-full border p-3 rounded-xl bg-slate-50 font-bold"
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

                {/* 2. OPERACION */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-black mb-4 flex items-center gap-2 text-emerald-900">
                        <Activity size={20} /> 2. Tiempos y Operación
                    </h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="col-span-1">
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Equipo Atendido</label>
                            <select className="w-full border p-3 rounded-xl bg-slate-50 font-bold" value={formData.equipment_condition} onChange={e => setFormData({...formData, equipment_condition: e.target.value})}>
                                <option value="OPERATIVO">OPERATIVO</option>
                                <option value="OPERATIVO PARCIAL">OPERATIVO PARCIAL</option>
                                <option value="NO OPERATIVO">NO OPERATIVO</option>
                            </select>
                        </div>
                        <div className="col-span-1">
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Criticidad</label>
                            <select className="w-full border p-3 rounded-xl bg-slate-50 font-bold" value={formData.criticality} onChange={e => setFormData({...formData, criticality: e.target.value})}>
                                <option value="BAJA">BAJA</option>
                                <option value="MEDIA">MEDIA</option>
                                <option value="ALTA">ALTA</option>
                                <option value="CRITICA">CRITICA</option>
                            </select>
                        </div>
                        <div className="col-span-2">
                             <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Clase</label>
                             <input className="w-full border p-3 rounded-xl bg-slate-100 font-bold text-slate-500" value="MANTENIMIENTO PREVENTIVO" readOnly />
                        </div>

                        <div className="col-span-2 lg:col-span-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase mb-1">Fecha Inicio</label>
                                <input type="date" className="w-full border p-3 rounded-xl" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase mb-1">Hora Inicio</label>
                                <input type="time" className="w-full border p-3 rounded-xl" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase mb-1">Fecha Término</label>
                                <input type="date" className="w-full border p-3 rounded-xl" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase mb-1">Hora Término</label>
                                <input type="time" className="w-full border p-3 rounded-xl" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} />
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. PLANIFICACIÓN DE ACTIVIDADES */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-black mb-4 flex items-center gap-2 text-violet-900">
                        <CheckCircle size={20} /> 3. Planificación de Actividades
                    </h2>
                    
                    <div className="flex gap-2 mb-6">
                        <input 
                            type="text"
                            placeholder="Describa una actividad o tarea manual..."
                            className="flex-1 border p-3 rounded-xl bg-slate-50 font-medium focus:ring-2 focus:ring-violet-500 outline-none"
                            value={newTaskDescription}
                            onChange={(e) => setNewTaskDescription(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTask())}
                        />
                        <button 
                            type="button"
                            onClick={addTask}
                            className="bg-violet-600 text-white px-6 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-violet-700 transition-all"
                        >
                            AGREGAR
                        </button>
                    </div>

                    <div className="space-y-3">
                        {formData.tasks.length === 0 ? (
                            <div className="text-center py-10 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
                                <Activity className="mx-auto mb-2 opacity-20" size={40} />
                                <p className="font-bold">No hay actividades planificadas para esta orden.</p>
                            </div>
                        ) : (
                            formData.tasks.map((task) => (
                                <div key={task.id} className="flex flex-col gap-3 p-4 bg-white border border-slate-200 rounded-2xl hover:border-violet-300 transition-all shadow-sm">
                                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                                        <div className="flex-1 font-bold text-slate-700">
                                            {task.description || task.task_description}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <select 
                                                className={`text-[10px] font-black uppercase px-3 py-2 rounded-lg border focus:ring-2 focus:ring-violet-500 outline-none transition-all ${
                                                    task.status === 'Pendiente' || task.checked === false ? 'bg-slate-100 text-slate-600 border-slate-300' :
                                                    task.status === 'Observado' ? 'bg-amber-100 text-amber-700 border-amber-300' :
                                                    'bg-emerald-100 text-emerald-700 border-emerald-300'
                                                }`}
                                                value={task.status || (task.checked ? 'Hecho' : 'Pendiente')}
                                                onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                                            >
                                                <option value="Pendiente">PENDIENTE</option>
                                                <option value="Observado">OBSERVADO</option>
                                                <option value="Finalizado">FINALIZADO</option>
                                            </select>
                                            <button 
                                                type="button"
                                                onClick={() => removeTask(task.id || task.task_description)}
                                                className="text-red-400 hover:text-red-600 p-2 transition-colors"
                                            >
                                                <ArrowLeft className="rotate-45" size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    {task.status === 'Observado' && (
                                        <input 
                                            type="text"
                                            placeholder="Describa la observación detectada..."
                                            className="w-full text-xs p-2 bg-amber-50 border border-amber-100 rounded-xl focus:ring-1 focus:ring-amber-400 outline-none font-medium"
                                            value={task.comment || ''}
                                            onChange={(e) => updateTaskComment(task.id, e.target.value)}
                                        />
                                    )}

                                    {/* ASIGNACIÓN DE TÉCNICOS POR ACTIVIDAD */}
                                    <div className="mt-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Técnicos Asignados:</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {formData.responsible_technicians.length === 0 ? (
                                                <p className="text-[10px] text-slate-400 italic px-1">Seleccione técnicos en la Sección 4 primero</p>
                                            ) : (
                                                formData.responsible_technicians.map((techName) => (
                                                    <button
                                                        key={techName}
                                                        type="button"
                                                        onClick={() => toggleTaskTechnician(task.id, techName)}
                                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black border transition-all ${
                                                            (task.assigned_technicians || []).includes(techName)
                                                            ? 'bg-indigo-600 border-indigo-700 text-white shadow-lg'
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

                {/* 4. TÉCNICOS */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-black mb-4 flex items-center gap-2 text-indigo-900">
                        <Users size={20} /> 4. Personal Responsable
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-semibold mb-2 text-slate-700">Técnicos Responsables (Varios)</label>
                            <div className="border p-4 rounded-xl bg-slate-50 max-h-48 overflow-y-auto grid grid-cols-1 gap-2">
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
                        <div className="flex flex-col gap-4">
                            <SignaturePad
                                label="FIRMA TÉCNICO LÍDER"
                                value={formData.technician_signature}
                                onChange={(val) => setFormData({ ...formData, technician_signature: val })}
                            />
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Nombre del Técnico Líder</label>
                                <input 
                                    type="text" 
                                    placeholder="Ingrese nombre completo..."
                                    className="w-full border p-2 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-400 outline-none font-bold"
                                    value={formData.leader_technician_name || ''}
                                    onChange={(e) => setFormData({ ...formData, leader_technician_name: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-4">
                            <SignaturePad
                                label="FIRMA SUPERVISOR DE PRODUCCIÓN"
                                value={formData.supervisor_signature}
                                onChange={(val) => setFormData({ ...formData, supervisor_signature: val })}
                            />
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Nombre del Supervisor</label>
                                <input 
                                    type="text" 
                                    placeholder="Ingrese nombre completo..."
                                    className="w-full border p-2 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-400 outline-none font-bold"
                                    value={formData.supervisor_name || ''}
                                    onChange={(e) => setFormData({ ...formData, supervisor_name: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* 5. REPUESTOS (RESUMEN) */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                     <h2 className="text-lg font-black mb-4 flex items-center gap-2 text-slate-800">
                        <Package size={20} /> 5. Resumen de Repuestos y Materiales
                    </h2>
                    <div className="grid grid-cols-1 gap-8">
                        <div>
                             <h4 className="text-xs font-black text-slate-400 uppercase mb-3 tracking-widest">MATERIALES UTILIZADOS</h4>
                             <div className="space-y-2 mb-4">
                                {formData.spare_results.map(s => (
                                    <div key={s.id} className="flex justify-between items-center bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs">
                                        <span className="font-bold text-amber-900">{s.name} x {s.used_quantity}</span>
                                        <button type="button" onClick={() => setFormData({...formData, spare_results: formData.spare_results.filter(x => x.id !== s.id)})} className="text-red-500 font-black uppercase text-[10px]">Quitar</button>
                                    </div>
                                ))}
                             </div>
                             <div className="flex gap-2">
                                <select className="flex-1 border p-2 rounded-lg text-xs" value={newSpareId} onChange={e => setNewSpareId(e.target.value)}>
                                    <option value="">Seleccione material...</option>
                                    {inventory.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                </select>
                                <button type="button" onClick={addSpare} className="bg-amber-500 text-white px-4 rounded-lg font-black text-xs uppercase">Añadir</button>
                             </div>
                        </div>
                    </div>
                </section>

                {/* BOTONERA FLOTANTE */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-6 flex justify-end gap-4 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
                    <div className="flex gap-4">
                        <button 
                            type="submit" 
                            disabled={saving}
                            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {saving ? 'Guardando...' : 'ACTUALIZAR PROGRESO'}
                        </button>
                        
                        {!isCompleted && (
                            <button 
                                type="button"
                                onClick={() => handleSubmit(null, true)}
                                disabled={saving}
                                className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-black shadow-lg hover:bg-emerald-700 transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                <CheckCircle size={20} /> FINALIZAR ORDEN
                            </button>
                        )}
                        
                        <button 
                            type="button"
                            onClick={() => navigate(-1)}
                            className="bg-slate-100 text-slate-600 px-8 py-3 rounded-xl font-black hover:bg-slate-200 transition-all"
                        >
                            CANCELAR
                        </button>
                    </div>
                </div>

            </form>
        </div>
    );
};

export default PreventiveExecutionEdit;
