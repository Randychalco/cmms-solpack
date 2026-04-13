import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
    Calendar, Clock, CheckCircle, Package, Users, 
    FileText, Download, Edit, ArrowLeft, Activity,
    Shield, MapPin, HardDrive, Check, Save
} from 'lucide-react';
import SignaturePad from '../components/SignaturePad';

const ACTIVITY_CODES = [
    { code: 'LIM', label: 'Limpieza', color: 'bg-emerald-100 text-emerald-800' },
    { code: 'CAM', label: 'Cambio', color: 'bg-teal-100 text-teal-800' },
    { code: 'RI', label: 'Inspección', color: 'bg-blue-100 text-blue-800' },
    { code: 'RL', label: 'Lubricación', color: 'bg-amber-100 text-amber-800' },
    { code: 'NEU', label: 'Neumático', color: 'bg-sky-100 text-sky-800' },
    { code: 'HID', label: 'Hidráulico', color: 'bg-cyan-100 text-cyan-800' },
    { code: 'MEC', label: 'Mecánico', color: 'bg-slate-50 text-slate-600' },
    { code: 'ELE', label: 'Eléctrico', color: 'bg-yellow-100 text-yellow-800' }
];

const PreventiveExecutionDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Edit states for when order is not completed
    const [taskResults, setTaskResults] = useState([]);
    const [spareResults, setSpareResults] = useState([]);
    const [generalObs, setGeneralObs] = useState('');
    const [techSignature, setTechSignature] = useState(null);
    const [supSignature, setSupSignature] = useState(null);
    const [techName, setTechName] = useState('');
    const [supName, setSupName] = useState('');

    useEffect(() => {
        const loadDetail = async () => {
            try {
                const res = await api.get(`/preventive/executions/${id}`);
                setData(res.data);
                setTaskResults(res.data.task_results || []);
                setSpareResults(res.data.spare_results || []);
                setGeneralObs(res.data.general_observations || '');
                setTechSignature(res.data.technician_signature);
                setSupSignature(res.data.supervisor_signature);
                setTechName(res.data.leader_technician_name || '');
                setSupName(res.data.supervisor_name || '');
                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };
        loadDetail();
    }, [id]);

    const handleSave = async (complete = false) => {
        try {
            setSaving(true);
            console.log('Enviando datos de firma:', { tech: !!techSignature, sup: !!supSignature });
            await api.put(`/preventive/executions/${id}`, {
                task_results: taskResults,
                spare_results: spareResults,
                general_observations: generalObs,
                technician_signature: techSignature,
                supervisor_signature: supSignature,
                leader_technician_name: techName || data.leader_technician_name,
                supervisor_name: supName || data.supervisor_name,
                status: complete ? 'COMPLETADO' : 'EN_PROGRESO'
            });
            alert(complete ? 'Mantenimiento Finalizado con Éxito' : 'Progreso Guardado');
            setSaving(false);
            window.location.reload();
        } catch (err) {
            console.error(err);
            alert('Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const generatePDF = () => {
        try {
            if (!data) return;
            const execution = data;
            const doc = new jsPDF();
            
            const marginX = 14;
            const pdfWidth = doc.internal.pageSize.getWidth();
            const pdfHeight = doc.internal.pageSize.getHeight();

            // Helper to draw the complex table header from the image
            const drawHeader = (pageNum, totalPages) => {
                const headerY = 10;
                const headerHeight = 25;
                const col1Width = 50;
                const col3Width = 45;
                const col2Width = pdfWidth - (marginX * 2) - col1Width - col3Width;

                doc.setDrawColor(0);
                doc.setLineWidth(0.3);

                doc.rect(marginX, headerY, pdfWidth - (marginX * 2), headerHeight);
                doc.line(marginX + col1Width, headerY, marginX + col1Width, headerY + headerHeight);
                doc.line(pdfWidth - marginX - col3Width, headerY, pdfWidth - marginX - col3Width, headerY + headerHeight);

                doc.setTextColor(165, 71, 58);
                doc.setFontSize(22);
                doc.setFont('helvetica', 'bold');
                doc.text('SOLPACK', marginX + (col1Width / 2), headerY + 12, { align: 'center' });
                doc.setTextColor(100, 116, 139);
                doc.setFontSize(7);
                doc.setFont('helvetica', 'normal');
                doc.text('SOLUCIONES DE EMBALAJE', marginX + (col1Width / 2), headerY + 18, { align: 'center' });

                doc.setTextColor(0);
                doc.setFontSize(10);
                doc.text('REGISTRO', marginX + col1Width + (col2Width / 2), headerY + 10, { align: 'center' });
                doc.line(marginX + col1Width, headerY + 14, pdfWidth - marginX - col3Width, headerY + 14);
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.text('REPORTE DE MANTENIMIENTO PREVENTIVO', marginX + col1Width + (col2Width / 2), headerY + 20, { align: 'center' });

                doc.setFontSize(7.5);
                doc.setFont('helvetica', 'normal');
                const metaX = pdfWidth - marginX - col3Width + 2;
                doc.text(`Código: MAN-RE-07`, metaX, headerY + 6);
                doc.text(`Versión: 03`, metaX, headerY + 11);
                doc.text(`Fecha: ${execution.start_date || '01/01/2026'}`, metaX, headerY + 16);
                doc.text(`Página: ${pageNum} de ${totalPages}`, metaX, headerY + 21);
                
                doc.line(pdfWidth - marginX - col3Width, headerY + 7.5, pdfWidth - marginX, headerY + 7.5);
                doc.line(pdfWidth - marginX - col3Width, headerY + 12.5, pdfWidth - marginX, headerY + 12.5);
                doc.line(pdfWidth - marginX - col3Width, headerY + 17.5, pdfWidth - marginX, headerY + 17.5);
            };

            const drawFooter = (pageNum, totalPages) => {
                const footerY = pdfHeight - 30;
                const colWidth = (pdfWidth - (marginX * 2)) / 3;

                doc.setDrawColor(0);
                doc.setLineWidth(0.2);

                doc.rect(marginX, footerY, pdfWidth - (marginX * 2), 12);
                doc.line(marginX + colWidth, footerY, marginX + colWidth, footerY + 12);
                doc.line(marginX + (colWidth * 2), footerY, marginX + (colWidth * 2), footerY + 12);

                doc.setFontSize(7.5);
                doc.setTextColor(0);
                
                doc.setFont('helvetica', 'normal');
                doc.text('Elaborado por:', marginX + 2, footerY + 4);
                doc.text('Supervisor de mantenimiento', marginX + 2, footerY + 9);
                


                doc.text('Revisado por:', marginX + colWidth + 2, footerY + 4);
                doc.text('Sub gerente de mantenimiento', marginX + colWidth + 2, footerY + 9);

                doc.text('Aprobado por:', marginX + (colWidth * 2) + 2, footerY + 4);
                doc.text('Gerente de operaciones', marginX + (colWidth * 2) + 2, footerY + 9);
                


                doc.setFont('helvetica', 'bold');
                doc.setFontSize(7);
                doc.text('Confidencial: Prohibido reproducir total o parcialmente sin autorización del Gerente General', pdfWidth / 2, footerY + 18, { align: 'center' });
                
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(6);
                doc.setTextColor(150);
                doc.text(`Sistema SOLPACK - Pág. ${pageNum} de ${totalPages}`, pdfWidth - marginX, pdfHeight - 5, { align: 'right' });
            };

            let currentY = 42;

            const drawSectionTitle = (title, color = [30, 64, 175]) => {
                doc.setFillColor(248, 250, 252);
                doc.rect(marginX, currentY, pdfWidth - (marginX * 2), 8, 'F');
                doc.setTextColor(color[0], color[1], color[2]);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.text(title, marginX + 3, currentY + 6);
                currentY += 12;
            };

            // 1. INFO GENERAL
            drawSectionTitle('1. INFORMACIÓN DEL EQUIPO Y UBICACIÓN');
            autoTable(doc, {
                startY: currentY,
                body: [
                    ['PLANTA:', execution.Plant?.name || '-', 'FECHA INICIO:', execution.start_date || '-'],
                    ['ÁREA:', execution.Area?.name || '-', 'FECHA TÉRMINO:', execution.end_date || '-'],
                    ['MÁQUINA:', execution.Machine?.name || '-', 'HORA INICIO:', execution.start_time || '-'],
                    ['SUB-MÁQUINA:', execution.SubMachine?.name || '-', 'HORA TÉRMINO:', execution.end_time || '-'],
                    ['CRITICIDAD:', execution.criticality || '-', 'CONDICIÓN:', execution.equipment_condition || '-']
                ],
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 2, lineColor: [226, 232, 240] },
                columnStyles: { 
                    0: { fontStyle: 'bold', fillColor: [241, 245, 249], cellWidth: 35 },
                    2: { fontStyle: 'bold', fillColor: [241, 245, 249], cellWidth: 35 }
                }
            });

            currentY = doc.lastAutoTable.finalY + 10;

            // 2. RESPONSABLES
            drawSectionTitle('2. PERSONAL RESPONSABLE DE LA ORDEN');
            const techList = Array.isArray(execution.responsible_technicians) ? execution.responsible_technicians : [];
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(51, 65, 85);
            if (techList.length > 0) {
                const techs = techList.join(' • ');
                const splitTechs = doc.splitTextToSize(techs, pdfWidth - (marginX * 2) - 10);
                doc.text(splitTechs, marginX + 5, currentY);
                currentY += (splitTechs.length * 5) + 8;
            } else {
                doc.text('No se asignaron técnicos generales.', marginX + 5, currentY);
                currentY += 10;
            }

            // 3. ACTIVIDADES
            const tasks = Array.isArray(execution.task_results) ? execution.task_results : [];
            if (tasks.length > 0) {
                drawSectionTitle('3. CONTROL DE ACTIVIDADES Y TAREAS');
                const taskRows = tasks.map(t => [
                    t.description || t.task_description || '-', 
                    Array.isArray(t.assigned_technicians) ? t.assigned_technicians.join(', ') : '-',
                    t.status || (t.checked ? 'COMPLETADO' : 'PENDIENTE'),
                    t.comment || '-'
                ]);
                autoTable(doc, {
                    startY: currentY,
                    head: [['Actividad / Tarea', 'Responsables', 'Estado', 'Observación']],
                    body: taskRows,
                    theme: 'grid',
                    headStyles: { fillColor: [51, 65, 85], fontSize: 8, halign: 'center' },
                    bodyStyles: { fontSize: 7.5, cellPadding: 3 },
                    columnStyles: { 
                        1: { cellWidth: 35 },
                        2: { cellWidth: 25, halign: 'center' },
                        3: { cellWidth: 40 }
                    }
                });
                currentY = doc.lastAutoTable.finalY + 10;
            }

            // 4. REPUESTOS
            const spares = Array.isArray(execution.spare_results) ? execution.spare_results : [];
            if (spares.length > 0) {
                drawSectionTitle('4. CONSUMO DE MATERIALES Y REPUESTOS');
                const spareRows = spares.map(s => [s.name || '-', s.used_quantity || 0]);
                autoTable(doc, {
                    startY: currentY,
                    head: [['Material / Repuesto', 'Cantidad']],
                    body: spareRows,
                    theme: 'striped',
                    headStyles: { fillColor: [180, 83, 9], fontSize: 8 },
                    bodyStyles: { fontSize: 8 }
                });
                currentY = doc.lastAutoTable.finalY + 10;
            }

            // 5. DESCRIPCIÓN DEL TRABAJO Y OBSERVACIONES
            if (execution.action_performed || execution.general_observations) {
                if (currentY > pdfHeight - 60) { doc.addPage(); currentY = 45; }
                drawSectionTitle('5. DESCRIPCIÓN DEL TRABAJO Y OBSERVACIONES');
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8);
                doc.text('TRABAJO EFECTUADO:', marginX + 2, currentY);
                currentY += 5;
                doc.setFont('helvetica', 'normal');
                const splitAction = doc.splitTextToSize(execution.action_performed || 'Sin detalle técnico.', pdfWidth - (marginX * 2) - 10);
                doc.text(splitAction, marginX + 5, currentY);
                currentY += (splitAction.length * 5) + 8;

                doc.setFont('helvetica', 'bold');
                doc.text('OBSERVACIONES GENERALES:', marginX + 2, currentY);
                currentY += 5;
                doc.setFont('helvetica', 'normal');
                const splitObs = doc.splitTextToSize(execution.general_observations || 'Sin observaciones.', pdfWidth - (marginX * 2) - 10);
                doc.text(splitObs, marginX + 5, currentY);
                currentY += (splitObs.length * 5) + 15;
            }

            // ── 6. FIRMAS ────────────────────────────────────────────────────────
            if (currentY > pdfHeight - 40) {
                doc.addPage();
                currentY = 40;
            } else {
                currentY += 20; // Extra room for signatures
            }

            doc.setDrawColor(150, 150, 150);
            doc.setLineWidth(0.3);

            const activeTechSig = techSignature || execution.technician_signature;
            const activeSupSig = supSignature || execution.supervisor_signature;

            // Left signature (Technical)
            if (activeTechSig && activeTechSig.startsWith('data:image')) {
                doc.addImage(activeTechSig, 'PNG', marginX + 25, currentY - 25, 50, 25);
            }
            doc.line(marginX + 20, currentY, marginX + 80, currentY);
            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(60, 60, 60);
            doc.text("TÉCNICO LÍDER", marginX + 50, currentY + 5, { align: 'center' });
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            const activeTechName = techName || execution.leader_technician_name || (Array.isArray(execution.responsible_technicians) && execution.responsible_technicians.length > 0 ? execution.responsible_technicians[0] : 'No asignado');
            doc.text(activeTechName, marginX + 50, currentY + 10, { align: 'center' });

            // Right signature (Supervisor)
            if (activeSupSig && activeSupSig.startsWith('data:image')) {
                doc.addImage(activeSupSig, 'PNG', pdfWidth - marginX - 75, currentY - 25, 50, 25);
            }
            doc.line(pdfWidth - marginX - 80, currentY, pdfWidth - marginX - 20, currentY);
            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(60, 60, 60);
            doc.text("SUPERVISOR / ENCARGADO", pdfWidth - marginX - 50, currentY + 5, { align: 'center' });
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            
            const activeSupName = supName || execution.supervisor_name || 'No registrado';
            doc.text(activeSupName, pdfWidth - marginX - 50, currentY + 10, { align: 'center' });

            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                drawHeader(i, pageCount);
                drawFooter(i, pageCount);
            }

            doc.save(`SOLPACK_PREVENTIVO_${execution.id}_${execution.Machine?.name || 'EQUIPO'}.pdf`);
        } catch (err) {
            console.error(err);
            alert('Error al generar PDF: ' + err.message);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 font-bold animate-pulse">Cargando expediente técnico...</p>
            </div>
        </div>
    );

    if (!data) return <div className="p-8 text-center text-red-500 font-bold">Error: Orden no encontrada</div>;

    const isCompleted = data.status === 'COMPLETADO';

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20">
            {/* Header / Navigation */}
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 py-4 flex justify-between items-center shadow-sm backdrop-blur-md bg-white/80">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${
                                data.status === 'COMPLETADO' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-blue-100 text-blue-700 border border-blue-200'
                            }`}>
                                {data.status?.replace('_', ' ')}
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{data.Machine?.name} • {data.Area?.name}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={generatePDF} className="flex items-center gap-2 bg-slate-100 text-slate-600 px-5 py-2.5 rounded-2xl font-black text-xs hover:bg-slate-200 transition-all active:scale-95">
                        <Download size={16} /> EXPORTAR PDF
                    </button>
                    {!isCompleted && (
                        <>
                            <button 
                                onClick={() => handleSave(true)} 
                                disabled={saving}
                                className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-2xl font-black text-xs shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <CheckCircle size={16} />}
                                FINALIZAR MANTENIMIENTO
                            </button>
                            <button onClick={() => navigate(`/preventive/execution/${data.id}/edit`)} className="flex items-center gap-2 bg-white text-slate-900 border-2 border-slate-100 px-5 py-2.5 rounded-2xl font-black text-xs hover:bg-slate-50 transition-all active:scale-95">
                                <Edit size={16} /> EDITAR
                            </button>
                        </>
                    )}
                    {isCompleted && (
                        <button onClick={() => navigate(`/preventive/execution/${data.id}/edit`)} className="flex items-center gap-2 bg-white text-slate-900 border-2 border-slate-100 px-5 py-2.5 rounded-2xl font-black text-xs hover:bg-slate-50 transition-all active:scale-95">
                            <Edit size={16} /> REVISAR / EDITAR
                        </button>
                    )}
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* COLUMNA IZQUIERDA: INFORMACIÓN Y TÉCNICOS */}
                    <div className="lg:col-span-1 space-y-8">
                        {/* 1. INFORMACIÓN GENERAL */}
                        <section className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
                            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                                <MapPin className="text-blue-600" size={24} /> 1. Ubicación
                            </h3>
                            <div className="space-y-4">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">UNIDAD / PLANTA</p>
                                    <p className="font-bold text-slate-700">{data.Plant?.name}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ÁREA DE PRODUCCIÓN</p>
                                    <p className="font-bold text-slate-700">{data.Area?.name}</p>
                                </div>
                                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">EQUIPO TÉCNICO</p>
                                    <p className="font-bold text-blue-900 text-lg">{data.Machine?.name}</p>
                                    {data.SubMachine && (
                                        <p className="text-sm font-bold text-blue-600/70 mt-1 italic">Sub-Equipo: {data.SubMachine.name}</p>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* 2. PERSONAL RESPONSABLE */}
                        <section className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
                            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                                <Users className="text-indigo-600" size={24} /> 2. Responsables
                            </h3>
                            <div className="space-y-6">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">TÉCNICOS ASIGNADOS</p>
                                    <div className="flex flex-wrap gap-2">
                                        {data.responsible_technicians?.map((t, i) => (
                                            <span key={i} className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-xs font-bold border border-indigo-100">
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">LÍDER</p>
                                        <p className="text-sm font-bold text-slate-700">{data.leader_technician_name}</p>
                                    </div>
                                    <div className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">SUPERVISOR</p>
                                        <p className="text-sm font-bold text-slate-700">{data.supervisor_name}</p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* COLUMNA DERECHA: RESULTADOS Y TRABAJO */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* 3. PLANIFICACIÓN DE ACTIVIDADES */}
                        <section className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
                            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                                <CheckCircle className="text-violet-600" size={24} /> 3. Planificación de Actividades
                            </h3>
                            {data.task_results?.length > 0 ? (
                                <div className="space-y-3">
                                    {data.task_results.map((task, idx) => (
                                        <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold text-slate-700">{task.description || task.task_description}</span>
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                    task.status === 'Observado' ? 'bg-amber-100 text-amber-700' :
                                                    task.status === 'Finalizado' || task.status === 'Hecho' ? 'bg-emerald-100 text-emerald-700' :
                                                    'bg-slate-200 text-slate-600'
                                                }`}>
                                                    {task.status || (task.checked ? 'Hecho' : 'Pendiente')}
                                                </span>
                                            </div>

                                            {/* RESPONSABLES POR ACTIVIDAD */}
                                            {task.assigned_technicians?.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 pt-1">
                                                    {task.assigned_technicians.map((tech, i) => (
                                                        <span key={i} className="text-[9px] font-black bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md uppercase border border-indigo-200 shadow-sm">
                                                            {tech}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {task.status === 'Observado' && task.comment && (
                                                <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-100 italic">
                                                    <span className="font-bold text-amber-500 not-italic mr-1">Obs:</span>
                                                    {task.comment}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                    <p className="text-slate-400 font-bold italic">No hay planificación específica registrada</p>
                                </div>
                            )}
                        </section>

                        {/* 4. REPUESTOS Y MATERIALES */}
                        <section className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
                            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                                <Package className="text-amber-600" size={24} /> 4. Recambios y Materiales
                            </h3>
                            {data.spare_results?.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {data.spare_results.map((spare, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-5 bg-amber-50/50 border border-amber-100 rounded-2xl transition-all hover:bg-amber-100/50">
                                            <span className="font-bold text-amber-900">{spare.name}</span>
                                            <span className="bg-amber-600 text-white px-3 py-1 rounded-full text-xs font-black">
                                                {spare.used_quantity} UND
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                    <p className="text-slate-400 font-bold italic">No se registraron cambios de repuestos en esta rutina</p>
                                </div>
                            )}
                        </section>

                        {/* FIRMAS */}
                        <section className="bg-slate-900 rounded-3xl p-8 shadow-2xl text-white relative overflow-hidden group">
                           <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
                           
                           <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                            <div className="flex flex-col items-center p-8 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">FIRMA TÉCNICO LÍDER</p>
                                {(techSignature || data.technician_signature) ? (
                                    <div className="flex flex-col items-center gap-2 w-full">
                                        <img src={techSignature || data.technician_signature} alt="Firma Técnico" className="h-28 object-contain filter grayscale hover:grayscale-0 transition-all duration-500" />
                                        <button type="button" onClick={() => setTechSignature('')} className="text-red-400 text-[10px] font-bold uppercase tracking-widest hover:text-red-600 transition">
                                            ✕ Borrar y firmar de nuevo
                                        </button>
                                    </div>
                                ) : (
                                    <SignaturePad 
                                        value={techSignature} 
                                        onChange={setTechSignature}
                                        label="" 
                                    />
                                )}
                                <div className="mt-6 pt-4 border-t border-slate-100 w-full">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center">Nombre del Técnico</label>
                                    <input 
                                        type="text" 
                                        placeholder="Escribe el nombre completo..."
                                        className="w-full text-center bg-slate-50 border border-slate-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 rounded-lg py-2 px-2 text-sm font-bold text-slate-800 outline-none transition-all"
                                        value={techName}
                                        onChange={(e) => setTechName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col items-center p-8 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">FIRMA SUPERVISOR</p>
                                {(supSignature || data.supervisor_signature) ? (
                                    <div className="flex flex-col items-center gap-2 w-full">
                                        <img src={supSignature || data.supervisor_signature} alt="Firma Supervisor" className="h-28 object-contain filter grayscale hover:grayscale-0 transition-all duration-500" />
                                        <button type="button" onClick={() => setSupSignature('')} className="text-red-400 text-[10px] font-bold uppercase tracking-widest hover:text-red-600 transition">
                                            ✕ Borrar y firmar de nuevo
                                        </button>
                                    </div>
                                ) : (
                                    <SignaturePad 
                                        value={supSignature} 
                                        onChange={setSupSignature}
                                        label="" 
                                    />
                                )}
                                <div className="mt-6 pt-4 border-t border-slate-100 w-full">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center">Nombre del Supervisor</label>
                                    <input 
                                        type="text" 
                                        placeholder="Escribe el nombre completo..."
                                        className="w-full text-center bg-slate-50 border border-slate-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 rounded-lg py-2 px-2 text-sm font-bold text-slate-800 outline-none transition-all"
                                        value={supName}
                                        onChange={(e) => setSupName(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Save signatures + names button */}
                            <div className="md:col-span-2 flex justify-center mt-2">
                                <button 
                                    onClick={() => handleSave(false)} 
                                    disabled={saving}
                                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 py-3 rounded-2xl shadow-lg shadow-indigo-200 transition-all disabled:opacity-50"
                                >
                                    <Save size={18} />
                                    {saving ? 'Guardando...' : 'Guardar Firmas y Nombres'}
                                </button>
                            </div>
                        </section>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PreventiveExecutionDetails;
