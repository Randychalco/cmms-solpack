import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Edit, Trash2, CalendarClock, Settings, Eye, Play, Tag, Package, ArrowLeft, FileSpreadsheet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ACTIVITY_CODES = [
    { code: 'MEC', label: 'Mecánico', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { code: 'ELE', label: 'Eléctrico', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    { code: 'LUB', label: 'Lubricación', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    { code: 'NEU', label: 'Neumático', color: 'bg-sky-100 text-sky-800 border-sky-200' },
    { code: 'HID', label: 'Hidráulico', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    { code: 'EST', label: 'Estructural', color: 'bg-slate-100 text-slate-800 border-slate-200' },
    { code: 'LIM', label: 'Limpieza', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
];

const PreventivePlans = () => {
    const navigate = useNavigate();
    const [plans, setPlans] = useState([]);
    const [machines, setMachines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        id: null,
        name: '',
        description: '',
        machine_id: '',
        frequency_days: 30,
        tasks: [],
        spares: []
    });

    // Sub-forms state
    const [newTaskCode, setNewTaskCode] = useState('MEC');
    const [newTask, setNewTask] = useState('');
    const [inventory, setInventory] = useState([]);
    const [newSpareId, setNewSpareId] = useState('');
    const [newSpareQty, setNewSpareQty] = useState(1);

    useEffect(() => {
        fetchData();
        fetchInventory();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [plansRes, machinesRes] = await Promise.all([
                api.get('/preventive/plans'),
                api.get('/master/machines')
            ]);
            setPlans(plansRes.data);
            setMachines(machinesRes.data);
        } catch (error) {
            console.error('Error fetching plans:', error);
            alert('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    };

    const fetchInventory = async () => {
        try {
            const { data } = await api.get('/inventory');
            setInventory(data);
        } catch (error) {
            console.error('Error fetching inventory');
        }
    }

    const handleOpenModal = (plan = null) => {
        if (plan) {
            setFormData(plan);
            setIsEditing(true);
        } else {
            setFormData({
                id: null,
                name: '',
                description: '',
                machine_id: '',
                frequency_days: 30,
                tasks: [],
                spares: []
            });
            setIsEditing(false);
        }
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.put(`/preventive/plans/${formData.id}`, formData);
            } else {
                await api.post('/preventive/plans', formData);
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            console.error(error);
            alert('Error al guardar el plan preventivo');
        }
    };

    const handleExportExcel = async () => {
        try {
            const response = await api.get('/export/preventive-plans-master', {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'plan_maestro_preventivo.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error al exportar:', error);
            alert('No se pudo generar el archivo Excel');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Eliminar este plan preventivo?')) {
            try {
                await api.delete(`/preventive/plans/${id}`);
                fetchData();
            } catch (error) {
                console.error(error);
                alert('Error al eliminar');
            }
        }
    };

    const handleGenerateExecution = async (plan_id) => {
        if(window.confirm('¿Generar nueva orden preventiva a partir de este plan?')) {
            try {
                const { data } = await api.post('/preventive/executions', { preventive_plan_id: plan_id });
                alert('Orden generada con éxito');
                navigate(`/preventive/execution/${data.id}`);
            } catch (err) {
                console.error(err);
                alert('Error al generar la orden');
            }
        }
    };

    const addTask = () => {
        if(!newTask.trim()) return;
        setFormData({
            ...formData,
            tasks: [...(formData.tasks || []), { 
                id: Date.now(), 
                task_code: newTaskCode,
                task_description: newTask 
            }]
        });
        setNewTask('');
    };

    const removeTask = (id) => {
        setFormData({
            ...formData,
            tasks: formData.tasks.filter(t => t.id !== id)
        });
    };

    const addSpare = () => {
        if(!newSpareId || newSpareQty < 1) return;
        const spareObj = inventory.find(i => i.id === parseInt(newSpareId));
        setFormData({
            ...formData,
            spares: [...(formData.spares || []), { 
                id: Date.now(), 
                inventory_id: parseInt(newSpareId), 
                expected_quantity: parseInt(newSpareQty),
                name: spareObj?.name || 'Repuesto Adicionado'
            }]
        });
        setNewSpareId('');
        setNewSpareQty(1);
    };

    const removeSpare = (id) => {
         setFormData({
            ...formData,
            spares: formData.spares.filter(s => s.id !== id)
        });
    };

    if (loading) return <div className="p-4">Cargando planes preventivos...</div>;

    return (
        <div className="p-6">
            <button 
                onClick={() => navigate('/preventive-history')}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-4 text-sm font-medium"
            >
                <ArrowLeft size={16} /> Volver al listado
            </button>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
                        <CalendarClock className="text-blue-600" /> Planes de Mantenimiento Preventivo
                    </h1>
                    <p className="text-gray-600 text-sm mt-1">Configuración y plantillas para mantenimientos rutinarios programados</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleExportExcel}
                        className="bg-white border border-slate-200 text-emerald-700 px-4 py-2 rounded flex items-center gap-2 hover:bg-slate-50 shadow-sm font-bold transition-all"
                    >
                        <FileSpreadsheet size={20} /> Exportar Excel
                    </button>
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 shadow font-bold transition-all"
                    >
                        <Plus size={20} /> Nuevo Plan Maestro
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nombre</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Máquina</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Frecuencia</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actividades / Repuestos</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {plans.length === 0 ? (
                            <tr><td colSpan="5" className="text-center py-6 text-gray-500">No hay planes registrados</td></tr>
                        ) : (
                            plans.map((plan) => (
                                <tr key={plan.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-slate-900">{plan.name}</div>
                                        <div className="text-xs text-slate-500">{plan.description}</div>
                                    </td>
                                    <td className="px-6 py-4">{plan.Machine?.name || 'N/A'}</td>
                                    <td className="px-6 py-4">Cada {plan.frequency_days} días</td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm">{(plan.tasks || []).length} Tareas</div>
                                        <div className="text-sm text-amber-600">{(plan.spares || []).length} Repuestos asig.</div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => handleGenerateExecution(plan.id)} className="text-emerald-600 hover:text-emerald-900 mr-4" title="Lanzar Orden Preventiva" >
                                            <Play size={18} />
                                        </button>
                                        <button onClick={() => handleOpenModal(plan)} className="text-blue-600 hover:text-blue-900 mr-4">
                                            <Edit size={18} />
                                        </button>
                                        <button onClick={() => handleDelete(plan.id)} className="text-red-600 hover:text-red-900">
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal de Creación/Edición */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4 border-b pb-2">
                            {isEditing ? 'Editar Plan Preventivo' : 'Nuevo Plan Preventivo'}
                        </h2>
                        
                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium mb-1">Nombre del Plan</label>
                                    <input
                                        required
                                        className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
                                        value={formData.name}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                        placeholder="Ej. Mantenimiento Preventivo Semestral SML 1"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium mb-1">Descripción / Objetivos</label>
                                    <textarea
                                        className="w-full border p-2 rounded"
                                        rows="2"
                                        value={formData.description}
                                        onChange={e => setFormData({...formData, description: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Máquina Base</label>
                                    <select
                                        required
                                        className="w-full border p-2 rounded"
                                        value={formData.machine_id}
                                        onChange={e => setFormData({...formData, machine_id: e.target.value})}
                                    >
                                        <option value="">Seleccione Equipo...</option>
                                        {machines.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Frecuencia (Días)</label>
                                    <input
                                        type="number"
                                        required min="1"
                                        className="w-full border p-2 rounded"
                                        value={formData.frequency_days}
                                        onChange={e => setFormData({...formData, frequency_days: e.target.value})}
                                    />
                                </div>
                            </div>

                            <hr />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* TAREAS */}
                                <div>
                                    <h3 className="font-bold mb-2 flex items-center gap-2"><Settings size={16}/> Tareas / Actividades</h3>
                                    <div className="flex gap-2 mb-3">
                                        <select 
                                            className="w-24 border p-2 rounded text-sm font-bold bg-slate-50"
                                            value={newTaskCode}
                                            onChange={e => setNewTaskCode(e.target.value)}
                                        >
                                            {ACTIVITY_CODES.map(c => (
                                                <option key={c.code} value={c.code}>{c.code}</option>
                                            ))}
                                        </select>
                                        <input 
                                            className="flex-1 border p-2 rounded text-sm" 
                                            placeholder="Describa la tarea a realizar"
                                            value={newTask}
                                            onChange={e => setNewTask(e.target.value)}
                                        />
                                        <button type="button" onClick={addTask} className="bg-slate-800 text-white px-3 py-1 rounded text-sm">Añadir</button>
                                    </div>
                                    <ul className="space-y-2">
                                        {(formData.tasks || []).map(t => {
                                            const codeConfig = ACTIVITY_CODES.find(c => c.code === (t.task_code || 'MEC')) || ACTIVITY_CODES[0];
                                            return (
                                              <li key={t.id} className="bg-white border shadow-sm p-3 rounded flex justify-between items-start gap-3 text-sm">
                                                  <div className="flex gap-3 items-start flex-1">
                                                      <span className={`px-2 py-0.5 rounded text-xs font-bold border ${codeConfig.color} mt-0.5 whitespace-nowrap`}>
                                                          {t.task_code || 'MEC'}
                                                      </span>
                                                      <span className="text-slate-800 font-medium leading-tight">{t.task_description}</span>
                                                  </div>
                                                  <button type="button" onClick={() => removeTask(t.id)} className="text-red-500 hover:text-red-700 bg-red-50 p-1 rounded">X</button>
                                              </li>
                                            );
                                        })}
                                        {(!formData.tasks || formData.tasks.length === 0) && <p className="text-xs text-gray-500 italic">No hay tareas definidas</p>}
                                    </ul>
                                </div>

                                {/* REPUESTOS */}
                                <div>
                                    <h3 className="font-bold mb-2 flex items-center gap-2 text-amber-600"><Package size={16}/> Repuestos Sugeridos</h3>
                                    <div className="flex gap-2 mb-3">
                                        <select 
                                            className="flex-1 border p-2 rounded text-sm"
                                            value={newSpareId}
                                            onChange={e => setNewSpareId(e.target.value)}
                                        >
                                            <option value="">Buscar repuesto...</option>
                                            {inventory.map(i => (
                                                <option key={i.id} value={i.id}>{i.code} - {i.name} (Stock: {i.stock})</option>
                                            ))}
                                        </select>
                                        <input 
                                            type="number" className="w-16 border p-2 rounded text-sm" min="1"
                                            value={newSpareQty}
                                            onChange={e => setNewSpareQty(e.target.value)}
                                        />
                                        <button type="button" onClick={addSpare} className="bg-amber-600 text-white px-3 py-1 rounded text-sm">Añadir</button>
                                    </div>
                                    <ul className="space-y-2">
                                        {(formData.spares || []).map(s => (
                                            <li key={s.id} className="bg-amber-50 border border-amber-200 p-2 rounded flex justify-between items-center text-sm">
                                                <span>CANT: {s.expected_quantity} - {s.name || inventory.find(i=>i.id===s.inventory_id)?.name}</span>
                                                <button type="button" onClick={() => removeSpare(s.id)} className="text-red-500 hover:text-red-700">X</button>
                                            </li>
                                        ))}
                                        {(!formData.spares || formData.spares.length === 0) && <p className="text-xs text-gray-500 italic">No hay repuestos obligatorios</p>}
                                    </ul>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6 border-t pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded hover:bg-gray-50">Cancelar</button>
                                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Guardar Plan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PreventivePlans;
