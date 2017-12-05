/*global define*/
/*jslint white: true*/
/**
 * Narrative data cell.
 *
 * Uses kbaseNarrativeViewers.js to "view" itself.
 *
 * @public
 */
/*global define*/
/*jslint white:true,browser:true*/
define ([
    'kbwidget',
    'bootstrap',
    'jquery',
    'underscore',
    'narrativeConfig',
    'narrativeViewers',
    'kbaseNarrativeCell',
    'kb_service/utils'
], function(
    KBWidget,
    bootstrap,
    $,
    _,
    Config,
    Viewers,
    kbaseNarrativeCell,
    ServiceUtils
) {
    'use strict';

    /**
     * Initialize
     */

    return KBWidget({
        name: 'kbaseNarrativeDataCell',
        parent : kbaseNarrativeCell,
        version: '0.0.1',
        options: {
            info: null, // object info
            info_tuple: null,
            error_message: null,
            type_spec: null,
            app_spec: null,
            output: null,
            cell: null, // Jupyter cell
            lp_url: Config.url('landing_pages')
        },
        obj_info: null,
        // for 'method_store' service
        // method_client: null,
        // Jupyter cell
        ip_cell: null,
        /**
         * NarrativeDataCell widget.
         *
         * This is the widget passed into
         * the viewer.
         */
        init: function (options) {
            this._super(options);
            //console.log("kbaseNarrativeDataCell: options=", JSON.stringify(options, null, 2));
            if (options.info_tuple) {
                this.obj_info = ServiceUtils.objectInfoToObject(options.info_tuple);
                this.obj_info.meta = this.obj_info.metadata;
                delete this.obj_info.metadata;
                this.obj_info.ws_id = this.obj_info.wsid;
            } else {
                this.obj_info = options.info;
            }
            this.obj_info.bare_type = /[^-]*/.exec(this.obj_info.type);
            this.obj_info.simple_date = /[^+]*/.exec(this.obj_info.save_date);
            this.ip_cell = options.cell;

            this.metadataInit();

            this.render(options.info);

            return this;
        },
        render: function () {
            var self = this;
            var $label = $('<span>').addClass('label label-info').append('Data'),
                baseClass = 'kb-cell-output',
                panelClass = 'panel-default',
                headerClass = 'kb-out-desc',
                is_default = false, // default-viewer
                widgetTitleElem = this.$elem.closest('.kb-cell-output')
                    .find('.panel')
                    .find('.panel-heading')
                    .find('.kb-out-desc')
                    .find('b');
            // var mainPanel = $('<div>');
            // self.$elem.append(mainPanel);

            var type_tokens = this.obj_info.type.split('.');
            var type_module = type_tokens[0];
            var type = type_tokens[1].split('-')[0];

            var error_message = this.options.error_message;
            var type_spec = this.options.type_spec;
            var app_spec = this.options.app_spec;
            var output = this.options.output;

            var onViewerCreated = function (widget) {
                widgetTitleElem.empty()
                .append(widget.title)
                .append('&nbsp;<a href="' + self.shortMarkdownDesc(self.obj_info,
                    self.options.lp_url) + '" target="_blank">' + self.obj_info.name + '</a>');

                self.metadataRender(self.$elem);
                self.$elem.append(widget.widget);
                self.$elem.closest('.cell').trigger('set-title', [self.obj_info.name]);
            };

            if (error_message || type_spec || app_spec || output) {
                onViewerCreated(this.createViewer(error_message, type_spec, app_spec, output));
            } else {
                Viewers.createViewer(this).then(onViewerCreated);
            }
            // Return the rendered widget
            return this;
        },
        shortMarkdownDesc: function (o, landing_page_url_prefix) {
            var link = "https://"; // force https
            if (window.location.hostname == '0.0.0.0' ||
                window.location.hostname == '127.0.0.1') {
                link += "narrative-dev.kbase.us"; // for testing
            } else {
                link += window.location.host;
            }
            link += landing_page_url_prefix + o.ws_name + "/" + o.name;
            return link;
        },

//-------------------------------------------------------------------------------------

        /**
         * Higher-level interface to relevant workspace functions for
         * a given single object.
         */
        WorkspaceObject: function(wsclient, obj_spec) {
            var ws = wsclient, spec = obj_spec, self = this, i=0;
            // Get info for every version of this object
            ws.list_objects({ids: [spec.wsid], minObjectID: spec.objid,
                                    maxObjectID: spec.objid, showAllVersions: 1})
                .then(function(objlist) {
                    var info = {};
                    for (i=0; i < objlist.length; i++) {
                        var o = objlist[i];
                        info[o[4]] = {objid: o[0], name: o[1], type: o[2],
                            save_date: o[3], version: o[4], saved_by: o[5],
                            wsid: o[6], workspace: o[7], chsum: o[8],
                            size: o[9], meta: o[10],
                            id: o[0], ws_id: o[6] /* aliases */ };
                    }
                    return info;
                })
                .then(function(info) {
                        self.metadata_info = info;
                        return null;
                });
            return {
                /**
                 * List of all versions of the object.
                 */
                object_versions: function() {
                    return _.keys(self.metadata_info);
                },

                /**
                 * The 'object_info' thing for a single object.
                 */
                info_for_version: function(ver) {
                    return self.metadata_info[ver];
                },

                /**
                 * References from/to the object.
                 */
                references: function(ver) {
                    var result = {from: [], to: []};

                    var references_to = function(result) {
                        var subset_spec = {objid: spec.objid, wsid: spec.wsid,
                                           included: ['/refs'], 'ver': ver};
                        return ws.get_object_subset([subset_spec]).then(function(objects) {
                            console.debug('@@ references-to, got objects:', objects);
                            result.to = objects[0].refs;
                            return result;
                        });
                    },

                    references_from = function(result) {
                        return ws.list_referencing_objects([spec]).then(function(rfrom) {
                            console.debug('@@ references-from, got data:', rfrom);
                            result.from = _.map(_.flatten(rfrom, true), function(obj) {
                                return obj[6] + '/' + obj[0] + '/' + obj[4];
                            });
                            return result;
                        });
                    };

                    // chain the promises
                    return references_to(result).then(references_from);
                }
            }
        },

        /**
         * Initialize instance vars for metadata display.
         */
        metadataInit: function() {
            this.metadata_ver_shown = -1;
            this.metadata_ver_cur = this.obj_info.version;
            this.metadata_info = {};
            this.wsobj = this.WorkspaceObject(kb.ws, {
                objid: this.obj_info.id,
                wsid: this.obj_info.ws_id
            });
            this.obj_maxver = -1;
            this.verlist_class = 'kb-data-obj-panel-verlist';
            this.node_class = 'kb-data-obj-panel-gnode';
            return this;
        },


        /**
         * Panel to show object metadata and versions.
         *
         * @param $elem Panel DOM is appended here
         * @returns `this` if successful, null on error.
         */
        metadataRender: function ($elem) {
            var self = this, fade_ms = 400;

            console.info('@@ create metadata panel - start');
            try {
                var $meta_button = $('<button>')
                    .addClass('btn btn-default kb-data-obj')
                    .attr('type', 'button')
                    .text('Object details..');
                var $meta_panel_close = $('<button>')
                    .attr({'type': 'button', 'aria-label': 'Close'})
                    .addClass('close kb-data-obj-close')
                    .append($('<span>')
                         .attr('aria-hidden', 'true')
                         .html('&times;'))
                    .click(function(event) {
                        $(this).parent().fadeOut(fade_ms);
                        $meta_button.show();
                    });
                var $meta_panel = $('<div>')
                        .addClass('row kb-data-obj-panel')
                        .append(
                            $('<div>')
                            .addClass('col-md-7 kb-data-obj-panel-info'))
                        .append(
                            $('<div>')
                            .addClass('col-md-4 kb-data-obj-panel-graph'))
                        .append($meta_panel_close);
                $meta_button.click(function(event) {
                    console.debug('@@ object info:', self.obj_info);
                    if (self.obj_info === undefined || self.obj_info === null) { return; }
                    $meta_button.hide();
                    self.showMetadata($meta_panel);
                    $meta_panel.fadeIn(fade_ms);
                });
                $elem.append($meta_button);
                console.debug('@@ Appending meta panel');
                $meta_panel.hide();
                $elem.append($meta_panel);
            }
            catch (ex) {
                console.error('Error making metadata panel:', ex);
                $meta_panel = null;
            }
            console.info('@@ create metadata panel - end:', $meta_panel);
            return this;
        },

        showMetadata: function($elem) {
            var success = true;
            var self = this;
            try {
                // - - - - - - - -
                // Info subpanel
                // - - - - - - - -
                console.debug('@@ showMetadata, obj_info:', this.obj_info);
                var $info = $elem.find('.kb-data-obj-panel-info'),
                    objref = this.obj_info.ws_id + '/' + this.obj_info.id + '/' + this.obj_info.version;
                $info.html("<dl>" +
                           "<dt>Version</dt><dd>" +
                              "<span class='" + this.verlist_class + "'></span></dd>" +
                           "<dt>Name</dt><dd>" + this.obj_info.name + "</dd>" +
                           "<dt>ID</dt><dd>" + objref + "</dd>" +
                           "<dt>Type</dt><dd>" + this.obj_info.type + "</dd>" +
                           "<dt>Saved</dt><dd>" + this.obj_info.save_date + "</dd>" +
                           "<dt>Saved by</dt><dd>" + this.obj_info.saved_by + "</dd>" +
                           "<dt>Size</dt><dd>" + this.humanSize(this.obj_info.size, false) + "</dd>" +
                           "<dt>Checksum</dt><dd>" + this.obj_info.chsum + "</dd>" +
                           "</dl>");
                // Info subpanel(2): create version listing
                var $version_list = $info.find('.' + this.verlist_class);
                // Generate version list
                var version_list = this.wsobj.object_versions();
                self.obj_maxver = _.max(version_list);
                for(var i=1; i <= self.obj_maxver; i++) {
                    var $ver_span = $('<span>');
                    $ver_span.text(i);
                    $version_list.append($ver_span);
                    // Switch on click
                    $ver_span.click(function(event) {
                        var v = self.metadata_ver_cur = 1 * $(event.target).text();
                        self.obj_info = self.metadata_info[v];
                        // Re-display
                        self.showMetadata($elem);
                    });
                }
                // Select currently viewed version in the list
                self.selectCurrentVersion($elem);
                // - - - - - - - -
                // Graph subpanel
                // - - - - - - - -
                var $graph = $elem.find('.kb-data-obj-panel-graph');
                var $g_rfrom = $("<div class='kb-data-obj-graph-ref-from'>")
                    .append('<table><thead><tr><th>Referencing Objects</th></tr></thead><tbody>');
                var $g_rto = $("<div class='kb-data-obj-graph-ref-to'>")
                    .append('<table><thead><tr><th>Objects Referenced</th></tr></thead><tbody>');
                // fetch refs
                this.wsobj.references().then(function(refs) {
                    _.each(refs.from, function(r) {
                        $g_rfrom.find('tbody').append($('<tr>').append($('<td>').text(r)));
                    });
                    _.each(refs.to, function(r) {
                        $g_rto.find('tbody').append($('<tr>').append($('<td>').text(r)));
                    });
                    $g_rfrom.append('</tbody></table>');
                    $g_rto.append('</tbody></table>');
                    $graph.empty();
                    $graph.append($g_rfrom).append($g_rto);
                });
            }
            catch (ex) {
                console.error('Failed to populate metadata:', ex);
                success = false;
            }
            return success;
        },

        selectCurrentVersion: function($elem) {
            var ver_selector = '.' + this.verlist_class + ' :nth-child(' +
                this.metadata_ver_cur + ')';
            $elem.find('.' + this.verlist_class).removeClass('selected');
            $elem.find(ver_selector).addClass('selected');
            this.metadata_ver_shown = self.metadata_ver_cur;
        },

        /**
         * Utility function to format a size as
         * a human-readable string.
         *
         * @param bytes The size, as integer bytes
         * @param si If true, use SI powers of 10, else powers of 2
         * @return Formatted string representation
         */
        humanSize: function(bytes, si) {
            var thresh = si ? 1000 : 1024;
            if(Math.abs(bytes) < thresh) {
                return bytes + ' B';
            }
            var units = si
                ? ['kB','MB','GB','TB','PB','EB','ZB','YB']
                : ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
            var u = -1;
            do {
                bytes /= thresh;
                ++u;
            } while(bytes >= thresh && u < units.length - 1);
            return bytes.toFixed(1)+' '+units[u];
        },

        createInfoObject: function (info) {
            return _.object(['id', 'name', 'type', 'save_date', 'version',
                'saved_by', 'ws_id', 'ws_name', 'chsum', 'size',
                'meta'], info);
        },

        createViewer: function(error_message, type_spec, app_spec, output_params) {
            var o = this.obj_info;
            if (error_message) {
                console.error("Error loading viewer spec: ", error_message);
                var mdDesc = '';
                if (_.isEmpty(o.meta)) {
                    mdDesc += "No metadata";
                } else {
                    mdDesc += "Metadata";
                    _.each(_.pairs(o.meta), function (p) {
                        mdDesc += '\n' + p[0] + ': ' + p[1];
                    });
                }
                return {widget: $('<div>').append($('<pre>').append(mdDesc)),
                    title: 'Unknown Data Type'};
            }

            var output = $.extend({}, output_params);
            output._obj_info = o;
            output.widgetTitle = type_spec.name || 'Unknown Data Type';
            output.landing_page_url_prefix = type_spec.landing_page_url_prefix;
            var outputWidget = app_spec.widgets.output;
            var w = null;
            // XXX: Temporary until all widgets are loaded with Require.
            // First, try to load it from global space.
            var $elem = $('<div>');
            try {
                w = $elem[outputWidget](output);
            }
            // If that fails, try to load with require.
            // If THAT fails, fail with an error (though the error should be improved)
            catch (err) {
                require([outputWidget], function (W) {
                    w = new W($elem, output);
                    return w;
                }, function (reqErr) {
                    console.error("errors occurred while making widget: " + outputWidget, {'firstTry': err, 'requireErr': reqErr});
                    $elem = defaultViewer(dataCell);
                    output.widgetTitle = 'Unknown Data Type';
                });
            }
            return {
                widget: $elem,
                title: output.widgetTitle
            };
        }

    });
});
