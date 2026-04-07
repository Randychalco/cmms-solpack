const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/* 
 * This script modifies all seed files to inject "PARÁMETRO TÉCNICO" and "MÉTODO" 
 * to their columns structure.
 */

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.startsWith('seed_') && f.endsWith('.js'));

let modifiedFiles = [];

files.forEach(file => {
    const filePath = path.join(dir, file);
    let originalFormat = fs.readFileSync(filePath, 'utf-8');
    
    // Ignore erema as it already has param and metodo via its own scheme
    if (file.includes('erema')) return;
    
    // Update inline columns in json sections
    const inlineRegex = /columns:\s*\[\s*\{\s*id:\s*'estado',\s*label:\s*'ESTADO',\s*type:\s*'select'\s*\},[\s\S]*?id:\s*'obs'[\s\S]*?\]/g;
    const inlineReplacement = `columns: [
                        { id: 'param', label: 'PARÁMETRO TÉCNICO', type: 'readonly' },
                        { id: 'metodo', label: 'MÉTODO', type: 'readonly' },
                        { id: 'estado', label: 'ESTADO', type: 'select' },
                        { id: 'obs', label: 'OBSERVACIONES', type: 'text' }
                    ]`;
    
    // Update constant columns arrays
    const assignmentRegex = /const\s+(?:statusC|c)olumns\s*=\s*\[\s*\{\s*id:\s*'estado',\s*label:\s*'ESTADO',\s*type:\s*'select'\s*\},[\s\S]*?id:\s*'obs'[\s\S]*?\]/g;
    const assignmentReplacement = `const columns = [
            { id: 'param', label: 'PARÁMETRO TÉCNICO', type: 'readonly' },
            { id: 'metodo', label: 'MÉTODO', type: 'readonly' },
            { id: 'estado', label: 'ESTADO', type: 'select' },
            { id: 'obs', label: 'OBSERVACIONES', type: 'text' }
        ]`;

    let newContent = originalFormat;
    
    if (inlineRegex.test(newContent)) {
        newContent = newContent.replace(inlineRegex, inlineReplacement);
    }
    
    if (assignmentRegex.test(newContent)) {
        newContent = newContent.replace(assignmentRegex, assignmentReplacement);
    }

    if (newContent !== originalFormat) {
        fs.writeFileSync(filePath, newContent, 'utf-8');
        modifiedFiles.push(file);
        console.log(`Modified: ${file}`);
    }
});

console.log(`\nModified ${modifiedFiles.length} files.`);

console.log('\nExecuting modified seed files...');
for (const file of modifiedFiles) {
    console.log(`Running node ${file}...`);
    try {
        execSync(`node ${file}`, { stdio: 'inherit', cwd: dir });
    } catch (e) {
        console.error(`Failed to run ${file}`);
    }
}
console.log('\nMigration complete.');
