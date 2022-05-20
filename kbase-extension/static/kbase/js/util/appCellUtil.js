define(['narrativeConfig', 'util/stagingFileCache', 'common/runtime', 'util/util'], (
    Config,
    StagingFileCache,
    Runtime,
    Util
) => {
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
     * @param {Array} filePathIds - array of strings, each is a file path parameter id
     * @param {Array} filePathValues - array of objects, where keys = param id, values = values,
     *  one for each file path row.
     * @param {Object} filePathOptions - keys = param id, values = object
     *  containing options for validating that input. Keys can also be missing. Options are applied
     *  to file params in each row.
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

        const filePathValidationParams = filePathValues.reduce(
            (paramSet, filePathRow) => {
                // this forces array normalization, in case any values are missing
                for (const paramId of filePathIds) {
                    paramSet[paramId].push(filePathRow[paramId]);
                }
                return paramSet;
            },
            // this little snippet converts [p1,p2] to {p1: [], p2: []}
            filePathIds.reduce((acc, curr) => ((acc[curr] = []), acc), {})
        );

        const filePathValidations = spec.validateMultipleParamsArray(
            filePathIds,
            filePathValidationParams,
            filePathOptions
        );

        return Promise.all([
            filePathValidations,
            spec.validateParams(paramIds, paramValues, paramOptions),
        ])
            .then(([filePathValidations, paramValidations]) => {
                // filePathValidations - kvp, keys = paramIds, vals = array of validations
                // paramValidations = vals = validations
                const filePathsValid = Object.values(filePathValidations).every(
                    (filePathValidations) => {
                        return filePathValidations.every((validation) => validation.isValid);
                    }
                );
                const paramsValid = Object.values(paramValidations).every((param) => param.isValid);

                return filePathsValid && paramsValid ? 'complete' : 'incomplete';
            })
            .catch((error) => {
                console.error(error);
            });
    }

    /**
     * This constructs a set of options for validating each item in a file path row.
     * By default, it assigns the Set of missing files to `invalidValues` for all actual file path
     * parameters, and it assigns a series of options to non-file path parameters (i.e. output
     * objects) to validate the workspace object name against the Workspace service. These are:
     * `shouldNotExist`: true,
     * `authToken`: the current auth token
     * `workspaceId`: the current workspace id
     * `workspaceServiceUrl`: the URl of the workspace service
     *
     * These can be added to or overridden by adding fileOptions or outputOptions, respectively.
     *
     * @param {Array} fpIds array of file parameter ids - those that describe files for import
     * @param {Object} paramIds array of parameter ids to set options
     * @param {Set} missingFiles Set of missing files
     * @param {Object} fileOptions Options that can be used to augment or override the default file
     *  input validation options
     * @param {Object} outputOptions Options that can be used to augment or override the default
     *  non-file input validation options
     * @returns {Object} where keys are parameter ids and values are the sets of options to be
     *  passed to the validator for that parameter.
     */
    function getFilePathValidationOptions(
        fpIds,
        paramIds,
        missingFiles,
        fileOptions = {},
        outputOptions = {}
    ) {
        const runtime = Runtime.make();
        const fpOptions = {};
        for (const id of paramIds) {
            // They're either file paths or output paths.
            if (fpIds.includes(id)) {
                // File paths always get the invalidValues option.
                fpOptions[id] = Object.assign(
                    { invalidValues: missingFiles },
                    Util.copy(fileOptions)
                );
            } else {
                // Not-file paths are expected to be workspace object names, and get the default
                // things for validating those
                fpOptions[id] = Object.assign(
                    {
                        shouldNotExist: true,
                        authToken: runtime.authToken(),
                        workspaceId: runtime.workspaceId(),
                        workspaceServiceUrl: runtime.config('services.workspace.url'),
                    },
                    Util.copy(outputOptions)
                );
            }
        }
        return fpOptions;
    }

    /**
     * Runs evaluateAppConfig over all apps, given the BulkImportCell's model, and constructs
     * the ready state.
     * @param {Object} model the data model from the BulkImportCell, containing all the cell info
     * @param {Object} specs keys = app id, values = app specs
     * @param {Set} missingFiles Set of files that the app cell expects to be present,
     *  but are missing from the staging area
     * @returns {Object} keys = file type ids, values = "complete" if ready, "incomplete" if not
     */
    function evaluateConfigReadyState(model, specs, missingFiles) {
        // given some missing files (precalculate for now), set up options for evaluating all file inputs
        const fileTypes = Object.keys(model.getItem(['inputs']));

        const evalPromises = fileTypes.map((fileType) => {
            const fileParamIds = model.getItem(['app', 'fileParamIds', fileType]);
            const filePathIds = getFilePathIds(model, fileType);
            const fpOptions = getFilePathValidationOptions(filePathIds, fileParamIds, missingFiles);
            // make an array of empty options with the same length as the
            // number of file path values
            return evaluateAppConfig(
                model.getItem(['app', 'otherParamIds', fileType]),
                model.getItem(['params', fileType, 'params']),
                {}, // no particular options for non-file parameters right now
                fileParamIds,
                model.getItem(['params', fileType, 'filePaths']),
                fpOptions,
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

    /**
     * This is a convenience function used to filter the file path parameter ids in a bulk import
     * cell to just those parameters that describe actual file paths for import. I.e., given a
     * model and file type, it will return those parameters that represent files in the Staging
     * Area.
     * @param {Object} model a Props object used with a Bulk Import cell
     * @param {String} fileType a file type id
     * @returns {Array<string>} file-input parameter ids
     */
    function getFilePathIds(model, fileType) {
        const fileParamIds = model.getItem(['app', 'fileParamIds', fileType]);
        const outIds = model.getItem(['app', 'outputParamIds', fileType]) || [];
        // overwrite fpIds with JUST the file inputs (not the outputs)
        return fileParamIds.filter((id) => !outIds.includes(id));
    }

    return {
        evaluateAppConfig,
        evaluateConfigReadyState,
        getMissingFiles,
        generateFileTypeMappings,
        getFilePathValidationOptions,
        getFilePathIds,
    };
});
