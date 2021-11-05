define(['bluebird', 'StagingServiceClient', 'common/runtime'], (
    Promise,
    StagingServiceClient,
    Runtime
) => {
    'use strict';

    let lastUpdateTime = 0,
        getListPromise = null;
    const REFRESH_INTERVAL = 30000; // ms

    /**
     * Returns a Promise that resolves into the result of StagingService.list. This
     * is typically a JSON string that will need to be parsed (this doesn't parse,
     * keeping in line with the API call).
     * @param {boolean} forceRefresh if true, forces the cache to update,
     *  regardless of the remaining time.
     * @returns
     */
    function getFileList(forceRefresh = false) {
        // if forceRefresh, just get the update
        // if there's an existing Promise and we haven't reached the timeout limit, return it
        if (forceRefresh || Date.now() - lastUpdateTime > REFRESH_INTERVAL) {
            const runtime = Runtime.make();
            const stagingClient = new StagingServiceClient({
                root: runtime.config('services.staging_api_url.url'),
                token: runtime.authToken(),
            });
            getListPromise = Promise.resolve(stagingClient.list());
            lastUpdateTime = Date.now();
        }
        return getListPromise;
    }

    function clearCache() {
        getListPromise = null;
        lastUpdateTime = 0;
    }

    return {
        getFileList,
        clearCache,
        REFRESH_INTERVAL,
    };
});
