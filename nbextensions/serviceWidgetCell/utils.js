define(['narrativeConfig'], (narrativeConfig) => {
    'use strict';

    function niceConfig() {
        const {
            // auth_cookie,
            comm_wait_timeout,
            environment,
            // dev_mode, git_commit_hash, git_commit_time,
            // version,
            urls: {
                auth,
                // awe, catalog, data_import_export,
                execution_engine2,
                // fba, genomeCmp, groups, job_service, narrative_job_proxy,
                // narrative_method_store, narrative_method_store_image,
                // sample_service, search,
                searchapi2,
                service_wizard,
                // shock, transform, trees, user_and_job_state,
                user_profile,
                workspace,
            },
        } = narrativeConfig.config;
        return {
            services: {
                Auth2: {
                    url: auth,
                },
                UserProfile: {
                    url: user_profile,
                },
                ServiceWizard: {
                    url: service_wizard,
                },
                SearchAPI2: {
                    url: searchapi2,
                },
                execution_engine2: {
                    url: execution_engine2,
                },
                Workspace: {
                    url: workspace,
                },
            },
            serviceRequestTimeout: comm_wait_timeout,
            environment: environment,
            isDevMode: false,
        };
    }

    return { niceConfig };
});
