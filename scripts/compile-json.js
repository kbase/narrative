/**
 * A program which, given a directory containing .json files, will compile
 * all files contained within into a single json object and store it.
 * The object is structured so that the path to through the object to the data
 * from a json file is the same as the path to the json source file through the
 * filesystem.
 */
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const { program } = require('commander');

/**
 * Sets a property in an object, given an initial object, the
 * path into the object, and a value.
 *
 * @param {Object} obj
 * @param {Array.<string>} propertyPath
 * @param {any} value
 */
function setProp(obj, propertyPath, value) {
    'use strict';
    const [element, ...rest] = propertyPath;
    if (rest.length === 0) {
        // at the terminus, store the value.
        obj[element] = value;
    } else {
        if (!(element in obj)) {
            obj[element] = {};
        }
        setProp(obj[element], rest, value);
    }
}

function main() {
    'use strict';

    program
        .requiredOption('-s, --source <source dir>', 'source directory')
        .requiredOption('-d, --dest <dest file>', 'destination file');

    program.parse(process.argv);
    const args = program.opts();

    const files = glob.sync(`**/*.json`, {
        cwd: args.source,
    });
    const dataIndex = {};
    for (const file of files) {
        const rawData = fs.readFileSync(path.resolve(args.source, file));
        const jsonData = JSON.parse(rawData);
        const dataPath = file.split(path.sep);
        setProp(dataIndex, dataPath, jsonData);
    }
    fs.writeFileSync(args.dest, JSON.stringify(dataIndex, null, 4));
}

main();
