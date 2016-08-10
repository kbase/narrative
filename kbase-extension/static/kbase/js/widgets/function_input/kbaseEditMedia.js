/**
 * Input widget to load edit media widget.  May also be used for new media, not sure yet.
 *
 * Responsible for loading the edit media widget.
 *
 * @param none.  This is an input widget, meant to be used with narrative_method_spec
 * @author Bill Riehl <wjriehl@lbl.gov>, nconrad <nconrad@anl.gov>
 * @public
 */

/*global define*/
/*jslint white: true*/
define([
    'kbwidget',
    'jquery',
    'narrativeConfig',
    'kbaseMediaEditor',
    'kbaseNarrativeMethodInput',
    'kbaseNarrativeInput',
    'kbaseNarrativeParameterTextInput',
    'kb_service/client/workspace',
    'bootstrap'
], function (
    KBWidget,
    $,
    Config,
    kbaseMediaEditor,
    kbaseNarrativeMethodInput,
    kbaseNarrativeInput,
    kbaseNarrativeParameterTextInput,
    Workspace
    ) {
    'use strict';
    return KBWidget({
        name: 'kbaseEditMedia',
        parent: kbaseNarrativeMethodInput,
        mediaChooserWidget: null,
        $mediaDisplayPanel: null,
        wsClient: null,
        init: function (options) {
            this._super(options);

            // change "Run" button to "Save"?
            //var saveBtn = this.$elem.parents('.kb-func-panel').find('.kb-method-run').text('Save');

            // remove footer
            // this.$elem.parents('.kb-cell').find('.kb-method-footer').remove();

            return this;
        },
        render: function (options) {
            this.wsClient = new Workspace(Config.url('workspace'), {token: this.authToken()});

            this.container = $('<div>');

            this.$mediaChooserPanel = $('<div>');
            this.$mediaDisplayPanel = $('<div>');

            this.container.append(this.$mediaChooserPanel)
                .append(this.$mediaDisplayPanel);

            this.$elem.append(this.container);

            // For now, spit up the method spec to console.log so you can read it.
            // this.options.method is guaranteed to be there.
            //console.log(this.options.method);

            // Creates the media chooser widget, which is just a 'text' input
            // This was originally designed to deal with the parameter spec object.
            this.mediaChooserWidget = new kbaseNarrativeParameterTextInput(this.$mediaChooserPanel, {
                loadingImage: Config.get('loading_gif'),
                parsedParameterSpec: this.options.appSpec.parameters[0],
                isInSidePanel: false
            });

            // Simple listener that just plops the input value in this panel.
            // Listener gets triggered whenever anything in the chooser widget
            // changes.

            this.mediaChooserWidget.addInputListener(function () {
                this.mediaName = this.mediaChooserWidget.getParameterValue();
                this.updateDisplayPanel(this.mediaName);
            }.bind(this));
        },
        /**
         * adds media widget (and a horizontal line above it)
         */
        updateDisplayPanel: function (mediaName) {
            this.$mediaDisplayPanel.remove();

            if (mediaName) {
                this.$mediaDisplayPanel = $('<div>');
                var mediaWidget = $('<div>');

                var self = this;
                new kbaseMediaEditor(mediaWidget, {
                    ws: this.options.workspaceName,
                    obj: mediaName,
                    onSave: function () {
                        self.trigger('updateData.Narrative')
                    }
                });

                this.$mediaDisplayPanel.append('<hr>');
                this.$mediaDisplayPanel.append(mediaWidget)

                this.container.append(this.$mediaDisplayPanel);
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
            return {'media': this.mediaName};
        },
        /**
         * Should do something with the state that gets returned.
         */
        loadState: function (state) {
            this.mediaChooserWidget.loadState(state.media);
            this.updateDisplayPanel(state.media);
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
        setParameterValue: function (paramId, value) {
            this.mediaChooserWidget.setParameterValue(value);
        },
        /**
         * Gets a single parameter value from the id set by the method spec.
         */
        getParameterValue: function (paramId) {
            return this.mediaChooserWidget.getParameterValue();
        },
        /**
         * Needed to run the function. Parameter ids need to map onto what's expected
         * from the method spec. Needs to be returned as a list.
         */
        getAllParameterValues: function () {
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
        isValid: function () {
            var isValidRet = {isValid: true, errormssgs: []};
            var paramStatus = this.mediaChooserWidget.isValid();
            if (!paramStatus.isValid()) {
                isValidRet.isValid = false;
                for (var i = 0; i < paramStatus.errormssgs.length; i++) {
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
        prepareDataBeforeRun: function () {

        },
    });
});
