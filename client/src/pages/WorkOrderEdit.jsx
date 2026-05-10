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

            // 2.5 Fetch Developers / Technicians
            const usersRes = await api.get('/users');
            const techs = usersRes.data
                .filter(u => u.role === 'technician' || u.role === 'admin' || u.role === 'supervisor')
                .map(u => u.name.toUpperCase());
            setTechnicians(techs);

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
                leader_technician_name: wo.leader_technician_name || '',
                supervisor_name: wo.supervisor_name || '',
                criticality: wo.priority || 'MEDIO'
            });

            // Load inventory for direct material search
            const invRes = await api.get('/inventory');
            setInventory(invRes.data || []);

            // Load existing direct materials from materials_used field
            if (wo.materials_used) {
                try {
                    const parsed = typeof wo.materials_used === 'string' ? JSON.parse(wo.materials_used) : wo.materials_used;
                    if (Array.isArray(parsed)) setSpareItems(parsed);
                } catch (e) { /* text field, ignore */ }
            }

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


    // Direct materials (spare items) state
    const [spareSearch, setSpareSearch] = useState('');
    const [showSpareDropdown, setShowSpareDropdown] = useState(false);
    const [selectedSpare, setSelectedSpare] = useState(null);
    const [spareQty, setSpareQty] = useState(1);
    const [spareItems, setSpareItems] = useState([]);
    const [inventory, setInventory] = useState([]);

    const addSpareItem = () => {
        if (!selectedSpare) return;
        setSpareItems(prev => [...prev, {
            id: Date.now(),
            inventory_id: selectedSpare.id,
            name: selectedSpare.name,
            used_quantity: parseInt(spareQty)
        }]);
        setSelectedSpare(null);
        setSpareSearch('');
        setSpareQty(1);
        setShowSpareDropdown(false);
    };

    const removeSpareItem = (itemId) => {
        setSpareItems(prev => prev.filter(s => s.id !== itemId));
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

    const handleSubmit = async (e, targetStatus) => {
        if (e) e.preventDefault();
        
        const finalStatus = targetStatus || formData.status;

        if (finalStatus === 'CERRADA') {
            if (!formData.action_taken || !formData.end_date || !formData.end_time || !formData.technician_signature || !formData.operator_signature) {
                setError('Para CERRAR la orden directamente, debes completar la Acción Realizada, las Fechas de Término y ambas Firmas.');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
        }

        setSaving(true);
        setError('');

        try {
            // Validation of materials removed

            const cleanedData = Object.fromEntries(
                Object.entries({ ...formData, status: finalStatus }).map(([key, value]) => [key, value === '' ? null : value])
            );
            // Map criticality back to priority for backend
            if (cleanedData.criticality) cleanedData.priority = cleanedData.criticality;

            // Serialize direct materials into materials_used field as JSON
            cleanedData.materials_used = spareItems.length > 0 ? JSON.stringify(spareItems) : null;

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

            <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-t-blue-500">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-slate-800">EDITAR ORDEN DE TRABAJO</h1>
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm font-bold border border-slate-200">
                        {formData.status}
                    </span>
                </div>

                {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 border border-red-200 shadow-sm">{error}</div>}

                <form className="space-y-6">
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



                        {/* Materiales Directos */}
                        <div className="mb-6 p-4 border border-amber-200 bg-amber-50 rounded-lg">
                            <label className="block text-amber-900 font-bold mb-3">MATERIALES USADOS EN LA ORDEN</label>
                            <div className="flex gap-2 items-start mb-3">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        placeholder="🔍 Buscar material por nombre o código..."
                                        className="w-full border p-2 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 outline-none bg-white"
                                        value={spareSearch}
                                        onChange={(e) => { setSpareSearch(e.target.value); setShowSpareDropdown(true); setSelectedSpare(null); }}
                                        onFocus={() => setShowSpareDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowSpareDropdown(false), 150)}
                                    />
                                    {selectedSpare && (
                                        <div className="mt-1 flex items-center gap-2">
                                            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full border border-amber-300">
                                                ✓ {selectedSpare.name}
                                            </span>
                                            <button type="button" onClick={() => { setSelectedSpare(null); setSpareSearch(''); }} className="text-red-400 text-xs">✕</button>
                                        </div>
                                    )}
                                    {showSpareDropdown && spareSearch.trim().length > 0 && (
                                        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                                            {inventory.filter(i =>
                                                i.name?.toLowerCase().includes(spareSearch.toLowerCase()) ||
                                                i.code?.toLowerCase().includes(spareSearch.toLowerCase())
                                            ).slice(0, 12).map(i => (
                                                <button key={i.id} type="button"
                                                    onMouseDown={() => { setSelectedSpare(i); setSpareSearch(i.name); setShowSpareDropdown(false); }}
                                                    className="w-full text-left px-4 py-2 text-sm hover:bg-amber-50 border-b border-slate-100 last:border-0 flex justify-between">
                                                    <span className="font-medium">{i.name}</span>
                                                    <span className="text-xs text-slate-400">{i.code} · Stock: {i.stock ?? i.current_stock ?? '?'}</span>
                                                </button>
                                            ))}
                                            {inventory.filter(i =>
                                                i.name?.toLowerCase().includes(spareSearch.toLowerCase()) ||
                                                i.code?.toLowerCase().includes(spareSearch.toLowerCase())
                                            ).length === 0 && <div className="px-4 py-3 text-sm text-slate-400 italic">Sin resultados</div>}
                                        </div>
                                    )}
                                </div>
                                <input type="number" min="1" value={spareQty}
                                    onChange={e => setSpareQty(e.target.value)}
                                    className="w-20 border p-2 rounded-lg text-sm" />
                                <button type="button" onClick={addSpareItem} disabled={!selectedSpare}
                                    className="bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white px-4 py-2 rounded-lg font-bold">AGREGAR</button>
                            </div>
                            <div className="space-y-2">
                                {spareItems.map(s => (
                                    <div key={s.id} className="flex justify-between items-center bg-white border border-amber-200 p-2 rounded text-sm">
                                        <span className="font-medium text-amber-900">{s.name} — <span className="font-bold">Cant: {s.used_quantity}</span></span>
                                        <button type="button" onClick={() => removeSpareItem(s.id)} className="text-red-500 font-bold text-xs">Eliminar</button>
                                    </div>
                                ))}
                                {spareItems.length === 0 && <p className="text-xs text-slate-400 italic">No se han registrado materiales aún.</p>}
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
                            onClick={() => navigate(`/work-orders/${id}`)}
                            className="bg-slate-200 text-slate-700 px-6 py-3 rounded-lg hover:bg-slate-300 font-bold transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={(e) => handleSubmit(e, formData.status)}
                            disabled={saving}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-bold shadow-sm disabled:opacity-50 transition-colors"
                        >
                            Guardar
                        </button>
                        
                        {(formData.status === 'ABIERTA' || formData.status === 'EN_PROCESO') && (
                            <button
                                type="button"
                                onClick={(e) => handleSubmit(e, 'PENDIENTE_MATERIALES')}
                                disabled={saving}
                                className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 font-bold shadow-sm disabled:opacity-50 transition-colors"
                            >
                                Guardar y Falta Material
                            </button>
                        )}

                        {formData.status !== 'CERRADA' && (
                            <button
                                type="button"
                                onClick={(e) => handleSubmit(e, 'CERRADA')}
                                disabled={saving}
                                className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 font-bold shadow-sm flex items-center justify-center disabled:opacity-50 transition-colors"
                            >
                                {saving ? 'Guardando...' : 'Guardar y Cerrar OT'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default WorkOrderEdit;
