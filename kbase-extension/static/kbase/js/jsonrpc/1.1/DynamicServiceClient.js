define(['jsonrpc/Cache', 'jsonrpc/1.1/ServiceClient'], (Cache, ServiceClient) => {
    'use strict';

    const ITEM_LIFETIME = 1800000;
    const MONITORING_FREQUENCY = 60000;
    const WAITER_TIMEOUT = 30000;
    const WAITER_FREQUENCY = 100;

    const moduleCache = new Cache({
        itemLifetime: ITEM_LIFETIME,
        monitoringFrequency: MONITORING_FREQUENCY,
        waiterTimeout: WAITER_TIMEOUT,
        waiterFrequency: WAITER_FREQUENCY,
    });

    const SERVICE_DISCOVERY_MODULE = 'ServiceWizard';

    /** Class implementing a client for a KBase Dynamic Service  */
    class DynamicServiceClient {
        /**
         *
         * @param {Object} params
         * @param {string} params.url - A url for the "Service Wizard"
         * @param {string} params.module - The module name for the Dynamic Service the client should call
         * @param {number} params.timeout - The timeout, in ms, after which a request for the service wizard or the
         *  actual Dynamic Service will be considered to be in error
         * @param {string} [params.token] - A KBase auth token
         * @param {boolean} [params.strict] -
         */
        constructor({ url, module, timeout, token, strict, version }) {
            // Required
            if (typeof url === 'undefined') {
                throw new TypeError('"url" is required');
            }
            this.url = url;

            if (typeof module === 'undefined') {
                throw new TypeError('"module" is required');
            }
            this.module = module;

            if (typeof timeout === 'undefined') {
                throw new TypeError('"timeout" is required');
            }
            this.timeout = timeout;

            // Optional:

            // The version can be either a release tag ('dev', 'beta', 'release', null), actual version (semver),
            // or a git hash.
            // (https://github.com/kbase/service_wizard/blob/d1f7f1451816baf878357b47be1987c1645bcdb9/ServiceWizard.spec#L12)
            // null indicates that the service wizard should select the "most released" (that logic has always existed,
            // but is not documented, and lives in https://github.com/kbase/catalog/blob/0471636a02d4f001cd2180978606cedd45578ebe/lib/biokbase/catalog/controller.py#L540)
            // version, meaning it will choose the first version tag it finds, in order
            // of preference 'release', 'beta', 'dev'.
            this.version = version || null;

            this.token = token || null;
            this.strict = strict || false;
        }

        moduleCacheKey() {
            let moduleId;
            if (this.version === null) {
                moduleId = this.module + ':auto';
            } else {
                moduleId = this.module + ':' + this.version;
            }
            return moduleId;
        }

        getCached(fetcher) {
            return moduleCache.waitForItem(this.moduleCacheKey(), fetcher);
        }

        /**
         * Synchronizes the url and module name from the service wizard.
         * Returns a promise which, when resolved, will have set the object's module and url
         * properties as returned by the service wizard.
         */
        getModule() {
            return this.getCached(() => {
                const client = new ServiceClient({
                    module: SERVICE_DISCOVERY_MODULE,
                    url: this.url,
                    token: this.token,
                    timeout: this.timeout,
                });
                return client.callFunc('get_service_status', {
                    module_name: this.module,
                    version: this.version,
                });
            });
        }

        async callFunc(funcName, params, options = {}) {
            const moduleInfo = await this.getModule();
            const { module_name, url } = moduleInfo;
            const serviceClient = new ServiceClient({
                module: module_name,
                url,
                timeout: this.timeout,
                token: this.token,
                strict: this.strict,
            });
            return serviceClient.callFunc(funcName, params, options);
        }
    }

    return DynamicServiceClient;
});
