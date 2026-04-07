import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useNavigate, useParams } from 'react-router-dom';
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

const WorkOrderEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    // Material Requests State
    const [pendingRequests, setPendingRequests] = useState([]);
    const [selectedRequestIds, setSelectedRequestIds] = useState([]);

    // Hierarchy data
    const [plants, setPlants] = useState([]);
    const [areas, setAreas] = useState([]);
    const [machines, setMachines] = useState([]);
    const [subMachines, setSubMachines] = useState([]);

    // List of technicians
    const technicians = [
        'LBERROSPI', 'MJUAREZ', 'RCABEZAS', 'VCOÑES', 'BSAPAICO',
        'HVENTURA', 'EALEGRE', 'JRAMOS', 'RCHALCO', 'ILOBATON', 'LCENTENO'
    ];

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
        criticality: 'MEDIO'
    });

    // loadData is called in useEffect Below

    const loadData = async () => {
        try {
            setLoading(true);
            // 1. Fetch Plants (always needed)
            const plantsRes = await api.get('/master/plants');
            setPlants(plantsRes.data);

            // Fetch Inventory (still needed if used elsewhere? Actually no, we don't need inventory here anymore. Can just remove)
            const woRes = await api.get(`/work-orders/${id}`);
            const wo = woRes.data;

            // Fetch requests already linked to THIS WO specifically (Asignado or Completado)
            const linkedReqRes = await api.get(`/material-requests?wo_id=${id}`);
            // Fetch requests with no WO assigned yet (only En Proceso = available)
            const pendingReqRes = await api.get('/material-requests?status=En Proceso');

            // Combine: linked requests (already assigned/completed) + free unassigned ones
            const allRelevantRequests = [...linkedReqRes.data, ...pendingReqRes.data];
            // Remove duplicates by ID (a linked 'En Proceso' might appear in both)
            const uniqueRequests = Array.from(new Map(allRelevantRequests.map(item => [item.id, item])).values());
            setPendingRequests(uniqueRequests);

            // Pre-select ONLY those linked to this specific WO
            setSelectedRequestIds(linkedReqRes.data.map(req => req.id));

            // 3. Fetch Cascading Options based on WO data
            if (wo.plant_id) {
                const areasRes = await api.get(`/master/areas/${wo.plant_id}`);
                setAreas(areasRes.data);
            }
            if (wo.area_id) {
                const machinesRes = await api.get(`/master/machines/${wo.area_id}`);
                setMachines(machinesRes.data);
            }
            if (wo.machine_id) {
                const subMachinesRes = await api.get(`/master/sub-machines/${wo.machine_id}`);
                setSubMachines(subMachinesRes.data);
            }

            // We no longer manage parsedMaterials in state
            // Let's just keep the legacy data in the DB but not load it to the form
            // setMaterials(parsedMaterials);

            // 4. Set Form Data
            setFormData({
                plant_id: wo.plant_id || '',
                area_id: wo.area_id || '',
                machine_id: wo.machine_id || '',
                sub_machine_id: wo.sub_machine_id || '',
                equipment_condition: wo.equipment_condition || '',
                order_class: wo.order_class || 'CORRECTIVO_PROGRAMADO',
                failure_description: wo.failure_description || '',
                failure_cause: wo.failure_cause || '',
                action_taken: wo.action_taken || '',
                planning_group: wo.planning_group || '',
                technician_id: wo.technician_id ? String(wo.technician_id) : '',
                start_date: wo.start_date ? wo.start_date.split('T')[0] : '',
                start_time: wo.start_time || '',
                end_date: wo.end_date ? wo.end_date.split('T')[0] : '',
                end_time: wo.end_time || '',
                materials_used: wo.materials_used || '',
                observations: wo.observations || '',
                priority: wo.priority || 'MEDIA',
                status: wo.status || 'ABIERTA',
                technician_signature: wo.technician_signature || '',
                operator_signature: wo.operator_signature || '',
                criticality: wo.priority || 'MEDIO'
            });

            setLoading(false);
        } catch (err) {
            console.error(err);
            setError('Error cargando la orden de trabajo.');
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [id]);

    const fetchAreas = async (plantId) => {
        try {
            const { data } = await api.get(`/master/areas/${plantId}`);
            setAreas(data);
        } catch (error) { console.error(error); }
    };

    const fetchMachines = async (areaId) => {
        try {
            const { data } = await api.get(`/master/machines/${areaId}`);
            setMachines(data);
        } catch (error) { console.error(error); }
    };

    const fetchSubMachines = async (machineId) => {
        try {
            const { data } = await api.get(`/master/sub-machines/${machineId}`);
            setSubMachines(data);
        } catch (error) { console.error(error); }
    };



    const handleChange = (e) => {
        const { name, value } = e.target;
        const upperValue = typeof value === 'string' ? value.toUpperCase() : value;

        // Handle cascading clears manually here instead of useEffect
        if (name === 'plant_id') {
            setFormData({ ...formData, plant_id: upperValue, area_id: '', machine_id: '', sub_machine_id: '' });
            setAreas([]); setMachines([]); setSubMachines([]);
            if (upperValue) fetchAreas(upperValue);
        } else if (name === 'area_id') {
            setFormData({ ...formData, area_id: upperValue, machine_id: '', sub_machine_id: '' });
            setMachines([]); setSubMachines([]);
            if (upperValue) fetchMachines(upperValue);
        } else if (name === 'machine_id') {
            setFormData({ ...formData, machine_id: upperValue, sub_machine_id: '' });
            setSubMachines([]);
            if (upperValue) fetchSubMachines(upperValue);
        } else {
            setFormData({ ...formData, [name]: upperValue });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            // Validation of materials removed

            const cleanedData = Object.fromEntries(
                Object.entries(formData).map(([key, value]) => [key, value === '' ? null : value])
            );
            // Map criticality back to priority for backend
            if (cleanedData.criticality) cleanedData.priority = cleanedData.criticality;

            // Materials won't be modified from frontend on Edit directly.
            // If we want to clear them, we pass null, but usually we just don't send the field 
            // to keep what's in DB or we handle requests elsewhere.
            // But since we want to remove the view, let's leave existing materials untouched by Edit.

            // Also attach selected material requests
            cleanedData.material_request_ids = selectedRequestIds;

            await api.put(`/work-orders/${id}`, cleanedData);
            navigate(`/work-orders/${id}`);
        } catch (error) {
            setError(error.response?.data?.message || 'Error actualizando Work Order');
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Cargando...</div>;

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <button onClick={() => navigate(`/work-orders/${id}`)} className="flex items-center text-gray-600 mb-4 hover:text-gray-900">
                <ArrowLeft size={20} className="mr-2" /> Cancelar y Volver
            </button>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold mb-6 text-slate-800">EDITAR ORDEN DE TRABAJO</h1>

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
                                    required
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
                        </div>

                        {/* 11.5 Material Requests pending attach */}
                        <div className="mb-6 p-4 border border-indigo-200 bg-indigo-50 rounded-lg">
                            <label className="block text-indigo-900 font-bold mb-2">SOLICITUDES DE MATERIALES ASIGNADAS Y EN PROCESO</label>
                            <p className="text-sm text-indigo-700 mb-3">Vincula solicitudes creadas previas a esta Orden de Trabajo, o revisa las ya vinculadas.</p>

                            {/* Selectable Requests List */}
                            {pendingRequests.filter(req => req.status !== 'Completado').length === 0 ? (
                                <p className="text-sm text-indigo-400 italic mb-4">No hay solicitudes pendientes o por asignar.</p>
                            ) : (
                                <details className="group bg-white border border-indigo-200 rounded-lg shadow-sm mb-4">
                                    <summary className="p-3 cursor-pointer select-none list-none flex justify-between items-center bg-indigo-50 rounded-lg group-open:rounded-b-none group-open:border-b border-indigo-200 hover:bg-indigo-100 transition-colors">
                                        <span className="font-bold text-indigo-900">
                                            {selectedRequestIds.filter(id => {
                                                const req = pendingRequests.find(r => r.id === id);
                                                return req && req.status !== 'Completado';
                                            }).length === 0
                                                ? 'Seleccionar solicitudes...'
                                                : `${selectedRequestIds.filter(id => {
                                                    const req = pendingRequests.find(r => r.id === id);
                                                    return req && req.status !== 'Completado';
                                                }).length} solicitud(es) seleccionada(s)`}
                                        </span>
                                        <span className="transition duration-300 group-open:rotate-180">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600">
                                                <polyline points="6 9 12 15 18 9"></polyline>
                                            </svg>
                                        </span>
                                    </summary>
                                    <div className="p-3 space-y-2 max-h-60 overflow-y-auto bg-slate-50/50">
                                        {pendingRequests.filter(req => req.status !== 'Completado').map(req => {
                                            const isSelected = selectedRequestIds.includes(req.id);

                                            return (
                                                <div
                                                    key={req.id}
                                                    className={`p-3 rounded-lg border transition cursor-pointer ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-indigo-200 hover:border-indigo-400'}`}
                                                    onClick={() => {
                                                        if (isSelected) {
                                                            setSelectedRequestIds(prev => prev.filter(id => id !== req.id));
                                                        } else {
                                                            setSelectedRequestIds(prev => [...prev, req.id]);
                                                        }
                                                    }}
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <div className={`text-xs font-mono mb-1 flex items-center gap-2 ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                                                                <span>ID: {req.id.substring(0, 8).toUpperCase()}</span>
                                                                <span>•</span>
                                                                <span>Por: {req.user_name || req.user_id}</span>
                                                                {req.status === 'Asignado' && isSelected && (
                                                                     <span className="ml-2 bg-indigo-500 text-xs px-2 rounded-full border border-indigo-400 text-white">Pre-asignada</span>
                                                                )}
                                                            </div>
                                                            <div className="text-sm space-y-1">
                                                                {req.items?.map((item, idx) => (
                                                                    <div key={idx} className="flex gap-2">
                                                                        <span className="font-bold">{item.quantity_requested} {item.unit_measure || 'un.'}</span>
                                                                        <span className={isSelected ? 'text-indigo-100' : 'text-slate-600'}>{item.description}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-white bg-indigo-500' : 'border-indigo-300'}`}>
                                                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white"></div>}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </details>
                            )}

                            {/* Read-Only Completed Requests List */}
                            {pendingRequests.filter(req => req.status === 'Completado' && selectedRequestIds.includes(req.id)).length > 0 && (
                                <div className="mt-4 pt-4 border-t border-indigo-200">
                                    <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                        Materiales Ya Entregados / Completados
                                    </h4>
                                    <div className="space-y-2">
                                        {pendingRequests.filter(req => req.status === 'Completado' && selectedRequestIds.includes(req.id)).map(req => (
                                            <div key={req.id} className="p-3 rounded-lg border border-green-200 bg-green-50 opacity-90 cursor-default">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <div className="text-xs font-mono mb-1 flex items-center gap-2 text-green-700">
                                                            <span>ID: {req.id.substring(0, 8).toUpperCase()}</span>
                                                            <span>•</span>
                                                            <span>Por: {req.user_name || req.user_id}</span>
                                                            <span className="ml-2 bg-green-200 text-green-800 text-xs px-2 rounded-full border border-green-300">Inventario Descontado</span>
                                                        </div>
                                                        <div className="text-sm space-y-1 text-slate-700">
                                                            {req.items?.map((item, idx) => (
                                                                <div key={idx} className="flex gap-2">
                                                                    <span className="font-bold text-green-800">{item.quantity_requested} {item.unit_measure || 'un.'}</span>
                                                                    <span>{item.description}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    {/* Botón sutil por si el usuario DE VERDAD necesita desvincularla por error, devolviendo inventario! */}
                                                    <button 
                                                        type="button"
                                                        onClick={() => {
                                                            if (window.confirm('¿Desvincular esta solicitud completada? ESTO DEVOLVERÁ ESTOS MATERIALES AL INVENTARIO. Úsalo solo para corregir errores graves.')) {
                                                                setSelectedRequestIds(prev => prev.filter(id => id !== req.id));
                                                            }
                                                        }}
                                                        className="text-xs text-red-500 hover:text-red-700 border border-red-200 rounded px-2 py-1 flex items-center gap-1 hover:bg-red-50 transition"
                                                    >
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                                        Revertir
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">*{' '}Estas solicitudes ya no pueden desmarcarse accidentalmente. Si se revierten, el stock retornará al almacén de forma automática al guardar la OT.</p>
                                </div>
                            )}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-slate-700 font-bold mb-2">TÉCNICO LÍDER (AUTOMÁTICO)</label>
                                <div className="p-3 bg-gray-100 rounded border border-gray-300 text-gray-700">
                                    {formData.technician_id ? formData.technician_id.split(',')[0] : 'Seleccione un técnico arriba'}
                                </div>
                            </div>
                            <div>
                                <label className="block text-slate-700 font-bold mb-2">NOMBRE SUPERVISOR PRODUCCIÓN</label>
                                <input
                                    type="text"
                                    name="operator_signature"
                                    className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.operator_signature || ''}
                                    onChange={handleChange}
                                    placeholder="Ingrese nombre del supervisor"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => navigate(`/work-orders/${id}`)}
                            className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center hover:bg-blue-700 disabled:bg-blue-300"
                        >
                            <Save size={20} className="mr-2" /> {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default WorkOrderEdit;
