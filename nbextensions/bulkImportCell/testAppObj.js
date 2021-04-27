define(['narrativeConfig', './testAppObj-ci', './testAppObj-prod'], (
    Config,
    TestDataCi,
    TestDataProd
) => {
    'use strict';

    const env = Config.get('environment');
    switch (env) {
        case 'ci':
        case 'dev':
            return TestDataCi;
        default:
            return TestDataProd;
    }
});
