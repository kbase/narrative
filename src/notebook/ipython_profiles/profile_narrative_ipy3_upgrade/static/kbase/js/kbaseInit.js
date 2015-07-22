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
    'jquery',
    'narrative_paths',
], function($) {
    "use strict";
    console.log('Initializing KBase config.');

    require(['narrativeConfig'], function(configDefer) {
        // The config returns a Deferrered. When that's
        // finished, inject the config into the global namespace.
        //
        // TODO: bail out if the config isn't available.
        configDefer.then(function(config) {
            if (config === null) {
                console.err('fatal error! gotta bail out here.');
                // TODO: change the view to an error/error popup/etc.
                return;
            }
            window.kbconfig = config;
            require(['narrativeLogin']);
        });
    });
});