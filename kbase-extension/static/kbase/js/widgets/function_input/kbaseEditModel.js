/**
 * Input widget to load edit model widget (editors/kbaseModelEditor.js).
 *
 * @param none.  This is an input widget, meant to be used with narrative_method_spec
 * @author Bill Riehl <wjriehl@lbl.gov>, nconrad <nconrad@anl.gov>
 * @public
 */

/*global define*/
/*jslint white: true*/
define(['jquery',
        'narrativeConfig',
        'bluebird',
        'kbwidget',
        'kbaseModelEditor',
        'kbaseNarrativeMethodInput',
        'kbaseNarrativeInput',
        'kbaseNarrativeParameterTextInput',
        'kbase-client-api'],
function ($,
          Config,
          Promise) {
    'use strict';
    $.KBWidget({
        name: 'kbaseEditModel',
        parent: 'kbaseNarrativeMethodInput',

        modelChooserWidget: null,
        $modelDisplayPanel: null,
        wsClient: null,

        init: function (options) {
            this._super(options);

            // remove footer
            this.$elem.parents('.kb-cell').find('.kb-method-footer').remove();

            return this;
        },

        render: function (options) {
            this.wsClient = new Workspace(Config.url('workspace'), { token:this.authToken() });

            this.container = $('<div>');

            this.$modelChooserPanel = $('<div>');
            this.$modelDisplayPanel = $('<div>');

            this.container.append(this.$modelChooserPanel)
                     .append(this.$modelDisplayPanel);
            this.$elem.append(this.container);

            // For now, spit up the method spec to console.log so you can read it.
            // this.options.method is guaranteed to be there.
            //console.log(this.options.method);

            // Creates the media chooser widget, which is just a 'text' input
            // This was originally designed to deal with the parameter spec object.
            this.modelChooserWidget = this.$modelChooserPanel.kbaseNarrativeParameterTextInput(
                {
                    loadingImage: Config.get('loading_gif'),
                    parsedParameterSpec: this.options.method.parameters[0],
                    isInSidePanel: false
                }
            );

            // Simple listener that just plops the input value in this panel.
            // Listener gets triggered whenever anything in the chooser widget
            // changes.
            this.modelChooserWidget.addInputListener(function() {
                this.modelName = this.modelChooserWidget.getParameterValue();
                this.updateDisplayPanel(this.modelName);
            }.bind(this));
        },

        /**
         * adds model widget (and a horizontal line above it)
         */
        updateDisplayPanel: function(modelName) {
            this.$modelDisplayPanel.remove();

            if (modelName) {
                this.$modelDisplayPanel = $('<div>');
                var modelWidget = $('<div>');

                var self = this;
                modelWidget.kbaseModelEditor({
                    ws: Jupyter.narrative.getWorkspaceName(),
                    obj: modelName,
                    onSave: function () { self.trigger('updateData.Narrative') }
                });

                this.$modelDisplayPanel.append('<hr>');
                this.$modelDisplayPanel.append(modelWidget)

                this.container.append(this.$modelDisplayPanel);
            }
        },

        /**
         * Refresh should pass along the command to each of its parameters,
         * or otherwise refresh itself. Called by the controller at startup, and
         * whenever the data panel gets updated.
         */
        refresh: function () {
            this.modelChooserWidget.refresh();
        },

        /**
         * Should return some state that can be refreshed into the widget.
         * Typically, the minimal object that can be stored in the narrative itself,
         * that can refresh the widget to its last state. Don't store entire
         * data objects here.
         */
        getState: function () {
            return {'model': this.modelName};
        },


        /**
         * Should do something with the state that gets returned.
         */
        loadState: function (state) {
            this.modelChooserWidget.loadState(state.model);
            this.updateDisplayPanel(state.model);
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
            this.modelChooserWidget.setParameterValue(value);
        },

        /**
         * Gets a single parameter value from the id set by the method spec.
         */
        getParameterValue: function(paramId) {
            return this.modelChooserWidget.getParameterValue();
        },

        /**
         * Needed to run the function. Parameter ids need to map onto what's expected
         * from the method spec. Needs to be returned as a list.
         */
        getAllParameterValues: function() {
            return [
                {
                    id: this.options.method.parameters[0].id,
                    value: this.modelChooserWidget.getParameterValue()
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
            var paramStatus = this.modelChooserWidget.isValid();
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
