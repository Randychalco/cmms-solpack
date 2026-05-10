const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function splitTemplates() {
    try {
        console.log('--- SPLITTING SAFETY TEMPLATES SML 1 & SML 2 ---');
        
        const columnDefinitions = [
            { id: "param", label: "Elemento de seguridad", type: "readonly" },
            { id: "method", label: "Método de verificación", type: "readonly" },
            { id: "result", label: "Resultado", type: "select", options: ["OK", "NO OK"] },
            { id: "obs", label: "Observación", type: "text" },
            { id: "crit", label: "Criticidad", type: "readonly" }
        ];

        const dataBySection = {
            "WINDER": [
                { id: "w_ext_a", label: "Exterior bobinado lado A", param: "Parada de emergencia", method: "Presionar botón y verificar detención inmediata", crit: "Alta" },
                { id: "w_ext_b", label: "Exterior bobinado lado B", param: "Parada de emergencia", method: "Presionar botón y verificar detención inmediata", crit: "Alta" },
                { id: "w_post_door", label: "Puerta posterior", param: "Interruptor de seguridad de bloqueo", method: "Abrir y verificar que impide operación", crit: "Alta" },
                { id: "w_int_a", label: "Interior bobinador lado A", param: "Parada de emergencia", method: "Presionar botón y verificar detención inmediata", crit: "Alta" },
                { id: "w_int_b", label: "Interior bobinador lado B", param: "Parada de emergencia", method: "Presionar botón y verificar detención inmediata", crit: "Alta" },
                { id: "w_tucos_a", label: "Mesa de tucos lado A", param: "Parada de emergencia", method: "Presionar botón y verificar detención inmediata", crit: "Alta" },
                { id: "w_tucos_b", label: "Mesa de tucos lado B", param: "Parada de emergencia", method: "Presionar botón y verificar detención inmediata", crit: "Alta" },
                { id: "w_lat_a_sw", label: "Puerta lateral lado A", param: "Interruptor de seguridad de bloqueo", method: "Abrir y verificar que impide operación", crit: "Alta" },
                { id: "w_lat_a_es", label: "Puerta lateral lado A", param: "Parada de emergencia", method: "Presionar botón y verificar detención inmediata", crit: "Alta" },
                { id: "w_lat_b_sw", label: "Puerta lateral lado B", param: "Interruptor de seguridad de bloqueo", method: "Abrir y verificar que impide operación", crit: "Alta" },
                { id: "w_lat_b_es", label: "Puerta lateral lado B", param: "Parada de emergencia", method: "Presionar botón y verificar detención inmediata", crit: "Alta" },
                { id: "w_ctrl_tab", label: "Tablero de control", param: "Parada de emergencia", method: "Presionar botón y verificar detención inmediata", crit: "Alta" },
                { id: "w_main_door_sw", label: "Puerta principal", param: "Interruptor de seguridad de bloqueo", method: "Abrir y verificar que impide operación", crit: "Alta" },
                { id: "w_main_door_es", label: "Puerta principal", param: "Parada de emergencia", method: "Presionar botón y verificar detención inmediata", crit: "Alta" },
                { id: "w_front_a", label: "Interior frontal lado A", param: "Parada de emergencia", method: "Presionar botón y verificar detención inmediata", crit: "Alta" },
                { id: "w_front_b", label: "Interior frontal lado B", param: "Parada de emergencia", method: "Presionar botón y verificar detención inmediata", crit: "Alta" },
                { id: "w_pull_a", label: "Interior frontal lado A", param: "Pull cord", method: "Activar cable y verificar parada inmediata", crit: "Alta" },
                { id: "w_pull_b", label: "Interior frontal lado B", param: "Pull cord", method: "Activar cable y verificar parada inmediata", crit: "Alta" },
                { id: "w_desc_a", label: "Mesa de descarga lado A", param: "Barrera fotoeléctrica de seguridad", method: "Interrumpir haz y verificar paro", crit: "Alta" },
                { id: "w_desc_b", label: "Mesa de descarga lado B", param: "Barrera fotoeléctrica de seguridad", method: "Interrumpir haz y verificar paro", crit: "Alta" }
            ],
            "SCANNER": [
                { id: "sc_tab", label: "Tablero de cabezales", param: "Parada de emergencia", method: "Presionar botón y verificar detención inmediata", crit: "Alta" }
            ],
            "CHILL ROLL": [
                { id: "cr_op", label: "Lado operación", param: "Parada de emergencia", method: "Presionar botón y verificar detención inmediata", crit: "Alta" },
                { id: "cr_faja", label: "Lado faja", param: "Parada de emergencia", method: "Presionar botón y verificar detención inmediata", crit: "Alta" },
                { id: "cr_tab", label: "Tablero control chill roll", param: "Parada de emergencia", method: "Presionar botón y verificar detención inmediata", crit: "Alta" },
                { id: "cr_ext_tab", label: "Tablero control extrusión", param: "Parada de emergencia", method: "Presionar botón y verificar detención inmediata", crit: "Alta" },
                { id: "cr_back_door", label: "Puerta trasera", param: "Interruptor de seguridad de bloqueo", method: "Abrir y verificar que impide operación", crit: "Alta" }
            ],
            "EXTRUSOR": [
                { id: "ext_door", label: "Costado de puerta", param: "Parada de emergencia", method: "Presionar botón y verificar detención inmediata", crit: "Alta" },
                { id: "ext_cont", label: "Lateral de container", param: "Parada de emergencia", method: "Presionar botón y verificar detención inmediata", crit: "Alta" }
            ],
            "EREMA": [
                { id: "er_pelet", label: "Peletizador", param: "Sensor magnético", method: "Verificar detección correcta de posición", crit: "Alta" },
                { id: "er_centrif", label: "Centrifugador", param: "Interruptor de seguridad de bloqueo", method: "Abrir resguardo y verificar que impide operación", crit: "Alta" },
                { id: "er_pcu", label: "PCU (olla)", param: "Interruptor de seguridad de bloqueo", method: "Abrir resguardo y verificar que impide operación", crit: "Alta" },
                { id: "er_ctrl", label: "Tablero de control", param: "Parada de emergencia", method: "Presionar botón y verificar detención inmediata", crit: "Alta" },
                { id: "er_refil", label: "Alimentador de refil", param: "Parada de emergencia", method: "Presionar botón y verificar detención inmediata", crit: "Alta" }
            ]
        };

        const machines = ["SML 1", "SML 2"];

        for (const machine of machines) {
            for (const [section, rows] of Object.entries(dataBySection)) {
                const templateName = `CHECKLIST SEGURIDAD - ${machine} - ${section}`;
                const assetCategory = `${machine.replace(' ', '_')}_SAFETY_${section.replace(' ', '_')}`;
                
                const items = JSON.stringify({
                    sections: [
                        {
                            title: section,
                            type: "matrix_status",
                            columns: columnDefinitions,
                            rows: rows
                        }
                    ]
                });

                // Delete if exists and insert
                await pool.query("DELETE FROM checklist_templates WHERE name = $1", [templateName]);
                await pool.query(
                    `INSERT INTO checklist_templates (name, asset_category, items, type, layout) 
                     VALUES ($1, $2, $3, 'safety', 'matrix')`,
                    [templateName, assetCategory, items]
                );
                console.log(`✅ Template created: ${templateName}`);
            }
        }

        // Optional: Remove or rename the old combined templates
        for (const machine of machines) {
            const oldName = `CHECKLIST SEGURIDAD - ${machine}`;
            // Check if exists
            const check = await pool.query("SELECT id FROM checklist_templates WHERE name = $1", [oldName]);
            if (check.rows.length > 0) {
                await pool.query(
                    "UPDATE checklist_templates SET name = $1 WHERE name = $2",
                    [`[LEGACY] ${oldName}`, oldName]
                );
                console.log(`ℹ️ Marked old template as legacy: ${oldName}`);
            }
        }

        console.log('--- SPLIT COMPLETE ---');
    } catch (e) {
        console.error('Split failed:', e);
    } finally {
        await pool.end();
    }
}

splitTemplates();
