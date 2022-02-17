define([
    'bluebird',
    'base/js/namespace',
    'narrativeConfig',
    'util/kbaseApiUtil',
    'util/string',
    'common/runtime',
    'StagingServiceClient',
    './importErrors',
], (Promise, Jupyter, Config, APIUtil, StringUtil, Runtime, StagingServiceClient, Errors) => {
    'use strict';
    const uploaders = Config.get('uploaders');
    const bulkIds = new Set(uploaders.bulk_import_types);

    /**
     * This makes a call to the Staging Service to fetch information from bulk specification files.
     * This then gets processed through `processSpreadsheetFileData` before being returned.
     * @param {Array[string]} files - array of file path names to treat as import specifications
     * @returns Promise that resolves into information that can be used to open a bulk import cell.
     * This has the format:
     * {
     *   types: {
     *     dataType1: [{ import parameters }, { import parameters }, ...etc...],
     *     dataType2: [{ ...etc... }]
     *   },
     *   files: {
     *     dataType1: {
     *       file: the given file path,
     *       tab: null or the name of the excel file tab, if the file was an excel file
     *     }
     *     dataType2: { ...etc... }
     *   }
     * }
     * @throws Errors.ImportSetupError if an error occurs in either data fetching from the Staging
     *   Service, or in the initial parsing done by `processSpreadsheetFileData`
     */
    function getSpreadsheetFileInfo(files) {
        if (!files || files.length === 0) {
            return Promise.resolve({});
        }
        const stagingUrl = Config.url('staging_api_url');
        const stagingServiceClient = new StagingServiceClient({
            root: stagingUrl,
            token: Runtime.make().authToken(),
        });

        // This is overkill, but a little future proofing. We have to make a GET call with an
        // undetermined number of files, so if there are more than we can allow in the URL, gotta break that
        // into multiple calls.

        // a little cheating here to figure out the length allowance. Maybe it should be in the client?
        const maxQueryLength = 2048 - stagingUrl.length - '/bulk_specification/?files='.length;
        const bulkSpecProms = [];

        while (files.length) {
            const fileBatch = [];
            let remainingLength = maxQueryLength;
            while (
                files.length &&
                remainingLength - files[0].length - 1 >= 0 // -1 is for the comma
            ) {
                const nextFile = files.shift();
                fileBatch.push(nextFile);
                remainingLength -= nextFile.length + 1;
            }
            bulkSpecProms.push(
                stagingServiceClient.bulkSpecification({
                    files: encodeURIComponent(fileBatch.join(',')),
                })
            );
        }

        return Promise.all(bulkSpecProms)
            .then((result) => {
                // join results of all calls together
                const errors = [];
                const parsed = result.reduce(
                    (allCalls, callResult) => {
                        callResult = JSON.parse(callResult);
                        Object.keys(callResult.types).forEach((dataType) => {
                            // if we already have a file of that datatype, then throw an error.
                            // see Staging Service docs for format
                            if (allCalls.files[dataType]) {
                                errors.push({
                                    type: Errors.BULK_SPEC_ERRORS.MULTIPLE_SPECS,
                                    file_1: callResult.files[dataType].file,
                                    tab_1: callResult.files[dataType].tab,
                                    file_2: allCalls.files[dataType].file,
                                    tab_2: allCalls.files[dataType].tab,
                                    message: `Data type ${dataType} appears in multiple importer specification sources`,
                                });
                            } else {
                                allCalls.types[dataType] = callResult.types[dataType];
                                allCalls.files[dataType] = callResult.files[dataType];
                            }
                        });
                        return allCalls;
                    },
                    { types: {}, files: {} }
                );
                if (errors.length) {
                    // cast this case into a service call error, so the catcher below can deal with it
                    // otherwise, it'll just catch the ImportSetupError and make wrong things happen.
                    // this could be avoided by setting the error capture type below, but we don't have
                    // a custom error type for the client call errors.
                    throw { responseText: JSON.stringify({ errors }) };
                }
                return parsed;
            })
            .catch((error) => {
                let parsedError;
                try {
                    parsedError = JSON.parse(error.responseText).errors;
                } catch (error) {
                    // this would happen if the above isn't JSON, so send the error code instead
                    parsedError = [
                        { type: Errors.BULK_SPEC_ERRORS.SERVER, message: error.responseText },
                    ];
                }
                throw new Errors.ImportSetupError(
                    'Error while fetching CSV/TSV/Excel import data',
                    parsedError
                );
            })
            .then((result) => {
                return processSpreadsheetFileData(result);
            });
    }

    /**
     * This function does some preprocessing on the spreadsheet file data. Specifically,
     * those parameters that are static dropdowns or checkboxes need to translate their input
     * to values accepted by the specs.
     * For dropdowns, we expect to see the "display" value of an option as input, which gets
     * translated to the actual value of that option.
     * For checkboxes, we expect to see either a 0 or 1, which gets translated to the
     * "checked_value" or "unchecked_value", respectively.
     *
     * Import data should look like this:
     * {
     *   types: {
     *     dataType1: [{ input parameters }, { input parameters }, etc.]
     *   },
     *   files: {
     *     dataType1: {
     *       file: string,
     *       tab: null or int
     *     }
     *   }
     * }
     * and will have the same format on return.
     *
     * TODO: also return the fetched app specs to avoid fetching them twice?
     * @param {Object} data
     */
    async function processSpreadsheetFileData(data) {
        // map from given datatype to app id.
        // if any data types are missing, record that
        // if any data types are not bulk import ready, record that, too.
        const appIdToType = {};
        const dataTypeErrors = [];
        Object.keys(data.types).forEach((dataType) => {
            if (!(dataType in uploaders.app_info)) {
                dataTypeErrors.push({
                    type: Errors.BULK_SPEC_ERRORS.UNKNOWN_TYPE,
                    dataType,
                    file: data.files[dataType].file,
                    tab: data.files[dataType].tab,
                });
            } else if (!uploaders.bulk_import_types.includes(dataType)) {
                dataTypeErrors.push({
                    type: Errors.BULK_SPEC_ERRORS.NOT_BULK_TYPE,
                    dataType,
                    file: data.files[dataType].file,
                    tab: data.files[dataType].tab,
                });
            } else {
                appIdToType[uploaders.app_info[dataType].app_id] = dataType;
            }
        });

        // throw errors now if there are incorrect data types
        if (dataTypeErrors.length) {
            throw new Errors.ImportSetupError('Data type error', dataTypeErrors);
        }

        // get the app specs
        const appSpecs = await APIUtil.getAppSpecs(Object.keys(appIdToType));
        // translate results into an object keyed on app id
        const appIdToSpec = appSpecs.reduce((appIdToSpec, appSpec) => {
            const appParamIds = new Set(appSpec.parameters.map((param) => param.id));
            appIdToSpec[appSpec.info.id] = {
                appSpec,
                appParamIds,
            };
            return appIdToSpec;
        }, {});

        /* Go over all rows, ensure that there are values present from all expected columns
         * If not, error fast on each file?
         */
        _scanForMissingParameters(data, uploaders.app_info, appIdToSpec);

        /* Go through all parameters and update values accordingly:
         *
         *   field_type = "dropdown" = display name -> value
         *   field_type = "checkbox" = 0 or 1 -> unchecked_value / checked_value respectively
         *   all others just pass through
         *
         * First, build a structure of out a very specific set of parameters, only those that we
         * want to modify as above.
         * thus, typeToAlteredParams will look like:
         * {
         *   dataType: {
         *     assembly_type: {  // a dropdown, just keep the display / values
         *       'Single amplified genome (SAG)': 'sag',
         *       'Metagenome-assembled genome (MAG)': 'mag',
         *       'Virus': 'virus'
         *       'Draft Isolate': 'draft isolate',
         *       'Plasmid': 'plasmid',
         *       'Construct': 'construct'
         *     }
         *     single_genome: {  // a checkbox, just map from 1/0 -> actual value
         *        1: 'checked',
         *        0: 'unchecked'
         *     }
         *   }
         * }
         */
        const typeToAlteredParams = Object.entries(appIdToType).reduce(
            (_typeToAlteredParams, [appId, dataType]) => {
                const spec = appIdToSpec[appId].appSpec;
                const specParams = spec.parameters.reduce((processedParams, param) => {
                    if (param.field_type === 'dropdown') {
                        processedParams[param.id] = param.dropdown_options.options.reduce(
                            (optionSet, option) => {
                                optionSet[option.display] = option.value;
                                return optionSet;
                            },
                            {}
                        );
                    } else if (param.field_type === 'checkbox') {
                        processedParams[param.id] = {
                            0: param.checkbox_options.unchecked_value,
                            1: param.checkbox_options.checked_value,
                        };
                    }
                    return processedParams;
                }, {});
                _typeToAlteredParams[dataType] = specParams;
                return _typeToAlteredParams;
            },
            {}
        );

        /*
         * Now, update all parameters in place.
         * For each set of parameters in each type, look at the translated spec parameters.
         * If any of those are in the given parameter set, do the translation.
         */
        Object.values(appIdToType).forEach((dataType) => {
            const specParams = typeToAlteredParams[dataType];
            data.types[dataType] = data.types[dataType].map((parameterSet) => {
                Object.keys(parameterSet).forEach((paramId) => {
                    const value = parameterSet[paramId];
                    if (specParams[paramId]) {
                        parameterSet[paramId] = specParams[paramId][value];
                    }
                });
                return parameterSet;
            });
        });
        return data;
    }

    /**
     *
     * @param {Object} data - has keys `types` and `files`, both of which are keyed on datatype.
     * @see processSpreadsheetFileData for details
     * @param {Object} appInfo - keyed on data type, mainly has the `app_id` key that we're interested in
     * @param {Object} appIdToSpec - maps from appId to both the appSpec (key) object and appParamIds (key) set
     */
    function _scanForMissingParameters(data, appInfo, appIdToSpec) {
        const columnErrors = [];
        Object.keys(data.types).forEach((dataType) => {
            const dataRow = data.types[dataType][0];
            const appId = appInfo[dataType].app_id;
            const paramIds = appIdToSpec[appId].appParamIds;
            // make sure all ids in the row are present in the set of param ids
            Object.keys(dataRow).forEach((paramId) => {
                if (!paramIds.has(paramId)) {
                    columnErrors.push({
                        type: Errors.BULK_SPEC_ERRORS.UNKNOWN_COLUMN,
                        column: paramId,
                        dataType,
                        file: data.files[dataType].file,
                        tab: data.files[dataType].tab,
                    });
                }
            });
            for (const paramId of paramIds) {
                if (!(paramId in dataRow)) {
                    columnErrors.push({
                        type: Errors.BULK_SPEC_ERRORS.MISSING_COLUMN,
                        column: paramId,
                        dataType,
                        file: data.files[dataType].file,
                        tab: data.files[dataType].tab,
                    });
                }
            }
        });
        if (columnErrors.length) {
            throw new Errors.ImportSetupError('data parameter error', columnErrors);
        }
    }

    /**
     * Creates a new non-bulk import app cell for each file in the fileInfo array.
     * @param {Array} fileInfo each object in the array is expected to have 'type' and 'name' keys,
     *   both of which are strings.
     * @returns A Promise that resolves when all importer app cells are created
     */
    function initSingleFileUploads(fileInfo) {
        const appInfos = uploaders.app_info;
        const tag = APIUtil.getAppVersionTag();
        const uploadCellProms = fileInfo.map((file) => {
            let fileParam = file.name;
            const inputs = {};
            const appInfo = appInfos[file.type];

            if (appInfo.app_input_param_type && appInfo.app_input_param_type === 'list') {
                fileParam = [fileParam];
            }

            if (appInfo.app_input_param) {
                inputs[appInfo.app_input_param] = fileParam;
            }

            if (appInfo.app_output_param) {
                inputs[appInfo.app_output_param] = StringUtil.sanitizeWorkspaceObjectName(
                    file.name,
                    true
                );
                if (appInfo.app_output_suffix) {
                    inputs[appInfo.app_output_param] += appInfo.app_output_suffix;
                }
            }

            if (appInfo.app_static_params) {
                for (const p of Object.keys(appInfo.app_static_params)) {
                    inputs[p] = appInfo.app_static_params[p];
                }
            }
            return Promise.try(() => {
                Jupyter.narrative.addAndPopulateApp(appInfo.app_id, tag, inputs);
            });
        });
        return Promise.all(uploadCellProms);
    }

    /**
     * This creates a single app cell initialized with the web uploader app.
     * @returns Promise that resolves when the web upload app cell is created
     */
    function setupWebUploadCell() {
        return initSingleFileUploads([{ name: null, type: 'web_upload' }]);
    }

    /**
     * This does the work of taking a list of file and their types and converting them into one
     * or more import app cells. It does so in 3 phases.
     * 1. Filter the file infos into bins based on their given type - single upload, bulk upload, or xsv (that's CSV, TSV, Excel)
     * 2. Get all the extended file info from the xsv files to push into the bulk uploader section
     * 3. Make the bulk import and other singleton import cells.
     * This returns a Promise that resolves once the cells are made.
     * @param {Array[object]} fileInfo an array of file infos composed of these objects:
     * {
     *   name: filename (might be a path),
     *   type: data type id
     * }
     * @returns a Promise that resolves when all cells are made
     */
    function setupImportCells(fileInfo) {
        /* Bin the files based on import stuff
         * 1. format and put in bulkFiles if the type is in the bulkIds set
         * 2. put in the queue to fetch spreadsheet info from the staging service if it's that type (TBD)
         * 3. put it in the array of single-app uploaders otherwise
         */
        const bulkFiles = {};
        const singleFiles = [];
        const xsvFiles = [];
        fileInfo.forEach((file) => {
            const importType = file.type;
            if (bulkIds.has(importType)) {
                const appInfo = uploaders.app_info[importType];
                if (!(importType in bulkFiles)) {
                    bulkFiles[importType] = {
                        appId: appInfo.app_id,
                        files: [],
                        outputSuffix: appInfo.app_output_suffix,
                    };
                }
                bulkFiles[importType].files.push(file.name);
            } else if (importType === 'import_specification') {
                xsvFiles.push(file.name);
            } else {
                singleFiles.push(file);
            }
        });
        return getSpreadsheetFileInfo(xsvFiles)
            .then((result) => {
                if (result.types) {
                    Object.keys(result.types).forEach((dataType) => {
                        if (!(dataType in bulkFiles)) {
                            bulkFiles[dataType] = {
                                appId: uploaders.app_info[dataType].app_id,
                                files: [],
                                outputSuffix: uploaders.app_info[dataType].app_output_suffix,
                            };
                        }
                        bulkFiles[dataType].appParameters = result.types[dataType];
                    });
                }
                if (Object.keys(bulkFiles).length) {
                    return Jupyter.narrative.insertBulkImportCell(bulkFiles);
                } else {
                    return Promise.resolve();
                }
            })
            .then(() => {
                return initSingleFileUploads(singleFiles);
            });
    }

    return {
        setupImportCells,
        setupWebUploadCell,
    };
});
