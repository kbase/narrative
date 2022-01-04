define(['bluebird', 'base/js/namespace', 'narrativeConfig', 'util/kbaseApiUtil', 'util/string'], (
    Promise,
    Jupyter,
    Config,
    APIUtil,
    StringUtil
) => {
    'use strict';
    const uploaders = Config.get('uploaders');
    const bulkIds = new Set(uploaders.bulk_import_types);

    function getSpreadsheetFileInfo(fileName) {
        return Promise.resolve(fileName);
    }

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
            } else if (importType === 'csv/tsv/spreadsheet/whatever') {
                xsvFiles.push(file.name);
            } else {
                singleFiles.push(file);
            }
        });
        return getSpreadsheetFileInfo(xsvFiles)
            .then(() => {
                // TODO: merge xsvFileInfo with bulkFiles, handle errors, etc.
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
