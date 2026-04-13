const db = require('./src/config/db');

async function updateTemplates() {
    try {
        console.log('--- UPDATING SAFETY TEMPLATES SML 1 & SML 2 WITH NEW STRUCTURE ---');
        
        const columnDefinitions = [
            { id: "param", label: "Elemento de seguridad", type: "readonly" },
            { id: "method", label: "Método de verificación", type: "readonly" },
            { id: "result", label: "Resultado", type: "select", options: ["OK", "NO OK"] },
            { id: "obs", label: "Observación", type: "text" },
            { id: "crit", label: "Criticidad", type: "readonly" }
        ];

        const sections = [
            {
                title: "WINDER",
                type: "matrix_status",
                columns: columnDefinitions,
                rows: [
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
                ]
            },
            {
                title: "SCANER",
                type: "matrix_status",
                columns: columnDefinitions,
                rows: [
                    { id: "sc_tab", label: "Tablero de cabezales", param: "Parada de emergencia", method: "Presionar botón y verificar detención inmediata", crit: "Alta" }
                ]
            },
            {
                title: "CHILL ROLL",
                type: "matrix_status",
                columns: columnDefinitions,
                rows: [
                    { id: "cr_op", label: "Lado operación", param: "Parada de emergencia", method: "Presionar botón y verificar detención inmediata", crit: "Alta" },
                    { id: "cr_faja", label: "Lado faja", param: "Parada de emergencia", method: "Presionar botón y verificar detención inmediata", crit: "Alta" },
                    { id: "cr_tab", label: "Tablero control chill roll", param: "Parada de emergencia", method: "Presionar botón y verificar detención inmediata", crit: "Alta" },
                    { id: "cr_ext_tab", label: "Tablero control extrusión", param: "Parada de emergencia", method: "Presionar botón y verificar detención inmediata", crit: "Alta" },
                    { id: "cr_back_door", label: "Puerta trasera", param: "Interruptor de seguridad de bloqueo", method: "Abrir y verificar que impide operación", crit: "Alta" }
                ]
            },
            {
                title: "EXTRUSOR",
                type: "matrix_status",
                columns: columnDefinitions,
                rows: [
                    { id: "ext_door", label: "Costado de puerta", param: "Parada de emergencia", method: "Presionar botón y verificar detención inmediata", crit: "Alta" },
                    { id: "ext_cont", label: "Lateral de container", param: "Parada de emergencia", method: "Presionar botón y verificar detención inmediata", crit: "Alta" }
                ]
            },
            {
                title: "EREMA",
                type: "matrix_status",
                columns: columnDefinitions,
                rows: [
                    { id: "er_pelet", label: "Peletizador", param: "Sensor magnético", method: "Verificar detección correcta de posición", crit: "Alta" },
                    { id: "er_centrif", label: "Centrifugador", param: "Interruptor de seguridad de bloqueo", method: "Abrir resguardo y verificar que impide operación", crit: "Alta" },
                    { id: "er_pcu", label: "PCU (olla)", param: "Interruptor de seguridad de bloqueo", method: "Abrir resguardo y verificar que impide operación", crit: "Alta" },
                    { id: "er_ctrl", label: "Tablero de control", param: "Parada de emergencia", method: "Presionar botón y verificar detención inmediata", crit: "Alta" },
                    { id: "er_refil", label: "Alimentador de refil", param: "Parada de emergencia", method: "Presionar botón y verificar detención inmediata", crit: "Alta" }
                ]
            }
        ];

        const items = JSON.stringify({ sections });

        // Update SML 1
        const res1 = await db.query(
            "UPDATE checklist_templates SET items = $1 WHERE name = 'CHECKLIST SEGURIDAD - SML 1'",
            [items]
        );
        console.log(`Updated SML 1: ${res1.rowCount} row(s)`);

        // Update SML 2
        const res2 = await db.query(
            "UPDATE checklist_templates SET items = $1 WHERE name = 'CHECKLIST SEGURIDAD - SML 2'",
            [items]
        );
        console.log(`Updated SML 2: ${res2.rowCount} row(s)`);

        console.log('Update complete.');
    } catch (e) {
        console.error('Update failed:', e);
    } finally {
        process.exit(0);
    }
}

updateTemplates();
