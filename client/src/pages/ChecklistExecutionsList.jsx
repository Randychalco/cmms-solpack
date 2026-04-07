import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { ArrowLeft, Trash, Eye, FileSpreadsheet, FileText, Search } from 'lucide-react';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

const ChecklistExecutionsList = () => {
    const navigate = useNavigate();
    const [executions, setExecutions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchExecutions();
    }, []);

    const fetchExecutions = async () => {
        try {
            const { data } = await api.get('/checklists/executions');
            setExecutions(data);
        } catch (error) {
            console.error('Error fetching executions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar este registro histórico de checklist? Esta acción no se puede deshacer.')) return;

        try {
            await api.delete(`/checklists/execution/${id}`);
            fetchExecutions();
        } catch (error) {
            console.error('Error deleting execution:', error);
            alert('Error al eliminar el checklist.');
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'CRITICO': return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'CON_OBSERVACION': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'OK':
            case 'COMPLETO': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const filteredExecutions = executions.filter(exec =>
        (exec.template_name && exec.template_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (exec.ticket_number && exec.ticket_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (exec.executed_by_name && exec.executed_by_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) return <div className="p-8 text-center text-slate-500">Cargando historial...</div>;

    return (
        <div className="bg-slate-50 min-h-screen pb-20">
            {/* Header */}
            <div className="bg-slate-900 text-white p-6 shadow-md border-b-4 border-indigo-600">
                <div className="max-w-7xl mx-auto flex items-center gap-4">
                    <button onClick={() => navigate('/checklists')} className="hover:bg-slate-800 p-2 rounded-full transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
                            Historial de Checklists
                            <span className="bg-indigo-600 text-white text-xs px-3 py-1 rounded-full font-bold">
                                {executions.length} Registros
                            </span>
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">
                            Visualiza, edita y exporta los controles de calidad y mantenimiento completados.
                        </p>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 mb-6">
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por plantilla, OT o usuario..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                        />
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs font-bold tracking-wider">
                                    <th className="p-4">D/H Ejecución</th>
                                    <th className="p-4">Plantilla</th>
                                    <th className="p-4">Origen / O.T.</th>
                                    <th className="p-4">Creado por</th>
                                    <th className="p-4">Estado</th>
                                    <th className="p-4 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredExecutions.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="p-8 text-center text-slate-500">
                                            No se encontraron ejecuciones de checklists que coincidan con la búsqueda.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredExecutions.map(exec => (
                                        <tr key={exec.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="p-4">
                                                <div className="font-bold text-slate-800">
                                                    {new Date(exec.date).toLocaleDateString()}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {new Date(exec.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>
                                            <td className="p-4 font-medium text-slate-800">
                                                {exec.template_name || 'Plantilla Desconocida'}
                                            </td>
                                            <td className="p-4">
                                                {exec.wo_id ? (
                                                    <span className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                                                        OT: {exec.ticket_number}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                                                        Rutina (Manual)
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-sm text-slate-600 font-medium">
                                                {exec.executed_by_name || 'Desconocido'}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusStyle(exec.overall_status)}`}>
                                                    {exec.overall_status || 'DESCONOCIDO'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => navigate(`/checklists/execution/${exec.id}`)}
                                                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                        title="Ver / Editar"
                                                    >
                                                        <Eye size={20} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(exec.id)}
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Eliminar"
                                                    >
                                                        <Trash size={20} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChecklistExecutionsList;
