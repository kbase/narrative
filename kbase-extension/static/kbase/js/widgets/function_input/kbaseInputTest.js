/*global define*/
/*jslint white: true*/
define (
	[
		'kbwidget',
		'bootstrap',
		'jquery',
		'narrativeConfig',
		'bluebird',
		'kbaseNarrativeMethodInput',
		'kbaseNarrativeInput',
		'kbaseNarrativeParameterTextInput',
		'kbase-client-api'
	], function(
		KBWidget,
		bootstrap,
		$,
		Config,
		Promise,
		kbaseNarrativeMethodInput,
		kbaseNarrativeInput,
		kbaseNarrativeParameterTextInput,
		kbase_client_api
	) {
    'use strict';
    return KBWidget({
        name: 'kbaseInputTest',
        parent : kbaseNarrativeMethodInput,

        mediaChooserWidget: null,
        $mediaDisplayPanel: null,
        wsClient: null,

        init: function (options) {
            this._super(options);
            return this;
        },

        render: function (options) {
            this.wsClient = new Workspace(Config.url('workspace'), { token:this.authToken() });

            var $mediaChooserPanel = $('<div>');
            this.$mediaDisplayPanel = $('<div>');

             this.$elem.append($mediaChooserPanel)
                     .append(this.$mediaDisplayPanel);

            // For now, spit up the method spec to console.log so you can read it.
            // this.options.method is guaranteed to be there.
            console.log(this.options.method);

            // Creates the media chooser widget, which is just a 'text' input
            // This was originally designed to deal with the parameter spec object.
            this.mediaChooserWidget =  new kbaseNarrativeParameterTextInput($mediaChooserPanel, {
                    loadingImage: Config.get('loading_gif'),
                    parsedParameterSpec: this.options.method.parameters[0],
                    isInSidePanel: false
                }
            );

            // Simple listener that just plops the input value in this panel.
            // Listener gets triggered whenever anything in the chooser widget
            // changes.
            this.mediaChooserWidget.addInputListener(function() {
                var mediaName = this.mediaChooserWidget.getParameterValue();
                this.updateDisplayPanel(mediaName);
            }.bind(this));
        },

        /**
         * You'll spend most of your time here, I think.
         */
        updateDisplayPanel: function(mediaObject) {
            console.log('input value: ' + mediaObject);

            if (mediaObject) {


                // cram a div into the area.
                // should probably get templated with Handlebars. An exercise for the reader.
                this.$mediaDisplayPanel.append($('<div class="alert alert-warning alert-dismissible">' +
                    '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
                    '<span aria-hidden="true">&times;</span></button>' +
                    mediaObject + '</div>'));

                // Actually fetch the data object. Bluebird promises rock way harder than jquery.ajax.
                // Seriously. Map and reduce among promises, being able to cancel running ones,
                // pretty sweet.
                //
                // And they're easy to wrap any existing deferreds (or any code, really).
                Promise.resolve(this.wsClient.get_objects([{
                    workspace: Jupyter.narrative.getWorkspaceName(),  // sneaky fetch code I put in last week. look in the kbaseNarrative.js module for more
                    name: mediaObject
                }]))
                .then(function(objects) {
                    console.log(objects);
                })
                .catch(function(error) {
                    console.error(error);
                });
            }
        },

        /**
         * Refresh should pass along the command to each of its parameters,
         * or otherwise refresh itself. Called by the controller at startup, and
         * whenever the data panel gets updated.
         */
        refresh: function () {
            this.mediaChooserWidget.refresh();
        },

        /**
         * Should return some state that can be refreshed into the widget.
         * Typically, the minimal object that can be stored in the narrative itself,
         * that can refresh the widget to its last state. Don't store entire
         * data objects here.
         */
        getState: function () {
            return {};
        },

        /**
         * Should do something with the state that gets returned.
         */
        loadState: function (state) {

        },

        /**
         * Should disable a single parameter editing (used when input is part of an app)
         */
        disableParameterEditing: function (paramId) {

        },

        /**
         * Enables a single parameter editing (used when input is part of an app)
         */
        enableParameterEditing: function (paramId) {

        },

        /**
         * Sets a single parameter value (only one in this widget, right?).
         * paramId is from the method spec.
         */
        setParameterValue: function(paramId, value) {
            this.mediaChooserWidget.setParameterValue(value);
        },

        /**
         * Gets a single parameter value from the id set by the method spec.
         */
        getParameterValue: function(paramId) {
            return this.mediaChooserWidget.getParameterValue();
        },

        /**
         * Needed to run the function. Parameter ids need to map onto what's expected
         * from the method spec. Needs to be returned as a list.
         */
        getAllParameterValues: function() {
            return [
                {
                    id: this.options.method.parameters[0].id,
                    value: this.mediaChooserWidget.getParameterValue()
                }
            ];
        },

        /*
         * This is called when this method is run to allow you to check if the parameters
         * that the user has entered is correct.  You need to return an object that indicates
         * if the input is valid, or if not, if there are any error messages.  When this is
         * called, you should visually indicate which parameters are invalid by marking them
         * red (see kbaseNarrativeMethodInput for default styles).
         */
        isValid: function() {
            var isValidRet = { isValid:true, errormssgs: [] };
            var paramStatus = this.mediaChooserWidget.isValid();
            if (!paramStatus.isValid()) {
                isValidRet.isValid = false;
                for (var i=0; i<paramStatus.errormssgs.length; i++) {
                    isValidRet.errormssgs.push(paramStatus.errormssgs[i]);
                }
            }
            return isValidRet;
        },

        /*
         * This function is invoked every time we run app or method. This is the difference between it
         * and getAllParameterValues/getParameterValue which could be invoked many times before running
         * (e.g. when widget is rendered).
         */
        prepareDataBeforeRun: function() {

        },

    });
});
