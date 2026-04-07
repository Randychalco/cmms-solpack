const fs = require('fs');
const path = require('path');

const directoryPath = '.'; // Relative to where we run it

async function cleanupSeedingFiles() {
    try {
        const files = fs.readdirSync(directoryPath).filter(file => file.startsWith('seed_') && file.endsWith('.js'));
        
        console.log(`Checking ${files.length} seeding files...`);

        for (const file of files) {
            const filePath = path.join(directoryPath, file);
            let content = fs.readFileSync(filePath, 'utf8');
            
            // Regex to find label: '1. Text' or label: "1. Text"
            // It looks for a sequence like label followed by any whitespace, colon, whitespace, quote, digits, dot, whitespace
            const originalContent = content;
            
            // This regex captures the prefix "1. " correctly within quotes
            // We search for 'label: "1. ' OR 'label: '1. ' and replace it with 'label: "' OR 'label: ''
            // Note: We need to handle both single and double quotes.
            
            const regexSingle = /label:\s*'(\d+\.\s+)(.*?)'/g;
            const regexDouble = /label:\s*"(\d+\.\s+)(.*?)"/g;

            content = content.replace(regexSingle, "label: '$2'");
            content = content.replace(regexDouble, 'label: "$2"');

            if (content !== originalContent) {
                fs.writeFileSync(filePath, content);
                console.log(`- Cleaned row labels in: ${file}`);
            }
        }

        console.log('\nGlobal seeding cleanup completed.');
    } catch (err) {
        console.error('Error during global seeding cleanup:', err);
    }
}

cleanupSeedingFiles();
