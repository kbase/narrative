require.config({
    waitSeconds: 60,

    urlArgs: 'v=20220524153658',

    baseUrl: '/narrative/static/',
    paths: {
        'auth/js/main': 'auth/js/main.min',
        custom: '/narrative/static/kbase/custom',
        nbextensions: '/narrative/nbextensions',
        kernelspecs: '/narrative/kernelspecs',
        underscore: 'components/underscore/underscore-min',
        backbone: 'components/backbone/backbone-min',
        jed: 'components/jed/jed',
        jquery: 'components/jquery/jquery.min',
        bootstrap: '/narrative/static/ext_components/bootstrap/dist/js/bootstrap.min',
        bootstraptour: 'components/bootstrap-tour/build/js/bootstrap-tour.min',
        'jquery-ui': 'components/jquery-ui/jquery-ui.min',
        moment: 'components/moment/moment',
        codemirror: 'components/codemirror',
        termjs: 'components/term.js/src/term',
        typeahead: 'components/jquery-typeahead/dist/jquery.typeahead',
    },
    map: {
        '*': {
            jqueryui: 'jquery-ui',
            contents: 'services/contents',
        },
    },
    shim: {
        typeahead: {
            deps: ['jquery'],
            exports: 'typeahead',
        },
        underscore: {
            exports: '_',
        },
        backbone: {
            deps: ['underscore', 'jquery'],
            exports: 'Backbone',
        },
        bootstrap: {
            deps: ['jquery'],
            exports: 'bootstrap',
        },
        bootstraptour: {
            deps: ['bootstrap'],
            exports: 'Tour',
        },
        'jquery-ui': {
            deps: ['jquery'],
            exports: '$',
        },
    },
});

document.nbjs_translations = { domain: 'nbjs', locale_data: { nbjs: { '': { domain: 'nbjs' } } } };
