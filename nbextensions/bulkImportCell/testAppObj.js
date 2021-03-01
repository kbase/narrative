define([
    'narrativeConfig',
    './testAppObj-ci',
    'json!./testAppObj-prod.json'
], (Config, TestDataCi, TestDataProd) => {
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
