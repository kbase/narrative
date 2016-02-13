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

requirejs.config({
    baseUrl: '/narrative/static/',

    paths: {
        moment: 'components/moment/moment',
        codemirror: 'components/codemirror',
    },

    deps: tests,

    callback: window.__karma__.start
});