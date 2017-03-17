/**
 * A little wrapper script for making sure that Narrative code
 * is injected at the right time before loading the Notebook running
 * code.
 *
 * Mainly, we need to load up a configuration, then make
 * sure that the other Narrative JS widgets are loaded *first*,
 * because they're referenced from within Markdown cells at Notebook
 * load time.
 *
 * I'm not thrilled about this, but if this isn't done, then our GUI
 * method/app/output widget cells are replaced by ReferenceErrors.
 *
 * Once this step is complete, the notebook main is run, and the
 * actual KBase Narrative startup code is instantiated in custom.js,
 * where is all ought to be. This is a ***temporary*** solution,
 * until we migrate our Frankenstein'd markdown cells to proper
 * output cells.
 *
 * @author Bill Riehl <wjriehl@lbl.gov>
 * @module narrativeInit
 * @static
 */
require([
    'narrative_paths',
    'require'
], function (paths, require) {
    require([
        'jquery',
        'bluebird',
        'narrativeConfig',
        'narrativeLogin'
    ], function ($,
        Promise,
        Config,
        Login) {
        'use strict';
        console.log('Initializing KBase Tree page.');
        Config.updateConfig()
            .then(function (config) {
                require(['kbapi', 'narrativeLogin'], function (API, Login) {
                    Login.init($('#signin-button'));
                    console.log('Starting Jupyter tree');
                    require(['tree/js/main']);
                });
            });
    });
});
