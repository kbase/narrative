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
    'kb_service/utils',
    'common/ui',
    'common/iframe/hostMessages',
    'common/events',

    'jquery-dataTables',
], (
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
    ServiceUtils,
    UI,
    HostMessages,
    Events
) => {
    'use strict';
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

            this.$mainPanel = $('<div>').addClass('report-widget');
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
            const m = shock_url.match(/\/node\/(.+)$/);
            if (m) {
                const shock_id = m[1];
                const query = {
                    id: shock_id,
                    wszip: 0,
                    name: name,
                };
                const queryString = Object.keys(query)
                    .map((key) => {
                        return [key, query[key]].map(encodeURIComponent).join('=');
                    })
                    .join('&');
                const url = Config.get('urls').data_import_export + '/download?' + queryString;
                return url;
            }
        },

        loadAndRender: function () {
            const self = this;
            self.loading(true);

            self.objIdentity = self.buildObjectIdentity(
                this.options.workspace_name,
                this.options.report_name,
                null,
                this.options.report_ref
            );

            self.ws
                .get_objects([self.objIdentity])
                .then((result) => {
                    self.reportData = result[0].data;
                    return self.getLinks(self.reportData);
                })
                .then((links) => {
                    self.reportLinks = links;
                    return self.render();
                })
                .catch((err) => {
                    self.clientError(err);
                });
        },

        wrapHtmlDoc: function (content) {
            if (/<html/.test(content)) {
                console.warn('Html document inserted into iframe');
                return content;
            }
            const t = html.tag,
                htmlTag = t('html'),
                head = t('head'),
                body = t('body');
            return htmlTag([
                head(),
                body(
                    {
                        style: {
                            margin: '0px',
                            padding: '0px',
                            overflow: 'auto',
                        },
                    },
                    [content]
                ),
            ]);
        },

        makeIframe: function (arg) {
            const t = html.tag,
                div = t('div'),
                script = t('script'),
                iframe = t('iframe');

            const iframeId = 'frame_' + html.genId(),
                iframeOrigin = document.location.origin,
                iframeMessages = HostMessages.makeHost({
                    root: window,
                    name: 'panel',
                });

            // The iframe content needs requirejs amd.

            const narrativeBase = window.location.origin + '/narrative';

            const requireConfig = {
                    baseUrl: narrativeBase + '/static/',
                    paths: {
                        bluebird: 'ext_components/bluebird/js/browser/bluebird.min',
                        uuid: 'ext_components/pure-uuid/uuid',
                        messages: 'kbase/js/common/iframe/messages',
                        heightNotifier: 'kbase/js/common/iframe/heightNotifier',
                    },
                },
                iframeScript = div([
                    script({
                        src: narrativeBase + '/static/ext_components/requirejs/require.js',
                    }),
                    script('require.config(' + JSON.stringify(requireConfig) + ');'),
                    script([
                        'require(["kbase/js/common/iframe/boot"], function (Boot) {',
                        '  var boot = Boot.make({iframeId: "' + iframeId + '"});',
                        '  boot.start();',
                        '});',
                    ]),
                ]),
                // the main content wrapper inside the iframe
                iframeContent = this.wrapHtmlDoc(
                    div(
                        {
                            id: iframeId,
                            dataFrame: iframeId,
                            style: {
                                overflow: 'hidden',
                            },
                            dataParams: encodeURIComponent(
                                JSON.stringify({
                                    parentHost: iframeOrigin,
                                    iframeId: iframeId,
                                    serviceId: iframeMessages.serviceId,
                                })
                            ),
                        },
                        arg.content + iframeScript
                    )
                ).replace(/"/g, '&quot;'),
                width = arg.width || '100%',
                maxHeight = arg.maxHeight || 'auto',
                iframeHtml = iframe({
                    style: {
                        display: 'block',
                        width: width,
                        height: 'auto',
                        maxHeight: maxHeight,
                        margin: 0,
                        padding: 0,
                    },
                    scrolling: 'no',
                    dataFrame: iframeId,
                    frameborder: '0',
                    id: iframeId,
                    // sandbox: 'allow-same-origin allow-scripts',
                    srcdoc: iframeContent,
                });

            return {
                parentHost: iframeOrigin,
                host: iframeOrigin,
                id: iframeId,
                content: iframeHtml,
                messages: iframeMessages,
            };
        },

        makeIframeSrcDataPlain: function (arg) {
            const t = html.tag,
                iframe = t('iframe');

            const iframeId = 'frame_' + html.genId();

            // The iframe content needs requirejs amd.

            const width = arg.width || '100%',
                iframeContent = arg.content,
                iframeHtml = iframe({
                    style: {
                        display: 'block',
                        width: width,
                        height: arg.height || 'auto',
                        margin: 0,
                        padding: 0,
                    },
                    dataFrame: iframeId,
                    frameborder: '0',
                    id: iframeId,
                    src: 'data:text/html;charset=utf-8,' + encodeURIComponent(iframeContent),
                });

            return {
                id: iframeId,
                content: iframeHtml,
            };
        },

        makeIframeSrc: function (arg) {
            const t = html.tag,
                iframe = t('iframe');

            const iframeId = 'frame_' + html.genId();

            const width = arg.width || '100%',
                maxHeight = arg.maxHeight || 'auto',
                iframeHtml = iframe({
                    style: {
                        display: 'block',
                        width: width,
                        height: arg.height,
                        maxHeight: maxHeight,
                        margin: 0,
                        padding: 0,
                    },
                    dataFrame: iframeId,
                    frameborder: '0',
                    scrolling: 'yes',
                    id: iframeId,
                });

            return {
                id: iframeId,
                content: iframeHtml,
            };
        },

        escapeHtml: function (string) {
            if (typeof string !== 'string') {
                return;
            }
            const entityMap = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;',
                '/': '&#x2F;',
                '`': '&#x60;',
                '=': '&#x3D;',
            };
            return String(string).replace(/[&<>"'`=\/]/g, (s) => {
                return entityMap[s];
            });
        },

        getLinks: function (report) {
            // NOTE: this returns a promise -- we must look up the html file set service url first.
            const _this = this;

            const client = new GenericClient({
                url: Config.url('service_wizard'),
                token: this.authToken(),
                module: 'HTMLFileSetServ',
            });
            return client.lookupModule().spread((serviceStatus) => {
                const htmlServiceURL = serviceStatus.url;
                if (report.html_links && report.html_links.length) {
                    return report.html_links.map((item, index) => {
                        return {
                            name: item.name,
                            // If label is not provided, name must be.
                            label: _this.escapeHtml(item.label || item.name),
                            url: [
                                htmlServiceURL,
                                'api',
                                'v1',
                                _this.objIdentity.ref,
                                '$',
                                index,
                                item.name,
                            ].join('/'),
                            description: item.description,
                        };
                    });
                } else {
                    return [];
                }
            });
        },

        makeIframeSrcUrl: function (arg) {
            const t = html.tag,
                iframe = t('iframe');

            const iframeId = 'frame_' + html.genId();

            const width = arg.width || '100%',
                // maxHeight = arg.maxHeight || 'auto',
                iframeHtml = iframe({
                    style: {
                        display: 'block',
                        width: width,
                        height: arg.height,
                        // maxHeight: maxHeight,
                        margin: 0,
                        padding: 0,
                    },
                    dataFrame: iframeId,
                    frameborder: '0',
                    scrolling: 'yes',
                    id: iframeId,
                    src: arg.src,
                });

            return {
                id: iframeId,
                content: iframeHtml,
            };
        },

        setupHostComm: function (iframe, container) {
            iframe.messages.start();
            const _this = this;

            iframe.messages.listen({
                name: 'ready',
                handler: function (message) {
                    if (message.iframeId !== iframe.id) {
                        // We may receive this if a 'ready' was received
                        // from another cell. Perhaps there is a better
                        // way of filtering messages before getting here!
                        // TODO: implement an address feature to allow a
                        //   message bus to ignore messages not sent to it.
                        //   we use the frame id for this, but it should actually
                        //   be a feature of the message bus itself.
                        //   E.g. each one has an id (uuid), and messages must
                        //   carry address.to and address.from
                        // console.error('Unexpected "ready"', message, message.iframeId, iframe.id);
                        return;
                    }

                    iframe.messages.addPartner({
                        name: message.iframeId,
                        host: iframe.host,
                        serviceId: message.address.from,
                        window: container.querySelector('[data-frame="' + iframe.id + '"]')
                            .contentWindow,
                    });

                    iframe.messages.send(message.from, {
                        name: 'start',
                    });
                },
            });

            iframe.messages.listen({
                name: 'rendered',
                handler: function (message) {
                    const height = message.height,
                        iframeNode = _this.$mainPanel[0].querySelector(
                            '[data-frame="' + iframe.id + '"]'
                        );

                    iframeNode.style.height = height + 'px';
                },
            });

            iframe.messages.listen({
                name: 'clicked',
                handler: function (message) {
                    if (message.iframeId !== iframe.id) {
                        return;
                    }
                    document.getElementById(message.iframeId).dispatchEvent(
                        new Event('click', {
                            bubbles: true,
                            cancelable: true,
                        })
                    );
                },
            });
        },

        render: function () {
            const self = this;
            const _this = this;
            const t = html.tag,
                div = t('div'),
                a = t('a');
            const ui = UI.make({ node: self.$mainPanel.get(0) });
            const report = self.reportData;
            const events = Events.make({
                node: self.$mainPanel.get(0),
            });

            // Handle warnings?
            if (report.warnings) {
                if (report.warnings.length > 0) {
                    const $warningPanel = $(
                        '<div style="max-height:100px;overflow-y:auto;margin:0px 5px 5px 10px;">'
                    );
                    const warnings = report.warnings;
                    if (warnings.length >= 5) {
                        $warningPanel.append(
                            $('<div>')
                                .css('margin', '5px')
                                .append('[' + warnings.length + 'Warnings]')
                        );
                    }
                    for (let k = 0; k < warnings.length; k++) {
                        $warningPanel.append(
                            $('<div>')
                                .css('margin', '0px 5px 5px 10px')
                                .append(
                                    $('<span>').addClass('label label-warning').append(warnings[k])
                                )
                        );
                    }
                    self.$mainPanel.append($warningPanel);
                }
            }

            if (self.options.showCreatedObjects) {
                const someDiv = div({ dataElement: 'created-objects' });
                self.$mainPanel.append(someDiv);
                if (report.objects_created) {
                    if (report.objects_created.length > 0) {
                        const objsCreated = report.objects_created;

                        const objIds = [];
                        for (let i = 0; i < objsCreated.length; i++) {
                            objIds.push({ ref: objsCreated[i].ref });
                        }
                        self.ws
                            .get_object_info_new({ objects: objIds })
                            .then((objInfo) => {
                                const pref = StringUtil.uuid();
                                const displayData = [];
                                const dataNameToInfo = {};
                                for (var k = 0; k < objInfo.length; k++) {
                                    displayData.push({
                                        name:
                                            '<a href="#" style="cursor: pointer;" class="report_row_' +
                                            pref +
                                            '" data-objname="' +
                                            objInfo[k][1] +
                                            '">' +
                                            objInfo[k][1] +
                                            '</a>',
                                        type: objInfo[k][2].split('-')[0].split('.')[1],
                                        fullType: objInfo[k][2],
                                        description: objsCreated[k].description
                                            ? objsCreated[k].description
                                            : '',
                                        ws_info: objInfo[k],
                                    });
                                    dataNameToInfo[objInfo[k][1]] = objInfo[k];
                                }

                                function reportRowEvents() {
                                    $('.report_row_' + pref).unbind('click');
                                    $('.report_row_' + pref).click(function (e) {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        const objName = [$(this).data('objname')];
                                        Jupyter.narrative.addViewerCell(dataNameToInfo[objName]);
                                    });
                                }

                                const numPerPage = 5;
                                const objTableId = self.uuid();

                                ui.setContent(
                                    'created-objects',
                                    ui.buildCollapsiblePanel({
                                        title: 'Objects',
                                        name: 'created-objects-toggle',
                                        hidden: false,
                                        type: 'default',
                                        classes: ['kb-panel-container'],
                                        body:
                                            "<div id = '" +
                                            objTableId +
                                            "' style = 'margin-top : 10px'></div>",
                                    })
                                );

                                const $tblDiv = $('#' + objTableId);

                                if (displayData.length <= numPerPage) {
                                    const $objTable = $(
                                        '<table class="table table-striped table-bordered" style="margin-left: auto; margin-right: auto;">'
                                    );

                                    displayData.sort((a, b) => {
                                        return a.name < b.name;
                                    });
                                    const color = '#555';
                                    $objTable.append(
                                        $('<tr>')
                                            .append(
                                                '<th style="width:30%;color:' +
                                                    color +
                                                    ';"><b>Created Object Name</b></th>'
                                            )
                                            .append(
                                                '<th style="width:20%;color:' +
                                                    color +
                                                    ';"><b>Type</b></th>'
                                            )
                                            .append(
                                                '<th style="color:' +
                                                    color +
                                                    ';"><b>Description</b></th>'
                                            )
                                    );
                                    for (var k = 0; k < displayData.length; k++) {
                                        $objTable.append(
                                            $('<tr>')
                                                .append(
                                                    '<td style="width:30%;color:' +
                                                        color +
                                                        ';">' +
                                                        displayData[k].name +
                                                        '</td>'
                                                )
                                                .append(
                                                    '<td style="width:20%;color:' +
                                                        color +
                                                        ';">' +
                                                        displayData[k].type +
                                                        '</td>'
                                                )
                                                .append(
                                                    '<td style="color:' +
                                                        color +
                                                        ';">' +
                                                        displayData[k].description +
                                                        '</td>'
                                                )
                                        );
                                    }
                                    $tblDiv.append($objTable);
                                    reportRowEvents();
                                } else {
                                    const $tbl = $(
                                        '<table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-left: 0px; margin-right: 0px;">'
                                    ).addClass('table table-bordered table-striped');
                                    $tblDiv.append($tbl);

                                    const tblSettings = {
                                        paginationType: 'full_numbers',
                                        displayLength: numPerPage,
                                        dom: 'ft<ip>',
                                        sorting: [[0, 'asc']],
                                        columns: [
                                            {
                                                title: '<b>Created Object Name</b>',
                                                data: 'name',
                                                width: '30%',
                                            },
                                            { title: '<b>Type</b>', data: 'type', width: '20%' },
                                            { title: '<b>Description</b>', data: 'description' },
                                        ],
                                        data: [],
                                        language: {
                                            search: 'Search: ',
                                            emptyTable: 'No created objects.',
                                        },
                                    };
                                    const objTable = $tbl.dataTable(tblSettings);
                                    objTable.fnAddData(displayData);
                                    reportRowEvents();
                                    objTable.on('draw.dt', () => {
                                        reportRowEvents();
                                    });
                                }
                            })
                            .catch((error) => {
                                console.error(error);
                            });
                    }
                }
            }

            let showingReport = false;
            if (this.options.showReportText) {
                // REPORT SECTION

                /*
                The "inline" report can come from either the direct_html property or the direct_html_link_index.
                The direct_html_link_index will take precedence since it offers a better method for referencing
                content within an iframe. Generally the app developer should use either method, not both
                 */

                let hasDirectHtml = false;
                let hasDirectHtmlIndex = false;
                if (report.direct_html && report.direct_html.length > 0) {
                    hasDirectHtml = true;
                }
                if (
                    typeof report.direct_html_link_index === 'number' &&
                    report.direct_html_link_index >= 0
                ) {
                    hasDirectHtmlIndex = true;
                }

                if (hasDirectHtml || hasDirectHtmlIndex) {
                    (function () {
                        showingReport = true;
                        // an iframe to hold the contents of the report.
                        let iframe;
                        // a link to view the report (url, name, desc)
                        let reportLink;
                        // button to open the report in an external window.
                        let reportButton;
                        if (hasDirectHtmlIndex) {
                            reportLink = _this.reportLinks[report.direct_html_link_index];
                            if (reportLink) {
                                reportButton = div(
                                    {
                                        style: {
                                            margin: '4px 4px 8px 0',
                                            xborder: '1px silver solid',
                                        },
                                    },
                                    a(
                                        {
                                            href: reportLink.url,
                                            target: '_blank',
                                            class: 'btn btn-default',
                                        },
                                        'View report in separate window'
                                    )
                                );
                                iframe = _this.makeIframeSrcUrl({
                                    src: reportLink.url,
                                    height: report.html_window_height
                                        ? report.html_window_height + 'px'
                                        : '500px',
                                });
                            } else {
                                iframe = {
                                    content: div(
                                        {
                                            class: 'alert alert-danger',
                                        },
                                        'Report not found for index ' +
                                            report.direct_html_link_index
                                    ),
                                };
                            }
                        } else {
                            // If the direct_html is a full document we cannot (yet?) insert
                            // the necessary code to gracefully handle resizing and click-passthrough.
                            if (/<html/.test(report.direct_html)) {
                                console.warn('Html document inserted into iframe', report);
                                iframe = _this.makeIframeSrcDataPlain({
                                    content: report.direct_html,
                                    height: report.html_window_height
                                        ? report.html_window_height + 'px'
                                        : '500px',
                                    events: events,
                                });
                            } else {
                                // note that for direct_html, we set the max height. this content is expected
                                // to be smaller than linked content, and we will want the container
                                // to shrink, but if it is larger, we simply don't want it to be too tall.
                                iframe = _this.makeIframe({
                                    content: report.direct_html,
                                    maxHeight: report.html_window_height
                                        ? report.html_window_height + 'px'
                                        : '500px',
                                });
                            }
                        }

                        _this.$mainPanel.append(div({ dataElement: 'html-panel' }));
                        ui.setContent(
                            'html-panel',
                            ui.buildCollapsiblePanel({
                                title: 'Report',
                                name: 'report-section-toggle',
                                hidden: false,
                                type: 'default',
                                classes: ['kb-panel-container'],
                                body: div([reportButton, iframe.content]),
                            })
                        );

                        if (iframe.messages) {
                            _this.setupHostComm(iframe, _this.$mainPanel[0]);
                        }
                    })();
                }

                // SUMMARY SECTION

                if (report.text_message && report.text_message.length > 0) {
                    self.$mainPanel.append(div({ dataElement: 'summary-section' }));
                    const reportSummary = div(
                        {
                            style: {
                                width: '100%',
                                fontFamily: 'Monaco,monospace',
                                fontSize: '9pt',
                                color: '#555',
                                whiteSpace: 'pre-wrap',
                                overflow: 'auto',
                                height: 'auto',
                                maxHeight: report.summary_window_height
                                    ? report.summary_window_height + 'px'
                                    : '500px',
                                //resize: 'vertical',
                                //rows: self.options.report_window_line_height,
                                //readonly: true
                            },
                        },
                        report.text_message
                    );
                    ui.setContent(
                        'summary-section',
                        ui.buildCollapsiblePanel({
                            title: 'Summary',
                            name: 'summary-section-toggle',
                            hidden: false,
                            collapsed: showingReport ? true : false,
                            type: 'default',
                            classes: ['kb-panel-container'],
                            body: reportSummary,
                        })
                    );
                }
            }

            // LINKS SECTION

            if (self.options.showHTML) {
                if (self.reportLinks && self.reportLinks.length) {
                    var $ul = $.jqElem('ul');
                    self.reportLinks.forEach((reportLink) => {
                        const link_id = StringUtil.uuid();
                        const $linkItem = $.jqElem('li').append(
                            $.jqElem('a')
                                .attr('href', reportLink.url)
                                .attr('target', '_blank')
                                .attr('id', link_id)
                                .append(reportLink.label || reportLink.name)
                        );
                        if (reportLink.description) {
                            $linkItem.append('<br/>');
                            $linkItem.append(reportLink.description);
                        }
                        $ul.append($linkItem);
                    });

                    self.$mainPanel.append(div({ dataElement: 'downloadable-html' }));
                    body = $.jqElem('div').append($ul).html();
                    ui.setContent(
                        'downloadable-html',
                        ui.buildCollapsiblePanel({
                            title: 'Links',
                            name: 'downloadable-html-toggle',
                            hidden: false,
                            type: 'default',
                            classes: ['kb-panel-container'],
                            body: body,
                        })
                    );
                }
            }

            // FILES SECTION

            if (self.options.showFiles) {
                if (report.file_links && report.file_links.length) {
                    self.$mainPanel.append(div({ dataElement: 'downloadable-files' }));

                    const iframe_id = StringUtil.uuid();

                    var $ul = $.jqElem('ul');
                    $.each(report.file_links, (i, v) => {
                        const link_id = StringUtil.uuid();
                        $ul.append(
                            $.jqElem('li').append(
                                $.jqElem('a')
                                    .attr('id', link_id)
                                    .attr('href', '#')
                                    .append(v.name || v.URL)
                                    .prop('download', true)
                                    .attr('download', 'download')
                            )
                        );

                        setTimeout(() => {
                            $('#' + link_id).on('click', (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                $('#' + iframe_id).attr(
                                    'src',
                                    self.importExportLink(v.URL, v.name || 'download-' + i)
                                );
                            });
                        }, 1);
                    });

                    const $iframe = $.jqElem('iframe').attr('id', iframe_id).css('display', 'none');

                    var body = $.jqElem('div').append($ul).append($iframe).html();

                    ui.setContent(
                        'downloadable-files',
                        ui.buildCollapsiblePanel({
                            title: 'Files',
                            name: 'downloadable-files-toggle',
                            hidden: false,
                            type: 'default',
                            classes: ['kb-panel-container'],
                            body: body,
                        })
                    );
                }
            }

            events.attachEvents();

            this.loading(false);
        },
        loading: function (isLoading) {
            if (isLoading) {
                this.showMessage('<i class="fa fa-spinner fa-spin"></i>');
            } else {
                this.hideMessage();
            }
        },
        showMessage: function (message) {
            const span = $('<span/>').append(message);
            this.$messagePane.append(span);
            this.$messagePane.show();
        },
        hideMessage: function () {
            this.$messagePane.hide();
            this.$messagePane.empty();
        },
        clientError: function (error) {
            this.loading(false);
            let errString = 'Unknown error.';
            console.error(error);
            if (typeof error === 'string') errString = error;
            else if (error.error && error.error.message) errString = error.error.message;
            else if (error.error && error.error.error && typeof error.error.error === 'string') {
                errString = error.error.error;
            }

            const $errorDiv = $('<div>')
                .addClass('alert alert-danger')
                .append('<b>Error:</b>')
                .append('<br>' + errString);
            this.$elem.empty();
            this.$elem.append($errorDiv);
        },
        buildObjectIdentity: function (workspaceID, objectID, objectVer, wsRef) {
            const obj = {};
            if (wsRef) {
                obj['ref'] = wsRef;
            } else {
                if (/^\d+$/.exec(workspaceID)) obj['wsid'] = workspaceID;
                else obj['workspace'] = workspaceID;

                // same for the id
                if (/^\d+$/.exec(objectID)) obj['objid'] = objectID;
                else obj['name'] = objectID;

                if (objectVer) obj['ver'] = objectVer;
            }
            return obj;
        },
    });
});
