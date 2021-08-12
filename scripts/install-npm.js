const fs = require('fs');
const path = require('path');

const sourceDir = 'node_modules';
const destDir = 'kbase-extension/static/ext_modules';

const filesToCopy = [
    ['msw/lib/umd/index.js', 'msw/index.js'],
    ['msw/lib/umd/mockServiceWorker.js', 'msw/mockServiceWorker.js'],
];

for (const [from, to] of filesToCopy) {
    const destPath = `${destDir}/${to}`;
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.copyFileSync(`${sourceDir}/${from}`, destPath);
}
