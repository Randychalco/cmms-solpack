import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Wrench, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
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
    "SATURACION DE FILTRO": ["EXCESO DE SUCIEDAD", "TIEMPO DE TRABAJO", "OPERATIVA"]
};

const MaintenanceNotificationDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [notification, setNotification] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isConverting, setIsConverting] = useState(false);
    
    const [technicians, setTechnicians] = useState([]);

    // OT Conversion Form State
    const [otData, setOtData] = useState({
        equipment_condition: '',
        order_class: 'CORRECTIVO_PROGRAMADO',
        failure_description: '',
        failure_cause: '',
        action_taken: '',
        planning_group: '',
        technician_id: '',
        start_date: new Date().toISOString().split('T')[0],
        start_time: new Date().toTimeString().split(' ')[0].substring(0,5),
        end_date: '',
        end_time: '',
        criticality: '',
        observations: '',
        technician_signature: '',
        operator_signature: '',
        leader_technician_name: '',
        supervisor_name: ''
    });

    // Direct spare parts / materials used
    const [spareItems, setSpareItems] = useState([]);
    const [newSpare, setNewSpare] = useState({ description: '', quantity: '', unit: 'UN' });

    useEffect(() => {
        const fetchNotification = async () => {
            try {
                const { data } = await api.get(`/notifications/${id}`);
                setNotification(data);
                setOtData(prev => ({
                    ...prev,
                    criticality: data.priority,
                    failure_description: Object.keys(failureCauses)[0] // Set a default
                }));
            } catch (err) {
                setError('Error al cargar el aviso.');
            } finally {
                setLoading(false);
            }
        };

        const fetchTechnicians = async () => {
            try {
                const { data } = await api.get('/users');
                const techs = data
                    .filter(u => u.role === 'technician' || u.role === 'admin' || u.role === 'supervisor')
                    .map(u => u.name.toUpperCase());
                setTechnicians(techs);
            } catch (error) {
                console.error('Error fetching technicians:', error);
            }
        };

        fetchNotification();
        fetchTechnicians();
    }, [id]);

    const handleOtChange = (e) => {
        const { name, value } = e.target;
        setOtData({
            ...otData,
            [name]: typeof value === 'string' ? value.toUpperCase() : value
        });
    };

    const handleConvertToOT = async (e, submitStatus = 'ABIERTA') => {
        e.preventDefault();
        
        if (submitStatus === 'CERRADA') {
            if (!otData.action_taken || !otData.end_date || !otData.end_time || !otData.technician_signature || !otData.operator_signature) {
                setError('Para CERRAR la orden directamente, debes completar la Acción Realizada, las Fechas de Término y ambas Firmas.');
                return;
            }
        }
        
        setIsConverting(true);
        setError('');

        try {
            // Clean empty strings to null
            const payload = Object.fromEntries(
                Object.entries({ ...otData, status: submitStatus }).map(([key, value]) => [key, value === '' ? null : value])
            );

            // Attach spare parts / materials used
            payload.materials_used = spareItems.length > 0 ? JSON.stringify(spareItems) : null;
            
            const { data } = await api.post(`/notifications/${id}/convert`, payload);
            
            // Redirect to the newly created OT
            navigate(`/work-orders/${data.workOrder.id}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al convertir a Orden de Trabajo');
            setIsConverting(false);
        }
    };

    const handleReject = async () => {
        if (!window.confirm('¿Está seguro de que desea rechazar este aviso?')) return;
        
        try {
            await api.put(`/notifications/${id}`, { status: 'RECHAZADO' });
            setNotification({ ...notification, status: 'RECHAZADO' });
        } catch (err) {
            alert('Error al rechazar el aviso');
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Cargando detalles...</div>;
    if (error && !notification) return <div className="p-8 text-center text-red-500">{error}</div>;
    if (!notification) return <div className="p-8 text-center">Aviso no encontrado.</div>;

    const isPending = notification.status === 'PENDIENTE';
    const isProcessed = notification.status === 'PROCESADO';

    return (
        <div className="p-4 max-w-5xl mx-auto flex flex-col lg:flex-row gap-6">
            
            {/* Left Column - Notification Details */}
            <div className="w-full lg:w-1/3 flex flex-col gap-6">
                <button onClick={() => navigate('/notifications')} className="flex items-center text-slate-600 hover:text-slate-900 w-fit">
                    <ArrowLeft size={20} className="mr-2" /> Volver
                </button>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start mb-4">
                        <h1 className="text-xl font-bold font-mono text-slate-800">{notification.notification_number}</h1>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            notification.status === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                            notification.status === 'PROCESADO' ? 'bg-green-100 text-green-800 border-green-200' :
                            'bg-red-100 text-red-800 border-red-200'
                        }`}>
                            {notification.status}
                        </span>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Equipo</p>
                            <p className="font-semibold text-slate-800">{notification.Machine?.name}</p>
                            <p className="text-sm text-slate-500">{notification.Plant?.name} / {notification.Area?.name}</p>
                            {notification.SubMachine && <p className="text-sm text-slate-500">Sub: {notification.SubMachine.name}</p>}
                        </div>

                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Descripción del Problema</p>
                            <div className="bg-slate-50 p-3 rounded border border-slate-100 text-sm text-slate-700 whitespace-pre-wrap">
                                {notification.description}
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Prioridad Solicitada</p>
                            <p className="font-semibold text-slate-700 flex items-center">
                                {notification.priority === 'CRITICO' && <AlertTriangle size={16} className="text-red-500 mr-2" />}
                                {notification.priority === 'ALTO' && <AlertTriangle size={16} className="text-orange-500 mr-2" />}
                                {notification.priority === 'MEDIO' && <Clock size={16} className="text-yellow-500 mr-2" />}
                                {notification.priority === 'BAJO' && <CheckCircle size={16} className="text-green-500 mr-2" />}
                                {notification.priority}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Reportado Por</p>
                            <p className="text-sm text-slate-700">{notification.Requester?.name || 'Sistema'}</p>
                            <p className="text-xs text-slate-500">{new Date(notification.created_at).toLocaleString()}</p>
                        </div>

                        {isProcessed && notification.WorkOrder && (
                            <div className="mt-4 pt-4 border-t border-slate-200">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Orden Generada</p>
                                <Link 
                                    to={`/work-orders/${notification.WorkOrder.id}`}
                                    className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors"
                                >
                                    <span className="font-mono font-bold text-blue-700">{notification.WorkOrder.ticket_number}</span>
                                    <span className="text-xs bg-white px-2 py-1 rounded text-blue-600 shadow-sm">{notification.WorkOrder.status}</span>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
                
                {isPending && user?.role !== 'production' && (
                    <button 
                        onClick={handleReject}
                        className="w-full py-2 bg-white border border-red-200 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors"
                    >
                        Rechazar Aviso
                    </button>
                )}
            </div>

            {/* Right Column - Conversion Form (Only visible to Mantenimiento if Pending) */}
            <div className="w-full lg:w-2/3">
                {isPending ? (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-200 border-t-4 border-t-blue-500">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 flex items-center">
                                    <Wrench className="mr-2 text-blue-500" /> Convertir a Orden de Trabajo
                                </h2>
                                <p className="text-sm text-slate-500 mt-1">Complete los detalles técnicos para iniciar el trabajo.</p>
                            </div>
                        </div>

                        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded border border-red-200">{error}</div>}

                        <form className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-slate-700 font-bold mb-2 text-sm">Condición de Equipo *</label>
                                    <select
                                        name="equipment_condition"
                                        className="w-full border border-slate-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
                                        value={otData.equipment_condition}
                                        onChange={handleOtChange}
                                        required
                                    >
                                        <option value="">Seleccionar</option>
                                        <option value="PARADO">PARADO</option>
                                        <option value="FUNCIONAMIENTO">FUNCIONAMIENTO</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-slate-700 font-bold mb-2 text-sm">Clase de Orden *</label>
                                    <select
                                        name="order_class"
                                        className="w-full border border-slate-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
                                        value={otData.order_class}
                                        onChange={handleOtChange}
                                        required
                                    >
                                        <option value="EMERGENCIA">EMERGENCIA</option>
                                        <option value="CORRECTIVO_PROGRAMADO">CORRECTIVO PROGRAMADO</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-slate-700 font-bold mb-2 text-sm">Falla Técnica *</label>
                                    <select
                                        name="failure_description"
                                        className="w-full border border-slate-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
                                        value={otData.failure_description}
                                        onChange={(e) => setOtData({...otData, failure_description: e.target.value, failure_cause: ''})}
                                        required
                                    >
                                        <option value="">Seleccionar Falla</option>
                                        {Object.keys(failureCauses).map(failure => (
                                            <option key={failure} value={failure}>{failure}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-slate-700 font-bold mb-2 text-sm">Causa Raíz</label>
                                    <select
                                        name="failure_cause"
                                        className="w-full border border-slate-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
                                        value={otData.failure_cause}
                                        onChange={handleOtChange}
                                        disabled={!otData.failure_description}
                                    >
                                        <option value="">Seleccionar Causa</option>
                                        {otData.failure_description && failureCauses[otData.failure_description]?.map(cause => (
                                            <option key={cause} value={cause}>{cause}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-slate-700 font-bold mb-2 text-sm">Grupo Planificación *</label>
                                    <select
                                        name="planning_group"
                                        className="w-full border border-slate-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
                                        value={otData.planning_group}
                                        onChange={handleOtChange}
                                        required
                                    >
                                        <option value="">Seleccionar Grupo</option>
                                        <option value="MECANICO">MECÁNICO</option>
                                        <option value="ELECTRICO">ELÉCTRICO</option>
                                        <option value="ELECTRONICO">ELECTRÓNICO</option>
                                        <option value="NEUMATICO">NEUMÁTICO</option>
                                        <option value="HIDRAULICO">HIDRÁULICO</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-slate-700 font-bold mb-2 text-sm">Técnico Asignado</label>
                                    <select
                                        className="w-full border border-slate-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
                                        value=""
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                const currentTechs = otData.technician_id ? otData.technician_id.split(',') : [];
                                                if (!currentTechs.includes(e.target.value)) {
                                                    const newTechs = [...currentTechs, e.target.value].join(',');
                                                    setOtData({ ...otData, technician_id: newTechs });
                                                }
                                            }
                                        }}
                                    >
                                        <option value="">Agregar Técnico...</option>
                                        {technicians.map(tech => (
                                            <option key={tech} value={tech}>{tech}</option>
                                        ))}
                                    </select>
                                    {/* Chips for techs */}
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {otData.technician_id.split(',').filter(t => t).map(tech => (
                                            <span key={tech} className="bg-slate-200 text-xs px-2 py-1 rounded flex items-center">
                                                {tech}
                                                <button type="button" className="ml-1 text-slate-500 hover:text-red-500 font-bold" onClick={() => {
                                                    const newTechs = otData.technician_id.split(',').filter(t => t !== tech).join(',');
                                                    setOtData({ ...otData, technician_id: newTechs });
                                                }}>&times;</button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-slate-700 font-bold mb-2 text-sm">Acción Realizada</label>
                                <textarea
                                    name="action_taken"
                                    rows="2"
                                    className="w-full border border-slate-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
                                    value={otData.action_taken}
                                    onChange={handleOtChange}
                                    placeholder="Solo necesario si se cerrará la OT inmediatamente..."
                                ></textarea>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-slate-700 font-bold mb-2 text-sm">Fecha Término</label>
                                    <input
                                        type="date"
                                        name="end_date"
                                        className="w-full border border-slate-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
                                        value={otData.end_date}
                                        onChange={handleOtChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-700 font-bold mb-2 text-sm">Hora Término</label>
                                    <input
                                        type="time"
                                        name="end_time"
                                        className="w-full border border-slate-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
                                        value={otData.end_time}
                                        onChange={handleOtChange}
                                    />
                                </div>
                            </div>

                            {/* Materiales / Repuestos Utilizados */}
                            <div className="mb-6 p-4 border border-amber-200 bg-amber-50 rounded-lg">
                                <label className="block text-amber-900 font-bold mb-1 text-sm">MATERIALES / REPUESTOS UTILIZADOS</label>
                                <p className="text-xs text-amber-700 mb-3">Registra los repuestos consumidos. El stock se descuenta automáticamente al cerrar la OT.</p>

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

                            <div className="mt-8 border-t border-slate-200 pt-6">
                                <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider text-center">Firmas para Cierre Inmediato (Opcional)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="border border-slate-200 p-4 rounded-lg bg-slate-50">
                                        <label className="block text-gray-700 font-bold mb-2 text-sm">Técnico Líder</label>
                                        <input
                                            type="text"
                                            name="leader_technician_name"
                                            className="w-full border border-slate-300 p-2 rounded mb-2 text-sm focus:ring-2 focus:ring-blue-500"
                                            value={otData.leader_technician_name || ''}
                                            onChange={handleOtChange}
                                            placeholder="Nombre del Técnico"
                                        />
                                        <SignaturePad
                                            label="FIRMA TÉCNICO LÍDER"
                                            value={otData.technician_signature}
                                            onChange={(val) => setOtData({ ...otData, technician_signature: val })}
                                        />
                                    </div>
                                    <div className="border border-slate-200 p-4 rounded-lg bg-slate-50">
                                        <label className="block text-gray-700 font-bold mb-2 text-sm">Operador / Supervisor</label>
                                        <input
                                            type="text"
                                            name="supervisor_name"
                                            className="w-full border border-slate-300 p-2 rounded mb-2 text-sm focus:ring-2 focus:ring-blue-500"
                                            value={otData.supervisor_name || ''}
                                            onChange={handleOtChange}
                                            placeholder="Nombre del Operador o Jefe"
                                        />
                                        <SignaturePad
                                            label="FIRMA OPERADOR / SUPERVISOR"
                                            value={otData.operator_signature}
                                            onChange={(val) => setOtData({ ...otData, operator_signature: val })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-slate-100 mt-6">
                                <button
                                    type="button"
                                    onClick={(e) => handleConvertToOT(e, 'ABIERTA')}
                                    disabled={isConverting}
                                    className="bg-white text-blue-600 border-2 border-blue-600 px-6 py-3 rounded-lg font-bold hover:bg-blue-50 transition-colors disabled:opacity-50 text-center"
                                >
                                    Generar OT (Abierta)
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => handleConvertToOT(e, 'PENDIENTE_MATERIALES')}
                                    disabled={isConverting}
                                    className="bg-orange-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-orange-600 transition-colors shadow disabled:opacity-50"
                                >
                                    ⚠️ Generar y Falta Material
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => handleConvertToOT(e, 'CERRADA')}
                                    disabled={isConverting}
                                    className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold flex justify-center items-center gap-2 hover:bg-green-700 transition-colors shadow disabled:opacity-50"
                                >
                                    ✅ {isConverting ? 'Generando...' : 'Generar y Cerrar OT'}
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-12 text-center flex flex-col items-center justify-center h-full">
                        {isProcessed ? (
                            <>
                                <CheckCircle size={48} className="text-green-500 mb-4" />
                                <h3 className="text-xl font-bold text-slate-800 mb-2">Este aviso ya ha sido procesado</h3>
                                <p className="text-slate-500 mb-4">Se ha generado una Orden de Trabajo exitosamente.</p>
                                {notification.WorkOrder && (
                                    <Link 
                                        to={`/work-orders/${notification.WorkOrder.id}`}
                                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                                    >
                                        Ir a la Orden de Trabajo
                                    </Link>
                                )}
                            </>
                        ) : (
                            <>
                                <AlertTriangle size={48} className="text-red-400 mb-4" />
                                <h3 className="text-xl font-bold text-slate-800 mb-2">Aviso Rechazado</h3>
                                <p className="text-slate-500">Este aviso fue revisado y no requiere la generación de una Orden de Trabajo.</p>
                            </>
                        )}
                    </div>
                )}
            </div>

        </div>
    );
};

export default MaintenanceNotificationDetails;
