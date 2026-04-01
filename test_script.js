import fs from 'fs';
const content = fs.readFileSync('src/App.jsx', 'utf8');

const applyFunc = content.substring(content.indexOf('const handleBuddyApply ='), content.indexOf('const handleGlobalKeyDown ='));
console.log(applyFunc.substring(0, 1000));
