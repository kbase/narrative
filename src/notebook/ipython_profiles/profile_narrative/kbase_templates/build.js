({
    baseUrl: "./static",
    mainConfigFile: "static/narrative_paths.js",
    findNestedDependencies: true,
    optimize: "uglify2",
    generateSourceMaps: true,
    preserveLicenseComments: false,
    name: "narrative_paths",
    out: "static/dist/kbase-narrative-built.js"
})