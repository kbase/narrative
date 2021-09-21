define(['narrativeConfig', 'util/stagingFileCache'], (Config, StagingFileCache) => {
    'use strict';

    /**
     * This evaluates the state of the app configuration. If it's ready to go, then we can
     * build the Python code and prep the app for launch. If not, then we shouldn't, and,
     * in fact, should clear the Python code if there's any there.
     * @returns a Promise that resolves into either 'complete' or 'incomplete' strings,
     * based on the config state.
     * @param {Array} paramIds
     * @param {Object} paramValues - keys = param ids, values = param values
     * @param {Object} paramOptions - keys = param ids, values = object containing options for
     *  validating that parameter (parameter specific). Keys can also be missing.
     * @param {Array} filePathIds
     * @param {Array} filePathValues - array of objects, where keys = param id, values = values,
     *  one for each file path row.
     * @param {Array} filePathOptions - array of objects, where keys = param id, values = object
     *  containing options for validating that input. Keys can also be missing. Each object
     *  matches to a single row.
     * @param {Object} spec - the post-processed Spec object
     * @returns a promise that resolves into "complete" or "incomplete" strings
     */
    function evaluateAppConfig(
        paramIds,
        paramValues,
        paramOptions,
        filePathIds,
        filePathValues,
        filePathOptions,
        spec
    ) {
        /* 2 parts.
         * 1 - eval the set of parameters using something in the spec module.
         * 2 - eval the array of file inputs and outputs.
         * If both are up to snuff, we're good.
         */

        // must have at least one file row of file paths to be complete
        if (filePathValues.length === 0) {
            return Promise.resolve('incomplete');
        }
        const filePathValidations = filePathValues.map((filePathRow, index) => {
            return spec.validateParams(filePathIds, filePathRow, filePathOptions[index]);
        });
        return Promise.all([
            spec.validateParams(paramIds, paramValues, paramOptions),
            ...filePathValidations,
        ]).then((results) => {
            const isValid = results.every((result) => {
                return Object.values(result).every((param) => param.isValid);
            });
            return isValid ? 'complete' : 'incomplete';
        });
    }

    /**
     * This builds up an Array of file path validation options. The validation call
     * takes a semi-arbitrary set of options in the form of an Object. For file types
     * (and for text inputs in general), this comes in the form of a Set of invalidValues.
     *
     * This function constructs an Array that matches the file input Array for a given fileType,
     * populated with options for file inputs.
     *
     * For example, if the filePath parameters in the data model looks like this:
     * [
     *   { input_file: 'file1', output_obj: 'obj1' },
     *   { input_file: 'file2', output_obj: 'obj2' }
     * ]
     *
     * where the fileParamIds are ['input_file', 'output_obj'], and the outputParamIds
     * Array is just ['output_obj'], and we have a few missing files in a Set, {'file1', 'file3'},
     * this would return:
     * [
     *   {
     *      input_file: {
     *          invalidValues: { 'file1', 'file3' }
     *      }
     *   },
     *   {
     *      input_file: {
     *          invalidValues: { 'file1', 'file3' }
     *      }
     *   }
     * ]
     *
     * This still seems a little bit arbitrary, but as long as the file inputs are validated as
     * text (and not data objects), this will continue to work.
     * @param {Object} model the main bulk import cell data model
     * @param {string} fileType which filetype to build options for
     * @param {Set} missingFiles the set of files that were present when this bulk import cell
     *   was created, but are now missing from the server
     * @returns {Array[Object]} each object has a key for each file input (not output). Values
     *   are the validation options for each mapped input
     */
    function getFilePathOptionsForValidation(model, fileType, missingFiles) {
        let fpIds = model.getItem(['app', 'fileParamIds', fileType]);
        const outIds = model.getItem(['app', 'outputParamIds', fileType]);
        // overwrite fpIds with JUST the file inputs (not the outputs)
        fpIds = new Set(fpIds.filter((id) => !outIds.includes(id)));
        const fpVals = model.getItem(['params', fileType, 'filePaths']);

        // fpVals = Array of input file path rows from the importer for the current fileType

        return fpVals.map((filePath) => {
            const fpOptions = {};
            for (const id of Object.keys(filePath)) {
                fpOptions[id] = {};
                if (fpIds.has(id)) {
                    fpOptions[id].invalidValues = missingFiles;
                }
            }
            return fpOptions;
        });
    }

    /**
     * Runs evaluateAppConfig over all apps, given the BulkImportCell's model, and constructs
     * the ready state.
     * @param {Object} model the data model from the BulkImportCell, containing all the cell info
     * @param {Object} specs keys = app id, values = app specs
     * @param {Set} missingFiles Set of files that the app cell expects to be present,
     *  but are missing from the staging area
     * @returns
     */
    function evaluateConfigReadyState(model, specs, missingFiles) {
        // given some missing files (precalcuate for now), set up options for evaluating all file inputs
        const fileTypes = Object.keys(model.getItem(['inputs']));
        const evalPromises = fileTypes.map((fileType) => {
            // make an array of empty options with the same length as the
            // number of file path values
            return evaluateAppConfig(
                model.getItem(['app', 'otherParamIds', fileType]),
                model.getItem(['params', fileType, 'params']),
                {}, // no particular options for non-file parameters right now
                model.getItem(['app', 'fileParamIds', fileType]),
                model.getItem(['params', fileType, 'filePaths']),
                getFilePathOptionsForValidation(model, fileType, missingFiles),
                specs[model.getItem(['inputs', fileType, 'appId'])]
            );
        });
        return Promise.all(evalPromises).then((evalResults) => {
            const readyState = {};
            evalResults.forEach((result, idx) => {
                readyState[fileTypes[idx]] = result;
            });
            return readyState;
        });
    }

    /**
     * Given an array of file path names, this makes a call to the StagingService for the
     * current user, and returns a Promise that resolves into an Array of files that are
     * not on the server.
     *
     * If the StagingService call fails, the returned Promise throws an error.
     * @param {Array} expectedFiles - the array of files that are expected to exist, and
     *  are referenced by the bulk import cell
     * @returns An array of files that are in expectedFiles, but not present in the
     *  staging service.
     *
     */
    function getMissingFiles(expectedFiles) {
        return StagingFileCache.getFileList()
            .then((data) => {
                // turn data into a Set of files with the first path (the root, username)
                // stripped, as those don't get used.
                const serverFiles = new Set(
                    JSON.parse(data).map((file) => {
                        return file.path.slice(file.path.indexOf('/') + 1);
                    })
                );

                // we really just need the missing files - those in the given files array
                // that don't exist in serverFiles. So filter out those that don't exist.
                return expectedFiles.filter((file) => !serverFiles.has(file));
            })
            .catch((error) => {
                throw new Error('Error while identifying missing files: ' + error.responseText);
            });
    }

    function generateFileTypeMappings(typesToFiles = {}) {
        const fileTypesDisplay = {},
            fileTypeMapping = {},
            uploaders = Config.get('uploaders');
        for (const uploader of uploaders.dropdown_order) {
            fileTypeMapping[uploader.id] = uploader.name;
        }
        for (const fileType of Object.keys(typesToFiles)) {
            fileTypesDisplay[fileType] = {
                label: fileTypeMapping[fileType] || `Unknown type "${fileType}"`,
            };
        }
        return { fileTypesDisplay, fileTypeMapping };
    }

    return {
        evaluateAppConfig,
        evaluateConfigReadyState,
        getMissingFiles,
        generateFileTypeMappings,
    };
});
