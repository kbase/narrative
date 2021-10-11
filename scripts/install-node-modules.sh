#!/bin/sh

# Install React
mkdir -p kbase-extension/static/ext_modules/react
cp node_modules/react/umd/react.development.js kbase-extension/static/ext_modules/react

# Install ReactDOM
mkdir -p kbase-extension/static/ext_modules/react-dom
cp node_modules/react-dom/umd/react-dom.development.js kbase-extension/static/ext_modules/react-dom

# Install React prop-types
mkdir -p kbase-extension/static/ext_modules/prop-types/lib
cp node_modules/prop-types/prop-types.min.js kbase-extension/static/ext_modules/prop-types
cp node_modules/prop-types/prop-types.js kbase-extension/static/ext_modules/prop-types
cp node_modules/prop-types/lib/ReactPropTypesSecret.js kbase-extension/static/ext_modules/prop-types/lib

