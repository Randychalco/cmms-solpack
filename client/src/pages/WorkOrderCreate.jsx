import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SignaturePad from '../components/SignaturePad';

const failureCauses = {
    "FUGA EN SELLO MECÁNICO": ["DESGASTE DEL SELLO", "OPERACIONAL"],
    "SOBRECALENTAMIENTO": ["SOBRECARGA", "OPERATIVA", "VENTILACIÓN DEFICIENTE"],
    "VIBRACIÓN EXCESIVA": ["DESBALANCEO", "RODAMIENTOS DAÑADOS", "OPERATIVA"],
    "DISPARO DE DISYUNTOR": ["CORTOCIRCUITO", "SOBRECORRIENTE", "OPERATIVA"],
    "NO ARRANCA": ["FALTA SEÑAL", "FALLA EN CONTACTOR", "COMPONENTES ELECTRICOS", "OPERATIVA"],
    "BAJA PRESIÓN": ["FUGAS", "BOMBA DEFECTUOSA", "OPERATIVA"],
    "FUGA DE ACEITE": ["SELLOS DAÑADOS", "OPERATIVA"],
    "CAÍDA DE PRESIÓN": ["FUGAS", "VÁLVULAS SUCIAS", "OPERACIONAL"],
    "ARRANQUE FALLIDO": ["FILTRO OBSTRUIDO", "MOTOR DAÑADO", "OPERATIVA"],
    "DESALINEACIÓN": ["POLEAS SUELTAS", "DESGASTE", "OPERATIVA"],
    "TEMPERATURA INESTABLE": ["SENSOR", "TERMOSTATO DEFECTUOSO", "OPERATIVA"],
    "BAJA REFRIGERACION": ["OBTRUCCION DE CONDENSADOR", "FALLA DEL VENTILADOR", "FUGA DE REFRIGERANTE", "OPERATIVA"],
    "BAJO RENDIMIENTO": ["DESGASTE DE PIEZAS", "OPERATIVA"],
    "LECTURAS ERRÓNEAS": ["SUCIEDAD", "CALIBRACIÓN DEFICIENTE", "OPERATIVA"],
    "FALLAS INTERMITENTES": ["SOBRETENSIÓN", "CONEXIÓN FLOJA", "OPERATIVA"],
    "FALTA DE LUBRICANTE": ["NO SE APLICÓ MANTENIMIENTO PREVENTIVO", "OPERATIVA"],
    "ROTURA": ["FATIGA", "CORROSIÓN", "OPERATIVA"],
    "RUIDOS METÁLICOS": ["ENGRANAJES DESGASTADOS", "OPERATIVA"],
    "NO GIRA ADECUADAMENTE": ["DESGASTADAS DE PIEZA", "FAJA SUELTA", "OPERATIVA"],
    "ACUMULACIÓN DE POLVO": ["LIMPIEZA DEFICIENTE", "OPERATIVA"],
    "SATURACION DE FILTRO": ["EXCESO DE SUCIEDAD", "TIEMPO DE TRABAJO", "OPERATIVA"],
    "PRUEBAS DE ARRANQUE": ["PRUEBAS DE ARRANQUE"],
    "PROYECTO": ["PROYECTO"],
    "IVS": ["IVS"],
    "MANTENIMIENTO PREVENTIVO": ["MANTENIMIENTO PREVENTIVO"],
    "LUBRICACION": ["LUBRICACION"],
    "TAREA": ["TAREA"]
};

const WorkOrderCreate = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Hierarchy data
    const [plants, setPlants] = useState([]);
    const [areas, setAreas] = useState([]);
    const [machines, setMachines] = useState([]);
    const [subMachines, setSubMachines] = useState([]);
    // List of technicians fetched from DB
    const [technicians, setTechnicians] = useState([]);

    const [formData, setFormData] = useState({
        plant_id: '',
        area_id: '',
        machine_id: '',
        sub_machine_id: '',
        equipment_condition: '',
        order_class: 'CORRECTIVO_PROGRAMADO',
        failure_description: '',
        failure_cause: '',
        action_taken: '',
        planning_group: '',
        technician_id: '',
        start_date: '',
        start_time: '',
        end_date: '',
        end_time: '',
        materials_used: '',
        observations: '',
        priority: 'MEDIA',
        status: 'ABIERTA',
        technician_signature: '',
        operator_signature: '',
        leader_technician_name: '',
        supervisor_name: '',
        criticality: 'MEDIO'
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Material Requests State
    const [pendingRequests, setPendingRequests] = useState([]);
    const [selectedRequestIds, setSelectedRequestIds] = useState([]);

    // Direct spare parts / materials used
    const [spareItems, setSpareItems] = useState([]);
    const [newSpare, setNewSpare] = useState({ description: '', quantity: '', unit: 'UN' });

    // We will call fetch data in useEffects *below* the function declarations

    const fetchPlants = async () => {
        try {
            const { data } = await api.get('/master/plants');
            setPlants(data);
        } catch (error) {
            console.error('Error fetching plants:', error);
        }
    };



    const fetchPendingRequests = async () => {
        try {
            const { data } = await api.get('/material-requests?status=En Proceso');
            setPendingRequests(data);
        } catch (error) {
            console.error('Error fetching material requests:', error);
        }
    };

    const fetchTechnicians = async () => {
        try {
            const { data } = await api.get('/users');
            // Filter technicians or admins
            const techs = data
                .filter(u => u.role === 'technician' || u.role === 'admin' || u.role === 'supervisor')
                .map(u => u.name.toUpperCase());
            setTechnicians(techs);
        } catch (error) {
            console.error('Error fetching technicians:', error);
        }
    };

    // Fetch initial data
    useEffect(() => {
        fetchPlants();
        fetchPendingRequests();
        fetchTechnicians();
    }, []);

    const fetchAreas = async (plantId) => {
        try {
            const { data } = await api.get(`/master/areas/${plantId}`);
            setAreas(data);
        } catch (error) {
            console.error('Error fetching areas:', error);
        }
    };

    const fetchMachines = async (areaId) => {
        try {
            const { data } = await api.get(`/master/machines/${areaId}`);
            setMachines(data);
        } catch (error) {
            console.error('Error fetching machines:', error);
        }
    };

    const fetchSubMachines = async (machineId) => {
        try {
            const { data } = await api.get(`/master/sub-machines/${machineId}`);
            setSubMachines(data);
        } catch (error) {
            console.error('Error fetching sub-machines:', error);
        }
    };

    // Fetch areas when plant changes
    useEffect(() => {
        if (formData.plant_id) {
            fetchAreas(formData.plant_id);
            setFormData(prev => ({ ...prev, area_id: '', machine_id: '', sub_machine_id: '' }));
            setMachines([]);
            setSubMachines([]);
        } else {
            setAreas([]);
            setMachines([]);
            setSubMachines([]);
        }
    }, [formData.plant_id]);

    // Fetch machines when area changes
    useEffect(() => {
        if (formData.area_id) {
            fetchMachines(formData.area_id);
            setFormData(prev => ({ ...prev, machine_id: '', sub_machine_id: '' }));
            setSubMachines([]);
        } else {
            setMachines([]);
            setSubMachines([]);
        }
    }, [formData.area_id]);

    // Fetch sub-machines when machine changes
    useEffect(() => {
        if (formData.machine_id) {
            fetchSubMachines(formData.machine_id);
            setFormData(prev => ({ ...prev, sub_machine_id: '' }));
        } else {
            setSubMachines([]);
        }
    }, [formData.machine_id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: typeof value === 'string' ? value.toUpperCase() : value
        });
    };



    const handleSubmit = async (e, targetStatus) => {
        if (e) e.preventDefault();
        const finalStatus = targetStatus || 'ABIERTA';

        // Validate required fields for closing
        if (finalStatus === 'CERRADA') {
            if (!formData.action_taken || !formData.end_date || !formData.end_time ||
                !formData.technician_signature || !formData.operator_signature) {
                setError('Para CERRAR la OT debes completar: Acción Realizada, Fecha y Hora de Término, y ambas Firmas.');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
        }

        setLoading(true);
        setError('');

        try {
            const cleanedData = Object.fromEntries(
                Object.entries(formData).map(([key, value]) => [key, value === '' ? null : value])
            );

            // Map criticality back to priority
            if (cleanedData.criticality) cleanedData.priority = cleanedData.criticality;

            // Attach status
            cleanedData.status = finalStatus;

            // Attach direct spare parts used
            cleanedData.materials_used = spareItems.length > 0 ? JSON.stringify(spareItems) : null;

            // Attach selected material requests
            if (selectedRequestIds.length > 0) {
                cleanedData.material_request_ids = selectedRequestIds;
            }

            await api.post('/work-orders', cleanedData);
            navigate('/work-orders');
        } catch (error) {
            setError(error.response?.data?.message || 'Error creating Work Order');
            setLoading(false);
        }
    };

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <button onClick={() => navigate('/work-orders')} className="flex items-center text-gray-600 mb-4 hover:text-gray-900">
                <ArrowLeft size={20} className="mr-2" /> Volver
            </button>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold mb-6 text-slate-800">NUEVA ORDEN DE TRABAJO</h1>

                {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

                <form onSubmit={handleSubmit}>
                    {/* Jerarquía de Equipos */}
                    <div className="mb-6">
                        <h2 className="text-lg font-bold mb-3 text-slate-700">UBICACIÓN DEL EQUIPO</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-700 font-bold mb-2">PLANTA *</label>
                                <select
                                    name="plant_id"
                                    className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.plant_id}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Seleccionar Planta</option>
                                    {plants.map(plant => (
                                        <option key={plant.id} value={plant.id}>{plant.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-gray-700 font-bold mb-2">ÁREA *</label>
                                <select
                                    name="area_id"
                                    className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.area_id}
                                    onChange={handleChange}
                                    required
                                    disabled={!formData.plant_id}
                                >
                                    <option value="">Seleccionar Area</option>
                                    {areas.map(area => (
                                        <option key={area.id} value={area.id}>{area.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-gray-700 font-bold mb-2">EQUIPO *</label>
                                <select
                                    name="machine_id"
                                    className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.machine_id}
                                    onChange={handleChange}
                                    required
                                    disabled={!formData.area_id}
                                >
                                    <option value="">Seleccionar Equipo</option>
                                    {machines.map(machine => (
                                        <option key={machine.id} value={machine.id}>{machine.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-gray-700 font-bold mb-2">SUB-EQUIPO *</label>
                                <select
                                    name="sub_machine_id"
                                    className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.sub_machine_id}
                                    onChange={handleChange}
                                    disabled={!formData.machine_id}
                                >
                                    <option value="">Seleccionar Sub Equipo</option>
                                    {subMachines.map(subMachine => (
                                        <option key={subMachine.id} value={subMachine.id}>{subMachine.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Información Detallada de la Orden */}
                    <div className="mb-6">
                        <h2 className="text-lg font-bold mb-3 text-slate-700">DETALLE DE LA ORDEN</h2>

                        {/* 1. Condición y 2. Clase */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-gray-700 font-bold mb-2">CONDICIÓN DE EQUIPO *</label>
                                <select
                                    name="equipment_condition"
                                    className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.equipment_condition}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Seleccionar</option>
                                    <option value="PARADO">PARADO</option>
                                    <option value="FUNCIONAMIENTO">FUNCIONAMIENTO</option>
                                    <option value="PROGRAMADO">PROGRAMADO</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-gray-700 font-bold mb-2">CLASE DE ORDEN *</label>
                                <select
                                    name="order_class"
                                    className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.order_class}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Seleccionar</option>
                                    <option value="EMERGENCIA">EMERGENCIA</option>
                                    <option value="CORRECTIVO_PROGRAMADO">CORRECTIVO PROGRAMADO</option>
                                    <option value="TAREA">TAREA</option>
                                    <option value="PROYECTO">PROYECTO</option>
                                    <option value="OPERACION">OPERACIÓN</option>
                                    <option value="MANTENIMIENTO_PREVENTIVO">MANTENIMIENTO PREVENTIVO</option>
                                    <option value="IVS">IVS</option>
                                    <option value="LUBRICACION">LUBRICACIÓN</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-gray-700 font-bold mb-2">CRITICIDAD *</label>
                                <select
                                    name="criticality"
                                    className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.criticality}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Seleccionar</option>
                                    <option value="BAJO">BAJO</option>
                                    <option value="MEDIO">MEDIO</option>
                                    <option value="ALTO">ALTO</option>
                                    <option value="CRITICO">CRÍTICO</option>
                                </select>
                            </div>
                        </div>

                        {/* 3. Falla y 4. Causa (Cascada) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-gray-700 font-bold mb-2">FALLA *</label>
                                <select
                                    name="failure_description"
                                    className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.failure_description}
                                    onChange={(e) => {
                                        setFormData({
                                            ...formData,
                                            failure_description: e.target.value,
                                            failure_cause: '' // Reset cause when failure changes
                                        });
                                    }}
                                    required
                                >
                                    <option value="">Seleccionar Falla</option>
                                    {Object.keys(failureCauses).map(failure => (
                                        <option key={failure} value={failure}>{failure}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-gray-700 font-bold mb-2">CAUSA</label>
                                <select
                                    name="failure_cause"
                                    className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.failure_cause}
                                    onChange={handleChange}
                                    disabled={!formData.failure_description}
                                >
                                    <option value="">Seleccionar Causa</option>
                                    {formData.failure_description && failureCauses[formData.failure_description]?.map(cause => (
                                        <option key={cause} value={cause}>{cause}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* 5. Acción Realizada */}
                        <div className="mb-4">
                            <label className="block text-gray-700 font-bold mb-2">ACCIÓN REALIZADA</label>
                            <textarea
                                name="action_taken"
                                rows="2"
                                className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.action_taken}
                                onChange={handleChange}
                                placeholder="Acciones tomadas"
                            ></textarea>
                        </div>

                        {/* 6. Grupo Planificación */}
                        <div className="mb-4">
                            <label className="block text-gray-700 font-bold mb-2">GRUPO PLANIFICACIÓN</label>
                            <select
                                name="planning_group"
                                className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.planning_group}
                                onChange={handleChange}
                            >
                                <option value="">Seleccionar Grupo</option>
                                <option value="MECANICO">MECÁNICO</option>
                                <option value="ELECTRICO">ELÉCTRICO</option>
                                <option value="ELECTRONICO">ELECTRÓNICO</option>
                                <option value="NEUMATICO">NEUMÁTICO</option>
                                <option value="HIDRAULICO">HIDRÁULICO</option>
                                <option value="OPERACIONAL">OPERACIONAL</option>
                                <option value="MANTENIMIENTO_PREVENTIVO">MANTENIMIENTO PREVENTIVO</option>
                                <option value="IVS">IVS</option>
                                <option value="LUBRICACION">LUBRICACIÓN</option>
                                <option value="PRUEBAS_DE_FUNCIONAMIENTO">PRUEBAS DE FUNCIONAMIENTO</option>
                            </select>
                        </div>

                        {/* 7-10. Fechas y Horas */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-gray-700 font-bold mb-2">HORA INICIO</label>
                                <input
                                    type="time"
                                    name="start_time"
                                    className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.start_time}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-bold mb-2">HORA TÉRMINO</label>
                                <input
                                    type="time"
                                    name="end_time"
                                    className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.end_time}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-bold mb-2">FECHA INICIO</label>
                                <input
                                    type="date"
                                    name="start_date"
                                    className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.start_date}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-bold mb-2">FECHA TÉRMINO</label>
                                <input
                                    type="date"
                                    name="end_date"
                                    className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.end_date}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* 11. Técnico Responsable - Multi-Select */}
                        <div className="mb-4">
                            <label className="block text-gray-700 font-bold mb-2">TÉCNICO(S) RESPONSABLE(S)</label>

                            {/* Selected Technicians Chips */}
                            <div className="flex flex-wrap gap-2 mb-2">
                                {formData.technician_id.split(',').filter(t => t).map(tech => (
                                    <div key={tech} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center">
                                        <span className="mr-2">{tech}</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const currentTechs = formData.technician_id.split(',').filter(t => t);
                                                const newTechs = currentTechs.filter(t => t !== tech).join(',');
                                                setFormData({ ...formData, technician_id: newTechs });
                                            }}
                                            className="text-blue-600 hover:text-blue-900 font-bold"
                                        >
                                            &times;
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <select
                                className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value=""
                                onChange={(e) => {
                                    if (e.target.value) {
                                        const currentTechs = formData.technician_id ? formData.technician_id.split(',') : [];
                                        if (!currentTechs.includes(e.target.value)) {
                                            const newTechs = [...currentTechs, e.target.value].join(',');
                                            setFormData({ ...formData, technician_id: newTechs });
                                        }
                                    }
                                }}
                            >
                                <option value="">Agregar Técnico...</option>
                                {technicians.map(tech => (
                                    <option key={tech} value={tech}>{tech}</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Seleccione un técnico para agregarlo a la lista.</p>
                        </div>



                        {/* Materiales / Repuestos Utilizados */}
                        <div className="mb-6 p-4 border border-amber-200 bg-amber-50 rounded-lg">
                            <label className="block text-amber-900 font-bold mb-1">MATERIALES / REPUESTOS UTILIZADOS</label>
                            <p className="text-xs text-amber-700 mb-3">Registra aquí los repuestos consumidos durante la intervención. El stock se descontará automáticamente al cerrar la OT.</p>

                            {/* Item list */}
                            {spareItems.length > 0 && (
                                <div className="mb-3 space-y-2">
                                    {spareItems.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-2 bg-white border border-amber-200 rounded-lg p-2">
                                            <span className="text-sm font-bold text-amber-800 w-12 text-center shrink-0">{item.quantity} {item.unit}</span>
                                            <span className="text-sm text-slate-700 flex-1">{item.description}</span>
                                            <button
                                                type="button"
                                                onClick={() => setSpareItems(prev => prev.filter((_, i) => i !== idx))}
                                                className="text-red-400 hover:text-red-600 transition"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add new item row */}
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                    type="text"
                                    placeholder="Descripción del material..."
                                    className="flex-1 border border-amber-300 p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                                    value={newSpare.description}
                                    onChange={(e) => setNewSpare(prev => ({ ...prev, description: e.target.value.toUpperCase() }))}
                                />
                                <input
                                    type="number"
                                    placeholder="Cant."
                                    className="w-20 border border-amber-300 p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                                    value={newSpare.quantity}
                                    onChange={(e) => setNewSpare(prev => ({ ...prev, quantity: e.target.value }))}
                                    min="0"
                                />
                                <select
                                    className="w-24 border border-amber-300 p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                                    value={newSpare.unit}
                                    onChange={(e) => setNewSpare(prev => ({ ...prev, unit: e.target.value }))}
                                >
                                    {['UN', 'KG', 'LT', 'MT', 'GL', 'PZA', 'RLL', 'CJA'].map(u => (
                                        <option key={u} value={u}>{u}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!newSpare.description.trim() || !newSpare.quantity) return;
                                        setSpareItems(prev => [...prev, { ...newSpare, quantity: parseFloat(newSpare.quantity) }]);
                                        setNewSpare({ description: '', quantity: '', unit: 'UN' });
                                    }}
                                    className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-600 transition shrink-0"
                                >
                                    + Agregar
                                </button>
                            </div>
                        </div>

                        {/* 13. Observación */}
                        <div className="mb-4">
                            <label className="block text-gray-700 font-bold mb-2">OBSERVACIÓN</label>
                            <textarea
                                name="observations"
                                rows="2"
                                className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.observations}
                                onChange={handleChange}
                                placeholder="Observaciones"
                            ></textarea>
                        </div>

                        {/* 14-15. Firmas */}
                        {/* 14-15. Firmas (Nombres) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-3">
                                <SignaturePad
                                    label="FIRMA TÉCNICO LÍDER"
                                    value={formData.technician_signature}
                                    onChange={(val) => setFormData({ ...formData, technician_signature: val })}
                                />
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Nombre del Técnico Líder</label>
                                    <input
                                        type="text"
                                        placeholder="Nombre libre (puede ser externo)..."
                                        className="w-full border p-2 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-blue-400 outline-none font-bold"
                                        value={formData.leader_technician_name || ''}
                                        onChange={(e) => setFormData({ ...formData, leader_technician_name: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-3">
                                <SignaturePad
                                    label="FIRMA SUPERVISOR PRODUCCIÓN"
                                    value={formData.operator_signature}
                                    onChange={(val) => setFormData({ ...formData, operator_signature: val })}
                                />
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Nombre del Supervisor</label>
                                    <input
                                        type="text"
                                        placeholder="Nombre libre (puede ser externo)..."
                                        className="w-full border p-2 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-blue-400 outline-none font-bold"
                                        value={formData.supervisor_name || ''}
                                        onChange={(e) => setFormData({ ...formData, supervisor_name: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8 pt-6 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={() => navigate('/work-orders')}
                            className="bg-slate-200 text-slate-700 px-6 py-3 rounded-lg hover:bg-slate-300 font-bold transition-colors"
                        >
                            Cancelar
                        </button>

                        {/* Crear OT abierta (comportamiento original) */}
                        <button
                            type="button"
                            onClick={(e) => handleSubmit(e, 'ABIERTA')}
                            disabled={loading}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-bold shadow-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                        >
                            <Save size={18} />
                            {loading ? 'Guardando...' : 'Crear OT'}
                        </button>

                        {/* Crear con falta de material */}
                        <button
                            type="button"
                            onClick={(e) => handleSubmit(e, 'PENDIENTE_MATERIALES')}
                            disabled={loading}
                            className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 font-bold shadow-sm disabled:opacity-50 transition-colors"
                        >
                            ⚠️ Crear y Falta Material
                        </button>

                        {/* Crear y cerrar en un solo paso */}
                        <button
                            type="button"
                            onClick={(e) => handleSubmit(e, 'CERRADA')}
                            disabled={loading}
                            className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 font-bold shadow-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                        >
                            ✅ {loading ? 'Guardando...' : 'Crear y Cerrar OT'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default WorkOrderCreate;
