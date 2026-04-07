import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

const PreventiveExecutionEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [plants, setPlants] = useState([]);
    const [areas, setAreas] = useState([]);
    const [allMachines, setAllMachines] = useState([]);
    const [filteredMachines, setFilteredMachines] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [allStandardTasks, setAllStandardTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [taskSearch, setTaskSearch] = useState('');

    const [formData, setFormData] = useState({
        plant_id: '',
        area_id: '',
        machine_ids: [],
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
        tasks: [],
        spare_results: [],
        general_observations: '',
        status: ''
    });

    // Sub-forms
    const [newTaskCode, setNewTaskCode] = useState('MEC');
    const [newTaskDesc, setNewTaskDesc] = useState('');
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
                const filtered = mRes.data.filter(m => m.areaId === parseInt(exe.area_id));
                setFilteredMachines(filtered);
            }

            setFormData({
                plant_id: exe.plant_id || '',
                area_id: exe.area_id || '',
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
                tasks: exe.task_results || [],
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
        setFormData({ ...formData, area_id: areaId, machine_ids: [] });
        const filtered = allMachines.filter(m => m.areaId === parseInt(areaId));
        setFilteredMachines(filtered);
    };

    const toggleMachine = (idInt) => {
        const current = formData.machine_ids;
        if (current.includes(idInt)) {
            setFormData({ ...formData, machine_ids: current.filter(m => m !== idInt) });
        } else {
            setFormData({ ...formData, machine_ids: [...current, idInt] });
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
        try {
            setSaving(true);
            const payload = {
                ...formData,
                task_results: formData.tasks 
            };
            await api.put(`/preventive/executions/${id}`, payload);
            alert('Orden Actualizada con Éxito');
            navigate(`/preventive/execution/${id}`);
        } catch (err) {
            console.error(err);
            alert('Error al actualizar la orden');
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
                        <div className="col-span-2">
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Equipos Seleccionados</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {filteredMachines.map(m => (
                                    <div 
                                        key={m.id}
                                        onClick={() => toggleMachine(m.id)}
                                        className={`cursor-pointer p-3 rounded-xl border text-sm font-bold transition-all flex items-center justify-between ${
                                            formData.machine_ids.includes(m.id) 
                                            ? 'bg-blue-600 border-blue-700 text-white shadow-md' 
                                            : 'bg-slate-50 border-slate-200 text-slate-500'
                                        }`}
                                    >
                                        {m.name}
                                        {formData.machine_ids.includes(m.id) && <CheckCircle size={14}/>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2. OPERACION */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-black mb-4 flex items-center gap-2 text-emerald-900">
                        <Activity size={20} /> 2. Tiempos y Operación
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                </section>

                {/* 3. TÉCNICOS */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-black mb-4 flex items-center gap-2 text-indigo-900">
                        <Users size={20} /> 3. Personal Responsable
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div>
                            <label className="block text-xs font-black text-slate-400 uppercase mb-2 text-center">EQUIPO TÉCNICO ASIGNADO</label>
                            <div className="border rounded-2xl p-4 bg-slate-50 grid grid-cols-2 gap-2 h-44 overflow-y-auto">
                                {technicians.map(t => (
                                    <div 
                                        key={t.id} 
                                        onClick={() => toggleTechnician(t.name)}
                                        className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer text-xs transition-all ${
                                            formData.responsible_technicians.includes(t.name) 
                                            ? 'bg-indigo-600 border-indigo-700 text-white font-black' 
                                            : 'bg-white border-slate-200 text-slate-600'
                                        }`}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${formData.responsible_technicians.includes(t.name) ? 'bg-white' : 'bg-slate-300'}`}></div>
                                        {t.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase mb-1">Técnico Líder en Reporte</label>
                                <input className="w-full border p-3 rounded-xl shadow-sm" value={formData.leader_technician_name} onChange={e => setFormData({...formData, leader_technician_name: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase mb-1">Supervisor Solicitante</label>
                                <input className="w-full border p-3 rounded-xl shadow-sm" value={formData.supervisor_name} onChange={e => setFormData({...formData, supervisor_name: e.target.value})} />
                            </div>
                        </div>
                    </div>
                </section>

                {/* 4. TAREAS Y REPUESTOS (RESUMEN) */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                     <h2 className="text-lg font-black mb-4 flex items-center gap-2 text-slate-800">
                        <CheckCircle size={20} /> 4. Resumen de Actividades y Repuestos
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                             <h4 className="text-xs font-black text-slate-400 uppercase mb-3 tracking-widest">ACTIVIDADES DEL CATÁLOGO</h4>
                             <div className="space-y-2 max-h-60 overflow-y-auto">
                                 {formData.tasks.map(t => (
                                     <div key={t.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl group relative">
                                         <span className="bg-blue-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md self-start mt-0.5">{t.task_code}</span>
                                         <p className="text-sm font-bold text-slate-700 flex-1">{t.task_description}</p>
                                         <button type="button" onClick={() => setFormData({...formData, tasks: formData.tasks.filter(x => x.id !== t.id)})} className="opacity-0 group-hover:opacity-100 transition-all text-red-500 font-black text-[10px]">REMOVER</button>
                                     </div>
                                 ))}
                                 <div className="flex gap-2">
                                     <input className="flex-1 border p-2 text-sm rounded-lg" placeholder="Añadir tarea manual..." value={newTaskDesc} onChange={e => setNewTaskDesc(e.target.value)} />
                                     <button type="button" onClick={addTask} className="bg-blue-50 text-blue-600 px-4 rounded-lg font-black text-xs">AÑADIR</button>
                                 </div>
                             </div>
                        </div>
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
                    <button type="button" onClick={() => navigate(-1)} className="px-8 py-3 rounded-2xl border-2 border-slate-200 font-black text-slate-400 hover:bg-slate-50 transition-all uppercase tracking-widest text-xs">Cancelar</button>
                    <button 
                        type="submit" 
                        disabled={saving}
                        className="bg-slate-900 hover:bg-black text-white px-12 py-3 rounded-2xl font-black shadow-2xl transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest text-xs flex items-center gap-3"
                    >
                        {saving ? <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div> : <Save size={20} />}
                        {saving ? 'PROCESANDO...' : 'ACTUALIZAR REGISTRO'}
                    </button>
                </div>

            </form>
        </div>
    );
};

export default PreventiveExecutionEdit;
