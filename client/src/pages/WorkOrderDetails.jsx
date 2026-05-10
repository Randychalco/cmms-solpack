import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertTriangle, Package, Clock, Save, User, MapPin, Wrench, FileText, Calendar, ClipboardCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ... (lines 9-157 skipped for brevity in replace, I will target specific chunks)


const WorkOrderDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [wo, setWo] = useState(null);
    const [linkedRequests, setLinkedRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusNote, setStatusNote] = useState('');
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchWO();
    }, [id]);

    const fetchWO = async () => {
        try {
            const { data } = await api.get(`/work-orders/${id}`);
            setWo(data);

            // Fetch linked material requests
            const reqRes = await api.get(`/material-requests?wo_id=${id}`);
            setLinkedRequests(reqRes.data || []);

            setLoading(false);
        } catch (error) {
            console.error('Error fetching WO:', error);
            setLoading(false);
        }
    };

    const generatePDF = () => {
        try {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const marginX = 10;
            const marginTop = 35;
            const marginBottom = 25;

            // ── Helper: draw header on current page ──────────────────────────
            const drawHeader = () => {
                pdf.setDrawColor(0);
                pdf.setLineWidth(0.3);

                // Box 1: Logo
                pdf.rect(10, 10, 50, 20);
                pdf.setFontSize(22);
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(205, 50, 40); 
                pdf.text('SOLPACK', 14, 20);
                pdf.setFontSize(7.5);
                pdf.setTextColor(120, 120, 120);
                pdf.text('SOLUCIONES DE EMBALAJE', 14, 25);

                // Box 2: Title
                pdf.rect(60, 10, 90, 20);
                pdf.setFontSize(10);
                pdf.setTextColor(0);
                pdf.setFont('helvetica', 'normal');
                pdf.text('REGISTRO', 105, 16, { align: 'center' });
                pdf.line(60, 19, 150, 19);
                pdf.setFontSize(11);
                pdf.setFont("helvetica", "bold");
                pdf.text('SOLICITUD DE TRABAJO DE MANTENIMIENTO', 105, 26, { align: 'center' });

                // Box 3: Meta
                pdf.rect(150, 10, 50, 20);
                pdf.setFontSize(8);
                pdf.setFont("helvetica", "normal");
                pdf.setTextColor(0);
                pdf.text('Código: MAN-RE-07', 152, 14);
                pdf.text('Versión: 03', 152, 19);
                pdf.text('Fecha: 1/01/2026', 152, 24);
                // "Página" will be drawn in the footer loop
            };

            // ── Helper: draw footer with page number ─────────────────────────
            const drawFooter = (pageNum, totalPages) => {
                const fY = pdfHeight - 20; // Start of footer grid
                pdf.setDrawColor(0);
                pdf.setLineWidth(0.3);

                // Grid bounding box
                pdf.rect(marginX, fY, pdfWidth - 2 * marginX, 12);
                
                // Vertical lines
                pdf.line(marginX + 60, fY, marginX + 60, fY + 12);
                pdf.line(marginX + 130, fY, marginX + 130, fY + 12);

                pdf.setFontSize(8);
                pdf.setFont("helvetica", "normal");
                pdf.setTextColor(0);

                // Col 1
                pdf.text('Elaborado por:', marginX + 2, fY + 4);
                pdf.text('Supervisor de mantenimiento', marginX + 2, fY + 9);

                // Col 2
                pdf.text('Revisado por:', marginX + 62, fY + 4);
                pdf.text('Sub gerente de mantenimiento', marginX + 62, fY + 9);

                // Col 3
                pdf.text('Aprobado por:', marginX + 132, fY + 4);
                pdf.text('Gerente de operaciones', marginX + 132, fY + 9);

                // Disclaimer
                pdf.setFontSize(8);
                pdf.setFont("helvetica", "bold");
                pdf.text('Confidencial: Prohibido reproducir total o parcialmente sin autorización del Gerente General', pdfWidth / 2, fY + 17, { align: 'center' });
            };

            drawHeader();
            let curY = marginTop;

            // ── Separator ─────────────────────────────────────────────────────
            pdf.setDrawColor(200, 200, 200);
            pdf.setLineWidth(0.4);
            pdf.line(marginX, curY, pdfWidth - marginX, curY);
            curY += 5;

            // Helper: dark section title matching Preventive style
            const drawSectionTitle = (title, colorArr = [30, 30, 46]) => {
                if (curY > pdfHeight - 55) {
                    pdf.addPage();
                    drawHeader();
                    curY = marginTop + 5;
                }
                pdf.setFillColor(...colorArr);
                pdf.rect(marginX, curY, pdfWidth - marginX * 2, 7, 'F');
                pdf.setFontSize(8.5);
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(255, 255, 255);
                pdf.text(title.toUpperCase(), marginX + 3, curY + 5);
                pdf.setTextColor(0);
                curY += 10;
            };

            // ── 1. INFORMACIÓN DEL EQUIPO ─────────────────────────────────────
            drawSectionTitle('1. Información del Equipo y Ubicación');
            autoTable(pdf, {
                body: [
                    [{ content: 'PLANTA:', fontStyle: 'bold' }, wo.Plant?.name || '-', { content: 'CONDICIÓN:', fontStyle: 'bold' }, wo.equipment_condition || '-'],
                    [{ content: 'ÁREA:', fontStyle: 'bold' }, wo.Area?.name || '-', { content: 'ESTADO:', fontStyle: 'bold' }, wo.status || '-'],
                    [{ content: 'EQUIPO:', fontStyle: 'bold' }, wo.Machine?.name || '-', { content: 'PRIORIDAD:', fontStyle: 'bold' }, wo.priority || '-'],
                    [{ content: 'SUB-EQUIPO:', fontStyle: 'bold' }, wo.SubMachine?.name || '-', { content: 'GRUPO PLAN:', fontStyle: 'bold' }, wo.planning_group || '-'],
                ],
                startY: curY,
                margin: { left: marginX, right: marginX },
                styles: { fontSize: 8, cellPadding: 2.5, textColor: [40, 40, 60] },
                alternateRowStyles: { fillColor: [248, 249, 252] },
                columnStyles: { 0: { cellWidth: 30, fontStyle: 'bold' }, 1: { cellWidth: 65 }, 2: { cellWidth: 28, fontStyle: 'bold' }, 3: { cellWidth: 'auto' } }
            });
            curY = pdf.lastAutoTable.finalY + 5;

            // ── 2. DETALLE DE LA ORDEN ────────────────────────────────────────
            drawSectionTitle('2. Detalle de la Orden');
            autoTable(pdf, {
                body: [
                    [{ content: 'N° OT:', fontStyle: 'bold' }, wo.ticket_number || '-', { content: 'CLASE:', fontStyle: 'bold' }, wo.order_class || '-'],
                    [{ content: 'TÉCNICO(S):', fontStyle: 'bold' }, wo.technician_id || '-', { content: 'FECHA INICIO:', fontStyle: 'bold' }, wo.start_date ? new Date(wo.start_date).toLocaleDateString('es-PE') : '-'],
                    [{ content: 'HORA INICIO:', fontStyle: 'bold' }, wo.start_time || '-', { content: 'FECHA FIN:', fontStyle: 'bold' }, wo.end_date ? new Date(wo.end_date).toLocaleDateString('es-PE') : '-'],
                ],
                startY: curY,
                margin: { left: marginX, right: marginX },
                styles: { fontSize: 8, cellPadding: 2.5, textColor: [40, 40, 60] },
                alternateRowStyles: { fillColor: [248, 249, 252] },
                columnStyles: { 0: { cellWidth: 30, fontStyle: 'bold' }, 1: { cellWidth: 65 }, 2: { cellWidth: 28, fontStyle: 'bold' }, 3: { cellWidth: 'auto' } }
            });
            curY = pdf.lastAutoTable.finalY + 5;

            // ── 3. FALLA Y CAUSA ─────────────────────────────────────────────
            drawSectionTitle('3. Falla y Causa Raíz');
            autoTable(pdf, {
                body: [
                    [{ content: 'DESCRIPCIÓN DE FALLA:', fontStyle: 'bold' }, wo.failure_description || 'No registrado'],
                    [{ content: 'CAUSA RAÍZ:', fontStyle: 'bold' }, wo.failure_cause || 'No registrado'],
                    [{ content: 'ACCIÓN REALIZADA:', fontStyle: 'bold' }, wo.action_taken || 'Pendiente de registro...'],
                ],
                startY: curY,
                margin: { left: marginX, right: marginX },
                styles: { fontSize: 8, cellPadding: 2.5, textColor: [40, 40, 60], overflow: 'linebreak' },
                alternateRowStyles: { fillColor: [248, 249, 252] },
                columnStyles: { 0: { cellWidth: 45 }, 1: { cellWidth: 'auto' } }
            });
            curY = pdf.lastAutoTable.finalY + 5;

            // ── 4. MATERIALES UTILIZADOS ──────────────────────────────────────
            drawSectionTitle('4. Consumo de Materiales y Repuestos', [165, 71, 58]);
            const mats = [];

            // Source 1: Solicitudes de materiales vinculadas
            linkedRequests.forEach(req => {
                const items = typeof req.items === 'string' ? JSON.parse(req.items) : (req.items || []);
                items.forEach(item => {
                    mats.push([item.description || '-', `${item.quantity_requested} ${item.unit_measure || 'un.'}`]);
                });
            });

            // Source 2: materials_used (campo directo de la OT)
            if (wo.materials_used) {
                try {
                    const directMats = typeof wo.materials_used === 'string' ? JSON.parse(wo.materials_used) : wo.materials_used;
                    if (Array.isArray(directMats)) {
                        directMats.forEach(m => {
                            mats.push([m.name || m.description || '-', `${m.used_quantity || m.quantity || '-'} un.`]);
                        });
                    }
                } catch (e) {
                    // si es texto plano, mostrarlo como una sola fila
                    mats.push([wo.materials_used, '-']);
                }
            }

            if (mats.length === 0) {
                autoTable(pdf, {
                    body: [['No se registraron materiales en esta orden.']],
                    startY: curY,
                    margin: { left: marginX, right: marginX },
                    styles: { fontSize: 8, fontStyle: 'italic', cellPadding: 2.5, textColor: [120, 120, 120] },
                    theme: 'plain'
                });
            } else {
                autoTable(pdf, {
                    head: [['Material / Repuesto', 'Cantidad']],
                    body: mats,
                    startY: curY,
                    margin: { left: marginX, right: marginX },
                    styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak', textColor: [30, 30, 30] },
                    headStyles: { fillColor: [165, 71, 58], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
                    alternateRowStyles: { fillColor: [253, 248, 246] },
                    columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 30, halign: 'center' } }
                });
            }
            curY = pdf.lastAutoTable.finalY + 5;


            // ── 5. OBSERVACIONES ──────────────────────────────────────────────
            if (wo.observations) {
                drawSectionTitle('5. Observaciones');
                autoTable(pdf, {
                    body: [[wo.observations]],
                    startY: curY,
                    margin: { left: marginX, right: marginX },
                    styles: { fontSize: 8, cellPadding: 2.5, textColor: [40, 40, 60] },
                    theme: 'plain'
                });
                curY = pdf.lastAutoTable.finalY + 5;
            }

            // ── FIRMAS ────────────────────────────────────────────────────────
            if (curY > pdfHeight - 55) {
                pdf.addPage();
                drawHeader();
                curY = marginTop + 10;
            } else {
                curY += 15;
            }

            pdf.setDrawColor(150, 150, 150);
            pdf.setLineWidth(0.3);

            // Left: Técnico Líder
            if (wo.technician_signature && wo.technician_signature.startsWith('data:image')) {
                pdf.addImage(wo.technician_signature, 'PNG', marginX + 15, curY - 22, 50, 20);
            }
            pdf.line(marginX + 10, curY, marginX + 80, curY);
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(60, 60, 60);
            pdf.text('TÉCNICO LÍDER', marginX + 45, curY + 5, { align: 'center' });
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(8);
            // Always print name
            const techDisplayName = wo.leader_technician_name || wo.technician_id || 'No asignado';
            pdf.text(techDisplayName, marginX + 45, curY + 10, { align: 'center' });

            // Right: Supervisor
            const rightX = pdfWidth - marginX - 80;
            if (wo.operator_signature && wo.operator_signature.startsWith('data:image')) {
                pdf.addImage(wo.operator_signature, 'PNG', rightX + 15, curY - 22, 50, 20);
            }
            pdf.line(rightX + 10, curY, rightX + 80, curY);
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(60, 60, 60);
            pdf.text('SUPERVISOR DE PRODUCCIÓN', rightX + 45, curY + 5, { align: 'center' });
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(8);
            // Always print name
            const supDisplayName = wo.supervisor_name || 'No registrado';
            pdf.text(supDisplayName, rightX + 45, curY + 10, { align: 'center' });

            // ── Apply header/footer to ALL pages ─────────────────────────────
            const totalPages = pdf.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                pdf.setPage(i);
                pdf.setFontSize(8);
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(0);
                pdf.text(`Página: ${i} de ${totalPages}`, 152, 29);
                drawFooter(i, totalPages);
            }

            pdf.save(`OT_${wo.ticket_number}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error al generar PDF: ' + error.message);
        }
    };


    const handleStatusChange = async (newStatus) => {
        if (newStatus === 'CERRADA') {
            // Check if wo has required fields
            const missingFields = !wo.action_taken || !wo.end_date || !wo.end_time || !wo.technician_signature || !wo.operator_signature;
            if (missingFields) {
                alert('Faltan datos (Acción realizada, fechas, o firmas). Redirigiendo a edición para completar el cierre...');
                navigate(`/work-orders/${id}/edit`);
                return;
            }
        }

        setUpdating(true);
        try {
            await api.put(`/work-orders/${id}/status`, { status: newStatus, note: statusNote });
            setStatusNote('');
            await fetchWO();
            
            // Redirect automatically if changing to EN_PROCESO
            if (newStatus === 'EN_PROCESO') {
                navigate(`/work-orders/${id}/edit`);
            }
        } catch (error) {
            alert('Error al actualizar el estado');
        } finally {
            setUpdating(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'ABIERTA': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'EN_PROCESO': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'PENDIENTE_MATERIALES': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'CERRADA': return 'bg-green-100 text-green-800 border-green-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getPriorityStyle = (priority) => {
        switch (priority) {
            case 'CRITICA': return 'bg-red-500 text-white';
            case 'ALTA': return 'bg-orange-500 text-white';
            case 'MEDIA': return 'bg-yellow-500 text-white';
            case 'BAJA': return 'bg-green-500 text-white';
            default: return 'bg-gray-500 text-white';
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
        </div>
    );

    if (!wo) return (
        <div className="p-8 text-center bg-white rounded-lg shadow-sm">
            <AlertTriangle size={48} className="mx-auto text-orange-500 mb-4" />
            <h2 className="text-xl font-bold text-slate-800">Orden de trabajo no encontrada</h2>
            <button onClick={() => navigate('/work-orders')} className="mt-4 text-blue-600 hover:underline">Volver a la lista</button>
        </div>
    );

    return (
        <div className="p-4 max-w-5xl mx-auto pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/work-orders')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={24} className="text-slate-600" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{wo.ticket_number}</h1>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full border ${getStatusStyle(wo.status)}`}>
                                {wo.status}
                            </span>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${getPriorityStyle(wo.priority)}`}>
                                {wo.priority || 'MEDIO'}
                            </span>
                        </div>
                        <p className="text-slate-500 font-medium">
                            {wo.order_class} — Creada el {new Date(wo.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={generatePDF}
                        className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm"
                    >
                        <FileText size={18} /> Exportar PDF
                    </button>
                    <button
                        onClick={() => navigate(`/work-orders/${id}/edit`)}
                        className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold shadow-lg hover:bg-slate-800 transition-all"
                    >
                        Editar Orden
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Panel Principal */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Ubicación del Equipo (Jerarquía) */}
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <MapPin size={16} /> UBICACIÓN DEL EQUIPO
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <span className="block text-[10px] uppercase font-black text-slate-400 mb-1">PLANTA</span>
                                <span className="font-bold text-slate-800">{wo.Plant?.name || '-'}</span>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <span className="block text-[10px] uppercase font-black text-slate-400 mb-1">ÁREA</span>
                                <span className="font-bold text-slate-800">{wo.Area?.name || '-'}</span>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <span className="block text-[10px] uppercase font-black text-slate-400 mb-1">EQUIPO</span>
                                <span className="font-bold text-slate-800">{wo.Machine?.name || '-'}</span>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <span className="block text-[10px] uppercase font-black text-slate-400 mb-1">SUB-EQUIPO</span>
                                <span className="font-bold text-slate-800">{wo.SubMachine?.name || '-'}</span>
                            </div>
                        </div>
                        {wo.equipment_condition && (
                            <div className="mt-4 flex items-center gap-2 text-sm">
                                <span className="text-slate-500">CONDICIÓN:</span>
                                <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded font-bold uppercase text-[10px]">
                                    {wo.equipment_condition}
                                </span>
                            </div>
                        )}
                    </section>

                    {/* Descripción de Falla y Acciones */}
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <AlertTriangle size={16} className="text-red-400" /> DESCRIPCIÓN DE LA FALLA
                                </h3>
                                <p className="text-slate-700 leading-relaxed bg-red-50 p-4 rounded-xl border border-red-100/50 italic text-lg font-medium">
                                    "{wo.failure_description || 'Sin descripción'}"
                                </p>
                            </div>

                            {wo.failure_cause && (
                                <div>
                                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">CAUSA RAÍZ</h3>
                                    <p className="text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        {wo.failure_cause}
                                    </p>
                                </div>
                            )}

                            <div>
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <CheckCircle size={16} className="text-green-500" /> ACCIÓN REALIZADA
                                </h3>
                                <div className="text-slate-700 bg-green-50 p-4 rounded-xl border border-green-100 min-h-[80px]">
                                    {wo.action_taken || <span className="text-slate-400 italic">Pendiente de registro...</span>}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Materiales y Observaciones */}
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <Package size={16} /> MATERIALES UTILIZADOS
                                </h3>
                                <div className="text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 min-h-[100px] text-sm">
                                    {linkedRequests.length === 0 ? (
                                        <p className="text-slate-500 italic">No hay solicitudes de materiales vinculadas.</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {linkedRequests.map(req => {
                                                const items = typeof req.items === 'string' ? JSON.parse(req.items) : (req.items || []);
                                                return (
                                                    <div key={req.id} className="border border-indigo-100 rounded-lg p-3 bg-white">
                                                        <div className="flex justify-between items-center mb-2 border-b border-indigo-50 pb-2">
                                                            <span className="font-mono text-xs text-indigo-600 font-bold">Solicitud #{req.id.substring(0, 8).toUpperCase()}</span>
                                                            <span className="text-xs text-slate-500">Por: {req.user_name}</span>
                                                        </div>
                                                        <ul className="space-y-1">
                                                            {items.map((item, idx) => (
                                                                <li key={idx} className="flex gap-2 text-sm">
                                                                    <span className="font-bold text-slate-700 min-w-[50px]">{item.quantity_requested} {item.unit_measure || 'un.'}</span>
                                                                    <span className="text-slate-600">{item.description}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <FileText size={16} /> OBSERVACIONES
                                </h3>
                                <div className="text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 min-h-[100px] text-sm whitespace-pre-wrap">
                                    {wo.observations || 'Sin observaciones adicionales.'}
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Panel Lateral */}
                <div className="space-y-6">
                    {/* Gestión de Estado */}
                    <section className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">CONTROL DE ESTADO</h3>
                        <div className="space-y-4">
                            <div className="flex flex-col gap-2">
                                {wo.status === 'ABIERTA' && (
                                    <button
                                        onClick={() => handleStatusChange('EN_PROCESO')}
                                        disabled={updating}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                                    >
                                        <Clock size={20} /> EN PROCESO
                                    </button>
                                )}
                                {wo.status === 'EN_PROCESO' && (
                                    <>
                                        <button
                                            onClick={() => handleStatusChange('PENDIENTE_MATERIALES')}
                                            disabled={updating}
                                            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-3 rounded-xl transition-all"
                                        >
                                            FALTA MATERIAL
                                        </button>
                                        <button
                                            onClick={() => handleStatusChange('CERRADA')}
                                            disabled={updating}
                                            className="w-full bg-green-500 hover:bg-green-600 text-white font-black py-3 rounded-xl transition-all"
                                        >
                                            CERRAR ORDEN
                                        </button>
                                    </>
                                )}
                                {wo.status === 'PENDIENTE_MATERIALES' && (
                                    <button
                                        onClick={() => handleStatusChange('EN_PROCESO')}
                                        disabled={updating}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl transition-all"
                                    >
                                        EN PROCESO
                                    </button>
                                )}
                            </div>

                            <textarea
                                placeholder="Agregar una nota al cambiar el estado..."
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                rows="3"
                                value={statusNote}
                                onChange={(e) => setStatusNote(e.target.value)}
                            ></textarea>
                        </div>
                    </section>

                    {/* Tiempos y Personal */}
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 rounded-lg"><User size={20} className="text-slate-600" /></div>
                                <div>
                                    <span className="block text-[10px] uppercase font-black text-slate-400">RESPONSABLE</span>
                                    <span className="font-bold text-slate-800">{wo.technician_id || 'Por asignar'}</span>
                                </div>
                            </div>
                            <hr className="border-slate-100" />
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 rounded-lg"><Calendar size={20} className="text-slate-600" /></div>
                                <div>
                                    <span className="block text-[10px] uppercase font-black text-slate-400">INICIO DE TRABAJO</span>
                                    <span className="font-bold text-slate-800">
                                        {wo.start_date ? `${new Date(wo.start_date).toLocaleDateString()} ${wo.start_time || ''}` : '-'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 rounded-lg"><Clock size={20} className="text-slate-600" /></div>
                                <div>
                                    <span className="block text-[10px] uppercase font-black text-slate-400">TÉRMINO DE TRABAJO</span>
                                    <span className="font-bold text-slate-800">
                                        {wo.end_date ? `${new Date(wo.end_date).toLocaleDateString()} ${wo.end_time || ''}` : '-'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Firmas (Nombres) */}
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">FIRMAS / RESPONSABLES</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col items-center p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <span className="block text-[10px] uppercase font-black text-slate-400 mb-2">TÉCNICO LÍDER</span>
                                {wo.technician_signature && wo.technician_signature.startsWith('data:image') ? (
                                    <img src={wo.technician_signature} alt="Firma Técnico" className="h-20 object-contain" />
                                ) : (
                                    <div className="font-bold text-slate-800 text-lg py-6">
                                        {wo.technician_id ? String(wo.technician_id).split(',')[0] : 'No asignado'}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col items-center p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <span className="block text-[10px] uppercase font-black text-slate-400 mb-2">SUPERVISOR DE PRODUCCIÓN</span>
                                {wo.operator_signature && wo.operator_signature.startsWith('data:image') ? (
                                    <img src={wo.operator_signature} alt="Firma Supervisor" className="h-20 object-contain" />
                                ) : (
                                    <div className="font-bold text-slate-800 text-lg py-6">
                                        {wo.operator_signature || 'No registrado'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default WorkOrderDetails;
