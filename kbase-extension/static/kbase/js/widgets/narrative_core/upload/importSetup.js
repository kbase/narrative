define(['bluebird', 'base/js/namespace', 'narrativeConfig', 'util/kbaseApiUtil', 'util/string'], (
    Promise,
    Jupyter,
    Config,
    APIUtil,
    StringUtil
) => {
    'use strict';

    function getSpreadsheetFileInfo(fileName) {
        return Promise.resolve(fileName);
    }

    function initSingleFileUploads(fileInfo, appInfos) {
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
     *
     * @param {Array[object]} fileInfo :
     * {
     *   name: filename (might be a path),
     *   type: data type id
     * }
     */
    function setupImportCells(fileInfo) {
        const uploaders = Config.get('uploaders');
        const bulkIds = new Set(uploaders.bulkImportTypes);

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
            const appInfo = uploaders.app_info[importType];
            if (bulkIds.has(importType)) {
                if (!(importType in bulkFiles)) {
                    bulkFiles[importType] = {
                        appId: appInfo.app_id,
                        files: [],
                        outputSuffix: appInfo.app_output_suffix,
                    };
                }
                bulkFiles[importType].push(file.name);
            } else if (importType === 'csv/tsv/spreadsheet/whatever') {
                xsvFiles.push(file.name);
            } else {
                singleFiles.push(file);
            }
        });
        return getSpreadsheetFileInfo(xsvFiles)
            .then(() => {
                // TODO: merge xsvFileInfo with bulkFiles
                if (Object.keys(bulkFiles).length) {
                    return Jupyter.narrative.insertBulkImportCell(bulkFiles);
                } else {
                    return Promise.resolve();
                }
            })
            .then(() => {
                return initSingleFileUploads(singleFiles, uploaders.app_info);
            });
    }

    return {
        setupImportCells,
    };
});
