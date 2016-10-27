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
define (
	[
		'kbwidget',
		'bootstrap',
		'jquery',
		'underscore',
		'narrativeConfig',
		'narrativeViewers',
		'kbaseNarrativeCell',
	], function(
		KBWidget,
		bootstrap,
		$,
		_,
		Config,
		Viewers,
		kbaseNarrativeCell
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
            this.obj_info = options.info;
            this.obj_info.bare_type = /[^-]*/.exec(this.obj_info.type);
            this.obj_info.simple_date = /[^+]*/.exec(this.obj_info.save_date);
            this.ip_cell = options.cell;

            this.metadataInit();
            
            this.render(options.info);

            return this;
        },
        render: function () {
            var $label = $('<span>').addClass('label label-info').append('Data');
            var baseClass = 'kb-cell-output';
            var panelClass = 'panel-default';
            var headerClass = 'kb-out-desc';

            var is_default = false; // default-viewer
            var widgetTitleElem = this.$elem.closest('.kb-cell-output').find('.panel').find('.panel-heading').find('.kb-out-desc').find('b');
            // var mainPanel = $('<div>');
            // self.$elem.append(mainPanel);

            var type_tokens = this.obj_info.type.split('.');
            var type_module = type_tokens[0];
            var type = type_tokens[1].split('-')[0];

            Viewers.createViewer(this).then(function (widget) {
                widgetTitleElem.empty()
                    .append(widget.title)
                    .append('&nbsp;<a href="' + this.shortMarkdownDesc(this.obj_info,
                        this.options.lp_url) + '" target="_blank">' + this.obj_info.name + '</a>');

                this.metadataRender(this.$elem);
                this.$elem.append(widget.widget);
                this.$elem.closest('.cell').trigger('set-title', [this.obj_info.name]);
                
            }.bind(this));

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
            var ws = wsclient;
            var spec = obj_spec;
            return {

                /**
                 * List of all versions of the object.
                 */
                object_versions: function() {
                    return ws.list_objects({ids: [spec.wsid], minObjectID: spec.objid,
                        maxObjectID: spec.objid, showAllVersions: 1})
                        .then(function(objlist) {
                            var versions = [];
                            _.each(objlist, function(o) { 
                                versions.push(o[4]); 
                            });
                            return versions;
                        }, function(exc) {
                            console.error('Getting object versions for (',  obj_spec, '):', exc);
                        });
                },
                
                /**
                 * The 'object_info' thing for a single object.
                 */
                info_for_version: function(ver) {
                    return ws.list_objects({ids: [spec.wsid], minObjectID: spec.objid,
                        maxObjectID: spec.objid, showAllVersions: 1})                    
                        .then(function(objlist) {
                            var for_version = _.filter(objlist, function(o) { 
                                return (o[4] == ver); 
                            });
                            if (for_version.length == 1) {
                                var a = for_version[0];
                                return {
                                    objid: a[0],
                                    name: a[1], 
                                    type: a[2],
                                    save_date: a[3],
                                    version: a[4],
                                    saved_by: a[5],
                                    wsid: a[6], 
                                    workspace: a[7],
                                    chsum: a[8],
                                    size: a[9],
                                    meta: a[10]                                    
                                };
                            }
                            else {
                                console.error('No versioned object found for (', spec, ')');
                            }
                        }, function(exc) {
                            console.error('Getting object info for (',  spec, '):', exc);
                        });
                }              
            };
        },
        
        /**
         * Initialize instance vars for metadata display.
         */
        metadataInit: function() {
            this.metadata_ver_shown = -1;
            this.metadata_ver_cur = this.obj_info.version;
            this.metadata_ver = {};
            this.metadata_ver[this.obj_info.version] = this.obj_info;
            this.wsobj = this.WorkspaceObject(kb.ws, {
                objid: this.obj_info.id,
                wsid: this.obj_info.ws_id
            });
            this.obj_maxver = -1;
            this.verlist_class = 'kb-data-obj-panel-verlist';            
            return this;
        },
        
        
        /**
         * Panel to show object metadata and versions.
         *
         * @param $elem Panel DOM is appended here
         * @returns `this` if successful, null on error.
         */
        metadataRender: function ($elem) {
            var self = this;
            var fade_ms = 400;
        
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
                            .addClass('col-md-8 kb-data-obj-panel-info'))
                        .append(
                            $('<div>')
                            .addClass('col-md-3 kb-data-obj-panel-graph'))
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
                // Info subpanel
                console.debug('@@ showMetadata, obj_info:', this.obj_info);
                var $info = $elem.find('.kb-data-obj-panel-info');
                $info.html("<dl>" +
                           "<dt>Version</dt><dd>" +
                              "<span class='" + this.verlist_class + "'></span></dd>" +
                           "<dt>Name</dt><dd>" + this.obj_info.name + "</dd>" + 
                           "<dt>Type</dt><dd>" + this.obj_info.type + "</dd>" + 
                           "<dt>Saved</dt><dd>" + this.obj_info.save_date + "</dd>" +
                           "<dt>Saved by</dt><dd>" + this.obj_info.saved_by + "</dd>" +
                           "<dt>Size</dt><dd>" + this.humanSize(this.obj_info.size, false) + "</dd>" +
                           "<dt>Checksum</dt><dd>" + this.obj_info.chsum + "</dd>" +
                           "</dl>");
                // Info subpanel(2): create version listing
                var $version_list = $info.find('.' + this.verlist_class);
                // Generate version list
                $version_list.empty();
                this.wsobj.object_versions().then(function (version_list) {
                    self.obj_maxver = _.max(version_list); 
                    for(var i=1; i <= self.obj_maxver; i++) {
                        var $ver_span = $('<span>');
                        $ver_span.text(i);
                        $version_list.append($ver_span);
                        // Switch on click
                        $ver_span.click(function(event) {
                            self.metadata_ver_cur = 1 * $(event.target).text();
                            // Switch object info to selected version
                            var v = self.metadata_ver_cur;
                            if (self.metadata_ver[v] === undefined) {
                                // Pull out info for this version
                                self.wsobj.info_for_version(v).then(function(info) {
                                    self.metadata_ver[v] = info;
                                    self.obj_info = info;
                                    // Re-display
                                    self.showMetadata($elem);
                                    self.metadata_ver_shown = v;
                                });
                            }
                            else {
                                self.obj_info = self.metadata_ver[v];
                                // Re-display
                                self.showMetadata($elem);                      
                                self.metadata_ver_shown = v;
                            }
                        });
                    }
                // Select currently viewed version in the list
                }).then(function() {
                    self.selectCurrentVersion();
                });
                // Graph subpanel
                var $graph = $elem.find('.kb-data-obj-panel-graph');
                $graph.text('graph');
            }
            catch (ex) {
                console.error('Failed to populate metadata:', ex);
                success = false;
            }            
            return success;
        },

        selectCurrentVersion: function() {
            var ver_selector = '.' + this.verlist_class + ' :nth-child(' +
                this.metadata_ver_cur + ')';
            $('.' + this.verlist_class).removeClass('selected'); 
            $(ver_selector).addClass('selected');
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
        }
     
    });
});