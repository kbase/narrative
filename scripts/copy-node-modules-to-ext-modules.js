const fs = require('fs');
const path = require('path');



const SOURCE_DIR = 'node_modules';
const DEST_DIR = 'kbase-extension/static/ext_modules';

const FILES_TO_COPY = [
    ['msw/lib/umd/index.js', 'msw/index.js'],
    ['msw/lib/umd/mockServiceWorker.js', 'msw/mockServiceWorker.js'],
    ['react/umd/react.development.js', 'react/react.development.js'],
    ['react/umd/react.production.min.js', 'react/react.production..min.js'],
    ['react-dom/umd/react-dom.development.js', 'react-dom/react-dom.development.js'],
    ['react-dom/umd/react-dom.production.min.js', 'react-dom/react-dom.production.min.js'],
    ['prop-types/prop-types.min.js', 'prop-types/prop-types.min.js'],
    ['prop-types/prop-types.js', 'prop-types/prop-types.js'],
    ['prop-types/lib/ReactPropTypesSecret.js', 'prop-types/lib/ReactPropTypesSecret.js'],
];

function main() {
    'use strict';
    for (const [from, to] of FILES_TO_COPY) {
        const destPath = `${DEST_DIR}/${to}`;
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        fs.copyFileSync(`${SOURCE_DIR}/${from}`, destPath);
    }
}

if (require.main === module) {
    main();
}
