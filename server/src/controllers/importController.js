const XLSX = require('xlsx');
const { WorkOrder, Plant, Area, Machine, SubMachine, User } = require('../models');
const { Op } = require('sequelize');

/**
 * Importar órdenes de trabajo desde Excel
 */
exports.importWorkOrders = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No se subió ningún archivo' });
        }

        // Leer archivo desde buffer
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Convertir a JSON
        const data = XLSX.utils.sheet_to_json(sheet);

        if (!data || data.length === 0) {
            return res.status(400).json({ message: 'El archivo está vacío o no tiene formato válido' });
        }

        const results = {
            total: data.length,
            success: 0,
            errors: [],
            imported_ids: []
        };

        // Cache para evitar múltiples consultas repetidas
        const cache = {
            plants: {},
            areas: {},
            machines: {},
            submachines: {},
            users: {} // Para técnicos si es necesario
        };

        // Helper para resolver IDs
        const resolveId = async (model, name, cacheKey, whereClause = {}) => {
            if (!name) return null;
            const key = name.toString().trim().toUpperCase();
            if (cache[cacheKey][key]) return cache[cacheKey][key];

            const item = await model.findOne({
                where: {
                    ...whereClause,
                    name: { [Op.iLike]: name.trim() } // Case insensitive search
                }
            });

            if (item) {
                cache[cacheKey][key] = item.id;
                return item.id;
            }
            return null;
        };

        // Procesar fila por fila
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNum = i + 2; // Excel header is row 1

            try {
                // Validación básica de campos requeridos
                // Campos mínimos: nada es estrictamente obligatorio en BD salvo lo que definamos, 
                // pero ticket_number se genera auto.
                // Validamos que al menos tenga algo de info útil.

                // Resolver relaciones
                const plantId = await resolveId(Plant, row['PLANTA'], 'plants');
                const areaId = await resolveId(Area, row['ÁREA'] || row['AREA'], 'areas', plantId ? { plantId } : {});
                const machineId = await resolveId(Machine, row['EQUIPO'], 'machines', areaId ? { areaId } : {});
                const subMachineId = await resolveId(SubMachine, row['SUB-EQUIPO'] || row['SUB EQUIPO'], 'submachines', machineId ? { machineId } : {});

                // Generar número de ticket
                const year = new Date().getFullYear();
                const count = await WorkOrder.count();
                // Ojala no haya colisiones en concurrencia (esto es simple, para prod serio usar transacciones/locking o secuencia DB)
                // En importación masiva secuencial debería estar bien.
                // Importante: count + 1 + i (para este batch) NO sirve porque otros pueden estar creando OTs.
                // Mejor: consultar count en cada iteración o usar un offset seguro. 
                // Por simplicidad haremos query en cada uno, aunque es lento.
                // Optimización: count inicial + i. Riesgo bajo si solo un usuario importa.
                const ticket_number = `OT-${year}-${String(count + 1 + i).padStart(4, '0')}`;

                // Mapear fechas (Excel a JS Date)
                const parseDate = (xlsxDate) => {
                    if (!xlsxDate) return null;
                    if (typeof xlsxDate === 'number') {
                        // Excel date to JS date
                        return new Date((xlsxDate - (25567 + 2)) * 86400 * 1000);
                    }
                    return new Date(xlsxDate);
                };

                const startDate = parseDate(row['FECHA INICIO']);
                const endDate = parseDate(row['FECHA FIN']);

                // Crear objeto WorkOrder
                const newWorkOrder = {
                    ticket_number,
                    plant_id: plantId,
                    area_id: areaId,
                    machine_id: machineId,
                    sub_machine_id: subMachineId,

                    order_class: row['CLASE DE ORDEN']?.toUpperCase() || 'CORRECTIVO',
                    planning_group: row['GRUPO DE PLANIFICACIÓN']?.toUpperCase() || null,
                    priority: row['PRIORIDAD']?.toUpperCase() || 'MEDIA',
                    status: row['ESTADO']?.toUpperCase() || 'ABIERTA',
                    equipment_condition: row['CONDICIÓN EQUIPO'] || null,

                    start_date: startDate,
                    end_date: endDate,

                    technician_id: row['TÉCNICO'] || row['TECNICO'] || null, // Guardamos texto directo por ahora según modelo actual

                    failure_description: row['DESCRIPCIÓN FALLA'] || row['DESCRIPCION'] || null,
                    failure_cause: row['CAUSA FALLA'] || null,
                    action_taken: row['ACCIÓN TOMADA'] || null,
                    materials_used: row['MATERIALES'] || null,
                    observations: row['OBSERVACIONES'] || null,

                    requester_id: req.user.id // Asignar al usuario que importa
                };

                // Validar Enums si es posible (opcional, sequelize lo hará)

                await WorkOrder.create(newWorkOrder);
                results.success++;
                results.imported_ids.push(ticket_number);

            } catch (error) {
                console.error(`Error en fila ${rowNum}:`, error);
                results.errors.push({
                    row: rowNum,
                    message: error.message,
                    data: row
                });
            }
        }

        res.json({
            message: 'Importación completada',
            results
        });

    } catch (error) {
        console.error('Error general de importación:', error);
        res.status(500).json({ message: 'Error procesando el archivo de importación' });
    }
};

/**
 * Descargar plantilla de ejemplo
 */
exports.downloadTemplate = (req, res) => {
    try {
        const wb = XLSX.utils.book_new();

        // Encabezados
        const headers = [
            'PLANTA', 'AREA', 'EQUIPO', 'SUB-EQUIPO',
            'CLASE DE ORDEN', 'GRUPO DE PLANIFICACIÓN', 'PRIORIDAD', 'ESTADO', 'CONDICIÓN EQUIPO',
            'FECHA INICIO', 'FECHA FIN',
            'TECNICO',
            'DESCRIPCIÓN FALLA', 'CAUSA FALLA', 'ACCIÓN TOMADA',
            'MATERIALES', 'OBSERVACIONES'
        ];

        // Datos de ejemplo
        const sampleData = [
            {
                'PLANTA': 'SURCO',
                'AREA': 'EXTRUSION',
                'EQUIPO': 'SML 1',
                'SUB-EQUIPO': 'EXTRUSOR',
                'CLASE DE ORDEN': 'PREVENTIVO',
                'GRUPO DE PLANIFICACIÓN': 'MECANICO',
                'PRIORIDAD': 'MEDIA',
                'ESTADO': 'CERRADA',
                'CONDICIÓN EQUIPO': 'PARADO',
                'FECHA INICIO': '2026-02-01',
                'FECHA FIN': '2026-02-01',
                'TECNICO': 'LBERROSPI',
                'DESCRIPCIÓN FALLA': 'Cambio de filtros',
                'CAUSA FALLA': 'Desgaste normal',
                'ACCIÓN TOMADA': 'Se cambiaron filtros de malla 80',
                'MATERIALES': 'Malla 80x10',
                'OBSERVACIONES': 'Todo ok'
            }
        ];

        const ws = XLSX.utils.json_to_sheet(sampleData, { header: headers });

        // Ajustar anchos
        ws['!cols'] = headers.map(() => ({ wch: 20 }));

        XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Carga Masiva');

        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Disposition', 'attachment; filename=plantilla_carga_ots.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);

    } catch (error) {
        console.error('Error generando plantilla:', error);
        res.status(500).json({ message: 'Error generando plantilla' });
    }
};

/**
 * Importar inventario desde Excel
 */
exports.importInventory = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No se subió ningún archivo' });
        }

        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const data = XLSX.utils.sheet_to_json(sheet);

        if (!data || data.length === 0) {
            return res.status(400).json({ message: 'El archivo está vacío o no tiene formato válido' });
        }

        const results = {
            total: data.length,
            success: 0,
            errors: [],
            imported_ids: []
        };

        const { Inventory } = require('../models');

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNum = i + 2;

            try {
                // Mapeo básico y validación
                const code = row['CÓDIGO'] || row['CODIGO'];
                const name = row['NOMBRE'] || row['ITEM'];

                if (!code || !name) {
                    throw new Error('Código y Nombre son obligatorios');
                }

                // Verificar si existe para actualizar o crear
                let item = await Inventory.findOne({ where: { code: code.toString() } });

                const itemData = {
                    code: code.toString(),
                    name: name,
                    description: row['DESCRIPCIÓN'] || row['DESCRIPCION'] || null,
                    category: row['CATEGORÍA'] || row['CATEGORIA'] || 'GENERAL',
                    location: row['UBICACIÓN'] || row['UBICACION'] || null,
                    current_stock: Number(row['STOCK ACTUAL']) || 0,
                    min_stock: Number(row['STOCK MÍNIMO']) || 0,
                    unit: row['UNIDAD'] || 'UND',
                    cost: Number(row['COSTO UNITARIO']) || 0,
                    supplier: row['PROVEEDOR'] || null
                };

                if (item) {
                    await item.update(itemData);
                } else {
                    await Inventory.create(itemData);
                }

                results.success++;
                results.imported_ids.push(code);

            } catch (error) {
                results.errors.push({
                    row: rowNum,
                    message: error.message,
                    data: row
                });
            }
        }

        res.json({
            message: 'Importación de inventario completada',
            results
        });

    } catch (error) {
        console.error('Error importando inventario:', error);
        res.status(500).json({ message: 'Error procesando archivo' });
    }
};

/**
 * Descargar plantilla de inventario
 */
exports.downloadInventoryTemplate = (req, res) => {
    try {
        const wb = XLSX.utils.book_new();

        const headers = [
            'CÓDIGO', 'NOMBRE', 'DESCRIPCIÓN', 'CATEGORÍA',
            'UBICACIÓN', 'STOCK ACTUAL', 'STOCK MÍNIMO',
            'UNIDAD', 'COSTO UNITARIO', 'PROVEEDOR'
        ];

        const sampleData = [
            {
                'CÓDIGO': 'ELEC-001',
                'NOMBRE': 'Contactor 24V',
                'DESCRIPCIÓN': 'Contactor marca Schneider',
                'CATEGORÍA': 'ELÉCTRICO',
                'UBICACIÓN': 'A-12',
                'STOCK ACTUAL': 10,
                'STOCK MÍNIMO': 2,
                'UNIDAD': 'UND',
                'COSTO UNITARIO': 45.50,
                'PROVEEDOR': 'Rexel'
            }
        ];

        const ws = XLSX.utils.json_to_sheet(sampleData, { header: headers });
        ws['!cols'] = headers.map(() => ({ wch: 15 }));

        XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Inventario');

        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Disposition', 'attachment; filename=plantilla_inventario.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);

    } catch (error) {
        console.error('Error generando plantilla:', error);
        res.status(500).json({ message: 'Error generando plantilla' });
    }
};
