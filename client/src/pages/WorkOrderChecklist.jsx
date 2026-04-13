import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import { ArrowLeft, Save, AlertTriangle, Download, FileText, FileSpreadsheet } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { useAuth } from '../context/AuthContext';
import SignaturePad from '../components/SignaturePad';

const getOptionColors = (opt) => {
    const normalized = opt?.toUpperCase() || '';
    if (normalized === 'OK' || normalized === 'BUENO' || normalized === 'COMPLETO') {
        return { header: 'bg-emerald-50 text-emerald-700', cell: 'bg-emerald-50/50', dot: 'bg-emerald-500 border-emerald-600' };
    }
    if (normalized === 'FALLA' || normalized === 'NO OK' || normalized === 'MALO' || normalized === 'OBSERVADO' || normalized.includes('FALTA')) {
        return { header: 'bg-red-50 text-red-700', cell: 'bg-red-50/50', dot: 'bg-red-500 border-red-600' };
    }
    if (normalized === 'N/A' || normalized === 'NO APLICA') {
        return { header: 'bg-slate-50 text-slate-400', cell: 'bg-slate-50/20', dot: 'bg-slate-300 border-slate-400' };
    }
    return { header: 'bg-slate-50 text-slate-600', cell: 'bg-slate-50/30', dot: 'bg-slate-400 border-slate-500' };
};

const WorkOrderChecklist = () => {
    const { id, templateId, executionId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [wo, setWo] = useState(null);
    const [template, setTemplate] = useState(null);
    const [execution, setExecution] = useState(null);
    const [results, setResults] = useState({});
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);

    // Signature State
    const [techSig, setTechSig] = useState('');
    const [supSig, setSupSig] = useState('');
    const [techName, setTechName] = useState('');
    const [supName, setSupName] = useState('');

    useEffect(() => {
        loadData();
    }, [id, templateId, executionId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const { data: templates } = await api.get('/checklists/templates');
            let targetTemplate = null;

            if (executionId) {
                const { data: existingExecution } = await api.get(`/checklists/execution/${executionId}`);
                if (existingExecution) {
                    setExecution(existingExecution);
                    setResults(typeof existingExecution.results === 'string'
                        ? JSON.parse(existingExecution.results)
                        : existingExecution.results || {});
                    
                    setTechSig(existingExecution.technician_signature || '');
                    setSupSig(existingExecution.supervisor_signature || '');
                    setTechName(existingExecution.technician_name || '');
                    setSupName(existingExecution.supervisor_name || '');

                    if (existingExecution.wo_id) {
                        const { data: woData } = await api.get(`/work-orders/${existingExecution.wo_id}`);
                        setWo(woData);
                    }
                    targetTemplate = templates.find(t => t.id === existingExecution.template_id);
                }
            } else if (templateId) {
                targetTemplate = templates.find(t => t.id === parseInt(templateId));
            } else if (id) {
                const { data: woData } = await api.get(`/work-orders/${id}`);
                setWo(woData);
                targetTemplate = templates.find(t => t.layout === 'sml2_matrix') || templates[0];
            }

            if (targetTemplate) {
                let parsedItems = typeof targetTemplate.items === 'string'
                    ? JSON.parse(targetTemplate.items)
                    : targetTemplate.items;

                setTemplate({ ...targetTemplate, items: parsedItems });

                if (id && !executionId) {
                    const { data: existingExecution } = await api.get(`/checklists/execution/wo/${id}`);
                    if (existingExecution) {
                        setExecution(existingExecution);
                        setResults(typeof existingExecution.results === 'string'
                            ? JSON.parse(existingExecution.results)
                            : existingExecution.results || {});
                        
                        setTechSig(existingExecution.technician_signature || '');
                        setSupSig(existingExecution.supervisor_signature || '');
                        setTechName(existingExecution.technician_name || '');
                        setSupName(existingExecution.supervisor_name || '');
                    }
                }
            }

            setLoading(false);
        } catch (error) {
            console.error('Error loading checklist data:', error);
            setLoading(false);
        }
    };

    const handleResultChange = (itemId, columnId, value) => {
        setResults(prev => {
            const newRes = { ...prev };
            const key = columnId ? `${itemId}_${columnId}` : itemId;
            newRes[key] = value;
            return newRes;
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            let observationCount = 0;
            let isImmediateCritical = false;

            Object.entries(results).forEach(([key, val]) => {
                if (val === 'Requiere cambio' || val === 'Exceso de temperatura') {
                    isImmediateCritical = true;
                }
                
                if (val === 'Falta lubricación' || val === 'Falta limpieza' || val === 'OBSERVADO') {
                    observationCount++;
                }

                if (key.endsWith('_obs')) {
                    if (val === 'X' || val === true || val === 'true') {
                        observationCount++;
                    } else if (typeof val === 'string' && val.trim() !== '') {
                        observationCount++;
                    }
                }
            });

            let overallStatus = 'OK';
            if (isImmediateCritical || observationCount > 3) {
                overallStatus = 'CRITICO';
            } else if (observationCount > 0) {
                overallStatus = 'CON_OBSERVACION';
            }

            const payload = {
                id: execution?.id,
                wo_id: wo?.id || null,
                template_id: template.id,
                results: results,
                overall_status: overallStatus,
                observation: Object.keys(results).length === 0 ? 'Sin datos' : 'Checklist llenado',
                technician_signature: techSig,
                supervisor_signature: supSig,
                technician_name: techName,
                supervisor_name: supName
            };
            await api.post('/checklists/execution', payload);
            alert('Checklist guardado con éxito');

            if (templateId) {
                navigate('/checklists');
            } else {
                navigate(`/work-orders/${id}`);
            }
        } catch (e) {
            console.error(e);
            alert('Error al guardar checklist');
            setSaving(false);
        }
    };

    const exportToPDF = async () => {
        setExporting(true);
        setShowExportMenu(false);
        try {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const marginX = 10;
            const marginTop = 35;
            const marginBottom = 25;

            const drawHeader = () => {
                pdf.setDrawColor(0);
                pdf.setLineWidth(0.3);
                pdf.rect(10, 10, 50, 20);
                pdf.setFontSize(22);
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(205, 50, 40); 
                pdf.text('SOLPACK', 14, 20);
                pdf.setFontSize(7.5);
                pdf.setTextColor(120, 120, 120);
                pdf.text('SOLUCIONES DE EMBALAJE', 14, 25);
                pdf.rect(60, 10, 90, 20);
                pdf.setFontSize(10);
                pdf.setTextColor(0);
                pdf.setFont('helvetica', 'normal');
                pdf.text('REGISTRO', 105, 16, { align: 'center' });
                pdf.line(60, 19, 150, 19);
                pdf.setFontSize(11);
                pdf.setFont("helvetica", "bold");
                pdf.text('CHECKLIST', 105, 26, { align: 'center' });
                pdf.rect(150, 10, 50, 20);
                pdf.setFontSize(8);
                pdf.setFont("helvetica", "normal");
                pdf.setTextColor(0);
                pdf.text('Código: MAN-RE-07', 152, 14);
                pdf.text('Versión: 03', 152, 19);
                pdf.text('Fecha: 1/01/2026', 152, 24);
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
                pdf.setFontSize(8);
                pdf.setFont("helvetica", "bold");
                pdf.text('Confidencial: Prohibido reproducir total o parcialmente sin autorización del Gerente General', pdfWidth / 2, fY + 17, { align: 'center' });
            };

            const addTable = (head, body, columnStyles, startY) => {
                autoTable(pdf, {
                    head,
                    body,
                    startY,
                    margin: { left: marginX, right: marginX, top: marginTop, bottom: marginBottom },
                    styles: {
                        fontSize: 8,
                        cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
                        overflow: 'linebreak',
                        valign: 'middle',
                        lineColor: [220, 220, 220],
                        lineWidth: 0.3,
                        textColor: [30, 30, 30],
                    },
                    headStyles: {
                        fillColor: [30, 30, 46],
                        textColor: [240, 240, 240],
                        fontStyle: 'bold',
                        fontSize: 7.5,
                        halign: 'center',
                    },
                    alternateRowStyles: {
                        fillColor: [248, 249, 252],
                    },
                    columnStyles,
                    didDrawPage: (data) => {
                        drawHeader();
                    },
                    showFoot: 'never',
                });
                return pdf.lastAutoTable.finalY;
            };

            drawHeader();
            let curY = marginTop;

            pdf.setFillColor(30, 30, 46);
            pdf.roundedRect(marginX, curY, pdfWidth - marginX * 2, 14, 2, 2, 'F');
            pdf.setFontSize(11);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(255, 255, 255);
            const templateTitle = template?.name || 'RUTINA DE INSPECCIÓN';
            pdf.text(templateTitle.toUpperCase(), pdfWidth / 2, curY + 9, { align: 'center' });
            curY += 17;

            const headerUserName = execution?.executed_by_name || user?.name || 'No asignado';
            
            if (wo) {
                const metaRows = [
                    [`OT: ${wo.ticket_number || '-'}`, `Usuario: ${headerUserName}`, `Fecha: ${wo.start_date ? new Date(wo.start_date).toLocaleDateString('es-PE') : '-'}`],
                    [`Equipo: ${wo.machine_name || wo.Machine?.name || '-'}`, `Área: ${wo.area_name || wo.Area?.name || '-'}`, `Estado: ${wo.status || '-'}`],
                ];
                autoTable(pdf, {
                    body: metaRows,
                    startY: curY,
                    margin: { left: marginX, right: marginX },
                    styles: { fontSize: 8, cellPadding: 2.5, textColor: [40, 40, 60] },
                    theme: 'plain',
                    columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 65 }, 2: { cellWidth: 'auto' } },
                });
                curY = pdf.lastAutoTable.finalY + 4;
            } else {
                const execDate = execution?.date ? new Date(execution.date).toLocaleDateString('es-PE') : new Date().toLocaleDateString('es-PE');
                autoTable(pdf, {
                    body: [[`Ejecución Rutinaria`, `Usuario: ${headerUserName}`, `Fecha: ${execDate}`]],
                    startY: curY,
                    margin: { left: marginX, right: marginX },
                    styles: { fontSize: 8, cellPadding: 2.5, textColor: [40, 40, 60] },
                    theme: 'plain',
                    columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 80 }, 2: { cellWidth: 'auto', halign: 'right' } }
                });
                curY = pdf.lastAutoTable.finalY + 4;
            }

            pdf.setDrawColor(200, 200, 200);
            pdf.setLineWidth(0.4);
            pdf.line(marginX, curY, pdfWidth - marginX, curY);
            curY += 4;

            const sections = template?.items?.sections || [];

            for (const section of sections) {
                if (curY > pdfHeight - 50) {
                    pdf.addPage();
                    drawHeader();
                    curY = marginTop + 4;
                }

                pdf.setFontSize(9);
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(30, 30, 46);
                pdf.text(section.title?.toUpperCase() || '', marginX, curY);
                curY += 5;

                if (section.type === 'matrix_status') {
                    const cols = section.columns || [];
                    const rows = section.rows || [];

                    const getShortLabel = (label) => {
                        const l = label.toUpperCase();
                        if (l.includes('ELEMENTO') || l.includes('PARÁMETRO')) return 'ELEMENTO';
                        if (l.includes('MÉTODO')) return 'MÉTODO';
                        if (l.includes('RESULTADO')) return 'RESULT.';
                        if (l.includes('OBSERVACIÓN')) return 'OBSERVACIÓN';
                        if (l.includes('CRITICIDAD')) return 'CRIT.';
                        return l;
                    };

                    const head = [['N°', 'UBICACIÓN', ...cols.map(c => getShortLabel(c.label))]];
                    const body = rows.map((row, idx) => {
                        const rowData = [String(idx + 1), row.label];
                        cols.forEach(col => {
                            const resKey = `${row.id}_${col.id}`;
                            const val = results[resKey] !== undefined ? results[resKey] : (row[col.id] || row[col.id === 'metodo' ? 'method' : ''] || '');
                            rowData.push(typeof val === 'object' ? JSON.stringify(val) : String(val));
                        });
                        return rowData;
                    });

                    const matrixColStyles = {
                        0: { cellWidth: 7, halign: 'center' },
                        1: { cellWidth: 38 },
                    };
                    
                    cols.forEach((c, i) => {
                        const index = i + 2;
                        if (c.id === 'result' || c.id === 'estado') matrixColStyles[index] = { cellWidth: 16, halign: 'center' };
                        else if (c.id === 'crit') matrixColStyles[index] = { cellWidth: 12, halign: 'center' };
                        else if (c.id === 'obs') matrixColStyles[index] = { cellWidth: 'auto' };
                        else {
                            matrixColStyles[index] = { cellWidth: 36 }; 
                        }
                    });

                    autoTable(pdf, {
                        head,
                        body,
                        startY: curY,
                        margin: { left: marginX, right: marginX, top: marginTop, bottom: marginBottom },
                        styles: { 
                            fontSize: 6.5, 
                            cellPadding: { top: 1.5, bottom: 1.5, left: 1, right: 1 }, 
                            overflow: 'linebreak', 
                            valign: 'middle', 
                            lineColor: [200, 200, 200], 
                            lineWidth: 0.1, 
                            textColor: [30, 30, 30] 
                        },
                        headStyles: { 
                            fillColor: [30, 30, 46], 
                            textColor: [255, 255, 255], 
                            fontStyle: 'bold', 
                            fontSize: 6, 
                            halign: 'center',
                            cellPadding: 1
                        },
                        alternateRowStyles: { fillColor: [250, 250, 252] },
                        columnStyles: matrixColStyles,
                        didParseCell: (data) => {
                            if (data.section === 'body') {
                                const val = String(data.cell.raw || '').toUpperCase();
                                if (val === 'OK') {
                                    data.cell.styles.textColor = [22, 163, 74];
                                    data.cell.styles.fontStyle = 'bold';
                                } else if (val === 'NO OK' || val === 'FALLA' || val.includes('OBSERV')) {
                                    data.cell.styles.textColor = [220, 38, 38];
                                    data.cell.styles.fontStyle = 'bold';
                                }
                            }
                        },
                        didDrawPage: () => { drawHeader(); },
                        showFoot: 'never',
                    });
                    curY = pdf.lastAutoTable.finalY + 5;
                }
                else if (section.type === 'matrix_numeric') {
                    const cols = section.columns || [];
                    const rows = section.rows || [];

                    const head = [['N°', 'COMPONENTE', ...cols.map(c => c.label.toUpperCase())]];
                    const body = rows.map((row, idx) => {
                        const rowData = [String(idx + 1), row.label];
                        cols.forEach(col => {
                            if (col.readOnly || col.type === 'text') {
                                rowData.push(row.nominal_val || row[col.id] || '');
                            } else {
                                const val = results[`${row.id}_${col.id}`] || results[row.id] || '';
                                rowData.push(String(val));
                            }
                        });
                        return rowData;
                    });

                    curY = addTable(head, body, {
                        0: { cellWidth: 8, halign: 'center' },
                        1: { cellWidth: 65 },
                        2: { cellWidth: 28, halign: 'center' },
                        3: { cellWidth: 28, halign: 'center' },
                        4: { cellWidth: 'auto' },
                    }, curY);
                    curY += 5;
                }
                else if (section.type === 'matrix_temp') {
                    const rows = section.rows || [];
                    const head = [['N°', 'COMPONENTE', 'MOTOR A', 'MOTOR B', 'REDUC. A', 'REDUC. B', 'VEL. (rpm)', 'VIB. (mm/s)']];
                    const body = rows.map((row, idx) => [
                        String(idx + 1), row.label,
                        results[`${row.id}_motorA`] || '',
                        results[`${row.id}_motorB`] || '',
                        results[`${row.id}_reducA`] || '',
                        results[`${row.id}_reducB`] || '',
                        results[`${row.id}_vel`] || '',
                        results[`${row.id}_vib`] || '',
                    ]);

                    curY = addTable(head, body, {
                        0: { cellWidth: 8, halign: 'center' },
                        1: { cellWidth: 40 },
                        2: { cellWidth: 18, halign: 'center' },
                        3: { cellWidth: 18, halign: 'center' },
                        4: { cellWidth: 18, halign: 'center' },
                        5: { cellWidth: 18, halign: 'center' },
                        6: { cellWidth: 22, halign: 'center' },
                        7: { cellWidth: 22, halign: 'center' },
                    }, curY);
                    curY += 5;
                }
                else if (section.type === 'winder_matrix') {
                    const rows = section.rows || [];
                    const cols = section.columns || [];
                    const head = [['N°', 'COMPONENTE', ...cols.map(c => c.label)]];
                    const body = rows.map((row, idx) => [
                        String(idx + 1), row.label,
                        ...cols.map(col => results[`${row.id}_${col.id}`] || ''),
                    ]);

                    curY = addTable(head, body, {
                        0: { cellWidth: 8, halign: 'center' },
                        1: { cellWidth: 'auto' },
                        2: { cellWidth: 30, halign: 'center' },
                        3: { cellWidth: 30, halign: 'center' },
                    }, curY);
                    curY += 5;
                }
                else {
                    const items = section.items || section.rows || [];
                    if (items.length > 0) {
                        const head = [['N°', 'PUNTO DE INSPECCIÓN', 'VALOR / ESTADO']];
                        const body = items.map((item, idx) => [
                            String(idx + 1),
                            item.label || item.id,
                            String(results[item.id] || ''),
                        ]);
                        curY = addTable(head, body, {
                            0: { cellWidth: 8, halign: 'center' },
                            1: { cellWidth: 120 },
                            2: { cellWidth: 'auto', halign: 'center' },
                        }, curY);
                        curY += 5;
                    }
                }
            }

            const finalTechSig = techSig || (wo ? wo.technician_signature : null);
            const finalSupSig = supSig || (wo ? wo.operator_signature : null);
            const finalTechName = techName || (wo ? wo.leader_technician_name : '');
            const finalSupName = supName || (wo ? wo.supervisor_name : '');

            if (finalTechSig || finalSupSig) {
                if (curY > pdfHeight - 50) {
                    pdf.addPage();
                    drawHeader();
                    curY = marginTop + 15;
                } else {
                    curY += 25;
                }

                pdf.setDrawColor(150, 150, 150);
                pdf.setLineWidth(0.3);

                if (finalTechSig && finalTechSig.startsWith('data:image')) {
                    pdf.addImage(finalTechSig, 'PNG', marginX + 25, curY - 25, 50, 25);
                }
                pdf.line(marginX + 20, curY, marginX + 80, curY);
                pdf.setFontSize(8);
                pdf.setFont("helvetica", "bold");
                pdf.setTextColor(60, 60, 60);
                pdf.text("TÉCNICO LÍDER", marginX + 50, curY + 5, { align: 'center' });
                if (finalTechName) {
                    pdf.setFont("helvetica", "normal");
                    pdf.text(finalTechName, marginX + 50, curY + 9, { align: 'center' });
                }

                if (finalSupSig && finalSupSig.startsWith('data:image')) {
                    pdf.addImage(finalSupSig, 'PNG', pdfWidth - marginX - 75, curY - 25, 50, 25);
                }
                pdf.line(pdfWidth - marginX - 80, curY, pdfWidth - marginX - 20, curY);
                pdf.setFontSize(8);
                pdf.setFont("helvetica", "bold");
                pdf.setTextColor(60, 60, 60);
                pdf.text("SUPERVISOR DE PRODUCCIÓN", pdfWidth - marginX - 50, curY + 5, { align: 'center' });
                if (finalSupName) {
                    pdf.setFont("helvetica", "normal");
                    pdf.text(finalSupName, pdfWidth - marginX - 50, curY + 9, { align: 'center' });
                }
            }

            const totalPages = pdf.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                pdf.setPage(i);
                pdf.setFontSize(8);
                pdf.setFont("helvetica", "normal");
                pdf.setTextColor(0);
                pdf.text(`Página: ${i} de ${totalPages}`, 152, 29);
                drawFooter(i, totalPages);
            }

            const fileName = wo
                ? `Checklist_${wo.ticket_number}.pdf`
                : `Checklist_Rutina_${new Date().toLocaleDateString('es-PE').replace(/\//g, '-')}.pdf`;
            pdf.save(fileName);

        } catch (error) {
            console.error('Error exporting PDF:', error);
            alert('Error al exportar a PDF');
        } finally {
            setExporting(false);
        }
    };

    const exportToExcel = () => {
        setExporting(true);
        setShowExportMenu(false);
        try {
            const data = [];
            if (template && template.items && template.items.sections) {
                template.items.sections.forEach(section => {
                    if (section.type === 'matrix_numeric' || section.type === 'matrix_status') {
                        section.rows.forEach(row => {
                            section.columns.forEach(col => {
                                const key = `${row.id}_${col.id}`;
                                let val = results[key] || '';
                                if (col.type === 'checkbox') {
                                    if (val === 'X' || val === true || val === 'true') {
                                        val = col.label;
                                    } else {
                                        val = '';
                                    }
                                }
                                data.push({
                                    'Sección': section.title,
                                    'Punto de Inspección / Parámetro': `${row.label} - ${col.label}`,
                                    'Valor / Resultado': val
                                });
                            });
                        });
                    }
                    if (section.type === 'matrix_temp') {
                        section.rows.forEach(row => {
                            ['motorA', 'motorB', 'reducA', 'reducB', 'vel', 'vib'].forEach(field => {
                                const key = `${row.id}_${field}`;
                                const val = results[key] || '';
                                let fieldLabel = '';
                                if (field === 'motorA') fieldLabel = 'Motor Zona A';
                                else if (field === 'motorB') fieldLabel = 'Motor Zona B';
                                else if (field === 'reducA') fieldLabel = 'Reductor Zona A';
                                else if (field === 'reducB') fieldLabel = 'Reductor Zona B';
                                else if (field === 'vel') fieldLabel = 'Velocidad (rpm)';
                                else if (field === 'vib') fieldLabel = 'Vibración (mm/s)';
                                data.push({
                                    'Sección': section.title,
                                    'Punto de Inspección / Parámetro': `${row.label} - ${fieldLabel}`,
                                    'Valor / Resultado': val
                                });
                            });
                        });
                    }
                    if (section.type === 'single_numeric' || section.type === 'conditional_checks') {
                        section.items.forEach(item => {
                            const val = results[item.id] || '';
                            data.push({
                                'Sección': section.title,
                                'Punto de Inspección / Parámetro': item.label,
                                'Valor / Resultado': val
                            });
                        });
                    }
                });
            } else {
                Object.keys(results).forEach(key => {
                    let value = results[key];
                    if (typeof value === 'object') value = JSON.stringify(value);
                    data.push({
                        'Sección': 'Otros',
                        'Punto de Inspección / Parámetro': key,
                        'Valor / Resultado': value
                    });
                });
            }

            const metadata = [
                { 'Sección': 'DATOS GENERALES', 'Punto de Inspección / Parámetro': 'Orden de Trabajo', 'Valor / Resultado': wo?.ticket_number || 'Rutina' },
                { 'Sección': 'DATOS GENERALES', 'Punto de Inspección / Parámetro': 'Fecha de Ejecución', 'Valor / Resultado': new Date().toLocaleDateString() },
                { 'Sección': 'DATOS GENERALES', 'Punto de Inspección / Parámetro': 'Plantilla', 'Valor / Resultado': template.name },
                { 'Sección': 'DATOS GENERALES', 'Punto de Inspección / Parámetro': 'Observación', 'Valor / Resultado': execution?.observation || '' },
                {},
            ];

            const finalData = [...metadata, ...data];
            const ws = XLSX.utils.json_to_sheet(finalData);
            ws['!cols'] = [{ wch: 30 }, { wch: 60 }, { wch: 30 }];
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Checklist Resultados");
            const fileName = wo ? `Checklist_${wo.ticket_number}.xlsx` : `Checklist_Rutina_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`;
            XLSX.writeFile(wb, fileName);
        } catch (error) {
            console.error('Error exporting Excel:', error);
            alert('Error al exportar a Excel');
        } finally {
            setExporting(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Cargando checklist...</div>;

    if (!template || template.layout !== 'sml2_matrix') {
        return (
            <div className="p-8 text-center max-w-2xl mx-auto mt-10">
                <AlertTriangle className="mx-auto text-orange-500 mb-4" size={48} />
                <h2 className="text-xl font-bold mb-2">Checklist No Compatible O No Encontrado</h2>
                <p className="text-slate-600 mb-4">Esta Orden de Trabajo no tiene un checklist matricial asignado.</p>
                <button onClick={() => navigate(`/work-orders/${id}`)} className="text-blue-600 font-bold hover:underline">
                    Volver a la Orden
                </button>
            </div>
        );
    }

    const { sections } = template.items;

    return (
        <div className="bg-slate-50 min-h-screen pb-20">
            <div className="bg-slate-900 text-white p-6 sticky top-0 z-50 shadow-md">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => {
                            if (executionId) navigate('/checklists/executions');
                            else if (templateId) navigate('/checklists');
                            else navigate(`/work-orders/${id}`);
                        }} className="hover:bg-slate-800 p-2 rounded-full transition-colors z-10">
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black tracking-tight">{template.name || 'Checklist de Inspección'}</h1>
                            <div className="flex flex-col md:flex-row md:items-center gap-2 mt-1">
                                <p className="text-slate-400 text-sm">
                                    {executionId ? `Historial: Ejecución #${executionId}` : templateId ? 'Ejecución Rutinaria (Sin OT)' : `O.T. ${wo?.ticket_number} - ${wo?.SubMachine?.name || 'Máquina SML 2'}`}
                                </p>
                                <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-md w-max shadow-sm border border-blue-500">
                                    Frecuencia: Semanal
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 relative">
                        <div className="relative">
                            <button
                                onClick={() => setShowExportMenu(!showExportMenu)}
                                disabled={exporting || loading}
                                className="bg-slate-800 hover:bg-slate-700 text-white p-2 md:px-4 md:py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border border-slate-700 disabled:opacity-50"
                            >
                                {exporting ? <span className="animate-pulse">Exportando...</span> : <><Download size={20} /><span className="hidden md:inline">Exportar</span></>}
                            </button>
                            {showExportMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
                                    <button onClick={exportToPDF} className="w-full text-left px-4 py-3 text-slate-700 hover:bg-slate-50 flex items-center gap-3 border-b border-slate-100 transition-colors">
                                        <FileText size={18} className="text-red-500" /><span className="font-medium">Exportar PDF</span>
                                    </button>
                                    <button onClick={exportToExcel} className="w-full text-left px-4 py-3 text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors">
                                        <FileSpreadsheet size={18} className="text-green-600" /><span className="font-medium">Exportar Excel</span>
                                    </button>
                                </div>
                            )}
                        </div>
                        <button onClick={handleSave} disabled={saving} className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 md:py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all">
                            <Save size={20} /> <span className="hidden md:inline">{saving ? 'Guardando...' : 'Guardar Resultados'}</span>
                        </button>
                    </div>
                </div>
            </div>

            <div id="checklist-content" className="max-w-7xl mx-auto p-4 md:p-6 space-y-8 mt-6">
                <div className="bg-red-50 border-l-4 border-red-500 p-4 md:p-6 rounded-r-xl shadow-sm text-red-900">
                    <h3 className="font-black flex items-center gap-2 text-lg mb-2">
                        <AlertTriangle size={20} /> REQUERIMIENTOS DE SEGURIDAD (EPP OBLIGATORIO)
                    </h3>
                    <ul className="text-sm md:text-base space-y-1 list-disc list-inside">
                        <li><strong>Botas de Seguridad:</strong> Uso obligatorio en toda la zona de extrusión y bobinado.</li>
                        <li><strong>Guantes Térmicos/Anticorte:</strong> Obligatorio para inspección en zona de cabezal y limpieza de rodillos.</li>
                        <li><strong>Casco y Lentes de Seguridad:</strong> Permanente en áreas de tránsito.</li>
                        <li><strong>Herramientas Requeridas:</strong> Pirómetro FLUKE calibrado, linterna de inspección.</li>
                    </ul>
                </div>

                {sections.map((section, sIndex) => (
                    <div key={sIndex} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="bg-slate-100 p-4 border-b border-slate-200">
                            <h2 className="font-black text-slate-800 text-lg md:text-xl uppercase tracking-tight">{section.title}</h2>
                        </div>
                        <div className="p-0 overflow-x-auto">
                            {section.type === 'matrix_numeric' && (
                                <table className="w-full text-left border-collapse min-w-[600px]">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-600 text-xs md:text-sm border-b uppercase">
                                            <th className="p-4 font-bold">{section.title && section.title.includes('TEMPERATURA') ? 'PARÁMETRO A MEDIR' : 'Parámetro a Medir'}</th>
                                            {section.rows.some(r => r.nominal) && <th className="p-4 font-bold text-center">Nominal</th>}
                                            {section.columns.map(col => (
                                                <th key={col.id} className="p-4 font-black text-center text-slate-900 bg-slate-100 border-l">{col.label}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {section.rows.map(row => (
                                            <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-4 font-medium text-slate-800 text-sm">{row.label}</td>
                                                {section.rows.some(r => r.nominal) && <td className="p-4 text-center text-slate-500 text-xs font-mono bg-slate-50">{row.nominal || ''}</td>}
                                                {section.columns.map(col => {
                                                    const val = results[`${row.id}_${col.id}`] || '';
                                                    if (col.readOnly) return <td key={col.id} className="p-2 border-l text-center bg-slate-50"><span className="text-sm font-mono text-slate-500 font-semibold">{row.nominal_val || ''}</span></td>;
                                                    return (
                                                        <td key={col.id} className="p-2 border-l text-center">
                                                            <input type="text" className="w-full min-w-[80px] max-w-[200px] border border-slate-300 rounded-lg p-2 text-center text-sm focus:ring-2 focus:ring-blue-500 mx-auto block" value={val} onChange={(e) => handleResultChange(row.id, col.id, e.target.value)} />
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                             {section.type === 'matrix_status' && (
                                 <div className="overflow-x-auto">
                                     <table className="w-full text-left border-collapse min-w-[900px]">
                                         <thead>
                                             <tr className="bg-slate-50 text-slate-600 text-[10px] md:text-xs border-b uppercase">
                                                 <th className="p-4 font-bold w-[20%]">Ubicación</th>
                                                 {section.columns.map(col => {
                                                     const isSelect = col.id === 'result' || col.id === 'estado';
                                                     const isCrit = col.id === 'crit';
                                                     return (
                                                         <th key={col.id} className={`p-4 font-black text-center text-slate-900 bg-slate-100 border-l ${isSelect ? 'w-32' : isCrit ? 'w-20' : ''}`}>
                                                             {col.label}
                                                         </th>
                                                     );
                                                 })}
                                             </tr>
                                         </thead>
                                         <tbody className="divide-y divide-slate-100">
                                             {section.rows.map(row => (
                                                 <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                                                     <td className="p-4 font-black text-slate-800 text-xs md:text-sm leading-tight">{row.label}</td>
                                                     {section.columns.map(col => {
                                                         const val = results[`${row.id}_${col.id}`] || '';
                                                         if (col.type === 'readonly') {
                                                             return (
                                                                 <td key={col.id} className="p-2 border-l text-center bg-slate-50">
                                                                     <span className="text-[11px] md:text-xs text-slate-600 font-semibold leading-relaxed block px-2">{row[col.id] || ''}</span>
                                                                 </td>
                                                             );
                                                         }
                                                         if (col.type === 'checkbox') {
                                                             const isChecked = val === 'X' || val === true || val === 'true';
                                                             return (
                                                                 <td key={col.id} className="p-2 border-l text-center vertical-middle">
                                                                     <input type="checkbox" className="w-5 h-5 mx-auto rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" checked={isChecked} onChange={(e) => {
                                                                         const checked = e.target.checked;
                                                                         setResults(prev => {
                                                                             const newRes = { ...prev };
                                                                             if (checked) {
                                                                                 section.columns.forEach(c => { if (c.type === 'checkbox') newRes[`${row.id}_${c.id}`] = ''; });
                                                                                 newRes[`${row.id}_${col.id}`] = 'X';
                                                                             } else newRes[`${row.id}_${col.id}`] = '';
                                                                             return newRes;
                                                                         });
                                                                     }} />
                                                                 </td>
                                                             );
                                                         }
                                                         if (col.type === 'select' || (!col.type && col.id === 'result')) {
                                                            const options = col.options || ["OK", "OBSERVADO", "NO OK"];
                                                            const isPositive = val === 'OK';
                                                            const isNegative = val === 'OBSERVADO' || val === 'NO OK' || val === 'FALLA';
                                                            const selectClass = isPositive ? 'bg-green-100 text-green-800 border-green-300 font-bold' : isNegative ? 'bg-red-100 text-red-800 border-red-300 font-bold' : 'bg-white text-slate-700 border-slate-300';
                                                            return (
                                                                <td key={col.id} className="p-2 border-l text-center">
                                                                    <select className={`w-32 border rounded-lg p-2 text-center text-sm focus:ring-2 focus:ring-blue-500 mx-auto block transition-colors ${selectClass}`} value={val} onChange={(e) => handleResultChange(row.id, col.id, e.target.value)}>
                                                                        <option value="">-- --</option>
                                                                        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                                    </select>
                                                                </td>
                                                            );
                                                         }
                                                         if (col.type === 'text' || col.id === 'obs') {
                                                             return (
                                                                 <td key={col.id} className="p-2 border-l text-center">
                                                                     <input type="text" className="w-full min-w-[150px] border border-slate-300 rounded p-1.5 text-sm focus:ring-2 focus:ring-blue-500" value={val} onChange={(e) => handleResultChange(row.id, col.id, e.target.value)} />
                                                                 </td>
                                                             );
                                                         }
                                                         return <td key={col.id} className="border-l text-center"></td>;
                                                     })}
                                                 </tr>
                                             ))}
                                         </tbody>
                                     </table>
                                 </div>
                             )}

                            {section.type === 'matrix_temp' && (
                                <table className="w-full text-left border-collapse min-w-[700px]">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-600 text-xs md:text-sm border-b uppercase">
                                            <th className="p-4 font-bold">Módulo</th>
                                            <th className="p-4 font-bold text-center border-l col-span-2">Motor (Zona A / B)</th>
                                            <th className="p-4 font-bold text-center text-slate-400 bg-slate-100 border-r">Rango M.</th>
                                            <th className="p-4 font-bold text-center col-span-2">Reductor (Zona a / b)</th>
                                            <th className="p-4 font-bold text-center text-slate-400 bg-slate-100 border-r">Rango R.</th>
                                            <th className="p-4 font-bold text-center">Velocidad<br /><span className="text-xs font-normal text-slate-400 capitalize">(rpm)</span></th>
                                            <th className="p-4 font-bold text-center border-l">Vibración<br /><span className="text-xs font-normal text-slate-400 capitalize">(mm/s)</span></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {section.rows.map(row => (
                                            <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-4 font-black text-slate-800 text-sm">{row.label}</td>
                                                <td className="p-2 border-l w-[140px]">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <input type="text" placeholder="A" className="w-14 border border-slate-300 rounded p-1.5 text-center text-sm" value={results[`${row.id}_motorA`] || ''} onChange={(e) => handleResultChange(row.id, 'motorA', e.target.value)} />
                                                        <span className="text-slate-400">/</span>
                                                        <input type="text" placeholder="B" className="w-14 border border-slate-300 rounded p-1.5 text-center text-sm" value={results[`${row.id}_motorB`] || ''} onChange={(e) => handleResultChange(row.id, 'motorB', e.target.value)} />
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center text-slate-500 text-xs font-mono bg-slate-100 border-r">{row.rangeMotor}</td>
                                                <td className="p-2 w-[140px]">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <input type="text" placeholder="a" className="w-14 border border-slate-300 rounded p-1.5 text-center text-sm" value={results[`${row.id}_reducA`] || ''} onChange={(e) => handleResultChange(row.id, 'reducA', e.target.value)} />
                                                        {row.id !== 'chill_roll' && (
                                                            <>
                                                                <span className="text-slate-400">/</span>
                                                                <input type="text" placeholder="b" className="w-14 border border-slate-300 rounded p-1.5 text-center text-sm" value={results[`${row.id}_reducB`] || ''} onChange={(e) => handleResultChange(row.id, 'reducB', e.target.value)} />
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center text-slate-500 text-xs font-mono bg-slate-100 border-r">{row.rangeReduc}</td>
                                                <td className="p-2 text-center">
                                                    <input type="text" placeholder="Vel." className="w-20 border border-slate-300 rounded-lg p-2 text-center text-sm mx-auto block" value={results[`${row.id}_vel`] || ''} onChange={(e) => handleResultChange(row.id, 'vel', e.target.value)} />
                                                </td>
                                                <td className="p-2 border-l text-center">
                                                    <input type="text" placeholder="Vib." className="w-20 border border-slate-300 rounded-lg p-2 text-center text-sm mx-auto block" value={results[`${row.id}_vib`] || ''} onChange={(e) => handleResultChange(row.id, 'vib', e.target.value)} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            {section.type === 'single_numeric' && (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-600 text-xs md:text-sm border-b uppercase">
                                            <th className="p-4 font-bold">Parámetro a Medir</th>
                                            <th className="p-4 font-bold text-center">Rango Nominal</th>
                                            <th className="p-4 font-bold text-center border-l bg-slate-100">Lectura Real</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {section.items.map(item => (
                                            <tr key={item.id}>
                                                <td className="p-4 font-medium text-slate-800 text-sm">{item.label}</td>
                                                <td className="p-4 text-center text-slate-500 text-xs font-mono bg-slate-50">{item.nominal}</td>
                                                <td className="p-4 border-l bg-slate-50 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <input type="text" placeholder="Valor" className="w-24 border border-slate-300 rounded-lg p-2 text-center text-sm focus:ring-2 focus:ring-blue-500" value={results[item.id] || ''} onChange={(e) => handleResultChange(item.id, null, e.target.value)} />
                                                        <span className="text-slate-500 font-bold">{item.unit}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            {section.type === 'conditional_checks' && (
                                <table className="w-full text-left border-collapse min-w-[700px]">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-600 text-xs md:text-sm border-b uppercase">
                                            <th className="p-4 font-bold min-w-[200px]">Punto de Inspección</th>
                                            {section.options.map(opt => (
                                                <th key={opt} className={`p-2 lg:p-4 font-black text-center border-l text-[10px] lg:text-xs leading-tight ${getOptionColors(opt).header}`}>{opt}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {section.items.map(item => (
                                            <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="p-4 font-medium text-slate-800 text-sm max-w-[200px] leading-tight">{item.label}</td>
                                                {section.options.map(opt => {
                                                    const isChecked = results[item.id] === opt;
                                                    const colors = getOptionColors(opt);
                                                    return (
                                                        <td key={opt} className={`p-0 border-l text-center cursor-pointer transition-colors ${isChecked ? colors.cell : 'hover:bg-slate-100'}`} onClick={() => handleResultChange(item.id, null, opt)}>
                                                            <div className="p-4 flex justify-center items-center w-full h-full">
                                                                <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${isChecked ? colors.dot : 'border-slate-300 bg-white'}`}>
                                                                    {isChecked && <div className="w-2.5 h-2.5 bg-white rounded-sm"></div>}
                                                                </div>
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                ))}
                
                <div className="mt-8 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <FileText className="text-indigo-600" size={20} />
                            Firmas de Conformidad
                        </h3>
                    </div>
                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-4">
                                <SignaturePad
                                    label="FIRMA TÉCNICO LÍDER"
                                    value={techSig}
                                    onChange={(val) => setTechSig(val)}
                                />
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Nombre del Técnico</label>
                                    <input
                                        type="text"
                                        placeholder="Ingrese nombre del técnico..."
                                        className="w-full border border-slate-300 p-3 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold bg-slate-50 shadow-inner"
                                        value={techName}
                                        onChange={(e) => setTechName(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <SignaturePad
                                    label="FIRMA SUPERVISOR DE PRODUCCIÓN"
                                    value={supSig}
                                    onChange={(val) => setSupSig(val)}
                                />
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Nombre del Supervisor</label>
                                    <input
                                        type="text"
                                        placeholder="Ingrese nombre del supervisor..."
                                        className="w-full border border-slate-300 p-3 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold bg-slate-50 shadow-inner"
                                        value={supName}
                                        onChange={(e) => setSupName(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkOrderChecklist;
