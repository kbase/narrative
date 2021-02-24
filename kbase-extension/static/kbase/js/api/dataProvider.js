/**
 * Acts as a service that provides the currently loaded data to various Narrative components.
 * Eventually will cache its stuff and periodically refresh on request.
 */
define([
    'bluebird',
    'narrativeConfig',
    'common/runtime',
    'kbase-generic-client-api',
    'base/js/namespace'
], (
    Promise,
    Config,
    Runtime,
    GenericClient,
    Jupyter
) => {
    'use strict';

    const DATA_CACHE_TIME = 300000;

    class DataProvider {
        constructor() {
            // set up auth, client, etc.
            this.lastDataUpdate = 0;
            this.initDataCache();
        }

        initDataCache() {
            this.nameToObject = {};
            this.refToObject = {};
            this.idToObject = {};
            this.typeToObjects = {};
            this.objects = [];
        }

        updateData(forceUpdate) {
            if (!this.cacheNeedsRefresh() && !forceUpdate) {
                return Promise.resolve();
            }

            const serviceClient = new GenericClient(
                Config.url('service_wizard'),
                {token: Runtime.make().authToken()}
            );

            return serviceClient.sync_call('NarrativeService.list_objects_with_sets', [{
                ws_name: Jupyter.narrative.getWorkspaceName(),
                includeMetadata: 1
            }])
                .then(data => {
                    this.initDataCache();
                    data[0].data.forEach(obj => {
                        const info = obj.object_info;
                        this.nameToObject[info[1]] = info;
                        const ref = info[6] + '/' + info[2];
                        this.refToObject[ref] = info;
                        this.idToObject[info[0]] = info;
                        const type = info[2].split('-')[0];
                        if (!this.typeToObjects[type]) {
                            this.typeToObjects[type] = [];
                        }
                        this.typeToObjects[type].push(info);
                        this.objects.push(obj);
                    });
                    this.lastDataUpdate = new Date().getTime();
                })
                .catch(error => {
                    console.error('Error while fetching data', error);
                });
        }

        cacheNeedsRefresh() {
            return new Date().getTime() >= this.lastDataUpdate + DATA_CACHE_TIME;
        }

        getData(forceUpdate) {
            return this.updateData(forceUpdate)
                .then(() => {
                    return this.objects;
                });
        }

        getDataByName(forceUpdate) {
            return this.updateData(forceUpdate)
                .then(() => {
                    return this.nameToObject;
                });
        }

    }

    return new DataProvider();
});
