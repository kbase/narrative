define([
    'bluebird',
    'jquery',
    'kbwidget',
    'kbaseAuthenticatedWidget',
    'narrativeConfig',
    'kb_service/utils',
    'kb_common/html',
    'kbase-client-api'
], function (
    Promise,
    $,
    KBWidget,
    kbaseAuthenticatedWidget,
    Config,
    ServiceUtils,
    html
) {
    'use strict';
    return KBWidget({
        name: 'kbaseDefaultObjectView',
        parent: kbaseAuthenticatedWidget,
        options: {
            upas: []
        },

        init: function(options) {
            this._super(options);
        },

        /**
         * Renders upas. With magic sauce.
         */
        render: function(upas) {
            var htmlProm = null;
            if (!this.token) {
                // some generic not-logged-in message
                htmlProm = this.renderMessage('Not logged in.');
            }
            else if (!upas) {
                // some generic placeholder
                htmlProm = this.renderMessage('No objects to display!');
            }
            else {
                htmlProm = this.fetchObjectInfo(upas)
                    .then((objectInfo) => {
                        let renderedObjects = objectInfo.infos.map((info) => {
                            return this.renderObjectInfo(ServiceUtils.objectInfoToObject(info));
                        });
                        return renderedObjects.join();
                    });
            }
            htmlProm.then((html) => {
                this.$elem.append(html);
            });
        },

        /**
         * Returns a div containing the message with a little formatting (margin, etc.).
         * if 'error', then it wraps in a Bootstrap error color element.
         */
        renderMessage: function(msg, isError) {
            return Promise.try(() => {
                return 'msg';
            });
        },

        /**
         * Fetches object info from a list of upas.
         */
        fetchObjectInfo: function(upas) {
            let ws = new Workspace(Config.url('workspace'), {token: this.token}),
                     objInfoInputs = upas.map((upa) => {
                        return {'ref': upa};
                     });
            return Promise.resolve(ws.get_object_info3({
                objects: objInfoInputs,
                includeMetadata: 1
            }));
        },

        /**
         * Takes in the result of a successful get_object_info3 call and renders the thing.
         */
        renderObjectInfo: function(objInfo) {
            let t = html.tag,
                div = t('div'),
                span = t('span'),
                b = t('b'),
                i = t('i'),
                a = t('a'),
                message = div({
                    class: 'alert alert-warning'
                }, [
                    'Objects of type ',
                    b(objInfo.typeModule + '.' + objInfo.typeName),
                    'don\'t have a view associated with them',
                    '<br>',
                    'High level object information is below.'
                ]),
                infoDiv = div({
                    style: {
                        marginTop: '5px',
                        padding: '5px'
                    }
                }, [
                    div([
                        b(objInfo.name),
                        ' - ',
                        span({
                            style: {
                                color: 'grey'
                            }
                        }, objInfo.ref),
                    ]),
                    div([
                        'Saved ',
                        objInfo.saveDate.toLocaleString(),
                        ' by ',
                        objInfo.saved_by
                    ]),
                    div('Approximately ' + objInfo.size.toLocaleString() + ' bytes'),
                    div({
                        style: {
                            marginLeft: '10px'
                        }
                    }, [
                        div([
                            a({
                                class: 'btn btn-xs btn-default',
                                href: '/#dataview/' + objInfo.ref,
                                target: '_lp'
                            }, [
                                span({
                                    class: 'fa fa-binoculars',
                                })
                            ]),
                            ' Explore data landing page'
                        ]),
                        div([
                            a({
                                class: 'btn btn-xs btn-default',
                                href: '/#objgraphview/' + objInfo.ref,
                                target: '_objgraph'
                            }, [
                                span({
                                    class: 'fa fa-sitemap fa-rotate-90'
                                })
                            ]),
                            ' View data provenance and relationships'
                        ])
                    ]),
                    div({
                        style: {
                            marginTop: '10px'
                        }
                    }, [
                        b('Type: ' + objInfo.typeModule + '.' + objInfo.typeName)
                    ]),
                    div({
                        style: {
                            marginLeft: '10px'
                        }
                    }, [
                        div([
                            a({
                                class: 'btn btn-xs btn-default',
                                href: '/#spec/module/' + objInfo.typeModule,
                                target: '_module'
                            }, [
                                span({
                                    class: 'fa fa-external-link-square'
                                })
                            ]),
                            ' View ',
                            i(objInfo.typeModule),
                            ' module info'
                        ]),
                        div([
                            a({
                                class: 'btn btn-xs btn-default',
                                href: '/#spec/type/' + objInfo.type,
                                target: '_typespec'
                            }, [
                                span({
                                    class: 'fa fa-external-link-square'
                                })
                            ]),
                            ' View ',
                            i(objInfo.typeModule),
                            '.',
                            i(objInfo.typeName),
                            ' type spec'
                        ])
                    ]),
                ]);


            return div([
                div(message),
                infoDiv
            ]);
        },

        loggedInCallback: function(event, auth) {
            this.token = auth.token;
            this.render(this.options.upas.upas);
            return this;
        },

        loggedOutCallback: function(event, auth) {
            this.token = null;
            this.render();
            return this;
        }
    });
});