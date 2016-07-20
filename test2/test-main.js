var tests = [];
for (var file in window.__karma__.files) {
    if (window.__karma__.files.hasOwnProperty(file)) {
        if (/-[sS]pec\.js$/.test(file)) {
            tests.push(file);
        }
    }
}

require.config({
    // Karma serves files under /base, which is the basePath from your config file
    baseUrl: '/base/kbase-extension/static/kbase/js',
    paths: {
        kb_common: 'http://cdn.kbase.us/cdn/kbase-common-js/1.5.4/',
        kb_service: 'http://cdn.kbase.us/cdn/kbase-service-clients-js/2.9.1/',
        uuid: 'http://cdn.kbase.us/cdn/pure-uuid/1.3.0/uuid',
        text:  'http://cdn.kbase.us/cdn/requirejs-text/2.0.14/text',
        css: 'http://cdn.kbase.us/cdn/require-css/0.1.8/css',
        'font-awesome': 'http://cdn.kbase.us/cdn/font-awesome/4.3.0/css/font-awesome',
        bluebird: 'http://cdn.kbase.us/cdn/bluebird/3.3.4/bluebird',
        jquery: 'http://cdn.kbase.us/cdn/jquery/2.2.2/jquery',
        bootstrap: 'http://cdn.kbase.us/cdn/jquery/3.3.6/js/bootstrap',
        bootstrap_css: 'http://cdn.kbase.us/cdn/jquery/3.3.6/css/bootstrap'
        
    },
    // dynamically load all test files
    deps: tests,
    // we have to kickoff jasmine, as it is asynchronous
    callback: window.__karma__.start
});
