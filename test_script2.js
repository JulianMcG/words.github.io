import fs from 'fs';
const content = fs.readFileSync('src/App.jsx', 'utf8');
const lines = content.split('\n');
let inFunc = false;
let funcLines = [];
for (const line of lines) {
    if (line.includes('const handleBuddyApply =')) inFunc = true;
    if (inFunc) {
        funcLines.push(line);
        if (line.startsWith('  };')) {
            break;
        }
    }
}
console.log(funcLines.join('\n'));
