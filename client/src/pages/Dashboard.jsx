import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Package, Wrench, AlertTriangle, DollarSign, Clock, Download, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LabelList } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4">
        <div className={`p-3 rounded-full ${color} text-white`}>
            <Icon size={24} />
        </div>
        <div>
            <p className="text-gray-500 text-sm">{title}</p>
            <h3 className="text-2xl font-bold">{value}</h3>
        </div>
    </div>
);

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalAssets: 0,
        openWorkOrders: 0,
        lowStockItems: 0,
        sinStockItems: 0,
        bajoMinimoItems: 0,
        monthlyCost: 0,
        woStatusDistribution: [],
        manHoursByTechnician: [],
        woCountByTechnician: [],
        availabilityByArea: [],
        availabilityByOrderClass: [],
        topDowntimeEvents: []
    });

    const [filters, setFilters] = useState({
        month: '',
        year: new Date().getFullYear().toString(),
        plantId: '',
        areaId: ''
    });

    const [plants, setPlants] = useState([]);
    const [areas, setAreas] = useState([]);

    const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];

    const months = [
        { value: '1', label: 'Enero' },
        { value: '2', label: 'Febrero' },
        { value: '3', label: 'Marzo' },
        { value: '4', label: 'Abril' },
        { value: '5', label: 'Mayo' },
        { value: '6', label: 'Junio' },
        { value: '7', label: 'Julio' },
        { value: '8', label: 'Agosto' },
        { value: '9', label: 'Septiembre' },
        { value: '10', label: 'Octubre' },
        { value: '11', label: 'Noviembre' },
        { value: '12', label: 'Diciembre' }
    ];

    // Fetch plants for filter
    useEffect(() => {
        const fetchPlants = async () => {
            try {
                const { data } = await api.get('/master/plants');
                setPlants(data);
            } catch (error) {
                console.error('Error fetching plants:', error);
            }
        };
        fetchPlants();
    }, []);

    // Fetch areas based on plant selection (cascade)
    useEffect(() => {
        const fetchAreas = async () => {
            try {
                if (filters.plantId) {
                    const { data } = await api.get(`/master/areas?plantId=${filters.plantId}`);
                    setAreas(data);
                } else {
                    const { data } = await api.get('/master/areas');
                    setAreas(data);
                }
            } catch (error) {
                console.error('Error fetching areas:', error);
            }
        };
        fetchAreas();

        // Reset area when plant changes
        setFilters(prev => ({ ...prev, areaId: '' }));
    }, [filters.plantId]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const params = new URLSearchParams();
                if (filters.month) params.append('month', filters.month);
                if (filters.year) params.append('year', filters.year);
                if (filters.plantId) params.append('plantId', filters.plantId);
                if (filters.areaId) params.append('areaId', filters.areaId);

                const { data } = await api.get(`/dashboard?${params.toString()}`);
                setStats(data);
            } catch (error) {
                console.error('Error fetching stats:', error);
            }
        };
        fetchStats();
    }, [filters]);

    const handleExportPDF = async () => {
        try {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            // Título principal
            pdf.setFontSize(20);
            pdf.setFont('helvetica', 'bold');
            pdf.text('REPORTE DE DASHBOARD', pageWidth / 2, 20, { align: 'center' });

            // Fecha y filtros
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            const currentDate = new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });
            pdf.text(`Fecha: ${currentDate}`, 20, 30);
            pdf.text(`Año: ${filters.year}`, 20, 35);
            if (filters.month) {
                const monthName = months.find(m => m.value === filters.month)?.label || '';
                pdf.text(`Mes: ${monthName}`, 20, 40);
            }
            if (filters.plantId) {
                const plantName = plants.find(p => p.id.toString() === filters.plantId)?.name || '';
                pdf.text(`Planta: ${plantName}`, 20, 45);
            }

            // Capturar todos los gráficos
            const chartContainers = document.querySelectorAll('.bg-white.p-6.rounded-lg.shadow-md');

            let yPosition = 55;
            for (let i = 0; i < chartContainers.length; i++) {
                if (i > 0) { // Skip stat cards, start from first chart
                    const canvas = await html2canvas(chartContainers[i], {
                        scale: 2,
                        useCORS: true,
                        backgroundColor: '#ffffff'
                    });

                    const imgData = canvas.toDataURL('image/png');
                    const imgWidth = 170;
                    const imgHeight = (canvas.height * imgWidth) / canvas.width;

                    // Verificar si necesita nueva página
                    if (yPosition + imgHeight > pageHeight - 20) {
                        pdf.addPage();
                        yPosition = 20;
                    }

                    pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight);
                    yPosition += imgHeight + 10;
                }
            }

            // PÁGINA FINAL: RESUMEN EJECUTIVO
            pdf.addPage();

            // Título del resumen
            pdf.setFontSize(18);
            pdf.setFont('helvetica', 'bold');
            pdf.text('RESUMEN EJECUTIVO', pageWidth / 2, 20, { align: 'center' });

            // Línea separadora
            pdf.setDrawColor(200, 200, 200);
            pdf.line(20, 25, pageWidth - 20, 25);

            // Estadísticas principales
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Estadísticas Generales', 20, 40);

            pdf.setFontSize(11);
            pdf.setFont('helvetica', 'normal');
            let summaryY = 50;


            // Calcular totales de OTs a partir de woStatusDistribution
            const totalOTs = stats.woStatusDistribution.reduce((sum, item) => sum + item.count, 0);
            const completedOTs = stats.woStatusDistribution.find(item => item.status === 'CERRADA')?.count || 0;
            const inProgressOTs = stats.woStatusDistribution.find(item => item.status === 'EN_PROCESO')?.count || 0;
            const openOTs = stats.woStatusDistribution.find(item => item.status === 'ABIERTA')?.count || 0;
            const pendingOTs = stats.woStatusDistribution.find(item => item.status === 'PENDIENTE_MATERIALES')?.count || 0;

            // Total de OTs
            pdf.setFont('helvetica', 'bold');
            pdf.text('Total de Órdenes de Trabajo:', 25, summaryY);
            pdf.setFont('helvetica', 'normal');
            pdf.text(totalOTs.toString(), 120, summaryY);
            summaryY += 10;

            // OTs Completadas
            pdf.setFont('helvetica', 'bold');
            pdf.text('Órdenes Completadas:', 25, summaryY);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(34, 197, 94); // Verde
            pdf.text(completedOTs.toString(), 120, summaryY);
            pdf.setTextColor(0, 0, 0); // Reset a negro
            summaryY += 10;

            // OTs Pendientes
            pdf.setFont('helvetica', 'bold');
            pdf.text('Órdenes Pendientes:', 25, summaryY);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(234, 179, 8); // Amarillo/Naranja
            pdf.text(pendingOTs.toString(), 120, summaryY);
            pdf.setTextColor(0, 0, 0); // Reset
            summaryY += 10;

            // OTs Abiertas
            pdf.setFont('helvetica', 'bold');
            pdf.text('Órdenes Abiertas:', 25, summaryY);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(239, 68, 68); // Rojo
            pdf.text(openOTs.toString(), 120, summaryY);
            pdf.setTextColor(0, 0, 0); // Reset
            summaryY += 15;

            // Tasa de completitud
            const completionRate = totalOTs > 0 ? ((completedOTs / totalOTs) * 100).toFixed(1) : 0;
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Tasa de Completitud:', 25, summaryY);
            pdf.setTextColor(34, 197, 94);
            pdf.text(`${completionRate}%`, 120, summaryY);
            pdf.setTextColor(0, 0, 0);
            summaryY += 20;

            // Información adicional
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Indicadores de Rendimiento', 20, summaryY);
            summaryY += 10;

            pdf.setFontSize(11);
            pdf.setFont('helvetica', 'normal');

            // Horas hombre totales
            if (stats.totalManHours !== undefined) {
                pdf.setFont('helvetica', 'bold');
                pdf.text('Total Horas-Hombre:', 25, summaryY);
                pdf.setFont('helvetica', 'normal');
                pdf.text(`${stats.totalManHours.toFixed(1)} hrs`, 120, summaryY);
                summaryY += 10;
            }

            // Downtime total
            if (stats.totalDowntime !== undefined) {
                pdf.setFont('helvetica', 'bold');
                pdf.text('Tiempo Parado Total:', 25, summaryY);
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(239, 68, 68);
                pdf.text(`${stats.totalDowntime.toFixed(1)} hrs`, 120, summaryY);
                pdf.setTextColor(0, 0, 0);
                summaryY += 15;
            }

            // Pie de página
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'italic');
            pdf.setTextColor(100, 100, 100);
            pdf.text('Este reporte fue generado automáticamente por el Sistema de Gestión de Mantenimiento - SOLPACK', pageWidth / 2, pageHeight - 15, { align: 'center' });
            pdf.text(currentDate, pageWidth / 2, pageHeight - 10, { align: 'center' });

            // Descargar PDF
            const timestamp = new Date().toISOString().slice(0, 10);
            pdf.save(`dashboard_${timestamp}.pdf`);
        } catch (error) {
            console.error('Error generando PDF:', error);
            alert('Error al generar PDF del dashboard');
        }
    };

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Dashboard General</h1>
                <button
                    onClick={handleExportPDF}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700"
                >
                    <Download size={20} /> <span className="hidden md:inline">Exportar PDF</span>
                </button>
            </div>

            {/* Filtros con diseño mejorado */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl shadow-lg mb-6 border border-blue-100">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Filtro de Año */}
                    <div className="relative">
                        <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Año
                        </label>
                        <select
                            value={filters.year}
                            onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                            className="w-full bg-white border-2 border-blue-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-300 cursor-pointer font-medium text-slate-700"
                        >
                            <option value="2024">2024</option>
                            <option value="2025">2025</option>
                            <option value="2026">2026</option>
                        </select>
                    </div>

                    {/* Filtro de Mes */}
                    <div className="relative">
                        <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Mes
                        </label>
                        <select
                            value={filters.month}
                            onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                            className="w-full bg-white border-2 border-indigo-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-indigo-300 cursor-pointer font-medium text-slate-700"
                        >
                            <option value="">Todos los meses</option>
                            {months.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Filtro de Planta */}
                    <div className="relative">
                        <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            Planta
                        </label>
                        <select
                            value={filters.plantId}
                            onChange={(e) => setFilters({ ...filters, plantId: e.target.value })}
                            className="w-full bg-white border-2 border-purple-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 hover:border-purple-300 cursor-pointer font-medium text-slate-700"
                        >
                            <option value="">Todas las plantas</option>
                            {plants.map(plant => (
                                <option key={plant.id} value={plant.id}>{plant.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Filtro de Área */}
                    <div className="relative">
                        <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                            Área
                        </label>
                        <select
                            value={filters.areaId}
                            onChange={(e) => setFilters({ ...filters, areaId: e.target.value })}
                            className="w-full bg-white border-2 border-teal-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 hover:border-teal-300 cursor-pointer font-medium text-slate-700"
                        >
                            <option value="">Todas las áreas</option>
                            {areas.map(area => (
                                <option key={area.id} value={area.id}>{area.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Total Activos" value={stats.totalAssets} icon={Wrench} color="bg-blue-500" />
                <StatCard title="OTs Abiertas" value={stats.openWorkOrders} icon={AlertTriangle} color="bg-yellow-500" />
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-full bg-red-500 text-white`}>
                            <Package size={24} />
                        </div>
                        <div className="flex-1">
                            <p className="text-gray-500 text-sm">Bajo Stock</p>
                            <h3 className="text-2xl font-bold">{stats.lowStockItems}</h3>
                            {stats.lowStockItems > 0 && (
                                <div className="flex gap-3 mt-1">
                                    {stats.sinStockItems > 0 && (
                                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                                            ⛔ {stats.sinStockItems} sin stock
                                        </span>
                                    )}
                                    {stats.bajoMinimoItems > 0 && (
                                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                                            ⚠️ {stats.bajoMinimoItems} bajo mínimo
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <StatCard title="Costo Materiales" value={`$${stats.monthlyCost}`} icon={DollarSign} color="bg-green-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-bold mb-4">Estado de Órdenes de Trabajo</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.woStatusDistribution}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="status" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#3b82f6">
                                    <LabelList dataKey="count" position="inside" style={{ fill: 'white', fontWeight: 'bold', fontSize: 12 }} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Clock size={20} className="text-indigo-600" />
                        Horas-Hombre por Técnico
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.manHoursByTechnician} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="technician" type="category" width={100} />
                                <Tooltip
                                    formatter={(value) => [`${value} hrs`, 'Horas']}
                                />
                                <Bar dataKey="hours" fill="#8b5cf6" radius={[0, 8, 8, 0]}>
                                    <LabelList dataKey="hours" position="center" style={{ fill: 'white', fontWeight: 'bold', fontSize: 12 }} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Wrench size={20} className="text-emerald-600" />
                        N° de OTs por Técnico
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.woCountByTechnician} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="technician" type="category" width={100} />
                                <Tooltip
                                    formatter={(value) => [`${value} OTs`, 'Órdenes']}
                                />
                                <Bar dataKey="count" fill="#10b981" radius={[0, 8, 8, 0]}>
                                    <LabelList dataKey="count" position="center" style={{ fill: 'white', fontWeight: 'bold', fontSize: 12 }} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <AlertTriangle size={20} className="text-orange-600" />
                        Disponibilidad por Área (%)
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.availabilityByArea}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="area" 
                                    interval={0} 
                                    angle={-45} 
                                    textAnchor="end" 
                                    height={80} 
                                    style={{ fontSize: '11px', fontWeight: 'bold' }}
                                />
                                <YAxis domain={[0, 100]} />
                                <Tooltip
                                    formatter={(value) => [`${value}%`, 'Disponibilidad']}
                                />
                                <Bar dataKey="availability" fill="#f59e0b" radius={[8, 8, 0, 0]}>
                                    <LabelList dataKey="availability" position="top" formatter={(value) => `${value}%`} style={{ fill: '#374151', fontWeight: 'bold', fontSize: 10 }} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Clock size={20} className="text-rose-600" />
                        Downtime por Clase de Orden
                    </h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.availabilityByOrderClass}
                                    dataKey="downtime"
                                    nameKey="orderClass"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    label={({ percentage }) => `${percentage}%`}
                                    labelLine={false}
                                >
                                    {stats.availabilityByOrderClass.map((entry, index) => {
                                        const colors = ['#ef4444', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6'];
                                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                                    })}
                                </Pie>
                                <Tooltip
                                    formatter={(value, name, props) => [
                                        `${value} hrs (${props.payload.percentage}%)`,
                                        props.payload.orderClass
                                    ]}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    formatter={(value, entry) => `${entry.payload.orderClass} (${entry.payload.downtime} hrs)`}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Activity size={20} className="text-red-600" />
                        Top 15 Paradas con Mayor Tiempo de Reparación por Equipo
                    </h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.topDowntimeEvents} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis 
                                    dataKey="label" 
                                    interval={0} 
                                    angle={-45} 
                                    textAnchor="end"
                                    style={{ fontSize: '11px', fontWeight: 'bold', fill: '#475569' }}
                                    height={100}
                                />
                                <YAxis label={{ value: 'Horas', angle: -90, position: 'insideLeft', offset: 10, style: { fill: '#475569', fontWeight: 'bold' } }} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(239, 68, 68, 0.1)' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value) => [`${value} hrs`, 'Reparación']}
                                />
                                <Bar dataKey="hours" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={40}>
                                    <LabelList dataKey="hours" position="top" style={{ fill: '#ef4444', fontWeight: 'bold', fontSize: '11px' }} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
