/*global define*/
/*jslint white: true*/
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
 * @module narrative
 * @class narrativeMain
 * @static
 */
require([
    './narrative_paths'
], function () {
    'use strict';
    require([
        'jquery',
        'narrativeConfig',
        'narrativeLogin',
        'css!font-awesome'
    ], function ($,
        Config,
        Login
    ) {
        console.log('Loading KBase Narrative setup routine.');

        Config.updateConfig()
            .then(function () {
                require(['kbaseNarrative'], function () {
                    Login.init($('#signin-button'))
                        .then(function() {
                            console.log('Starting Jupyter main');
                            require(['notebook/js/main']);
                        });
                });
            });
    });
});
