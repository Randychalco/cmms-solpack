const XLSX = require('xlsx');
const { WorkOrder, Plant, Area, Machine, SubMachine, User, Inventory, Asset } = require('../models');
const { Op } = require('sequelize');
const db = require('../config/db');

/**
 * Exportar órdenes de trabajo a Excel
 */
exports.exportWorkOrders = async (req, res) => {
    try {
        const { plant, area, startDate, endDate, status, type } = req.query;

        // Construir filtros
        const where = {};
        if (plant) where.plant_id = plant;
        if (area) where.area_id = area;
        if (status) where.status = status;
        if (type) where.work_order_type = type;
        if (startDate || endDate) {
            where.start_date = {};
            if (startDate) where.start_date[Op.gte] = new Date(startDate);
            if (endDate) where.start_date[Op.lte] = new Date(endDate);
        }

        // Obtener órdenes de trabajo con relaciones
        const workOrders = await WorkOrder.findAll({
            where,
            include: [
                { model: Plant, attributes: ['name'] },
                { model: Area, attributes: ['name'] },
                { model: Machine, attributes: ['name'] },
                { model: SubMachine, attributes: ['name'] }
            ],
            order: [['id', 'DESC']]
        });

        // Obtener materiales solicitados
        const woIds = workOrders.map(wo => wo.id);
        const materialsMap = {};
        
        if (woIds.length > 0) {
            const mrResult = await db.query(
                `SELECT wo_id, items FROM material_requests WHERE wo_id = ANY($1::int[]) AND status != 'Rechazado'`,
                [woIds]
            );
            
            mrResult.rows.forEach(row => {
                if (row.items && Array.isArray(row.items)) {
                    let itemsStr = row.items.map(item => `${item.quantity_requested} ${item.unit_measure || 'un.'} ${item.description}`).join('; ');
                    if (materialsMap[row.wo_id]) {
                        materialsMap[row.wo_id] += '; ' + itemsStr;
                    } else {
                        materialsMap[row.wo_id] = itemsStr;
                    }
                }
            });
        }

        // Preparar datos para Excel
        const data = workOrders.map(wo => ({
            'ID OT': wo.id,
            'TICKET': wo.ticket_number || '',
            'PLANTA': wo.Plant?.name || '',
            'ÁREA': wo.Area?.name || '',
            'EQUIPO': wo.Machine?.name || '',
            'SUB-EQUIPO': wo.SubMachine?.name || '',
            'CLASE DE ORDEN': wo.order_class || '',
            'GRUPO DE PLANIFICACIÓN': wo.planning_group || '',
            'PRIORIDAD': wo.priority || '',
            'ESTADO': wo.status || '',
            'CONDICIÓN EQUIPO': wo.equipment_condition || '',
            'FECHA INICIO': wo.start_date ? new Date(wo.start_date).toLocaleDateString('es-PE') : '',
            'FECHA FIN': wo.end_date ? new Date(wo.end_date).toLocaleDateString('es-PE') : '',
            'TÉCNICO': wo.technician_id || '',
            'DESCRIPCIÓN FALLA': wo.failure_description || '',
            'CAUSA FALLA': wo.failure_cause || '',
            'ACCIÓN TOMADA': wo.action_taken || '',
            'MATERIALES': materialsMap[wo.id] ? materialsMap[wo.id] : (wo.materials_used || ''),
            'OBSERVACIONES': wo.observations || ''
        }));

        // Crear libro de Excel
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);

        // Ajustar anchos de columna
        const colWidths = [
            { wch: 8 },  // ID OT
            { wch: 15 }, // Ticket
            { wch: 12 }, // Planta
            { wch: 15 }, // Área
            { wch: 20 }, // Equipo
            { wch: 20 }, // Sub-Equipo
            { wch: 25 }, // Clase de Orden
            { wch: 20 }, // Grupo de Planificación
            { wch: 12 }, // Prioridad
            { wch: 15 }, // Estado
            { wch: 18 }, // Condición Equipo
            { wch: 12 }, // Fecha Inicio
            { wch: 12 }, // Fecha Fin
            { wch: 15 }, // Técnico
            { wch: 40 }, // Descripción Falla
            { wch: 40 }, // Causa Falla
            { wch: 40 }, // Acción Tomada
            { wch: 30 }, // Materiales
            { wch: 40 }  // Observaciones
        ];
        ws['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws, 'Órdenes de Trabajo');

        // Generar buffer
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        // Configurar headers para descarga
        const timestamp = new Date().toISOString().slice(0, 10);
        res.setHeader('Content-Disposition', `attachment; filename=ordenes_trabajo_${timestamp}.xlsx`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        res.send(buffer);
    } catch (error) {
        console.error('Error exportando órdenes de trabajo:', error);
        res.status(500).json({ error: 'Error al exportar órdenes de trabajo' });
    }
};

/**
 * Exportar reportes del dashboard a Excel
 */
exports.exportDashboard = async (req, res) => {
    try {
        const { plant, startDate, endDate } = req.query;

        // Construir filtros
        const where = {};
        if (plant) where.plant_id = plant;
        if (startDate || endDate) {
            where.start_date = {};
            if (startDate) where.start_date[Op.gte] = new Date(startDate);
            if (endDate) where.start_date[Op.lte] = new Date(endDate);
        }

        // Estadísticas generales
        const totalOTs = await WorkOrder.count({ where });
        const completedOTs = await WorkOrder.count({ where: { ...where, status: 'Terminado' } });
        const pendingOTs = await WorkOrder.count({ where: { ...where, status: { [Op.in]: ['Abierto', 'En Proceso'] } } });

        const stats = [
            { 'MÉTRICA': 'Total de OTs', 'VALOR': totalOTs },
            { 'MÉTRICA': 'OTs Completadas', 'VALOR': completedOTs },
            { 'MÉTRICA': 'OTs Pendientes', 'VALOR': pendingOTs },
            { 'MÉTRICA': 'Tasa de Completitud', 'VALOR': totalOTs > 0 ? `${((completedOTs / totalOTs) * 100).toFixed(1)}%` : '0%' }
        ];

        // OTs por prioridad
        const byPriority = await WorkOrder.findAll({
            where,
            attributes: [
                'priority',
                [WorkOrder.sequelize.fn('COUNT', WorkOrder.sequelize.col('id')), 'count']
            ],
            group: ['priority']
        });

        const priorityData = byPriority.map(item => ({
            'PRIORIDAD': item.priority || 'Sin prioridad',
            'CANTIDAD': item.dataValues.count
        }));

        // OTs por área
        const byArea = await WorkOrder.findAll({
            where,
            include: [{ model: Area, attributes: ['name'] }],
            attributes: [
                [WorkOrder.sequelize.fn('COUNT', WorkOrder.sequelize.col('WorkOrder.id')), 'count']
            ],
            group: ['Area.id', 'Area.name'],
            raw: true
        });

        const areaData = byArea.map(item => ({
            'ÁREA': item['Area.name'] || 'Sin área',
            'CANTIDAD': item.count
        }));

        // Crear libro con múltiples hojas
        const wb = XLSX.utils.book_new();

        // Hoja 1: Estadísticas generales
        const ws1 = XLSX.utils.json_to_sheet(stats);
        ws1['!cols'] = [{ wch: 25 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, ws1, 'Estadísticas');

        // Hoja 2: Por prioridad
        const ws2 = XLSX.utils.json_to_sheet(priorityData);
        ws2['!cols'] = [{ wch: 20 }, { wch: 12 }];
        XLSX.utils.book_append_sheet(wb, ws2, 'Por Prioridad');

        // Hoja 3: Por área
        const ws3 = XLSX.utils.json_to_sheet(areaData);
        ws3['!cols'] = [{ wch: 25 }, { wch: 12 }];
        XLSX.utils.book_append_sheet(wb, ws3, 'Por Área');

        // Generar buffer
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        // Configurar headers
        const timestamp = new Date().toISOString().slice(0, 10);
        res.setHeader('Content-Disposition', `attachment; filename=reporte_dashboard_${timestamp}.xlsx`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        res.send(buffer);
    } catch (error) {
        console.error('Error exportando dashboard:', error);
        res.status(500).json({ error: 'Error al exportar dashboard' });
    }
};

/**
 * Exportar inventario a Excel
 */
exports.exportInventory = async (req, res) => {
    try {
        // Obtener inventario
        const inventory = await Inventory.findAll({
            order: [['name', 'ASC']]
        });

        // Preparar datos
        const data = inventory.map(item => ({
            'Código': item.code || '',
            'Nombre': item.name || '',
            'Categoría': item.category || '',
            'Stock Actual': item.current_stock || 0,
            'Stock Mínimo': item.min_stock || 0,
            'Unidad': item.unit || '',
            'Ubicación': item.location || '',
            'Descripción': item.description || ''
        }));

        // Crear libro
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);

        // Ajustar anchos
        ws['!cols'] = [
            { wch: 12 }, // Código
            { wch: 30 }, // Nombre
            { wch: 20 }, // Categoría
            { wch: 12 }, // Stock Actual
            { wch: 12 }, // Stock Mínimo
            { wch: 10 }, // Unidad
            { wch: 20 }, // Ubicación
            { wch: 40 }  // Descripción
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'Inventario');

        // Generar buffer
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        // Headers de descarga
        const timestamp = new Date().toISOString().slice(0, 10);
        res.setHeader('Content-Disposition', `attachment; filename=inventario_${timestamp}.xlsx`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        res.send(buffer);
    } catch (error) {
        console.error('Error exportando inventario:', error);
        res.status(500).json({ error: 'Error al exportar inventario' });
    }
};

exports.exportChecklists = async (req, res) => {
    try {
        const { format } = req.query;

        // Fetch all executions with joined data, PLUS the raw items JSON from the template to know the questions
        const result = await db.query(`
            SELECT 
                ce.id, ce.date, ce.overall_status, ce.observation, ce.results,
                ct.name as template_name, ct.items as template_items,
                wo.ticket_number,
                u.name as executed_by_name
            FROM checklist_executions ce
            LEFT JOIN checklist_templates ct ON ce.template_id = ct.id
            LEFT JOIN work_orders wo ON ce.wo_id = wo.id
            LEFT JOIN users u ON ce.executed_by = u.id
            ORDER BY ce.date DESC
        `);

        let data = [];
        let sheetName = 'Historial Checklists';

        if (format === 'database') {
            // EXPERIMENTAL DATABASE FLAT FORMAT
            sheetName = 'Base de Datos Checklists';

            result.rows.forEach(row => {
                const results = typeof row.results === 'string' ? JSON.parse(row.results || '{}') : (row.results || {});
                const templateItems = typeof row.template_items === 'string' ? JSON.parse(row.template_items || '{}') : (row.template_items || {});

                const baseInfo = {
                    'ID Ejecución': row.id,
                    'Fecha y Hora': new Date(row.date).toLocaleString('es-PE'),
                    'Creado Por': row.executed_by_name || 'Desconocido',
                    'Plantilla': row.template_name || 'Desconocida',
                    'O.T. / Origen': row.ticket_number ? `OT: ${row.ticket_number}` : 'Rutina',
                    'Estado Global': row.overall_status || '',
                    'Observación General': row.observation || ''
                };

                let hasExportedItems = false;

                if (templateItems && templateItems.sections) {
                    templateItems.sections.forEach(section => {
                        // 1. Matrices numéricas y de estado
                        if (section.type === 'matrix_numeric' || section.type === 'matrix_status') {
                            section.rows.forEach(r => {
                                section.columns.forEach(col => {
                                    const key = `${r.id}_${col.id}`;
                                    let val = results[key] || '';

                                    // FORMAT CHECKBOXES FOR EXCEL
                                    // Instead of 'X', print the actual column name (e.g. "Dañado")
                                    if (col.type === 'checkbox') {
                                        if (val === 'X' || val === true || val === 'true') {
                                            val = col.label; // Use the human-readable column name
                                        } else {
                                            val = ''; // Not checked, leave empty
                                        }
                                    }

                                    if (val !== undefined && val !== null) { // Export even empty ones for DB consistency, or choose to skip empty logic. We will export all.
                                        data.push({
                                            ...baseInfo,
                                            'Sección': section.title,
                                            'Punto de Inspección': r.label,
                                            'Parámetro Evaluado': col.label,
                                            'Resultado / Valor': val
                                        });
                                        hasExportedItems = true;
                                    }
                                });
                            });
                        }

                        // 2. Matriz de temperatura/motores
                        if (section.type === 'matrix_temp') {
                            section.rows.forEach(r => {
                                ['motorA', 'motorB', 'reducA', 'reducB', 'vel', 'vib'].forEach(field => {
                                    const key = `${r.id}_${field}`;
                                    const val = results[key] || '';

                                    let fieldLabel = '';
                                    if (field === 'motorA') fieldLabel = 'Motor Zona A';
                                    else if (field === 'motorB') fieldLabel = 'Motor Zona B';
                                    else if (field === 'reducA') fieldLabel = 'Reductor Zona A';
                                    else if (field === 'reducB') fieldLabel = 'Reductor Zona B';
                                    else if (field === 'vel') fieldLabel = 'Velocidad (rpm)';
                                    else if (field === 'vib') fieldLabel = 'Vibración (mm/s)';

                                    data.push({
                                        ...baseInfo,
                                        'Sección': section.title,
                                        'Punto de Inspección': r.label,
                                        'Parámetro Evaluado': fieldLabel,
                                        'Resultado / Valor': val
                                    });
                                    hasExportedItems = true;
                                });
                            });
                        }

                        // 3. Inputs numéricos simples y checks condicionales
                        if (section.type === 'single_numeric' || section.type === 'conditional_checks') {
                            section.items.forEach(item => {
                                const val = results[item.id] || '';
                                data.push({
                                    ...baseInfo,
                                    'Sección': section.title,
                                    'Punto de Inspección': item.label,
                                    'Parámetro Evaluado': 'Checklist',
                                    'Resultado / Valor': val
                                });
                                hasExportedItems = true;
                            });
                        }
                    });
                }

                // If the template was somehow empty or didn't match the new system, export raw keys
                if (!hasExportedItems && Object.keys(results).length > 0) {
                    Object.keys(results).forEach(key => {
                        let value = results[key];
                        if (typeof value === 'object') value = JSON.stringify(value);
                        data.push({
                            ...baseInfo,
                            'Sección': 'Otros / Legacy',
                            'Punto de Inspección': key,
                            'Parámetro Evaluado': 'Desconocido',
                            'Resultado / Valor': value
                        });
                    });
                } else if (!hasExportedItems) {
                    // Empty checklist case
                    data.push({
                        ...baseInfo,
                        'Sección': 'Sin Datos',
                        'Punto de Inspección': '-',
                        'Parámetro Evaluado': '-',
                        'Resultado / Valor': ''
                    });
                }
            });

        } else {
            // NORMAL SUMMARY FORMAT
            data = result.rows.map(row => ({
                'ID': row.id,
                'Fecha y Hora': new Date(row.date).toLocaleString('es-PE'),
                'Plantilla': row.template_name || 'Desconocida',
                'O.T. / Origen': row.ticket_number ? `OT: ${row.ticket_number}` : 'Rutina',
                'Ejecutado Por': row.executed_by_name || 'Desconocido',
                'Estado Global': row.overall_status || '',
                'Observaciones': row.observation || ''
            }));
        }

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);

        // Adjust column widths based on format
        if (format === 'database') {
            ws['!cols'] = [
                { wch: 12 }, // ID Ejecución
                { wch: 20 }, // Fecha y Hora
                { wch: 20 }, // Creado Por
                { wch: 25 }, // Plantilla
                { wch: 15 }, // OT / Origen
                { wch: 15 }, // Estado Global
                { wch: 35 }, // Observación General
                { wch: 30 }, // Sección
                { wch: 40 }, // Punto de Inspección
                { wch: 25 }, // Parámetro Evaluado
                { wch: 20 }  // Resultado / Valor
            ];
        } else {
            ws['!cols'] = [
                { wch: 8 },  // ID
                { wch: 20 }, // Fecha y Hora
                { wch: 30 }, // Plantilla
                { wch: 15 }, // OT / Origen
                { wch: 25 }, // Ejecutado Por
                { wch: 15 }, // Estado Global
                { wch: 50 }  // Observaciones
            ];
        }

        XLSX.utils.book_append_sheet(wb, ws, sheetName);

        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        const timestamp = new Date().toISOString().slice(0, 10);
        const fileName = format === 'database' ? `database_checklists_${timestamp}.xlsx` : `historial_checklists_${timestamp}.xlsx`;
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        res.send(buffer);
    } catch (error) {
        console.error('Error exportando checklists:', error);
        res.status(500).json({ error: 'Error al exportar checklists' });
    }
};

/**
 * Exportar Solicitudes de Materiales a Excel
 */
exports.exportMaterialRequests = async (req, res) => {
    try {
        const { status } = req.query;

        let query = `
            SELECT mr.*, u.name as user_name, m.name as machine_name,
                   wo.ticket_number
            FROM material_requests mr
            LEFT JOIN users u ON mr.user_id = u.id
            LEFT JOIN "Machines" m ON mr.machine_id = m.id
            LEFT JOIN work_orders wo ON mr.wo_id = wo.id
        `;
        const queryParams = [];

        if (status) {
            query += ` WHERE mr.status = $1`;
            queryParams.push(status);
        }

        query += ` ORDER BY mr.created_at DESC`;

        const result = await db.query(query, queryParams);
        const requests = result.rows;

        // Preparar datos para Excel
        const data = [];

        requests.forEach(req => {
            const baseData = {
                'ID SOLICITUD': req.id,
                'USUARIO': req.user_name || 'Desconocido',
                'EQUIPO DESTINO': req.machine_name || 'No especificado',
                'OT VINCULADA': req.ticket_number || 'N/A',
                'ESTADO': req.status || '',
                'FECHA CREACIÓN': req.created_at ? new Date(req.created_at).toLocaleDateString('es-PE') : '',
                'NOTAS': req.notes || ''
            };

            if (req.items && Array.isArray(req.items) && req.items.length > 0) {
                // Generar una fila por cada ítem
                req.items.forEach(item => {
                    data.push({
                        ...baseData,
                        'SKU': item.sku || '',
                        'DESCRIPCIÓN': item.description || '',
                        'CANT. SOLICITADA': item.quantity_requested || 0
                    });
                });
            } else {
                // Si la solicitud no tuviera ítems (caso borde), la insertamos vacía en ítems
                data.push({
                    ...baseData,
                    'SKU': '',
                    'DESCRIPCIÓN': 'Sin ítems',
                    'CANT. SOLICITADA': ''
                });
            }
        });

        // Crear libro de Excel
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);

        // Ajustar anchos de columna
        const colWidths = [
            { wch: 36 }, // ID
            { wch: 20 }, // Usuario
            { wch: 25 }, // Equipo
            { wch: 15 }, // OT
            { wch: 15 }, // Estado
            { wch: 15 }, // Fecha
            { wch: 30 }, // Notas
            { wch: 15 }, // SKU
            { wch: 40 }, // Descripción
            { wch: 18 }  // Cant. Solicitada
        ];
        ws['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws, 'Solicitudes de Materiales');

        // Generar buffer
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        // Configurar headers para descarga
        const timestamp = new Date().toISOString().slice(0, 10);
        res.setHeader('Content-Disposition', `attachment; filename=solicitudes_materiales_${timestamp}.xlsx`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        res.send(buffer);
    } catch (error) {
        console.error('Error exportando solicitudes de materiales:', error);
        res.status(500).json({ error: 'Error al exportar solicitudes de materiales' });
    }
};

/**
 * Exportar Reparaciones a Excel
 */
exports.exportRepairs = async (req, res) => {
    try {
        const { status } = req.query;

        // Construir filtros
        const where = {};
        if (status && status !== 'ALL') {
            where.status = status;
        }

        const { RepairRecord } = require('../models');

        const repairs = await RepairRecord.findAll({
            where,
            include: [
                {
                    model: Machine,
                    attributes: ['id', 'name'],
                    include: [
                        {
                            model: Area,
                            attributes: ['id', 'name'],
                            include: [
                                {
                                    model: Plant,
                                    attributes: ['id', 'name']
                                }
                            ]
                        }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        const data = repairs.map(repair => ({
            'ID REPARACIÓN': repair.id.substring(0, 8),
            'PLANTA': repair.Machine?.Area?.Plant?.name || '',
            'ÁREA': repair.Machine?.Area?.name || '',
            'MÁQUINA': repair.Machine?.name || `Máquina ID: ${repair.machine_id}`,
            'REPUESTO / PIEZA': repair.part_name || '',
            'DESCRIPCIÓN FALLA': repair.issue_description || '',
            'PROVEEDOR / TALLER': repair.supplier_name || '',
            'FECHA ENVÍO': repair.sent_date ? new Date(repair.sent_date).toLocaleDateString('es-PE') : '',
            'RETORNO ESTIMADO': repair.expected_return_date ? new Date(repair.expected_return_date).toLocaleDateString('es-PE') : '',
            'FECHA RETORNO REAL': repair.return_date ? new Date(repair.return_date).toLocaleDateString('es-PE') : '',
            'ESTADO': repair.status || '',
            'COSTO REPARACIÓN': repair.repair_cost || '',
            'NOTAS REPARACIÓN': repair.repair_notes || ''
        }));

        // Crear libro de Excel
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);

        // Ajustar anchos de columna
        const colWidths = [
            { wch: 15 }, // ID REPARACIÓN
            { wch: 20 }, // PLANTA
            { wch: 20 }, // ÁREA
            { wch: 30 }, // MÁQUINA
            { wch: 30 }, // REPUESTO / PIEZA
            { wch: 40 }, // DESCRIPCIÓN FALLA
            { wch: 30 }, // PROVEEDOR / TALLER
            { wch: 15 }, // FECHA ENVÍO
            { wch: 18 }, // RETORNO ESTIMADO
            { wch: 20 }, // FECHA RETORNO REAL
            { wch: 15 }, // ESTADO
            { wch: 20 }, // COSTO REPARACIÓN
            { wch: 40 }  // NOTAS REPARACIÓN
        ];
        ws['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws, 'Reparaciones Externas');

        // Generar buffer
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        // Configurar headers para descarga
        const timestamp = new Date().toISOString().slice(0, 10);
        res.setHeader('Content-Disposition', `attachment; filename=reparaciones_externas_${timestamp}.xlsx`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        res.send(buffer);
    } catch (error) {
        console.error('Error exportando reparaciones:', error);
        res.status(500).json({ error: 'Error al exportar reparaciones' });
    }
};

/**
 * Exportar Pedidos de Compra a Excel
 */
exports.exportPurchaseRequests = async (req, res) => {
    try {
        const { status } = req.query;

        // Construir filtros
        const where = {};
        if (status && status !== 'ALL') {
            where.status = status;
        }

        const { PurchaseRequest } = require('../models');

        const requests = await PurchaseRequest.findAll({
            where,
            include: [
                {
                    model: Machine,
                    attributes: ['id', 'name'],
                    include: [
                        {
                            model: Area,
                            attributes: ['id', 'name'],
                            include: [
                                {
                                    model: Plant,
                                    attributes: ['id', 'name']
                                }
                            ]
                        }
                    ]
                },
                {
                    model: User,
                    as: 'Requester',
                    attributes: ['id', 'name']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        // Preparar datos para Excel
        const data = requests.map(req => ({
            'ID PEDIDO': req.id.substring(0, 8),
            'REPUESTO / MATERIAL': req.part_name || '',
            'N° PARTE / SKU': req.part_number || '',
            'CANTIDAD': req.quantity || 0,
            'MÁQUINA DESTINO': req.Machine?.name || 'No especificada',
            'ÁREA': req.Machine?.Area?.name || '',
            'PLANTA': req.Machine?.Area?.Plant?.name || '',
            'PRIORIDAD': req.priority || '',
            'ESTADO': req.status || '',
            'PROV. SUGERIDO': req.suggested_supplier || '',
            'N° ORDEN COMPRA': req.po_number || '',
            'JUSTIFICACIÓN': req.justification || '',
            'SOLICITANTE': req.Requester?.name || '',
            'FECHA SOLICITUD': req.createdAt ? new Date(req.createdAt).toLocaleDateString('es-PE') : ''
        }));

        // Crear libro de Excel
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);

        // Ajustar anchos de columna
        const colWidths = [
            { wch: 12 }, // ID PEDIDO
            { wch: 40 }, // REPUESTO
            { wch: 20 }, // N° PARTE
            { wch: 10 }, // CANTIDAD
            { wch: 30 }, // MÁQUINA
            { wch: 20 }, // ÁREA
            { wch: 15 }, // PLANTA
            { wch: 15 }, // PRIORIDAD
            { wch: 15 }, // ESTADO
            { wch: 25 }, // PROV SUGERIDO
            { wch: 20 }, // OC
            { wch: 50 }, // JUSTIFICACIÓN
            { wch: 25 }, // SOLICITANTE
            { wch: 18 }  // FECHA SOLICITUD
        ];
        XLSX.utils.book_append_sheet(wb, ws, 'Pedidos de Compra');

        // Generar buffer
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        // Configurar headers para descarga
        const timestamp = new Date().toISOString().slice(0, 10);
        res.setHeader('Content-Disposition', `attachment; filename=pedidos_compra_${timestamp}.xlsx`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        res.send(buffer);
    } catch (error) {
        console.error('Error exportando pedidos de compra:', error);
        res.status(500).json({ error: 'Error al exportar pedidos de compra' });
    }
};
/**
 * Exportar órdenes preventivas a Excel
 */
exports.exportPreventiveOrders = async (req, res) => {
    try {
        const { status } = req.query;
        const { PreventiveExecution, PreventivePlan } = require('../models');

        // Construir filtros
        const where = {};
        if (status && status !== 'ALL') {
            where.status = status;
        }

        // Opcional: Si necesitas los nombres de los equipos desde machine_ids, puedes obtenerlos aquí
        // Pero para el reporte rápido, usaremos la lógica de texto.

        const executions = await PreventiveExecution.findAll({
            where,
            include: [
                { model: Plant, attributes: ['name'] },
                { model: Area, attributes: ['name'] },
                { 
                    model: PreventivePlan, 
                    attributes: ['name'],
                    include: [{ model: Machine, attributes: ['name'] }]
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        // Preparar datos para Excel
        const data = executions.map(exe => ({
            'ID PREVENTIVO': exe.id,
            'PLANTA': exe.Plant?.name || '',
            'ÁREA': exe.Area?.name || '',
            'EQUIPO': exe.PreventivePlan?.Machine?.name || (exe.machine_ids?.length > 0 ? 'Múltiples Equipos' : 'Equipo General'),
            'PLAN APLICADO': exe.PreventivePlan?.name || 'Manual',
            'ESTADO': exe.status || '',
            'CONDICIÓN EQUIPO': exe.equipment_condition || '',
            'CRITICIDAD': exe.criticality || '',
            'ACCIÓN REALIZADA': exe.action_performed || '',
            'FECHA PROGRAMADA': exe.scheduled_date ? new Date(exe.scheduled_date).toLocaleDateString('es-PE') : '',
            'FECHA INICIO': exe.start_date ? new Date(exe.start_date).toLocaleDateString('es-PE') : '',
            'FECHA FIN': exe.end_date ? new Date(exe.end_date).toLocaleDateString('es-PE') : '',
            'LÍDER TÉCNICO': exe.leader_technician_name || '',
            'SUPERVISOR': exe.supervisor_name || '',
            'OBSERVACIONES GENERALES': exe.general_observations || ''
        }));

        // Crear libro de Excel
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);

        // Ajustar anchos de columna
        const colWidths = [
            { wch: 15 }, // ID
            { wch: 15 }, // Planta
            { wch: 15 }, // Área
            { wch: 25 }, // Equipo
            { wch: 30 }, // Plan
            { wch: 15 }, // Estado
            { wch: 18 }, // Condición
            { wch: 12 }, // Criticidad
            { wch: 40 }, // Acción
            { wch: 18 }, // Fecha Prog
            { wch: 15 }, // Inicio
            { wch: 15 }, // Fin
            { wch: 20 }, // Técnico
            { wch: 20 }, // Supervisor
            { wch: 40 }  // Obs
        ];
        ws['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws, 'Órdenes Preventivas');

        // Generar buffer
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        // Configurar headers para descarga
        const timestamp = new Date().toISOString().slice(0, 10);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=preventivos_${timestamp}.xlsx`);

        res.send(buffer);
    } catch (error) {
        console.error('Error exportando preventivos:', error);
        res.status(500).json({ error: 'Error al exportar preventivos' });
    }
};

/**
 * Exportar una ÚNICA orden preventiva detallada a Excel
 */
exports.exportSinglePreventiveOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { PreventiveExecution, PreventivePlan } = require('../models');

        const exe = await PreventiveExecution.findByPk(id, {
            include: [
                { model: Plant, attributes: ['name'] },
                { model: Area, attributes: ['name'] },
                { 
                    model: PreventivePlan, 
                    attributes: ['name'],
                    include: [{ model: Machine, attributes: ['name'] }]
                }
            ]
        });

        if (!exe) return res.status(404).json({ error: 'Orden no encontrada' });

        const wb = XLSX.utils.book_new();

        // Hoja 1: Información General
        const generalInfo = [
            { 'CAMPO': 'ID ORDEN', 'VALOR': exe.id },
            { 'CAMPO': 'PLAN / NOMBRE', 'VALOR': exe.PreventivePlan?.name || 'MANUAL' },
            { 'CAMPO': 'EQUIPO', 'VALOR': exe.PreventivePlan?.Machine?.name || 'MÚLTIPLES' },
            { 'CAMPO': 'PLANTA', 'VALOR': exe.Plant?.name || '' },
            { 'CAMPO': 'ÁREA', 'VALOR': exe.Area?.name || '' },
            { 'CAMPO': 'ESTADO', 'VALOR': exe.status || '' },
            { 'CAMPO': 'CRITICIDAD', 'VALOR': exe.criticality || '' },
            { 'CAMPO': 'CONDICIÓN EQUIPO', 'VALOR': exe.equipment_condition || '' },
            { 'CAMPO': 'FECHA INICIO', 'VALOR': exe.start_date || '' },
            { 'CAMPO': 'HORA INICIO', 'VALOR': exe.start_time || '' },
            { 'CAMPO': 'FECHA FIN', 'VALOR': exe.end_date || '' },
            { 'CAMPO': 'HORA FIN', 'VALOR': exe.end_time || '' },
            { 'CAMPO': 'TÉCNICO LÍDER', 'VALOR': exe.leader_technician_name || '' },
            { 'CAMPO': 'SUPERVISOR', 'VALOR': exe.supervisor_name || '' },
            { 'CAMPO': 'EQUIPO TÉCNICO', 'VALOR': exe.responsible_technicians?.join(', ') || '' },
            { 'CAMPO': 'OBSERVACIONES', 'VALOR': exe.general_observations || '' },
            { 'CAMPO': 'TRABAJO EFECTUADO', 'VALOR': exe.action_performed || '' }
        ];
        const ws1 = XLSX.utils.json_to_sheet(generalInfo);
        ws1['!cols'] = [{ wch: 25 }, { wch: 60 }];
        XLSX.utils.book_append_sheet(wb, ws1, 'Resumen General');

        // Hoja 2: Protocolo de Actividades
        const tasks = (exe.task_results || []).map(t => ({
            'CÓDIGO': t.task_code || 'MEC',
            'DESCRIPCIÓN DE LA TAREA': t.task_description,
            'ESTADO': t.checked ? 'COMPLETADO' : 'PENDIENTE',
            'OBSERVACIÓN TÉCNICA': t.observation || ''
        }));
        const ws2 = XLSX.utils.json_to_sheet(tasks);
        ws2['!cols'] = [{ wch: 10 }, { wch: 60 }, { wch: 15 }, { wch: 40 }];
        XLSX.utils.book_append_sheet(wb, ws2, 'Protocolo de Actividades');

        // Hoja 3: Repuestos Utilizados
        const spares = (exe.spare_results || []).map(s => ({
            'NOMBRE DEL REPUESTO': s.name,
            'CANT. PREVISTA': s.expected_quantity || 0,
            'CANT. UTILIZADA': s.used_quantity || 0,
            'UNIDAD': 'UN.'
        }));
        const ws3 = XLSX.utils.json_to_sheet(spares);
        ws3['!cols'] = [{ wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 10 }];
        XLSX.utils.book_append_sheet(wb, ws3, 'Repuestos y Materiales');

        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=orden_preventiva_${id}.xlsx`);
        res.send(buffer);
    } catch (error) {
        console.error('Error exportando orden preventiva individual:', error);
        res.status(500).json({ error: 'Error al exportar orden' });
    }
};

/**
 * Exportar el PLAN MAESTRO de mantenimiento preventivo a Excel
 */
exports.exportPreventivePlansMaster = async (req, res) => {
    try {
        const { PreventivePlan } = require('../models');

        const plans = await PreventivePlan.findAll({
            include: [{ model: Machine, attributes: ['name'] }],
            order: [['name', 'ASC']]
        });

        const data = plans.map(p => ({
            'ID': p.id,
            'NOMBRE DEL PLAN': p.name || '',
            'EQUIPO': p.Machine?.name || 'GENERICO',
            'FRECUENCIA (DÍAS)': p.frequency_days || 'No definida',
            'N° TAREAS': p.tasks?.length || 0,
            'N° REPUESTOS': p.spares?.length || 0,
            'ESTADO': p.is_active ? 'ACTIVO' : 'INACTIVO'
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);

        // Column widths
        ws['!cols'] = [
            { wch: 10 }, // ID
            { wch: 40 }, // Nombre
            { wch: 25 }, // Equipo
            { wch: 20 }, // Frecuencia
            { wch: 12 }, // Tareas
            { wch: 15 }, // Repuestos
            { wch: 10 }  // Estado
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'Plan Maestro Preventivo');

        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=plan_maestro_preventivo.xlsx`);
        res.send(buffer);
    } catch (error) {
        console.error('Error exportando plan maestro:', error);
        res.status(500).json({ error: 'Error al exportar plan maestro' });
    }
};
