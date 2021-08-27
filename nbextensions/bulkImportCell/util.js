define(['common/runtime', 'StagingServiceClient'], (Runtime, StagingServiceClient) => {
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
    function evaluateAppConfig(paramIds, paramValues, paramOptions, filePathIds, filePathValues, filePathOptions, spec) {
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
     * Runs evaluateAppConfig over all apps, given the BulkImportCell's model, and constructs
     * the ready state.
     */
    function evaluateConfigReadyState(model, specs) {
        const fileTypes = Object.keys(model.getItem(['inputs']));
        const evalPromises = fileTypes.map((fileType) => {
            return evaluateAppConfig(
                model.getItem(['app', 'otherParamIds', fileType]),
                model.getItem(['params', fileType, 'params']),
                {},
                model.getItem(['app', 'fileParamIds', fileType]),
                model.getItem(['params', fileType, 'filePaths']),
                {},
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
     *
     * @param {Array} expectedFiles
     * @returns
     */
    function getMissingFiles(expectedFiles) {
        const runtime = Runtime.make();
        const stagingService = new StagingServiceClient({
            root: runtime.config('services.staging_api_url.url'),
            token: runtime.authToken(),
        });
        return Promise.resolve(stagingService.list()).then((data) => {
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
        });
    }

    return {
        evaluateAppConfig,
        evaluateConfigReadyState,
        getMissingFiles,
    };
});
