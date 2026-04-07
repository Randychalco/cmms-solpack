const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.startsWith('seed_') && f.endsWith('.js'));

let modifiedFiles = [];

files.forEach(file => {
    const filePath = path.join(dir, file);
    let originalFormat = fs.readFileSync(filePath, 'utf-8');
    
    // Check if it's a target file
    if (!originalFormat.includes('req_lub')) return;

    // Pattern 1: Inline in sections `columns: [ ... ]`
    const inlineRegex = /columns:\s*\[[\s\S]*?id:\s*'req_lub'[\s\S]*?\]/g;
    const inlineReplacement = `columns: [
                        { id: 'estado', label: 'ESTADO', type: 'select' },
                        { id: 'obs', label: 'OBSERVACIONES', type: 'text' }
                    ]`;
    
    // Pattern 2: Array assignment `const columns = [ ... ]`
    const assignmentRegex = /const\s+(?:statusC|c)olumns\s*=\s*\[[\s\S]*?id:\s*'req_lub'[\s\S]*?\]/g;
    const assignmentReplacement = `const columns = [
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

// Execute all modified scripts to update the DB
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
