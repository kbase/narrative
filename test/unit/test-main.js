/*jslint white: true*/

var tests = [
    'text', 'json'
];
for (var file in window.__karma__.files) {
    if (window.__karma__.files.hasOwnProperty(file)) {
        if (/[sS]pec\.js$/.test(file)) {
            tests.push(file);
        }
    }
}

// hack to make jed (the i18n library that Jupyter uses) happy.
document.nbjs_translations = {
    'domain': 'nbjs',
    'locale_data':
    {
        'nbjs': {
            '': {
                'domain': 'nbjs'
            }
        }
    }
};

// hacks to spoof preact and preactCompat, needed by a Jupyter component we aren't testing.
window.preact = {
    render: function() { return null; }
};
window.preactCompat = {
    createClass: function() { return {}; },
    createElement: function() { return {}; }
};

requirejs.config({
    baseUrl: '/narrative/static/',

    paths: {
        moment: 'components/moment/moment',
        codemirror: 'components/codemirror',
        bootstraptour: 'components/bootstrap-tour/build/js/bootstrap-tour.min',
        bootstrap: 'ext_components/bootstrap/dist/js/bootstrap.min',
        testUtil: '../../test/unit/testUtil',
        bluebird: 'ext_components/bluebird/js/browser/bluebird.min',
        jed: 'components/jed/jed',
        custom: 'kbase/custom'
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
            exports: 'jquery'
        },
        bootstraptour: {
            deps: ['bootstrap'],
            exports: 'Tour'
        },
        bootstrap: {
            deps: ['jquery'],
            exports: 'Bootstrap'
        },
    },

    callback: function() {
        require(['testUtil'], function(TestUtil) {
            TestUtil.make().then(function() {
                window.__karma__.start();
            });
        }, function (error) {
            console.error('Failed to open TestUtil file.');
            console.error(error);
            throw error;
        });
    }
});
