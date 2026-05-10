import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MaintenanceNotificationCreate = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [plants, setPlants] = useState([]);
    const [areas, setAreas] = useState([]);
    const [machines, setMachines] = useState([]);
    const [subMachines, setSubMachines] = useState([]);

    const [formData, setFormData] = useState({
        plant_id: '',
        area_id: '',
        machine_id: '',
        sub_machine_id: '',
        description: '',
        priority: 'MEDIA'
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchPlants = async () => {
        try {
            const { data } = await api.get('/master/plants');
            setPlants(data);
        } catch (error) {
            console.error('Error fetching plants:', error);
        }
    };

    useEffect(() => {
        fetchPlants();
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
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const cleanedData = Object.fromEntries(
                Object.entries(formData).map(([key, value]) => [key, value === '' ? null : value])
            );

            await api.post('/notifications', cleanedData);
            navigate('/notifications');
        } catch (error) {
            setError(error.response?.data?.message || 'Error al generar el aviso de mantenimiento');
            setLoading(false);
        }
    };

    return (
        <div className="p-4 max-w-3xl mx-auto">
            <button onClick={() => navigate('/notifications')} className="flex items-center text-slate-600 mb-4 hover:text-slate-900 transition-colors">
                <ArrowLeft size={20} className="mr-2" /> Volver a la lista
            </button>

            <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                    <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Reportar Falla</h1>
                        <p className="text-slate-500 text-sm">Genere un nuevo aviso de mantenimiento para producción.</p>
                    </div>
                </div>

                {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-200 flex items-center gap-2"><AlertTriangle size={20}/> {error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="mb-8">
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">1. UBICACIÓN DEL EQUIPO</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-slate-700 font-semibold mb-2 text-sm">Planta *</label>
                                <select
                                    name="plant_id"
                                    className="w-full border border-slate-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50"
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
                                <label className="block text-slate-700 font-semibold mb-2 text-sm">Área *</label>
                                <select
                                    name="area_id"
                                    className="w-full border border-slate-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 disabled:opacity-50"
                                    value={formData.area_id}
                                    onChange={handleChange}
                                    required
                                    disabled={!formData.plant_id}
                                >
                                    <option value="">Seleccionar Área</option>
                                    {areas.map(area => (
                                        <option key={area.id} value={area.id}>{area.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-slate-700 font-semibold mb-2 text-sm">Equipo *</label>
                                <select
                                    name="machine_id"
                                    className="w-full border border-slate-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 disabled:opacity-50"
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
                                <label className="block text-slate-700 font-semibold mb-2 text-sm">Sub-Equipo</label>
                                <select
                                    name="sub_machine_id"
                                    className="w-full border border-slate-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 disabled:opacity-50"
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

                    <div className="mb-8">
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">2. DETALLES DEL PROBLEMA</h2>
                        
                        <div className="mb-4">
                            <label className="block text-slate-700 font-semibold mb-2 text-sm">Descripción de la Falla *</label>
                            <textarea
                                name="description"
                                rows="4"
                                className="w-full border border-slate-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Describa el problema, ruidos anormales, piezas rotas, etc."
                                required
                            ></textarea>
                            <p className="text-xs text-slate-500 mt-1">Por favor, sea lo más detallado posible para ayudar a los técnicos a identificar el problema rápidamente.</p>
                        </div>

                        <div>
                            <label className="block text-slate-700 font-semibold mb-2 text-sm">Prioridad o Impacto *</label>
                            <select
                                name="priority"
                                className="w-full md:w-1/2 border border-slate-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50"
                                value={formData.priority}
                                onChange={handleChange}
                                required
                            >
                                <option value="BAJO">BAJO - No afecta la producción inmediata</option>
                                <option value="MEDIO">MEDIO - Falla parcial o riesgo a corto plazo</option>
                                <option value="ALTO">ALTO - Afecta calidad o velocidad de producción</option>
                                <option value="CRITICO">CRÍTICO - Parada total de máquina / Riesgo de seguridad</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => navigate('/notifications')}
                            className="px-6 py-2.5 rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.machine_id || !formData.description}
                            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium flex items-center hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed shadow-sm"
                        >
                            <Save size={20} className="mr-2" /> {loading ? 'Enviando...' : 'Generar Aviso'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MaintenanceNotificationCreate;
