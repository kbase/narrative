const fs = require('fs');
const path = require('path');

const sourceDir = 'node_modules';
const extToolsDir = 'kbase-extension/static/ext_modules';
const extComponentsDir = 'kbase-extension/static/ext_components';

const toolsToCopy = [
    ['msw/lib/umd/index.js', 'msw/index.js'],
    ['msw/lib/umd/mockServiceWorker.js', 'msw/mockServiceWorker.js'],
];

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));

const extraComponents = [
    'datatables.net',
    'datatables.net-buttons',
    'requirejs',
    'requirejs-domready'
];

const componentsToCopy = Object.keys(pkg.dependencies).concat(extraComponents);

for (const [from, to] of toolsToCopy) {
    const destPath = `${extToolsDir}/${to}`;
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.copyFileSync(`${sourceDir}/${from}`, destPath);
}

for (const component of componentsToCopy) {
    // blow away the old version
    if (fs.existsSync(`${extComponentsDir}/${component}`)) {
        fs.rmSync(`${extComponentsDir}/${component}`, {recursive: true});
    }
    // copy in the new one
    fs.cpSync(`${sourceDir}/${component}`, `${extComponentsDir}/${component}`, { recursive: true });
}
