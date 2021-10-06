/* eslint {strict: ['error', 'global']} */
/* global requirejs */
'use strict';
const tests = [
    ...['text', 'json'],
    ...Object.keys(window.__karma__.files).filter((file) => /[sS]pec\.js$/.test(file)),
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
window.createReactClass = () => { };

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
        // React: 'ext_modules/react/react.development',
        // ReactDOM: 'ext_modules/react/react-dom.development',
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
