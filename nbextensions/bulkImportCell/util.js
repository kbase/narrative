define([], () => {
    'use strict';

    /**
     * This evaluates the state of the app configuration. If it's ready to go, then we can
     * build the Python code and prep the app for launch. If not, then we shouldn't, and,
     * in fact, should clear the Python code if there's any there.
     * @returns a Promise that resolves into either 'complete' or 'incomplete' strings,
     * based on the config state.
     * @param {Array} paramIds
     * @param {Object} paramValues
     * @param {Array} filePathIds
     * @param {Object} filePathValues
     * @param {Object} spec - the post-processed Spec object
     * @returns
     */
    function evaluateAppConfig(paramIds, paramValues, filePathIds, filePathValues, spec) {
        /* 2 parts.
         * 1 - eval the set of parameters using something in the spec module.
         * 2 - eval the array of file inputs and outputs.
         * If both are up to snuff, we're good.
         */

        // must have at least one file row of file paths to be complete
        if (filePathValues.length === 0) {
            return Promise.resolve('incomplete');
        }
        const filePathValidations = filePathValues.map((filePathRow) => {
            return spec.validateParams(filePathIds, filePathRow);
        });
        return Promise.all([
            spec.validateParams(paramIds, paramValues),
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
                model.getItem(['app', 'fileParamIds', fileType]),
                model.getItem(['params', fileType, 'filePaths']),
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

    return {
        evaluateAppConfig,
        evaluateConfigReadyState,
    };
});
