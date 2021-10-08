/**
 * Basic viz for a basic report type.
 * @public
 */

define([
    'jquery',
    'bluebird',
    'kbwidget',
    'narrativeConfig',
    'uuid',
    'common/html',
    'common/runtime',
    'util/string',
    'kb_common/jsonRpc/dynamicServiceClient',
    'kb_service/client/workspace',
    'common/ui',
    'common/iframe/hostMessages',
    'common/events',
    'common/cellComponents/tabs/results/outputWidget',
], (
    $,
    Promise,
    KBWidget,
    Config,
    UUID,
    html,
    Runtime,
    StringUtil,
    DynamicServiceClient,
    Workspace,
    UI,
    HostMessages,
    Events,
    OutputWidget
) => {
    'use strict';
    return KBWidget({
        name: 'kbaseReportView',
        version: '1.0.0',
        options: {
            workspace_name: null,
            report_name: null,
            showReportText: true,
            showCreatedObjects: false,
            showFiles: true,
            showHTML: true,
            report_ref: null,
        },
        // workspace client
        ws: null,
        reportData: null,
        baseCssClass: 'kb-report-view',
        init: function (options) {
            this._super(options);
            this.runtime = Runtime.make();

            // Create a message pane
            this.$messagePane = $('<div/>').addClass('kbwidget-message-pane kbwidget-hide-message');
            this.$elem.append(this.$messagePane);

            this.$mainPanel = $('<div>').addClass(this.baseCssClass + '__container');
            this.$elem.append(this.$mainPanel);
            this.ws = new Workspace(Config.url('workspace'), { token: this.runtime.authToken() });
            return this;
        },

        /**
         * This builds a link to the data_import_export service for downloading some file from
         * a shock node. This gets used for downloading files referenced from the report object.
         * If the given url is not really a shock node, this returns null.
         * @param {string} shockUrl - the URL to the shock node containing some file to fetch
         * @param {string} name - the name of the file to download
         */
        importExportLink: function (shockUrl, name) {
            const m = shockUrl.match(/\/node\/(.+)$/);
            if (m) {
                const query = {
                    id: m[1],
                    wszip: 0,
                    name: name,
                };
                const queryString = Object.keys(query)
                    .map((key) => {
                        return [key, query[key]].map(encodeURIComponent).join('=');
                    })
                    .join('&');
                return Config.url('data_import_export') + '/download?' + queryString;
            }
            return null;
        },

        /**
         * Loads report information and renders the widget. This returns a Promise that
         * resolves when complete.
         */
        loadAndRender: function () {
            this.loading(true);

            this.objIdentity = this.buildObjectIdentity(
                this.options.workspace_name,
                this.options.report_name,
                null,
                this.options.report_ref
            );

            return this.ws
                .get_objects2({ objects: [this.objIdentity] })
                .then((result) => {
                    this.reportData = result.data[0].data;
                    return Promise.all([
                        this.getLinks(this.reportData),
                        this.getCreatedObjectInfo(this.reportData),
                    ]);
                })
                .spread((links, createdObjects) => {
                    this.reportLinks = links;
                    this.createdObjects = createdObjects;
                    return this.render();
                })
                .catch((err) => {
                    this.showClientError(err);
                });
        },

        /**
         * Wraps an HTML document in HTML tags, to be embedded in an iframe for the report view.
         * @param {string} content
         */
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
                            margin: '0',
                            padding: '0',
                            overflow: 'auto',
                        },
                    },
                    [content]
                ),
            ]);
        },

        /**
         * This builds an IFrame from an embedded document that's not given as an entire HTML document.
         * It gets wrapped in an HTML tag and embedded with code that lets click events and other
         * messages pass through from the Narrative into it.
         * @param {object} arg - an object with the following properties
         *  - content - the HTML content to embed in the iframe.
         *  - maxHeight - optional (default 'auto') - a maximum height for the iframe, usually provided
         *    by the report object
         */
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
                        '  const boot = Boot.make({iframeId: "' + iframeId + '"});',
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
                iframeHtml = iframe({
                    class: this.baseCssClass + '__report_iframe',
                    style: {
                        maxHeight: arg.maxHeight || 'auto',
                    },
                    scrolling: 'no',
                    dataFrame: iframeId,
                    frameborder: '0',
                    id: iframeId,
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

        /**
         * This builds an IFrame for the report view from either a source URL, or from an embedded
         * HTML document. If BOTH are provided, then the source URL will be used and the embedded
         * content will be ignored.
         * @param {Object} arg - properties are:
         *  - height - height of the iframe, default = 'auto'
         *  - src - source url of the iframe (either this OR content should be used)
         *  - content - raw content to put in the iframe, will be encoded (this OR src should be used)
         */
        makeIframeFromSrc: function (arg) {
            if (!arg.src && !arg.content) {
                throw new Error('Report iframe must have either a source URL or direct content');
            }
            const iframe = html.tag('iframe'),
                iframeId = 'frame_' + html.genId(),
                height = arg.height || 'auto',
                src = arg.src || 'data:text/html;charset=utf-8,' + encodeURIComponent(arg.content);
            const iframeHtml = iframe({
                class: this.baseCssClass + '__report_iframe',
                style: {
                    height: height,
                },
                dataFrame: iframeId,
                frameborder: '0',
                scrolling: 'yes',
                id: iframeId,
                src: src,
            });
            return {
                id: iframeId,
                content: iframeHtml,
            };
        },

        /**
         * Returns a Promise that resolves into a list of links to the hosted report. This needs
         * to talk to the Service Wizard to get the HTMLFileSetServ URL.
         * @param {object} report
         */
        getLinks: function (report) {
            // NOTE: this returns a promise -- we must look up the html file set service url first.
            const serviceWizard = new DynamicServiceClient({
                module: 'HTMLFileSetServ',
                url: Config.url('service_wizard'),
                token: this.runtime.authToken(),
            });

            if (!report.html_links || !report.html_links.length) {
                return Promise.resolve([]);
            }
            return serviceWizard.lookupModule().spread((info) => {
                return report.html_links.map((item, index) => {
                    return {
                        name: item.name,
                        label: StringUtil.escape(item.label || item.name),
                        description: item.description,
                        url: [
                            info.url,
                            'api',
                            'v1',
                            this.objIdentity.ref,
                            '$',
                            index,
                            item.name,
                        ].join('/'),
                    };
                });
            });
        },

        /**
         * Returns a Promise that resolves into an array of created objects, or an
         * empty array if there are none. Also, if the showCreatedObjects option isn't set,
         * this just returns a Promise that resolves into an empty array and doesn't call out
         * to the Workspace service.
         * @param {object} report
         */
        getCreatedObjectInfo: function (report) {
            if (
                !this.options.showCreatedObjects || // if we're not showing it, just return an empty array
                !report.objects_created ||
                !report.objects_created.length
            ) {
                return Promise.resolve([]);
            }
            const lookupInfos = report.objects_created.map((obj) => {
                return { ref: obj.ref };
            });
            // will be in the same order as the report.objects_created array
            // we're just gonna update that as we go.
            return this.ws.get_object_info_new({ objects: lookupInfos }).then((infos) => {
                const objectInfos = infos.map((info, idx) => {
                    return Object.assign(report.objects_created[idx], {
                        name: info[1],
                        simpleType: info[2].split('-')[0].split('.')[1],
                        type: info[2],
                        wsInfo: info,
                    });
                });
                return objectInfos;
            });
        },

        setupHostComm: function (iframe, container) {
            iframe.messages.start();

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
                handler: (message) => {
                    const height = message.height,
                        iframeNode = this.$mainPanel[0].querySelector(
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

        /**
         * Warnings is an array of strings, with potential warnings about the report. These get
         * rendered as a set of divs and returned.
         * @param {Array} warnings
         * @returns {string} warnings panel html
         */
        buildReportWarnings: function (warnings) {
            const div = html.tag('div'),
                span = html.tag('span'),
                warningClass = this.baseCssClass + '__warning';

            let warningCount = '';
            if (warnings.length >= 5) {
                warningCount = div(
                    { class: warningClass + '__count' },
                    `[${warnings.length} warnings]`
                );
            }
            const warningPanel = div(
                {
                    class: warningClass + '__container',
                },
                [
                    warningCount,
                    ...warnings.map((warning) => {
                        return div(
                            {
                                class: warningClass + '__text',
                            },
                            [span({ class: 'label label-warning' }, warning)]
                        );
                    }),
                ]
            );
            return warningPanel;
        },

        /**
         * This builds some HTML that resolves in links to download any of the files associated
         * with the report.
         * @param {Array} fileLinks - the array of file links from the report object
         * @param {object} ui - the UI object that will hold the constructed HTML
         * @param {object} events - the events object for binding the download event
         * @returns {string} the constructed HTML. This will add events to the passed events object
         *   that should be bound to the container where the HTML will get attached.
         */
        buildFileLinksPanel: function (fileLinks, ui, events) {
            const ul = html.tag('ul'),
                li = html.tag('li'),
                a = html.tag('a'),
                iframe = html.tag('iframe'),
                div = html.tag('div');

            const downloadIframeId = 'file-download-' + new UUID(4).format();
            const linkList = ul(
                fileLinks.map((link, idx) => {
                    const linkText = link.name || link.URL;
                    return li(
                        a(
                            {
                                id: events.addEvent({
                                    type: 'click',
                                    handler: () => {
                                        const dlLink = this.importExportLink(
                                            link.URL,
                                            link.name || 'download-' + idx
                                        );
                                        ui.getElement(downloadIframeId).setAttribute('src', dlLink);
                                    },
                                }),
                                class: this.baseCssClass + '__download_button',
                                type: 'button',
                                ariaLabel: `download file ${linkText}`,
                                download: 'download',
                            },
                            linkText
                        )
                    );
                })
            );
            const dlIframe = iframe({
                dataElement: downloadIframeId,
                class: this.baseCssClass + '__download-iframe',
            });
            return div([linkList, dlIframe]);
        },

        /**
         * This builds a set of HTML links from the list of report links. It converts the raw URLs
         * into some HTML with links out to each report page that open in new tabs.
         * @param {Array} htmlLinks list of html report links, provided by the report object and
         * the main link to the HTMLFileSetServ service.
         */
        buildHtmlLinksPanel: function (htmlLinks) {
            const ul = html.tag('ul'),
                li = html.tag('li'),
                a = html.tag('a'),
                div = html.tag('div'),
                br = html.tag('br', { close: false });

            const linkList = ul(
                {},
                htmlLinks.map((link) => {
                    const linkText = link.label || link.name;
                    return li({}, [
                        a(
                            {
                                href: link.url,
                                target: '_blank',
                                ariaLabel: `open ${linkText} in another window`,
                            },
                            linkText
                        ),
                        link.description ? br() + link.description : '',
                    ]);
                })
            );
            return div({}, linkList);
        },

        /**
         * This returns a Promise that resolves when the created objects is done rendering, as it's the
         * only widget that resolves as a Promise. If that's not rendered, then still resolves an empty
         * Promise.
         */
        render: function () {
            const _this = this;
            const t = html.tag,
                div = t('div'),
                a = t('a');
            const ui = UI.make({ node: this.$mainPanel.get(0) });
            const report = this.reportData;
            const events = Events.make({
                node: this.$mainPanel.get(0),
            });
            const renderPromises = [];

            // Handle warnings
            if (report.warnings && report.warnings.length) {
                this.$mainPanel.append(this.buildReportWarnings(report.warnings));
            }

            if (this.options.showCreatedObjects) {
                const objectWidget = OutputWidget.make();
                const objectsNode = document.createElement('div');
                this.$mainPanel.append(objectsNode);
                renderPromises.push(
                    objectWidget.start({
                        node: objectsNode,
                        objectData: this.createdObjects || [],
                    })
                );
            }

            let showingReport = false;
            if (this.options.showReportText) {
                // REPORT SECTION

                /*
                The "inline" report can come from either the direct_html property or the direct_html_link_index.
                The direct_html_link_index will take precedence since it offers a better method for referencing
                content within an iframe. Generally the app developer should use either method, not both
                */

                const hasDirectHtml = report.direct_html && report.direct_html.length;
                const hasDirectHtmlIndex =
                    typeof report.direct_html_link_index === 'number' &&
                    report.direct_html_link_index >= 0;
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
                                    { class: _this.baseCssClass + '__report_button' },
                                    a(
                                        {
                                            href: reportLink.url,
                                            target: '_blank',
                                            class: 'btn btn-default',
                                            type: 'button',
                                        },
                                        'View report in separate window'
                                    )
                                );
                                iframe = _this.makeIframeFromSrc({
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
                                iframe = _this.makeIframeFromSrc({
                                    content: report.direct_html,
                                    height: report.html_window_height
                                        ? report.html_window_height + 'px'
                                        : '500px',
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
                    this.$mainPanel.append(div({ dataElement: 'summary-section' }));
                    const reportSummary = div(
                        {
                            class: this.baseCssClass + '__summary',
                            style: report.summary_window_height
                                ? { maxHeight: report.summary_window_height + 'px' }
                                : null,
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

            // HTML LINKS SECTION
            if (this.options.showHTML && this.reportLinks && this.reportLinks.length) {
                this.$mainPanel.append(div({ dataElement: 'downloadable-html' }));
                const htmlReportLinksBody = this.buildHtmlLinksPanel(this.reportLinks);
                ui.setContent(
                    'downloadable-html',
                    ui.buildCollapsiblePanel({
                        title: 'Links',
                        name: 'downloadable-html-toggle',
                        hidden: false,
                        type: 'default',
                        classes: ['kb-panel-container'],
                        body: htmlReportLinksBody,
                    })
                );
            }

            // FILES SECTION
            if (this.options.showFiles && report.file_links && report.file_links.length) {
                this.$mainPanel.append(div({ dataElement: 'downloadable-files' }));
                const fileLinksPanelBody = this.buildFileLinksPanel(report.file_links, ui, events);
                ui.setContent(
                    'downloadable-files',
                    ui.buildCollapsiblePanel({
                        title: 'Files',
                        name: 'downloadable-files-toggle',
                        hidden: false,
                        type: 'default',
                        classes: ['kb-panel-container'],
                        body: fileLinksPanelBody,
                    })
                );
            }
            events.attachEvents();
            this.loading(false);
            return Promise.all(renderPromises);
        },
        loading: function (isLoading) {
            if (isLoading) {
                this.$messagePane.append(UI.loading());
                this.$messagePane.show();
            } else {
                this.$messagePane.hide();
                this.$messagePane.empty();
            }
        },
        /**
         * This shows an error from either a string or an object, wiping out everything else in this
         * widget's body.
         * The common KBase JSON-RPC error object format is:
         * {
         *   error: {
         *     error: 'some error message',
         *     ... other keys ...
         *   },
         *   status: 500
         * }
         * though this is possible, too:
         * {
         *   error: {
         *     message: 'some message'
         *   }
         * }
         * @param {Object | String} error
         */
        showClientError: function (error) {
            this.loading(false);
            let errString = 'Unknown error.';
            console.error(JSON.stringify(error));
            // if we get a basic error as a string
            if (typeof error === 'string') {
                errString = error;
                // this can be thrown from certain network error cases
            } else if (error.error && error.error.message) {
                errString = error.error.message;
                // this mess can come from a workspace API error
            } else if (error.error && error.error.error && typeof error.error.error === 'string') {
                errString = error.error.error;
            }

            const div = html.tag('div'),
                strong = html.tag('strong'),
                br = html.tag('br', { close: false });
            const errorDiv = div({ class: 'alert alert-danger' }, [
                strong('Error:'),
                br(),
                errString,
            ]);
            this.$elem.empty().append(errorDiv);
        },
        /**
         * Converts from several possible inputs into a Workspace ObjectIdentity structure.
         * @param {string | number} workspaceId - an identifier for the workspace, either a numerical id or a name string
         * @param {string | number} objectId - an identifier for the object, either a numerical id or a name string
         * @param {string | number} objectVer - a number for the object version
         * @param {string} wsRef - expected to be a valid workspace reference - using this overrides the other options
         */
        buildObjectIdentity: function (workspaceId, objectId, objectVer, wsRef) {
            const obj = {};
            if (wsRef) {
                obj.ref = wsRef;
            } else {
                obj.ref = `${workspaceId}/${objectId}`;
                if (objectVer) {
                    obj.ref += `/${objectVer}`;
                }
            }
            return obj;
        },
    });
});
