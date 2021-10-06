/*
kbaseGenericSetViewer

A widget which can display a data object visualization for several types of objects
in the "KBaseSets" type module.

This viewer is just a wrapper around the entrypoint react component, Dispatcher.
*/
define([
    'react',
    'react-dom',
    'kbwidget',
    'kbaseAuthenticatedWidget',
    'narrativeConfig',
    'react_components/ErrorMessage',
    'widgets/function_output/KBaseSets/Dispatcher'
], (
    React,
    ReactDOM,
    KBWidget,
    kbaseAuthenticatedWidget,
    Config,
    ErrorMessage,
    Dispatcher
) => {
    'use strict';

    const { createElement: e } = React;

    /**
     * A kbwidget which wraps the React component above.
     */
    return KBWidget({
        name: "kbaseGenericSetViewer",
        parent: kbaseAuthenticatedWidget,

        version: "1.0.0",

        init: function (options) {
            try {
                this._super(options);

                ReactDOM.render(e(Dispatcher, {
                    workspaceURL: Config.url('workspace'),
                    serviceWizardURL: Config.url('service_wizard'),
                    token: this.authToken(),
                    objectRef: this.options.upas.obj_ref
                }), this.$elem[0]);
            } catch (ex) {
                return ReactDOM.render(e(ErrorMessage({
                    error: ex
                })), this.$elem[0]);
            }
        },
    });
});
