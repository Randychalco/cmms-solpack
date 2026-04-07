import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Save, CheckSquare, Package, ArrowLeft, Activity, FileText, FileSpreadsheet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ACTIVITY_CODES = [
    { code: 'MEC', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { code: 'ELE', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    { code: 'LUB', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    { code: 'NEU', color: 'bg-sky-100 text-sky-800 border-sky-200' },
    { code: 'HID', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    { code: 'EST', color: 'bg-slate-100 text-slate-800 border-slate-200' },
    { code: 'LIM', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
];

const PreventiveExecutionDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [execution, setExecution] = useState(null);
    const [taskResults, setTaskResults] = useState([]);
    const [spareResults, setSpareResults] = useState([]);
    const [generalObs, setGeneralObs] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchExecution = async () => {
            try {
                const { data } = await api.get(`/preventive/executions/${id}`);
                setExecution(data);
                setTaskResults(data.task_results || []);
                setSpareResults(data.spare_results || []);
                setGeneralObs(data.general_observations || '');
                setLoading(false);
            } catch (error) {
                console.error(error);
                alert('No se pudo cargar la ejecución');
                navigate('/preventive-plans');
            }
        };
        fetchExecution();
    }, [id, navigate]);

    const generatePDF = () => {
        try {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const marginX = 10;
            const marginTop = 35;

            // ── Helper: draw header ──────────────────────────────────────────
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
                pdf.text('ORDEN DE MANTENIMIENTO PREVENTIVO', 105, 26, { align: 'center' });

                // Box 3: Meta
                pdf.rect(150, 10, 50, 20);
                pdf.setFontSize(8);
                pdf.setFont("helvetica", "normal");
                pdf.setTextColor(0);
                pdf.text('Código: MAN-RE-08', 152, 14);
                pdf.text('Versión: 01', 152, 19);
                pdf.text('Fecha: 01/01/2026', 152, 24);
            };

            const drawFooter = (pageNum, totalPages) => {
                const fY = pdfHeight - 20;
                pdf.setDrawColor(0);
                pdf.setLineWidth(0.3);
                pdf.rect(marginX, fY, pdfWidth - 2 * marginX, 12);
                pdf.line(marginX + 60, fY, marginX + 60, fY + 12);
                pdf.line(marginX + 130, fY, marginX + 130, fY + 12);
                pdf.setFontSize(8);
                pdf.setFont("helvetica", "normal");
                pdf.setTextColor(0);
                pdf.text('Elaborado por:', marginX + 2, fY + 4);
                pdf.text('Supervisor de mantenimiento', marginX + 2, fY + 9);
                pdf.text('Revisado por:', marginX + 62, fY + 4);
                pdf.text('Sub gerente de mantenimiento', marginX + 62, fY + 9);
                pdf.text('Aprobado por:', marginX + 132, fY + 4);
                pdf.text('Gerente de operaciones', marginX + 132, fY + 9);
                pdf.setFont("helvetica", "bold");
                pdf.text('Confidencial: Prohibido reproducir total o parcialmente sin autorización del Gerente General', pdfWidth / 2, fY + 17, { align: 'center' });
            };

            drawHeader();
            let curY = marginTop;

            const drawSectionTitle = (title) => {
                if (curY > pdfHeight - 50) {
                    pdf.addPage();
                    drawHeader();
                    curY = marginTop + 4;
                }
                pdf.setFontSize(9);
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(30, 30, 46);
                pdf.text(title.toUpperCase(), marginX, curY);
                curY += 5;
            };

            // ── 0. INFORMACIÓN GENERAL ───────────────────────────────────────
            drawSectionTitle('INFORMACIÓN GENERAL DEL EQUIPO Y LA ORDEN');
            const metaRows = [
                [{ content: 'PLANTA:', fontStyle: 'bold' }, execution.Plant?.name || '-', { content: 'ÁREA:', fontStyle: 'bold' }, execution.Area?.name || '-'],
                [{ content: 'EQUIPO(S):', fontStyle: 'bold' }, execution.PreventivePlan?.Machine?.name || (execution.machine_ids?.length > 0 ? 'Múltiples Equipos' : 'Equipo General'), { content: 'PLAN:', fontStyle: 'bold' }, execution.PreventivePlan?.name || 'Manual'],
                [{ content: 'CONDICIÓN:', fontStyle: 'bold' }, execution.equipment_condition || '-', { content: 'CRITICIDAD:', fontStyle: 'bold' }, execution.criticality || '-']
            ];
            autoTable(pdf, {
                body: metaRows,
                startY: curY,
                margin: { left: marginX, right: marginX },
                styles: { fontSize: 8, cellPadding: 2, textColor: [40, 40, 60] },
                theme: 'plain',
                columnStyles: { 0: { cellWidth: 25 }, 1: { cellWidth: 65 }, 2: { cellWidth: 25 }, 3: { cellWidth: 'auto' } }
            });
            curY = pdf.lastAutoTable.finalY + 6;

            // ── 0.1 TIEMPOS Y RESPONSABLES ────────────────────────────────────
            drawSectionTitle('TIEMPOS Y RESPONSABLES');
            autoTable(pdf, {
                body: [
                    [{ content: 'FECHA INICIO:', fontStyle: 'bold' }, `${execution.start_date ? new Date(execution.start_date).toLocaleDateString('es-PE') : '-'} ${execution.start_time || ''}`, { content: 'FECHA FIN:', fontStyle: 'bold' }, `${execution.end_date ? new Date(execution.end_date).toLocaleDateString('es-PE') : '-'} ${execution.end_time || ''}`],
                    [{ content: 'TÉCNICO LÍDER:', fontStyle: 'bold' }, execution.leader_technician_name || '-', { content: 'SUPERVISOR:', fontStyle: 'bold' }, execution.supervisor_name || '-'],
                    [{ content: 'EQUIPO TÉCNICO:', fontStyle: 'bold' }, execution.responsible_technicians?.join(', ') || 'No registrado', '', '']
                ],
                startY: curY,
                margin: { left: marginX, right: marginX },
                styles: { fontSize: 8, cellPadding: 2, textColor: [40, 40, 60] },
                theme: 'plain',
                columnStyles: { 0: { cellWidth: 25 }, 1: { cellWidth: 65 }, 2: { cellWidth: 25 }, 3: { cellWidth: 'auto' } }
            });
            curY = pdf.lastAutoTable.finalY + 8;

            // ── 1. TAREAS DE RUTINA ──────────────────────────────────────────
            drawSectionTitle('TAREAS DE RUTINA / ACTIVIDADES REALIZADAS');
            const tasksData = (taskResults || []).map(task => {
                return [
                    task.task_code || 'MEC',
                    task.task_description,
                    task.checked ? 'COMPLETADO' : 'PENDIENTE'
                ];
            });

            autoTable(pdf, {
                head: [['CÓDIGO', 'ACCIÓN / DESCRIPCIÓN DE LA TAREA', 'RESULTADO']],
                body: tasksData,
                startY: curY,
                margin: { left: marginX, right: marginX },
                styles: { fontSize: 8, cellPadding: 2.5 },
                headStyles: { fillColor: [30, 30, 46], textColor: [240, 240, 240] },
                columnStyles: { 0: { cellWidth: 20 }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 30, halign: 'center' } }
            });
            curY = pdf.lastAutoTable.finalY + 8;

            // ── 2. REPUESTOS UTILIZADOS ───────────────────────────────────────
            const hasSpares = execution.spare_results && execution.spare_results.length > 0;
            if (hasSpares) {
                drawSectionTitle('REPUESTOS Y MATERIALES UTILIZADOS');
                const sparesData = (spareResults || []).map(sp => {
                    return [
                        sp.name || 'Repuesto',
                        sp.expected_quantity || 0,
                        sp.used_quantity || 0,
                        'UN.'
                    ];
                });

                autoTable(pdf, {
                    head: [['DESCRIPCIÓN REPUESTO', 'CANT. PREVISTA', 'CANT. USADA', 'UNIDAD']],
                    body: sparesData,
                    startY: curY,
                    margin: { left: marginX, right: marginX },
                    styles: { fontSize: 8, cellPadding: 2.5 },
                    headStyles: { fillColor: [245, 158, 11], textColor: [255, 255, 255] },
                    columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 30, halign: 'center' }, 2: { cellWidth: 30, halign: 'center' }, 3: { cellWidth: 20, halign: 'center' } }
                });
                curY = pdf.lastAutoTable.finalY + 8;
            }

            // ── 2.5 ACCIÓN REALIZADA ──────────────────────────────────────────
            if (execution.action_performed) {
                drawSectionTitle('TRABAJO TÉCNICO EFECTUADO');
                autoTable(pdf, {
                    body: [[execution.action_performed]],
                    startY: curY,
                    margin: { left: marginX, right: marginX },
                    styles: { fontSize: 8, cellPadding: 2.5 },
                    theme: 'plain'
                });
                curY = pdf.lastAutoTable.finalY + 6;
            }

            // ── 3. OBSERVACIONES ───────────────────────────────────────────────
            drawSectionTitle('OBSERVACIONES GENERALES');
            autoTable(pdf, {
                body: [[generalObs || 'Sin novedades adicionales durante el mantenimiento.']],
                startY: curY,
                margin: { left: marginX, right: marginX },
                styles: { fontSize: 8, cellPadding: 2.5, fontStyle: 'italic' },
                theme: 'plain'
            });
            curY = pdf.lastAutoTable.finalY + 20;

            // ── 4. FIRMAS ──────────────────────────────────────────────────────
            if (curY > pdfHeight - 40) {
                pdf.addPage();
                drawHeader();
                curY = marginTop + 20;
            }

            pdf.setDrawColor(150, 150, 150);
            pdf.setLineWidth(0.3);
            
            // Left signature (Technical)
            pdf.line(marginX + 20, curY, marginX + 80, curY);
            pdf.setFontSize(8);
            pdf.setFont("helvetica", "bold");
            pdf.text("TÉCNICO LÍDER", marginX + 50, curY + 5, { align: 'center' });
            pdf.setFont("helvetica", "normal");
            pdf.text(execution.leader_technician_name || 'Nombre:', marginX + 50, curY + 10, { align: 'center' });

            // Right signature (Supervisor)
            pdf.line(pdfWidth - marginX - 80, curY, pdfWidth - marginX - 20, curY);
            pdf.text("SUPERVISOR DE PRODUCCIÓN", pdfWidth - marginX - 50, curY + 5, { align: 'center' });
            pdf.text(execution.supervisor_name || 'Nombre:', pdfWidth - marginX - 50, curY + 10, { align: 'center' });

            // Finalize PDF
            const totalPages = pdf.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                pdf.setPage(i);
                pdf.setFontSize(8);
                pdf.text(`Página: ${i} de ${totalPages}`, 152, 29);
                drawFooter(i, totalPages);
            }

            pdf.save(`MP_PV-${execution.id}.pdf`);
        } catch (error) {
            console.error('Error al exportar PDF:', error);
            alert('Error al generar PDF: ' + error.message);
        }
    };

    const handleExportExcel = async () => {
        try {
            const response = await api.get(`/export/preventive-order/${id}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `orden_preventiva_${id}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error al exportar a Excel:', error);
            alert('No se pudo generar el archivo Excel');
        }
    };

    const handleSave = async (complete = false) => {
        try {
            setSaving(true);
            const status = complete ? 'COMPLETADO' : 'EN_PROGRESO';
            await api.put(`/preventive/executions/${id}`, {
                status,
                task_results: taskResults,
                spare_results: spareResults,
                general_observations: generalObs
            });
            alert(complete ? 'Orden Preventiva completada' : 'Progreso guardado');
            if (complete) navigate('/preventive-plans');
        } catch (error) {
            console.error(error);
            alert('Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const toggleTask = (taskId) => {
        if(execution.status === 'COMPLETADO') return;
        setTaskResults(prev => prev.map(t => 
            t.task_id === taskId ? { ...t, checked: !t.checked } : t
        ));
    };

    const updateSpareUsed = (spareId, val) => {
        if(execution.status === 'COMPLETADO') return;
        setSpareResults(prev => prev.map(s => 
            s.spare_id === spareId ? { ...s, used_quantity: parseInt(val) || 0 } : s
        ));
    };

    if (loading) return <div className="p-4">Cargando...</div>;

    const planTasks = execution?.PreventivePlan?.tasks || [];
    const planSpares = execution?.PreventivePlan?.spares || [];
    const isCompleted = execution.status === 'COMPLETADO';

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <button onClick={() => navigate('/preventive-plans')} className="text-blue-600 flex items-center mb-4"><ArrowLeft size={16} className="mr-1"/> Volver</button>
            
            <div className="bg-white rounded-lg shadow p-6 border-t-4 border-blue-600">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{execution.PreventivePlan?.name}</h1>
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest border ${isCompleted ? 'bg-green-100 text-green-800 border-green-200' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>
                                {execution.status}
                            </div>
                        </div>
                        <p className="text-slate-500 mt-1 font-medium flex items-center gap-2">
                            <Activity size={14}/> Máquina: {execution.PreventivePlan?.Machine?.name || 'Múltiples / General'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button
                            onClick={handleExportExcel}
                            className="flex-1 md:flex-none bg-white border border-slate-200 text-emerald-700 px-4 py-2.5 rounded-xl font-bold shadow-sm hover:bg-slate-50 flex items-center justify-center gap-2 transition-all"
                        >
                            <FileSpreadsheet size={18} /> <span className="hidden sm:inline">Excel</span>
                        </button>
                        <button
                            onClick={generatePDF}
                            className="flex-1 md:flex-none bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold shadow-sm hover:bg-slate-50 flex items-center justify-center gap-2 transition-all"
                        >
                            <FileText size={18} /> <span className="hidden sm:inline">PDF</span>
                        </button>
                        <button
                            onClick={() => navigate(`/preventive/execution/${id}/edit`)}
                            className="flex-1 md:flex-none bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg hover:bg-slate-800 flex items-center justify-center gap-2 transition-all"
                        >
                            <Save size={18} /> Editar
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Tasks Checklist */}
                    <div>
                        <h3 className="font-bold flex items-center gap-2 mb-4 border-b pb-2 text-slate-700">
                            <CheckSquare className="text-blue-500" /> Tareas de Rutina
                        </h3>
                        <div className="space-y-3">
                            {planTasks.map(task => {
                                const tr = taskResults.find(t => t.task_id === task.id) || {};
                                const codeConfig = ACTIVITY_CODES.find(c => c.code === (task.task_code || 'MEC')) || ACTIVITY_CODES[0];
                                return (
                                    <div key={task.id} className="flex items-start p-3 bg-white border shadow-sm rounded hover:bg-slate-50 cursor-pointer" onClick={() => toggleTask(task.id)}>
                                        <input type="checkbox" className="w-5 h-5 mr-3 mt-0.5 cursor-pointer" checked={tr.checked || false} readOnly />
                                        <div className="flex-1 flex gap-2 items-start">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold border ${codeConfig.color} mt-0.5 whitespace-nowrap`}>
                                                {task.task_code || 'MEC'}
                                            </span>
                                            <span className={`${tr.checked ? "line-through text-slate-400" : "font-medium text-slate-800"} leading-tight`}>{task.task_description}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Spares Allocation */}
                    <div>
                        <h3 className="font-bold flex items-center gap-2 mb-4 border-b pb-2 text-slate-700">
                            <Package className="text-amber-500" /> Repuestos Proyectados
                        </h3>
                        <div className="space-y-3">
                            {planSpares.map(sp => {
                                const sr = spareResults.find(s => s.spare_id === sp.id) || {};
                                return (
                                    <div key={sp.id} className="bg-amber-50 border border-amber-200 p-3 rounded text-sm flex flex-col gap-2">
                                        <div className="font-medium text-slate-800">{sp.name || 'Repuesto'}</div>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-xs text-slate-500">Requerido: {sp.expected_quantity} und.</span>
                                            <div className="flex items-center gap-2">
                                                <label className="text-xs font-bold text-amber-800">CANT. USADA:</label>
                                                <input 
                                                    type="number" 
                                                    min="0"
                                                    value={sr.used_quantity || 0}
                                                    onChange={e => updateSpareUsed(sp.id, e.target.value)}
                                                    className="w-16 p-1 border rounded text-center font-bold"
                                                    disabled={isCompleted}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    <h3 className="font-bold mb-2">Observaciones Generales</h3>
                    <textarea 
                        className="w-full border p-3 rounded focus:ring-2 focus:ring-blue-500"
                        rows="3"
                        disabled={isCompleted}
                        value={generalObs}
                        onChange={e => setGeneralObs(e.target.value)}
                        placeholder="Novedades durante el mantenimiento preventivo..."
                    />
                </div>

                {!isCompleted && (
                    <div className="mt-6 flex justify-end gap-4 border-t pt-4">
                        <button 
                            onClick={() => handleSave(false)} 
                            disabled={saving}
                            className="px-6 py-2 border rounded hover:bg-slate-50 font-medium"
                        >
                            Guardar Progreso
                        </button>
                        <button 
                            onClick={() => handleSave(true)}
                            disabled={saving}
                            className="bg-emerald-600 text-white px-6 py-2 rounded hover:bg-emerald-700 font-bold flex items-center gap-2"
                        >
                            <Save size={18} /> Finalizar Mantenimiento
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PreventiveExecutionDetails;
