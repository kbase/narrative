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
		'kbaseNarrativeCell'
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
            this.metadata_filled = false;
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

                this.renderMetadataPanel(this.$elem);
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
        /**
         * Panel to show object metadata and versions.
         *
         * @param $elem Create the panel DOM and append it to `$elem`.
         * @returns Created DOM root if successful, null on error.
         */
        renderMetadataPanel: function($elem) {
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
                    if (!self.metadata_filled) {
                        var $panel = $(this).parent();
                        self.metadata_filled = self.populateMetadata($panel);
                    }
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
            return $meta_panel;
        },
        populateMetadata: function($elem) {
            var success = true;
            try {
                var $info = $elem.find('.kb-data-obj-panel-info');
                $info.html("<dl>" +
                           "<dt>Version</dt><dd><span class='kb-data-obj-panel-verlist'></span></dd>" +
                           "<dt>Name</dt><dd>" + this.obj_info.name + "</dd>" + 
                           "<dt>Type</dt><dd>" + this.obj_info.type + "</dd>" + 
                           "<dt>Saved</dt><dd>" + this.obj_info.save_date + "</dd>" +
                           "<dt>Saved by</dt><dd>" + this.obj_info.saved_by + "</dd>" +
                           "<dt>Size</dt><dd>" + this.humanSize(this.obj_info.size, false) + "</dd>" +
                           "<dt>Checksum</dt><dd>" + this.obj_info.chsum + "</dd>" +
                           "</dl>");
                var $version_list = $info.find('.kb-data-obj-panel-verlist');
                           
                var $graph = $elem.find('.kb-data-obj-panel-graph');
                $graph.text('graph');
            }
            catch (ex) {
                console.error('Failed to populate metadata:', ex);
                success = false;
            }            
            return success;
        },
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