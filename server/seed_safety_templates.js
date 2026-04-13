const db = require('./src/config/db');

async function seed() {
    try {
        console.log('--- SEEDING SAFETY TEMPLATES FOR SML 1 & SML 2 ---');
        
        const safetyItems = {
            sections: [
                {
                    title: "1. DISPOSITIVOS DE EMERGENCIA",
                    type: "conditional_checks",
                    options: ["OK", "FALLA", "N/A"],
                    items: [
                        { id: "e_stop_main", label: "Parada de Emergencia Principal (Panel Central)" },
                        { id: "e_stop_extruder", label: "Paradas de Emergencia en Extrusoras" },
                        { id: "e_stop_winder", label: "Paradas de Emergencia en Bobinadores" },
                        { id: "pull_cords", label: "Cuerdas de tracción/tirón (si aplica)" }
                    ]
                },
                {
                    title: "2. PROTECCIONES Y RESGUARDOS",
                    type: "conditional_checks",
                    options: ["OK", "FALLA", "N/A"],
                    items: [
                        { id: "guards_mechanical", label: "Protecciones físicas de partes móviles" },
                        { id: "interlocks", label: "Sensores de puertas (Interlocks) operativos" },
                        { id: "fences", label: "Vallas perimetrales cerradas y seguras" }
                    ]
                },
                {
                    title: "3. RIESGOS ELÉCTRICOS Y TÉRMICOS",
                    type: "conditional_checks",
                    options: ["OK", "FALLA", "N/A"],
                    items: [
                        { id: "cables_state", label: "Estado de cables y canalizaciones (No expuestos)" },
                        { id: "panel_doors", label: "Puertas de tableros cerradas con llave" },
                        { id: "grounding", label: "Conexión a tierra visible y firme" },
                        { id: "hot_zones", label: "Señalética de zonas calientes presente" }
                    ]
                },
                {
                    title: "4. HIGIENE Y ENTORNO (SEGURIDAD)",
                    type: "conditional_checks",
                    options: ["OK", "FALLA", "N/A"],
                    items: [
                        { id: "leaks_oil", label: "Ausencia de fugas de aceite (Riesgo de caída)" },
                        { id: "leaks_water", label: "Ausencia de fugas de agua en piso" },
                        { id: "clear_paths", label: "Pasillos de evacuación despejados" },
                        { id: "lighting", label: "Iluminación adecuada del área de trabajo" }
                    ]
                }
            ]
        };

        const sml1 = {
            name: "CHECKLIST SEGURIDAD - SML 1",
            asset_category: "EXTRUSION_2",
            layout: "sml2_matrix",
            type: "safety",
            items: JSON.stringify(safetyItems)
        };

        const sml2 = {
            name: "CHECKLIST SEGURIDAD - SML 2",
            asset_category: "EXTRUSION_2",
            layout: "sml2_matrix",
            type: "safety",
            items: JSON.stringify(safetyItems)
        };

        // Insert SML 1
        await db.query(
            `INSERT INTO checklist_templates (name, asset_category, layout, type, items) 
             VALUES ($1, $2, $3, $4, $5)`,
            [sml1.name, sml1.asset_category, sml1.layout, sml1.type, sml1.items]
        );

        // Insert SML 2
        await db.query(
            `INSERT INTO checklist_templates (name, asset_category, layout, type, items) 
             VALUES ($1, $2, $3, $4, $5)`,
            [sml2.name, sml2.asset_category, sml2.layout, sml2.type, sml2.items]
        );

        console.log('Seeding complete: Created SML 1 and SML 2 safety checklists.');
    } catch (e) {
        console.error('Seeding failed:', e);
    } finally {
        process.exit(0);
    }
}

seed();
