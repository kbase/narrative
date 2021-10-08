#!/bin/sh

mkdir -p kbase-extension/static/ext_modules/react
cp node_modules/react/umd/react.development.js kbase-extension/static/ext_modules/react
mkdir -p kbase-extension/static/ext_modules/react-dom
cp node_modules/react-dom/umd/react-dom.development.js kbase-extension/static/ext_modules/react-dom