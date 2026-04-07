const { WorkOrder, Machine, Plant, Area, SubMachine, PreventiveExecution } = require('../models');
const Inventory = require('../models/Inventory');
const { Op } = require('sequelize');
const sequelize = require('../config/sequelize');

// @desc    Get Dashboard KPIs
// @route   GET /api/dashboard
// @access  Private
const getDashboardStats = async (req, res) => {
    try {
        // Extract filter parameters
        const { month, year, plantId, areaId } = req.query;

        console.log('📊 Dashboard filters:', { month, year, plantId, areaId });

        // Helper function to get total hours for period
        const getTotalHours = (year, month) => {
            if (month) {
                const daysInMonth = new Date(year, month, 0).getDate();
                return 24 * daysInMonth;
            }
            return 24 * 365; // Annual
        };

        // Build date filter for SQL queries
        let dateFilter = '';
        if (year && month) {
            dateFilter = `AND EXTRACT(YEAR FROM wo."start_date") = ${year} AND EXTRACT(MONTH FROM wo."start_date") = ${month}`;
        } else if (year) {
            dateFilter = `AND EXTRACT(YEAR FROM wo."start_date") = ${year}`;
        }

        // Build area filter for SQL queries
        let areaFilter = areaId ? `AND wo."area_id" = ${areaId}` : '';

        // Build date filter for Sequelize queries
        let dateWhere = {};
        if (year && month) {
            dateWhere.start_date = {
                [Op.and]: [
                    sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('YEAR FROM "start_date"')), year),
                    sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('MONTH FROM "start_date"')), month)
                ]
            };
        } else if (year) {
            dateWhere.start_date = sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('YEAR FROM "start_date"')), year);
        }

        // Add area filter to dateWhere
        if (areaId) {
            dateWhere.area_id = areaId;
        }

        console.log('🔍 Date filters built:', { dateFilter, hasDateWhere: Object.keys(dateWhere).length > 0 });

        // 1. Total Assets (Using Asset model)
        const totalAssets = await require('../models').Asset.count();

        // 2. Open Work Orders (with filters)
        let openWOWhere = { status: 'ABIERTA', ...dateWhere };
        let openWOInclude = [];
        if (plantId) {
            openWOInclude.push({
                model: Area,
                attributes: [],
                where: { plantId },
                required: true
            });
        }
        console.log('📋 Open WO where clause:', openWOWhere, 'plantFilter:', plantId ? 'yes' : 'no');
        const openWOCount = await WorkOrder.count({
            where: openWOWhere,
            include: openWOInclude,
            distinct: true
        });

        // 3. Low Stock Items - query inventory for real data
        const sinStockCount = await Inventory.count({
            where: { current_stock: 0 }
        });
        const bajoMinimoCount = await Inventory.count({
            where: {
                current_stock: { [Op.gt]: 0, [Op.lte]: sequelize.col('min_stock') }
            }
        });
        const lowStockCount = sinStockCount + bajoMinimoCount;

        // 4. Total Cost of COMPLETED Material Requests
        // Each MR has items JSONB: [{id, sku, quantity_requested, ...}]
        // We join each item to inventory to get cost per unit
        let mrDateFilter = '';
        if (year && month) {
            mrDateFilter = `AND EXTRACT(YEAR FROM mr.updated_at) = ${year} AND EXTRACT(MONTH FROM mr.updated_at) = ${month}`;
        } else if (year) {
            mrDateFilter = `AND EXTRACT(YEAR FROM mr.updated_at) = ${year}`;
        }

        const costResult = await sequelize.query(
            `SELECT COALESCE(SUM(
                (item->>'quantity_requested')::numeric * inv.cost
            ), 0) AS total_cost
            FROM material_requests mr
            CROSS JOIN LATERAL jsonb_array_elements(mr.items::jsonb) AS item
            LEFT JOIN inventory inv ON inv.id = (item->>'id')::integer
            WHERE mr.status = 'Completado'
            ${mrDateFilter}`,
            { type: sequelize.QueryTypes.SELECT, raw: true }
        );
        const monthlyCost = parseFloat(costResult[0]?.total_cost || 0).toFixed(2);

        // 5. Work Order Status Distribution (with filters)
        let statusInclude = [];
        if (plantId) {
            statusInclude.push({
                model: Area,
                attributes: [],
                where: { plantId },
                required: true
            });
        }
        const statusDist = await WorkOrder.findAll({
            where: dateWhere,
            include: statusInclude,
            attributes: [
                'status',
                [sequelize.fn('COUNT', sequelize.col('WorkOrder.id')), 'count']
            ],
            group: ['status']
        });

        // 6. Man-Hours by Technician (handling comma-separated names, with filters)
        let manHoursWhere = {
            ...dateWhere,
            start_date: { [Op.ne]: null },
            end_date: { [Op.ne]: null },
            start_time: { [Op.ne]: null },
            end_time: { [Op.ne]: null },
            technician_id: { [Op.ne]: null }
        };
        let manHoursInclude = [];
        if (plantId) {
            manHoursInclude.push({
                model: Area,
                attributes: [],
                where: { plantId },
                required: true
            });
        }
        const workOrders = await WorkOrder.findAll({
            where: manHoursWhere,
            include: manHoursInclude,
            attributes: ['technician_id', 'start_date', 'start_time', 'end_date', 'end_time'],
            raw: true
        });

        // 6.b Fetch Preventive executions for man-hours
        let pmWhere = {
            ...dateWhere,
            start_date: { [Op.ne]: null },
            end_date: { [Op.ne]: null },
            status: 'COMPLETADO'
        };
        const pmExecutions = await PreventiveExecution.findAll({
            where: pmWhere,
            include: plantId ? [{ model: Area, attributes: [], where: { plantId }, required: true }] : [],
            attributes: ['leader_technician_name', 'responsible_technicians', 'start_date', 'start_time', 'end_date', 'end_time'],
            raw: true
        });

        // Process each work order and split technicians
        const technicianHours = {};
        workOrders.forEach(wo => {
            // Calculate hours for this work order
            const startDateTime = new Date(`${wo.start_date}T${wo.start_time}`);
            const endDateTime = new Date(`${wo.end_date}T${wo.end_time}`);
            const totalHours = (endDateTime - startDateTime) / (1000 * 60 * 60); // Convert ms to hours

            // Split technician names by comma and trim whitespace
            const technicians = wo.technician_id.split(',').map(t => t.trim());
            const hoursPerTech = totalHours / technicians.length; // Divide hours equally

            technicians.forEach(tech => {
                if (tech) { // Skip empty strings
                    technicianHours[tech] = (technicianHours[tech] || 0) + hoursPerTech;
                }
            });
        });

        // Process Preventive Executions for technician hours
        pmExecutions.forEach(pm => {
            const startDateTime = new Date(`${pm.start_date}T${pm.start_time || '00:00:00'}`);
            const endDateTime = new Date(`${pm.end_date}T${pm.end_time || '00:00:00'}`);
            const totalHours = Math.max(0, (endDateTime - startDateTime) / (1000 * 60 * 60));
            const technicians = [pm.leader_technician_name, ...(pm.responsible_technicians || [])].filter(t => t && t.trim()).map(t => t.trim());
            if (technicians.length > 0) {
                const hoursPerTech = totalHours / technicians.length;
                technicians.forEach(tech => {
                    technicianHours[tech] = (technicianHours[tech] || 0) + hoursPerTech;
                });
            }
        });

        // Convert to array format
        const manHoursByTechnician = Object.entries(technicianHours).map(([tech, hours]) => ({
            technician: tech,
            hours: parseFloat(hours).toFixed(2)
        }));

        // 7. Work Order Count by Technician (handling comma-separated names, with filters)
        let woCountWhere = {
            ...dateWhere,
            technician_id: { [Op.ne]: null }
        };
        let woCountInclude = [];
        if (plantId) {
            woCountInclude.push({
                model: Area,
                attributes: [],
                where: { plantId },
                required: true
            });
        }
        const workOrdersForCount = await WorkOrder.findAll({
            where: woCountWhere,
            include: woCountInclude,
            attributes: ['technician_id'],
            raw: true
        });

        // Add PM counts
        const pmExecutionsForCount = await PreventiveExecution.findAll({
            where: pmWhere,
            include: plantId ? [{ model: Area, attributes: [], where: { plantId }, required: true }] : [],
            attributes: ['leader_technician_name', 'responsible_technicians'],
            raw: true
        });

        // Count work orders per technician
        const technicianWOCount = {};
        workOrdersForCount.forEach(wo => {
            const technicians = wo.technician_id.split(',').map(t => t.trim());
            technicians.forEach(tech => {
                if (tech) {
                    technicianWOCount[tech] = (technicianWOCount[tech] || 0) + 1;
                }
            });
        });

        // Count PM executions per technician
        pmExecutionsForCount.forEach(pm => {
            const technicians = [pm.leader_technician_name, ...(pm.responsible_technicians || [])].filter(t => t && t.trim()).map(t => t.trim());
            technicians.forEach(tech => {
                technicianWOCount[tech] = (technicianWOCount[tech] || 0) + 1;
            });
        });

        // Convert to array format
        const woCountByTechnician = Object.entries(technicianWOCount).map(([tech, count]) => ({
            technician: tech,
            count: count
        }));

        // 8. Availability by Area (refined calculation with filters)
        // Formula: Availability % = (Total Hours - Downtime Hours) / Total Hours × 100
        // Total Hours = dynamic based on period selected
        // Downtime = Work orders where order_class is:
        //   - EMERGENCIA (emergency repairs)
        //   - CORRECTIVO_PROGRAMADO (planned corrective maintenance)

        // Build plant filter for SQL query
        let plantFilter = plantId ? `AND a."plantId" = ${plantId}` : '';

        const workOrdersWithArea = await sequelize.query(
            `SELECT 
                wo."area_id",
                wo."start_date",
                wo."start_time",
                wo."end_date",
                wo."end_time",
                wo."order_class",
                wo."equipment_condition",
                a."name" AS "Area.name"
             FROM "WorkOrders" wo
             INNER JOIN "Areas" a ON wo."area_id" = a."id"
             WHERE 
                wo."start_date" IS NOT NULL 
                AND wo."end_date" IS NOT NULL
                AND wo."start_time" IS NOT NULL  
                AND wo."end_time" IS NOT NULL
                AND wo."area_id" IS NOT NULL
                AND (
                    wo."order_class" = 'EMERGENCIA'
                    OR wo."order_class" = 'CORRECTIVO_PROGRAMADO'
                )
                ${dateFilter}
                ${plantFilter}
                ${areaFilter}`,
            {
                type: sequelize.QueryTypes.SELECT,
                raw: true
            }
        );

        // Calculate downtime per area (only stopped equipment)
        const areaDowntime = {};
        workOrdersWithArea.forEach(wo => {
            const areaName = wo['Area.name'];
            if (!areaName) return;

            const startDateTime = new Date(`${wo.start_date}T${wo.start_time}`);
            const endDateTime = new Date(`${wo.end_date}T${wo.end_time}`);
            const downtimeHours = (endDateTime - startDateTime) / (1000 * 60 * 60);

            areaDowntime[areaName] = (areaDowntime[areaName] || 0) + downtimeHours;
        });

        // Calculate availability percentage using dynamic total hours
        const TOTAL_HOURS = getTotalHours(year || new Date().getFullYear(), month);
        const availabilityByArea = Object.entries(areaDowntime).map(([area, downtime]) => ({
            area: area,
            availability: parseFloat(((TOTAL_HOURS - downtime) / TOTAL_HOURS * 100).toFixed(2))
        }));

        // If an area has no downtime records, it should show 100% availability
        // Get all areas (filtered by plant if needed) to ensure they all appear
        let areaWhere = {};
        if (plantId) {
            areaWhere.plantId = plantId;
        }
        const allAreas = await Area.findAll({
            where: areaWhere,
            attributes: ['name'],
            raw: true
        });

        allAreas.forEach(areaObj => {
            const areaName = areaObj.name;
            if (!availabilityByArea.find(item => item.area === areaName)) {
                availabilityByArea.push({
                    area: areaName,
                    availability: 100.0
                });
            }
        });

        // 9. Availability by Order Class (showing downtime impact of each order type)
        const workOrdersByClass = await sequelize.query(
            `SELECT 
                wo."id",
                wo."order_class",
                wo."start_date",
                wo."start_time",
                wo."end_date",
                wo."end_time",
                m."name" AS "machine_name"
             FROM "WorkOrders" wo
             INNER JOIN "Areas" a ON wo."area_id" = a."id"
             LEFT JOIN "Machines" m ON wo."machine_id" = m."id"
             WHERE 
                wo."start_date" IS NOT NULL 
                AND wo."end_date" IS NOT NULL
                AND wo."start_time" IS NOT NULL  
                AND wo."end_time" IS NOT NULL
                ${dateFilter}
                ${plantFilter}
                ${areaFilter}`,
            {
                type: sequelize.QueryTypes.SELECT,
                raw: true
            }
        );

        // Fetch Preventive Executions for Downtime by Class
        const pmResults = await PreventiveExecution.findAll({
            where: {
                ...dateWhere,
                start_date: { [Op.ne]: null },
                end_date: { [Op.ne]: null },
                status: 'COMPLETADO'
            },
            include: plantId ? [{ model: Area, attributes: [], where: { plantId }, required: true }] : [],
            attributes: ['id', 'start_date', 'start_time', 'end_date', 'end_time', 'order_class'],
            raw: true
        });

        // Calculate downtime per order class
        const downtimeByClass = {};
        workOrdersByClass.forEach(wo => {
            const orderClass = wo.order_class || 'SIN_CLASIFICAR';
            const startDateTime = new Date(`${wo.start_date}T${wo.start_time}`);
            const endDateTime = new Date(`${wo.end_date}T${wo.end_time}`);
            const hours = (endDateTime - startDateTime) / (1000 * 60 * 60);

            if (hours > 0) {
                downtimeByClass[orderClass] = (downtimeByClass[orderClass] || 0) + hours;
            }
        });

        // Add Preventive Maintenance durations
        pmResults.forEach(pm => {
            const startDateTime = new Date(`${pm.start_date}T${pm.start_time || '00:00:00'}`);
            const endDateTime = new Date(`${pm.end_date}T${pm.end_time || '00:00:00'}`);
            const hours = Math.max(0, (endDateTime - startDateTime) / (1000 * 60 * 60));
            if (hours > 0) {
                const orderClass = pm.order_class || 'MANTENIMIENTO PREVENTIVO';
                downtimeByClass[orderClass] = (downtimeByClass[orderClass] || 0) + hours;
            }
        });

        // Convert to array format with percentages
        const totalDowntime = Object.values(downtimeByClass).reduce((sum, hours) => sum + hours, 0);
        const availabilityByOrderClass = Object.entries(downtimeByClass).map(([orderClass, hours]) => ({
            orderClass: orderClass,
            downtime: parseFloat(hours.toFixed(2)),
            percentage: totalDowntime > 0 ? parseFloat((hours / totalDowntime * 100).toFixed(2)) : 0
        })).sort((a, b) => b.downtime - a.downtime);

        res.json({
            totalAssets,
            openWorkOrders: openWOCount,
            lowStockItems: lowStockCount,
            sinStockItems: sinStockCount,
            bajoMinimoItems: bajoMinimoCount,
            monthlyCost,
            woStatusDistribution: statusDist.map(item => ({
                status: item.status,
                count: parseInt(item.get('count'))
            })),
            manHoursByTechnician,
            woCountByTechnician,
            availabilityByArea,
            availabilityByOrderClass,
            topDowntimeEvents: workOrdersByClass
                .map(wo => {
                    const start = new Date(`${wo.start_date}T${wo.start_time}`);
                    const end = new Date(`${wo.end_date}T${wo.end_time}`);
                    const hours = Math.max(0, (end - start) / (1000 * 60 * 60));
                    return {
                        id: wo.id,
                        orderClass: wo.order_class,
                        machine: wo.machine_name || 'GENERICO',
                        hours: parseFloat(hours.toFixed(2)),
                        label: `${wo.machine_name || 'Generico'} (#${wo.id})`
                    };
                })
                .sort((a, b) => b.hours - a.hours)
                .slice(0, 15)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getDashboardStats };
