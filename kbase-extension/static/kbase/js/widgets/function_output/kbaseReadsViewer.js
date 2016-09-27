/**
 * This is a simple template for building KBase Narrative Widgets.
 * KBase Widgets are based around the jQuery widget extension architecture,
 * and are also instantiated as such.
 *
 * Your widget will need (at minimum) a unique name, a parent to inherit 
 * from, a semantic version, an 'options' structure, and an init() function
 * that returns itself.
 *
 * Details are described below.
 *
 * Instantiating a widget is done using a code form like this:
 * $("#myElement").MyWidget({ option1: value1, option2:value2 });
 *
 * Instantiating this widget within the narrative just requires the output
 * of a function that is run in the IPython Kernel to output the widget and
 * the set of options it requires. Examples to follow.
 *
 * This version of the widget template includes authentication options for
 * free - you shouldn't need to handle passing in user ids or auth tokens.
 * These are referenced by the functions:
 * this.user_id();
 * and
 * this.authToken();
 *
 * @see kbaseAuthenticatedWidget.js
 * @public
 */
define (
	[
                'bluebird',
		'kbwidget',
		'bootstrap',
		'jquery',
		'kbaseAuthenticatedWidget',
                'narrativeConfig',
                'kbase-client-api'
	], function(
                Promise,
		KBWidget,
		bootstrap,
		$,
		kbaseAuthenticatedWidget,
                Config,
                KBaseClientApi
	) {
    return KBWidget({
        /* 
         * (required) Your widget should be named in CamelCase.
         */
        name: 'kbaseDefaultNarrativeOutput',
        parent : kbaseAuthenticatedWidget,
        version: "1.0.0",
        token: null,
        options: {
            wsId: null,
            wsName: null,
	    objId: null,
            jobId: null,
	    data: null
        },

        /*
         * Extending kbaseAuthenticatedWidget lets you use auth tokens
         * semi-automatically, assuming the page this is used in fires
         * the loggedIn.kbase, loggedOut.kbase, and loggedInQuery events.
         * These are usually fired by the kbaseLogin widget.
         *
         * this.user_id() = the logged in user id
         * this.authToken() = the current authentication token
         */
        

        /**
         * (required) This is the only required function for a KBase Widget.
         * @param {object} options - a structure containing the set of 
         * options to be passed to this widget.
         * @private
         */
        init: function(options) {
            /*
             * This should be the first line of your init function.
             * It registers the new widget, overriding existing options.
             *
             * The members of the options structure will become members of 
             * this.options, overriding any existing members.
             */
            this._super(options);
	    this.wsUrl = Config.url('workspace');

            /*
             * It is required to return this.
             */
            return this;
        },

        /**
         * (not required)
         * I prefer to keep initialization and rendering code separate, but
         * that's just a style thing. You can do whatever the widget requires.
         */
        render: function() {
            var s = this.options.data;
	    this.$elem.append('<div><b>hello!</b></div>');
	    
	    alert(this.options.objId);
	    Promise.resolve(this.wsClient.get_objects([{ref: this.options.wsName + '/' + this.options.objId}]))
            .then(function(results) {
                var reads = results[0];
                this.$elem.append('<div>' + JSON.stringify(reads) + '</div>');
                console.log(reads);
            }.bind(this))
            .catch(function(error) {
		alert('An error happened');
            });

//	    var readsObject =

            return this;
        },

        loggedInCallback: function(event, auth) {
            this.token = auth.token;
	    this.wsClient = new Workspace(this.wsUrl, auth);
            this.render();
            return this;
        },

        loggedOutCallback: function(event, auth) {
            this.token = null;
            this.render();
            return this;
        },

    });
});
