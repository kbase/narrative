({
    name: 'narrative_paths',
    baseUrl: 'kbase-extension/static',
    include: ['narrativeMain', 'buildTools/loadAppWidgets'],
    mainConfigFile: 'kbase-extension/static/narrative_paths.js',
    findNestedDependencies: true,
    optimize: 'none',
    generateSourceMaps: true,
    preserveLicenseComments: false,
    out: 'kbase-extension/static/kbase-narrative.js',
    paths: {
        jqueryui: 'empty:',
        bootstrap: 'empty:',
        'jquery-ui': 'empty:',
        narrativeConfig: 'empty:',
        'base/js/utils': 'empty:',
        'base/js/namespace': 'empty:',
        bootstraptour: 'empty:',
        'services/kernels/comm': 'empty:',
        'common/ui': 'empty:',
        'notebook/js/celltoolbar': 'empty:',
        'base/js/events': 'empty:',
        'base/js/keyboard': 'empty:',
        'base/js/dialog': 'empty:',
        'notebook/js/notebook': 'empty:',
        'notebook/js/main': 'empty:',
        'custom/custom': 'empty:',
    },
    inlineText: false,
    buildCSS: false,
    optimizeAllPluginResources: false,
});
