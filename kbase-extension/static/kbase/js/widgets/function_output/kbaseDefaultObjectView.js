define([
    'bluebird',
    'jquery',
    'kbwidget',
    'kbaseAuthenticatedWidget',
    'narrativeConfig',
    'kb_service/utils',
    'kb_common/html',
    'kbaseTabs',
    'common/runtime',
    'kbase-client-api'
], function (
    Promise,
    $,
    KBWidget,
    kbaseAuthenticatedWidget,
    Config,
    ServiceUtils,
    html,
    KBaseTabs,
    Runtime
) {
    'use strict';
    return KBWidget({
        name: 'kbaseDefaultObjectView',
        parent: kbaseAuthenticatedWidget,
        options: {
            upas: {
                upas: []
            }
        },

        init: function(options) {
            this._super(options);
            this.token = Runtime.make().authToken();
            this.render(this.options.upas.upas);
            return this;
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
                    .then((objectList) => {
                        let renderedObjects = [],
                            renderedMetadata = [],
                            objectInfos = objectList.infos.map((info) => {
                                return ServiceUtils.objectInfoToObject(info);
                            });

                        objectInfos.forEach((info) => {
                            renderedObjects.push(this.renderObjectInfo(info));
                            renderedMetadata.push(this.renderObjectMeta(info.metadata));
                        });

                        let $tabDiv = $('<div>'),
                            $tabWidget = new KBaseTabs($tabDiv, {
                                tabs: [{
                                    tab: 'Overview',
                                    content: $('<div>').append(renderedObjects.join())
                                }, {
                                    tab: 'Metadata',
                                    content: $('<div>').append(renderedMetadata.join())
                                }]
                            });
                        return $tabDiv;
                    })
                    .catch((error) => {
                        console.error(JSON.stringify(error));
                        return this.renderMessage('Unable to retrieve object information for ' + JSON.stringify(upas), true);
                    });
            }
            return htmlProm.then((html) => {
                this.$elem.empty().append(html);
            });
        },

        renderObjectMeta: function(meta) {
            if (!meta || Object.keys(meta).length === 0) {
                return 'No metadata found for this object.';
            }
            let t = html.tag,
                div = t('div'),
                table = t('table'),
                tr = t('tr'),
                td = t('td'),
                th = t('th'),
                metaTableRows = Object.keys(meta).map((key) => {
                    return tr([
                        td(key),
                        td(meta[key])
                    ]);
                }),
                metaTable = table({
                    class: 'table table-bordered table-striped'
                }, [
                    th('Key'),
                    th('Value')
                ].concat(metaTableRows)
                );
            return metaTable;
        },

        /**
         * Returns a div containing the message with a little formatting (margin, etc.).
         * if 'error', then it wraps in a Bootstrap error color element.
         */
        renderMessage: function(msg, isError) {
            return Promise.try(() => {
                let divAtts = {
                    style: {
                        padding: '5px'
                    }
                },
                t = html.tag,
                div = t('div');
                if (isError) {
                    divAtts = {
                        class: 'alert alert-danger'
                    }
                }
                return div(
                    divAtts,
                    [msg]
                );
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

        renderWarningAlert: function(objType) {
            let t = html.tag,
                div = t('div'),
                b = t('b');
            return div({
                style: {
                    padding: '5px'
                }
            }, [
                'Objects of this type don\'t have a viewer associated with them. Showing default information.',
            ]);
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
                message = this.renderWarningAlert(),
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
                message,
                infoDiv
            ]);
        },
    });
});