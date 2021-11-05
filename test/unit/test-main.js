/* global requirejs */
const tests = [
    ...['text', 'json'],
    // Keep only the test spec files under the test directory.
    // Karma prepends these with /base/, so make sure that's included.
    ...Object.keys(window.__karma__.files).filter((file) =>
        /^\/base\/test\/.*[sS]pec\.js$/.test(file)
    ),
];

// hack to make jed (the i18n library that Jupyter uses) happy.
document.nbjs_translations = {
    domain: 'nbjs',
    locale_data: {
        nbjs: {
            '': {
                domain: 'nbjs',
            },
        },
    },
};

// hack to spoof createReactClass, needed by a Jupyter component we aren't testing.
window.createReactClass = () => {
    /* no op */
};

requirejs.config({
    baseUrl: '/narrative/static/',

    paths: {
        moment: 'components/moment/moment',
        codemirror: 'components/codemirror',
        bootstraptour: 'components/bootstrap-tour/build/js/bootstrap-tour.min',
        bootstrap: 'ext_components/bootstrap/dist/js/bootstrap.min',
        testUtil: '../../test/unit/testUtil',
        narrativeMocks: '../../test/unit/mocks',
        bluebird: 'ext_components/bluebird/js/browser/bluebird.min',
        jed: 'components/jed/jed',
        custom: 'kbase/custom',
        // Note that this is only provided in the testing amd module configuration;
        // Mock Service Worker (MSW) is not active in the actual Narrative web app.
        msw: 'ext_modules/msw/index',
    },
    map: {
        '*': {
            'jquery-ui': 'jqueryui',
        },
    },

    deps: tests,

    shim: {
        jquery: {
            deps: [],
            exports: 'jquery',
        },
        bootstraptour: {
            deps: ['bootstrap'],
            exports: 'Tour',
        },
        bootstrap: {
            deps: ['jquery'],
            exports: 'Bootstrap',
        },
    },

    callback: function () {
        'use strict';
        require(['testUtil'], (TestUtil) => {
            TestUtil.make().then(() => {
                window.__karma__.start();
            });
        }, (error) => {
            console.error('Failed to open TestUtil file.');
            console.error(error);
            throw error;
        });
    },
});
