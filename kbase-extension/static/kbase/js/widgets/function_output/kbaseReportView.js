/**
 * Basic viz for a basic report type.
 * @public
 */

define([
    'bootstrap',
    'jquery',
    'base/js/namespace',

    'kbwidget',
    'kbaseAuthenticatedWidget',
    'narrativeConfig',
    'util/string',
    'kb_common/html',
    'kb_sdk_clients/genericClient',
    'kb_service/client/workspace',
    'common/ui',
    'common/iframe/hostMessages',
    'common/events',

    'jquery-dataTables',
    'jquery-dataTables-bootstrap'
], function (
    bootstrap,
    $,
    Jupyter,

    KBWidget,
    kbaseAuthenticatedWidget,
    Config,
    StringUtil,
    html,
    GenericClient,
    Workspace,
    UI,
    HostMessages,
    Events
) {
    return KBWidget({
        name: 'kbaseReportView',
        parent: kbaseAuthenticatedWidget,
        version: '1.0.0',
        options: {
            workspace_name: null,
            report_name: null,
            report_window_line_height: 10,
            showReportText: true,
            showCreatedObjects: false,
            showFiles: true,
            showHTML: true,
            inNarrative: true, // todo: toggles whether data links show in narrative or new page

            wsURL: Config.url('workspace'),
        },
        // workspace client
        ws: null,
        init: function (options) {
            this._super(options);

            // Create a message pane
            this.$messagePane = $('<div/>').addClass('kbwidget-message-pane kbwidget-hide-message');
            this.$elem.append(this.$messagePane);

            this.$mainPanel = $('<div>');
            this.$elem.append(this.$mainPanel);

            return this;
        },
        loggedInCallback: function (event, auth) {

            // Build a client
            this.ws = new Workspace(this.options.wsURL, auth);

            // Let's go...
            this.loadAndRender();
            return this;
        },
        loggedOutCallback: function (event, auth) {
            this.isLoggedIn = false;
            return this;
        },
        reportData: null,

        // this is an ugly hack. It'd be prettier to hand in just the shock node ID, but I don't have one of those yet.
        // Also, this is embedding the token into the html and the URL, both of which are potentially security concerns.
        // TODO: update to put the auth token into the url... should be working in CI already.
        // TODO: NO HARDCODING OF URLS!!!
        importExportLink: function (shock_url, name) {
            var m = shock_url.match(/\/node\/(.+)$/);
            if (m) {
                var shock_id = m[1];
                var url = 'https://ci.kbase.us/services/data_import_export/download?&id=' + shock_id + '&token=' + this.authToken() + '&wszip=0&name=' + name;

                return url;
            }
        },

        preauthMagicClick: function (url, link_id) {
            var self = this;
            $.ajax({
                url: url,
                type: 'GET',
                //processData : false,
                //dataType : 'binary',
                headers: { 'Authorization': 'Oauth ' + self.authToken() },
                //processData : false
            }).then(function (d) {

                $('#' + link_id).on('click', function (e) {

                    e.stopPropagation();
                    self.preauthMagicClick(url, link_id);
                    window.location.href = self.properPreauthURL(d.data.url);
                });
            }).fail(function (d) {
                //console.log("FAILED ", d);
            });
        },


        properPreauthURL: function (url) {
            var m = url.match(new RegExp('^http://ci.kbase.us/preauth/(.+)$'));
            if (m) {
                url = 'https://ci.kbase.us/services/shock-api/preauth/' + m[1];
            }
            return url;
        },

        loadAndRender: function () {
            var self = this;
            self.loading(true);

            self.objIdentity = self.buildObjectIdentity(this.options.workspace_name, this.options.report_name, null, this.options.report_ref);

            //self.objIdentity = {ref : "11699/2/77"};
            
            console.log('load and render:', this.options);

            self.ws.get_objects([self.objIdentity])
                .then(function (result) {
                    self.reportData = result[0].data;
                    return self.getLinks(self.reportData);
                })
                .then(function (links) {
                    self.reportLinks = links;
                    return self.render();
                })
                .catch(function (err) {
                    self.clientError(err);
                });

            // self.ws.get_objects([self.objIdentity],
            //     function (data) {
            //         self.reportData = data[0].data;
            //         self.render();
            //     },
            //     function (error) {
            //         self.clientError(error);
            //     });
        },

        wrapHtmlDoc: function (content) {
            if (/<html/.test(content)) {
                console.warn('Html document inserted into iframe');
                return content;
            }
            var t = html.tag,
                htmlTag = t('html'),
                head = t('head'),
                body = t('body');
            return htmlTag([
                head(),
                body({
                    style: {
                        margin: '0px',
                        padding: '0px',
                        overflow: 'auto'
                    }
                }, [
                    content
                ])
            ]);
        },

        makeIframe: function (arg) {
            var t = html.tag,
                div = t('div'),
                script = t('script'),
                iframe = t('iframe');

            var iframeId = 'frame_' + html.genId(),
                iframeOrigin = document.location.origin,
                iframeMessages = HostMessages.makeHost({
                    root: window,
                    name: 'panel'
                });

            // The iframe content needs requirejs amd.

            var requireConfig = {
                    baseUrl: 'http://localhost:8888/narrative/static/',
                    paths: {
                        bluebird: 'ext_components/bluebird/js/browser/bluebird.min',
                        messages: 'kbase/js/common/iframe/messages',
                        heightNotifier: 'kbase/js/common/iframe/heightNotifier'
                    }
                },
                iframeScript = div([
                    script({
                        src: 'http://localhost:8888/narrative/static/ext_components/requirejs/require.js'
                    }),
                    script(
                        'require.config(' + JSON.stringify(requireConfig) + ');'
                    ),
                    script([
                        'require(["kbase/js/common/iframe/boot"], function (Boot) {',
                        '  var boot = Boot.make({iframeId: "' + iframeId + '"});',
                        '  boot.start();',
                        '});'
                    ])
                ]),
                // the main content wrapper inside the iframe
                iframeContent = this.wrapHtmlDoc(div({
                    id: iframeId,
                    dataFrame: iframeId,
                    style: {
                        overflow: 'auto'
                    },
                    dataParams: encodeURIComponent(JSON.stringify({
                        parentHost: iframeOrigin,
                        iframeId: iframeId
                    }))
                }, arg.content + iframeScript)).replace(/"/g, '&quot;'),
                width = arg.width || '100%',
                maxHeight = arg.maxHeight || 'auto',
                iframeHtml = iframe({
                    style: {
                        display: 'block',
                        width: width,
                        height: 'auto',
                        maxHeight: maxHeight,
                        margin: 0,
                        padding: 0
                    },
                    dataFrame: iframeId,
                    frameborder: '0',
                    id: iframeId,
                    // src: 'data:text/html;charset=utf-8,' + encodeURIComponent(iframeContent),
                    xsandbox: 'allow-same-origin allow-scripts',
                    xsrcdoc: '<p>Hi!</p>',
                    srcdoc: iframeContent
                });

            return {
                parentHost: iframeOrigin,
                host: iframeOrigin,
                id: iframeId,
                content: iframeHtml,
                messages: iframeMessages
            };
        },

        openReportWindow: function (arg) {
            var w = window.open('http://www.apple.com', 'report');
            w.focus();
        },

        makeIframeDoc: function (arg) {
            var t = html.tag,
                iframe = t('iframe'),
                div = t('div');

            var iframeId = 'frame_' + html.genId();

            var _this = this;

            // The iframe content needs requirejs amd.

            var width = arg.width || '100%',
                maxHeight = arg.maxHeight || 'auto',
                iframeContent = arg.content,
                iframeHtml = iframe({
                    style: {
                        display: 'block',
                        width: width,
                        height: '500px',
                        maxHeight: maxHeight,
                        margin: 0,
                        padding: 0
                    },
                    dataFrame: iframeId,
                    frameborder: '0',
                    id: iframeId,
                    src: 'data:text/html;charset=utf-8,' + encodeURIComponent(iframeContent)
                }),
                wrappedIframe = div({
                    style: {
                        position: 'relative'
                    }
                }, [
                    div({
                        id: arg.events.addEvent({
                            type: 'click',
                            handler: function (e) {
                                _this.openReportWindow({
                                    url: 'something'
                                });
                            }
                        }),
                        style: {
                            position: 'absolute',
                            top: '0',
                            bottom: '0',
                            left: '0',
                            right: '0',
                            backgroundColor: 'rgba(200,200,200,0.5)'
                        }
                    }, [
                        div({
                            style: {
                                position: 'absolute',
                                top: '50%',
                                fontSize: '200%',
                                color: '#FFF',
                                fontWeight: 'bold',
                                padding: '8px',
                                backgroundColor: 'rgba(100,100,100,0.5)',
                                textAlign: 'center',
                                margin: 'auto',
                                border: '2px green solid'
                            }
                        }, 'Click anywhere to view report')
                    ]),
                    iframeHtml
                ]);

            return {
                id: iframeId,
                content: wrappedIframe
            };
        },

        makeIframeSrcDataPlain: function (arg) {
            var t = html.tag,
                iframe = t('iframe'),
                div = t('div');

            var iframeId = 'frame_' + html.genId();

            var _this = this;

            // The iframe content needs requirejs amd.

            var width = arg.width || '100%',
                height = arg.height || 'auto',
                iframeContent = arg.content,
                iframeHtml = iframe({
                    style: {
                        display: 'block',
                        width: width,
                        height: height,
                        // maxHeight: maxHeight,
                        margin: 0,
                        padding: 0
                    },
                    dataFrame: iframeId,
                    frameborder: '0',
                    id: iframeId,
                    src: 'data:text/html;charset=utf-8,' + encodeURIComponent(iframeContent)
                });

            return {
                id: iframeId,
                content: iframeHtml
            };
        },

        makeIframeSrc: function (arg) {
            var t = html.tag,
                iframe = t('iframe');

            var iframeId = 'frame_' + html.genId();

            var width = arg.width || '100%',
                maxHeight = arg.maxHeight || 'auto',
                iframeHtml = iframe({
                    style: {
                        display: 'block',
                        width: width,
                        height: '500px',
                        maxHeight: maxHeight,
                        margin: 0,
                        padding: 0
                    },
                    dataFrame: iframeId,
                    frameborder: '0',
                    scrolling: 'yes',
                    id: iframeId
                });

            return {
                id: iframeId,
                content: iframeHtml
            };
        },

        getLinks: function (report) {
            // NOTE: this returns a promise -- we must look up the html file set service url first.
            var _this = this;

            var client = new GenericClient({
                url: Config.url('service_wizard'),
                token: this.authToken(),
                module: 'HTMLFileSetServ',
                version: 'dev'
            });
            return client.lookupModule()
                .spread(function (serviceStatus) {
                    var htmlServiceURL = serviceStatus.url;
                    if (report.html_links && report.html_links.length) {
                        return report.html_links.map(function (item, index) {
                            console.log('LINK', item);
                            return {
                                name: item.name,
                                url: [htmlServiceURL, 'api', 'v1', _this.objIdentity.ref, '$', index, item.name].join('/')
                            }
                        });
                    } else {
                        return [];
                    }
                });
        },

        makeIframeSrcUrl: function (arg) {
            var t = html.tag,
                iframe = t('iframe');

            var iframeId = 'frame_' + html.genId();

            var width = arg.width || '100%',
                maxHeight = arg.maxHeight || 'auto',
                iframeHtml = iframe({
                    style: {
                        display: 'block',
                        width: width,
                        height: '500px',
                        maxHeight: maxHeight,
                        margin: 0,
                        padding: 0
                    },
                    dataFrame: iframeId,
                    frameborder: '0',
                    scrolling: 'yes',
                    id: iframeId,
                    src: arg.url
                });

            return {
                id: iframeId,
                content: iframeHtml
            };
        },

        setupHostComm: function (iframe, container) {
            iframe.messages.start();
            var _this = this;

            iframe.messages.listen({
                name: 'ready',
                handler: function (message) {
                    if (message.iframeId !== iframe.id) {
                        console.error('Unexpected "ready"', message, message.iframeId, iframe.id);
                        return;
                    }

                    iframe.messages.addPartner({
                        name: message.iframeId,
                        host: iframe.host,
                        window: container.querySelector('[data-frame="' + iframe.id + '"]').contentWindow
                    });

                    iframe.messages.send(message.from, {
                        name: 'start'
                    });
                }
            });

            iframe.messages.listen({
                name: 'rendered',
                handler: function (message) {
                    var height = message.height,
                        iframeNode = _this.$mainPanel[0].querySelector('[data-frame="' + iframe.id + '"]');

                    iframeNode.style.height = height + 'px';
                }
            });

            iframe.messages.listen({
                name: 'clicked',
                handler: function (message) {
                    document.getElementById(message.iframeId).dispatchEvent(new Event('click', {
                        bubbles: true,
                        cancelable: true
                    }));
                }
            });
        },

        render: function () {
            var self = this;
            var _this = this;
            var t = html.tag,
                div = t('div'),
                a = t('a');
            var ui = UI.make({ node: self.$mainPanel.get(0) });
            var report = self.reportData;
            var events = Events.make({
                node: self.$mainPanel.get(0)
            });

            // Handle warnings?
            if (report.warnings) {
                if (report.warnings.length > 0) {
                    var $warningPanel = $('<div style="max-height:100px;overflow-y:auto;margin:0px 5px 5px 10px;">');
                    var warnings = report.warnings;
                    if (warnings.length >= 5) {
                        $warningPanel.append($('<div>').css('margin', '5px').append('[' + warnings.length + 'Warnings]'));
                    }
                    for (var k = 0; k < warnings.length; k++) {
                        $warningPanel.append(
                            $('<div>').css('margin', '0px 5px 5px 10px').append(
                                $('<span>').addClass('label label-warning')
                                .append(warnings[k])));
                    }
                    self.$mainPanel.append($warningPanel);
                }
            }

            if (self.options.showCreatedObjects) {
                var someDiv = div({ dataElement: 'created-objects' });
                self.$mainPanel.append(someDiv);
                if (report.objects_created) {
                    if (report.objects_created.length > 0) {

                        var objsCreated = report.objects_created;

                        var objIds = [];
                        for (var i = 0; i < objsCreated.length; i++) {
                            objIds.push({ 'ref': objsCreated[i].ref });
                        }
                        self.ws.get_object_info_new({ 'objects': objIds })
                            .then(
                                function (objInfo) {

                                    var pref = StringUtil.uuid();
                                    var displayData = [];
                                    var dataNameToInfo = {};
                                    for (var k = 0; k < objInfo.length; k++) {

                                        //var $name = $('<a>').append(objInfo[k][1]);
                                        /* TODO: we need code something like this to show data objects on click
                                         var obj = _.findWhere(self.objectList, {key: key});
                                         var info = self.createInfoObject(obj.info);
                                         // Insert the narrative data cell into the div we just rendered
                                         new kbaseNarrativeDataCell(//$('#' + cell_id), {cell: cell, info: info});
                                         self.trigger('createViewerCell.Narrative', {
                                         'nearCellIdx': near_idx,
                                         'widget': 'kbaseNarrativeDataCell',
                                         'info' : info
                                         });*/

                                        displayData.push({
                                            'name': '<a class="report_row_' + pref + '" data-objname="' + objInfo[k][1] + '">' + objInfo[k][1] + '</a>',
                                            'type': objInfo[k][2].split('-')[0].split('.')[1],
                                            'fullType': objInfo[k][2],
                                            'description': objsCreated[k].description ? objsCreated[k].description : '',
                                            'ws_info': objInfo[k]
                                        });
                                        dataNameToInfo[objInfo[k][1]] = objInfo[k];
                                    }

                                    function reportRowEvents() {
                                        $('.report_row_' + pref).unbind('click');
                                        $('.report_row_' + pref).click(function () {
                                            var objName = [$(this).data('objname')];
                                            self.openViewerCell(dataNameToInfo[objName]);
                                        });
                                    }

                                    var iDisplayLength = 5;
                                    var sDom = 'ft<ip>';
                                    var $tblDiv = $('<div>').css('margin-top', '10px');
                                    //self.$mainPanel.append($tblDiv);

                                    var objTableId = self.uuid();

                                    ui.setContent('created-objects',
                                        ui.buildCollapsiblePanel({
                                            title: 'Objects',
                                            name: 'created-objects-toggle',
                                            hidden: false,
                                            type: 'default',
                                            classes: ['kb-panel-container'],
                                            body: '<div id = \'' + objTableId + '\' style = \'margin-top : 10px\'></div>',
                                        })
                                    );

                                    var $tblDiv = $('#' + objTableId);

                                    if (displayData.length <= iDisplayLength) {
                                        var $objTable = $('<table class="table table-striped table-bordered" style="margin-left: auto; margin-right: auto;">');

                                        displayData.sort(function (a, b) {
                                            return a.name < b.name;
                                        });
                                        var color = '#555';
                                        $objTable.append($('<tr>')
                                            .append('<th style="width:30%;color:' + color + ';"><b>Created Object Name</b></th>')
                                            .append('<th style="width:20%;color:' + color + ';"><b>Type</b></th>')
                                            .append('<th style="color:' + color + ';"><b>Description</b></th>'));
                                        for (var k = 0; k < displayData.length; k++) {
                                            $objTable.append($('<tr>')
                                                .append('<td style="width:30%;color:' + color + ';">' + displayData[k].name + '</td>')
                                                .append('<td style="width:20%;color:' + color + ';">' + displayData[k].type + '</td>')
                                                .append('<td style="color:' + color + ';">' + displayData[k].description + '</td>'));
                                        }
                                        $tblDiv.append($objTable)
                                        reportRowEvents();
                                    } else {
                                        var $tbl = $('<table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-left: 0px; margin-right: 0px;">')
                                            .addClass('table table-bordered table-striped');
                                        $tblDiv.append($tbl);

                                        var sDom = 'ft<ip>';

                                        var tblSettings = {
                                            'sPaginationType': 'full_numbers',
                                            'iDisplayLength': iDisplayLength,
                                            'sDom': sDom,
                                            'aaSorting': [
                                                [0, 'asc']
                                            ],
                                            'aoColumns': [
                                                { sTitle: '<b>Created Object Name</b>', mData: 'name', sWidth: '30%' },
                                                { sTitle: '<b>Type</b>', mData: 'type', sWidth: '20%' },
                                                { sTitle: '<b>Description</b>', mData: 'description' }
                                            ],
                                            'aaData': [],
                                            'oLanguage': {
                                                'sSearch': 'Search: ',
                                                'sEmptyTable': 'No created objects.'
                                            }
                                        };
                                        var objTable = $tbl.dataTable(tblSettings);
                                        objTable.fnAddData(displayData);


                                        var $objTable = $('<table ' +
                                                'class="table table-bordered table-striped" style="width:100%;margin-left:0px; margin-right:0px;">' +
                                                '</table>')
                                            .dataTable({
                                                'sPaginationType': 'full_numbers',
                                                'sDom': sDom,
                                                'iDisplayLength': iDisplayLength,
                                                'aaSorting': [
                                                    [0, 'asc'],
                                                    [1, 'asc']
                                                ],
                                                'aaData': displayData,
                                                'aoColumns': [
                                                    { sTitle: 'Created Object Name', mData: 'name', sWidth: '20%' },
                                                    { sTitle: 'Type', mData: 'type', sWidth: '20%' },
                                                    { sTitle: 'Description', mData: 'description' }
                                                ],
                                                'oLanguage': {
                                                    'sEmptyTable': 'No objects specified!',
                                                    'sSearch': 'Search Created Objects: '
                                                },
                                                'fnDrawCallback': reportRowEvents
                                            });
                                        //$tblDiv.append($objTable)
                                    }

                                }
                            )
                            .catch(
                                function (error) {
                                    console.error(error);
                                }
                            );
                    }
                }
            }

            var showingReport = false;
            if (this.options.showReportText) {

                // REPORT SECTION

                if (report.direct_html) {
                    (function () {
                        showingReport = true;
                        // an iframe to hold the contents of the report.
                        var iframe;
                        // a link to view the same report in its own window
                        var reportLink;
                        if (/<html/.test(report.direct_html)) {
                            console.warn('Html document inserted into iframe', report);
                            if (report.direct_html_link_index) {
                                iframe = _this.makeIframeSrc({
                                    src: report.html_links[report.direct_html_link_index].URL,
                                    maxHeight: '500px'
                                });
                            } else {
                                // if (report.html_links.length && report.html_links.length > 0) {
                                if (_this.reportLinks && _this.reportLinks.length > 0) {
                                    reportLink = div({
                                        style: {
                                            margin: '4px 4px 8px 0',
                                            xborder: '1px silver solid'
                                        }
                                    }, a({
                                        href: _this.reportLinks[0].url,
                                        target: '_blank',
                                        class: 'btn btn-default'
                                    }, 'View Report in separate window'));
                                    iframe = _this.makeIframeSrcUrl({
                                        // TODO: use the index in the report
                                        // fake for now!!
                                        url: _this.reportLinks[0].url,
                                        height: '600px',
                                        events: events
                                    });
                                } else {
                                    iframe = _this.makeIframeSrcDataPlain({
                                        content: report.direct_html,
                                        height: '600px',
                                        events: events
                                    });
                                }


                            }
                        } else {
                            iframe = _this.makeIframe({
                                content: report.direct_html,
                                maxHeight: '500px'
                            });
                        }

                        _this.$mainPanel.append(div({ dataElement: 'html-panel' }));
                        ui.setContent('html-panel',
                            ui.buildCollapsiblePanel({
                                title: 'Report',
                                name: 'report-section-toggle',
                                hidden: false,
                                type: 'default',
                                classes: ['kb-panel-container'],
                                body: div([
                                    reportLink,
                                    iframe.content
                                ])
                            })
                        );

                        if (iframe.messages) {
                            _this.setupHostComm(iframe, _this.$mainPanel[0]);
                        }
                    }());
                }

                // REPORT LINK
                // Hmm, this is duplicated with the html_links section below.
                // It appears to only be placed in the html report section as a convenience
                // But is there always a link if there is report content? No
                // Also, they are not the same thing.
                if (report.direct_html_link_index >= 0) {
                    (function () {
                        showingReport = true;
                        var id = html.genId();
                        var content = a({
                            id: id
                        }, 'Download');
                        var url = report.html_links[report.direct_html_link_index].URL;

                        _this.$mainPanel.append(div({ dataElement: 'html-link-panel' }));
                        ui.setContent('html-link-panel',
                            ui.buildCollapsiblePanel({
                                title: 'HTML Report Link',
                                name: 'report-section-toggle',
                                hidden: false,
                                type: 'default',
                                classes: ['kb-panel-container'],
                                body: content
                            })
                        );

                        var link = document.getElementById(id);
                        link.addEventListener('click', function (e) {
                            e.stopPropagation();
                            window.location.href = _this.importExportLink(url, 'report.html');
                        });
                    }());
                }


                // SUMMARY SECTION

                self.$mainPanel.append(div({ dataElement: 'summary-section' }));

                var reportSummary = div({
                    style: {
                        width: '100%',
                        fontFamily: 'Monaco,monospace',
                        fontSize: '9pt',
                        color: '#555',
                        whiteSpace: 'pre-wrap'
                            //resize: 'vertical',
                            //rows: self.options.report_window_line_height,
                            //readonly: true
                    }
                }, report.text_message);

                ui.setContent('summary-section',
                    ui.buildCollapsiblePanel({
                        title: 'Summary',
                        name: 'summary-section-toggle',
                        hidden: false,
                        collapsed: showingReport ? true : false,
                        type: 'default',
                        classes: ['kb-panel-container'],
                        body: reportSummary
                    })
                );
            }

            // LINKS SECTION

            if (self.options.showHTML) {

                if (self.reportLinks && self.reportLinks.length) {
                    var $ul = $.jqElem('ul');
                    self.reportLinks.forEach(function (reportLink) {
                        var link_id = StringUtil.uuid();
                        $ul.append(
                            $.jqElem('li')
                            .append(
                                $.jqElem('a')
                                .attr('href', reportLink.url)
                                .attr('target', '_blank')
                                .attr('id', link_id)
                                .append(reportLink.name || reportLink.url)
                            )
                        );
                    });

                    self.$mainPanel.append(div({ dataElement: 'downloadable-html' }));
                    body = $.jqElem('div').append($ul).html();
                    ui.setContent('downloadable-html',
                        ui.buildCollapsiblePanel({
                            title: 'Links',
                            name: 'downloadable-html-toggle',
                            hidden: false,
                            type: 'default',
                            classes: ['kb-panel-container'],
                            body: body
                        })
                    );
                }
            }

            // FILES SECTION

            if (self.options.showFiles) {
                if (report.file_links && report.file_links.length) {
                    self.$mainPanel.append(div({ dataElement: 'downloadable-files' }));

                    var iframe_id = StringUtil.uuid();

                    var $ul = $.jqElem('ul');
                    $.each(
                        report.file_links,
                        function (i, v) {
                            var link_id = StringUtil.uuid();
                            //self.preauthMagicClick(v.URL + '?download_url', link_id);
                            $ul.append(
                                $.jqElem('li')
                                .append(
                                    $.jqElem('a')
                                    //.attr('href', self.importExportLink(v.URL, v.name || 'download-' + i) )
                                    .attr('id', link_id)
                                    .append(v.name || v.URL)
                                    .prop('download', true)
                                    .attr('download', 'download')
                                )
                            );

                            setTimeout(function () {
                                $('#' + link_id).on('click', function (e) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    $('#' + iframe_id).attr('src', self.importExportLink(v.URL, v.name || 'download-' + i));
                                });
                            }, 1);
                        }
                    );

                    var $iframe = $.jqElem('iframe')
                        .attr('id', iframe_id)
                        .css('display', 'none');

                    var body = $.jqElem('div').append($ul).append($iframe).html();

                    ui.setContent('downloadable-files',
                        ui.buildCollapsiblePanel({
                            title: 'Files',
                            name: 'downloadable-files-toggle',
                            hidden: false,
                            type: 'default',
                            classes: ['kb-panel-container'],
                            body: body
                        })
                    );
                }
            }

            events.attachEvents();

            this.loading(false);
        },
        openViewerCell: function (ws_info) {
            var self = this;
            var cell = Jupyter.notebook.get_selected_cell();
            var near_idx = 0;
            if (cell) {
                near_idx = Jupyter.notebook.find_cell_index(cell);
                $(cell.element).off('dblclick');
                $(cell.element).off('keydown');
            }
            var info = self.createInfoObject(ws_info);
            self.trigger('createViewerCell.Narrative', {
                'nearCellIdx': near_idx,
                'widget': 'kbaseNarrativeDataCell',
                'info': info
            });
        },
        createInfoObject: function (info) {
            return _.object(['id', 'name', 'type', 'save_date', 'version',
                'saved_by', 'ws_id', 'ws_name', 'chsum', 'size',
                'meta'
            ], info);
        },
        loading: function (isLoading) {
            if (isLoading) {
                this.showMessage('<i class="fa fa-spinner fa-spin"></i>');
            } else {
                this.hideMessage();
            }
        },
        showMessage: function (message) {
            var span = $('<span/>').append(message);
            this.$messagePane.append(span);
            this.$messagePane.show();
        },
        hideMessage: function () {
            this.$messagePane.hide();
            this.$messagePane.empty();
        },
        clientError: function (error) {
            this.loading(false);
            var errString = 'Unknown error.';
            console.error(error);
            if (typeof error === 'string')
                errString = error;
            else if (error.error && error.error.message)
                errString = error.error.message;
            else if (error.error && error.error.error && typeof error.error.error === 'string') {
                errString = error.error.error;
            }

            var $errorDiv = $('<div>')
                .addClass('alert alert-danger')
                .append('<b>Error:</b>')
                .append('<br>' + errString);
            this.$elem.empty();
            this.$elem.append($errorDiv);
        },
        buildObjectIdentity: function (workspaceID, objectID, objectVer, wsRef) {
            var obj = {};
            if (wsRef) {
                obj['ref'] = wsRef;
            } else {
                if (/^\d+$/.exec(workspaceID))
                    obj['wsid'] = workspaceID;
                else
                    obj['workspace'] = workspaceID;

                // same for the id
                if (/^\d+$/.exec(objectID))
                    obj['objid'] = objectID;
                else
                    obj['name'] = objectID;

                if (objectVer)
                    obj['ver'] = objectVer;
            }
            return obj;
        }
    });
});