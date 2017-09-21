/*jslint white: true*/
// var baseUrl = "http://localhost:8888/static/";

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
console.log('starting...');

requirejs.config({
    baseUrl: '/narrative/static/',

    paths: {
        moment: 'components/moment/moment',
        codemirror: 'components/codemirror',
        bootstraptour: 'components/bootstrap-tour/build/js/bootstrap-tour.min',
        bootstrap: 'components/bootstrap/js/bootstrap.min',
        testUtil: '../../test/unit/testUtil'
    },
    map: {
        '*': {
            'jquery-ui': 'jqueryui'
        }
    },

    deps: tests,

    shim: {
        bootstraptour: {
            deps: ['bootstrap'],
            exports: 'Tour'
        },
        bootstrap: {
            deps: ['jquery'],
            exports: 'Bootstrap'
        }
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


function addCdnModules(baseUrl) {
    if (!baseUrl) {
        baseUrl = 'https://ci.kbase.us/cdn/files';
        // baseUrl = 'http://cdn.kbase.us/cdn';
    }
    var modules = {
            kb_common: 'kbase-common-js/1.7.0/',
            kb_service: 'kbase-service-clients-js/2.9.1/',
            uuid: 'pure-uuid/1.3.0/uuid',
            // TODO: we need to reconcile Jupyter and KBase external deps
            // text:  'requirejs-text/2.0.14/text',
            css: 'require-css/0.1.8/css',
            'font-awesome': 'font-awesome/4.5.0/css/font-awesome',
            handlebars: 'handlebars/4.0.5/handlebars',
            'google-code-prettify': 'google-code-prettify/1.2.0/'
        },
        paths = {};

    Object.keys(modules).forEach(function (key) {
        paths[key] = [baseUrl, modules[key]].join('/');
    });

    require.config({
        paths: paths
    });
}
addCdnModules();
