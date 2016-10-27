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
        'kbaseNarrativeMetadata'
	], function(
		KBWidget,
		bootstrap,
		$,
		_,
		Config,
		Viewers,
		kbaseNarrativeCell,
        kbaseMetadataWidget
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
            console.debug('@@ meta widget:', kbaseMetadataWidget);
            this.meta_widget = new kbaseMetadataWidget({info: options.info});
            
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

                this.meta_widget.render(this.$elem);
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
     
    });
});