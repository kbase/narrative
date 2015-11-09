/**
 * Absolute minimal support for logging.
 *
 * Author: Dan Gunter <dkgunter@lbl.gov>
 * Date: 14 September 2013
 * - Addig
 */

/*jshint sub:true*/
/*global window:true,define:true, module:true*/
(function(window) {
    "use strict";
    /* Make console logging a no-op where not defined */
	if (typeof console === 'undefined' || !console.log) {
	  window.console = {
	    debug: function() {},
	    trace: function() {},
	    log: function() {},
	    info: function() {},
	    warn: function() {},
	    error: function() {}
	  };
	}
})(window);
