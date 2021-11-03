const fs = require('fs');
const path = require('path');

const sourceDir = 'node_modules';
const extToolsDir = 'kbase-extension/static/ext_modules';
const extComponentsDir = 'kbase-extension/static/ext_components';

const toolsToCopy = [
    ['msw/lib/umd/index.js', 'msw/index.js'],
    ['msw/lib/umd/mockServiceWorker.js', 'msw/mockServiceWorker.js'],
];

const pkg = fs.readFileSync('package.json', 'utf-8');
const componentsToCopy = Object.keys(pkg.dependencies);

for (const [from, to] of toolsToCopy) {
    const destPath = `${extToolsDir}/${to}`;
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.copyFileSync(`${sourceDir}/${from}`, destPath);
}

componentsToCopy.forEach((component) => {
    'use strict';
    console.log(component);
});
