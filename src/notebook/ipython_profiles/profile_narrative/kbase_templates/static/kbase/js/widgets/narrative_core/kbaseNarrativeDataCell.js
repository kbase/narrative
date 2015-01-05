/**
 * Narrative data cell.
 *
 * Uses kbaseNarrativeViewers.js to "view" itself.
 *
 * @public
 */

// Global singleton for viewers
kb_g_viewers = null;


/**
 * Get/store info on all viewers from method store.
 *
 * Parameters:
 *  mclient - Method store client
 */
var KBaseNarrativeViewers = function(mclient) {
    this.viewers = {};
    this.landing_page_urls = {};
    this.specs = {};
    this.method_ids = [];
    var self = this;
    // Get application types, and populate data structures
    mclient.list_categories({'load_methods': 0, 'load_apps': 0, 'load_types': 1},
        function(data) {
            var aTypes = data[3];
            _.each(aTypes, function(val, key) {
                if (val.loading_error) {
                    console.error("Error loading method [" + key + "]: " + val.loading_error);
                }
                else if (val.view_method_ids && val.view_method_ids.length > 0) {
                    //console.debug("adding view method[" + key + "]=", val);
                    var mid = val.view_method_ids[0];
                    self.viewers[key] = mid;
                    self.landing_page_urls[key] = val.landing_page_url_prefix;
                    self.method_ids.push(mid);
                }
                else {
                    console.warn("No output types for: " + key);
                }
            });
            // Get method specs from all method_ids associated with some type in the previous loop
            // and populate `specs` with the data.
            self.method_ids = _.uniq(self.method_ids);
            mclient.get_method_spec({'ids':self.method_ids},
                function(specs) {
                    _.each(specs, function(value, key) {
                        console.debug("Set spec[" + value.info.id + "]");
                        self.specs[value.info.id] = value;
                    });
                },
                function(error) {
                    console.error("get_method_spec:",error);
            });
    });
    return this;
};

// Methods
KBaseNarrativeViewers.prototype.create_viewer = function(elt, data_cell) {
    // Helper functions
    /** Get value of parameter in mapping. */
    var get_param_value = function(o, mapping) {
          var param = null;
          // Get input/output parameter value
          if (mapping.input_parameter) {
              param = o.id;
          }
          else if (mapping.constant_value) {
              param = mapping.constant_value;
          }
          else if (mapping.narrative_system_variable) {
              switch (mapping.narrative_system_variable) {
                  case 'workspace':
                      param = o.ws_id;
                      break;
                  default:
                      console.error('Method (' + method_id + ') spec: unknown narrative system variable=' + sysProp);
              }
          }
          return param;
    };
    /** Transform parameter according to transform given by mapping */
    var transform_param = function(o, mapping, param) {
          if (mapping.target_type_transform) {
          	switch (mapping.target_type_transform) {
              case 'list':
          		param = [param];
                  break;
              case 'ref':
          		param = o['ws_id'] + '/' + param;
                  break;
          	default:
                  param = null;
          	}
          }
          return param;
    };
    // Variables and main method
    var o = data_cell.obj_info;
    var method_id = this.viewers[o.bare_type];
    if (!method_id) {
        console.debug("No viewer found for type=" + o.bare_type);
        return null;
    }
    var spec = this.specs[method_id];
	  var inputParamId = spec['parameters'][0]['id'];
	  var output = {};
    var mappings = spec.behavior.output_mapping;
    _.each(mappings, function(mapping) {
        // Get parameter value
        var param = get_param_value(o, mapping);
        if (param == null) {
            console.error('Unsupported output mapping structure:', mapping);
            return null;
        }
        // Get transformed parameter value
        param = transform_param(o, mapping, param);
        if (param == null) {
            console.error('Method (' + method_id + ') spec: bad transformation type=',
                          method.target_type_transform);
            return null;
        }
        // Get target property
        if (!mapping.target_property) {
            console.error('Method (' + method_id + ') spec: missing target property');
            return null;
        }
        // Set target property to transformed parameter value
        output[mapping.target_property] = param;
    });
    output.widget_title = spec.info.name;
    output.landing_page_url_prefix = this.landing_page_urls[method_id];
    var output_widget = spec.widgets.output;
    return elt[output_widget](output);
}

/**
 * Default viewer.
 *
 * Parameters:
 *    elt - jQuery element that the viewer should be attached to
 *    data_cell - The kbaseNarrativeDataCell widget with the data, etc.
 */
var KBaseNarrativeDefaultViewer = function(elt, data_cell) {
    var o = data_cell.obj_info;
    var lp_prefix = kb_g_viewers.landing_page_urls[o.bare_type];
    if (lp_prefix === undefined) {
        lp_prefix = "";
    }
    var md_desc = data_cell.shortMarkdownDesc(o, lp_prefix);
    if (!_.isEmpty(o.meta)) {
      md_desc += "\n\nMetadata: ";
      this.prev = false;
      _.each(_.pairs(o.meta), function(p) {
        if (this.prev) {
          md_desc += ", ";
        }
        md_desc += p[0] + "=" + p[1];
        this.prev = true;
      });
    }
    data_cell.ip_cell.edit();
    data_cell.ip_cell.set_text(md_desc);
    data_cell.ip_cell.unselect();
    return elt;
};

/**
 * NarrativeDataCell widget.
 *
 * This is the widget passed into
 * the viewer.
*/

(function($, undefined) {
    $.KBWidget({
        name: 'kbaseNarrativeDataCell',
        parent: 'kbaseNarrativeCell',
        version: '0.0.1',
        options: {
            info: null, // object info
            cell: null, // IPython cell
        },
        obj_info: null,
        // for 'method_store' service
        method_client: null,
        // IPython cell
        ip_cell: null,

        /**
         * Initialize
         */
        init: function(options) {
            console.debug("kbaseNarrativeDataCell.init.start");
            this._super(options);
            this.obj_info = options.info;
            this.obj_info.bare_type = /[^-]*/.exec(this.obj_info.type);
            this.obj_info.simple_date = /[^+]*/.exec(this.obj_info.save_date);
            this.ip_cell = options.cell;
            this._initMethodStoreClient();
            if (kb_g_viewers == null) {
                kb_g_viewers = new KBaseNarrativeViewers(this.method_client);
            }
            this.all_viewers = kb_g_viewers;
            console.debug("kbaseNarrativeDataCell.init.done");
            return this.render(options.info);
        },

        _initMethodStoreClient: function() {
            if (this.method_client === null) {
              this.method_client = new NarrativeMethodStore(this._getMethodStoreURL());
            }
        },

        _getMethodStoreURL: function() {
            var methodStoreURL = null;
            if (window.kbconfig && window.kbconfig.urls) {
                methodStoreURL = window.kbconfig.urls.narrative_method_store;
            } else {
                methodStoreURL = 'http://dev19.berkeley.kbase.us/narrative_method_store';
            }
            return methodStoreURL;
        },

        /**
         * Instantiate viewer widget for a data object.
         *
         * @param object_info (object) Object with info about data item
         * @return Whatever the 'viewer' function returns.
         */
        render: function() {
            var is_default = false; // default-viewer
            var self = this;
            var $view = this.all_viewers.create_viewer(self.$elem, self);
            if (_.isNull($view)) {
                KBaseNarrativeDefaultViewer(self.$elem, self);
                is_default = true;
            }
            else {
                var widget_title = $view.options.widget_title;
                var landing_page_url_prefix = $view.options.landing_page_url_prefix;
                var html = $(marked.parser(marked.lexer(
                        self.shortMarkdownDesc(self.obj_info, landing_page_url_prefix))));
                html.find("a[href]").not('[href^="#"]').attr("target", "_blank");
                self.$elem.before(html);
            }
            // Make sure that we have unselected the cell
            self.ip_cell.unselect();
            // If *not* default viewer, disable cell editing, as this will mess it up
            if (!is_default) {
              self.ip_cell.edit = function() { };
            }
            // Return the rendered widget
            return this;
        },

        shortMarkdownDesc: function(o, landing_page_url_prefix) {
          var link = "https://"; // force https
          if (window.location.hostname == '0.0.0.0' ||
              window.location.hostname == '127.0.0.1') {
            link += "narrative-dev.kbase.us"; // for testing
          }
          else {
            link += window.location.host;
          }
          link += "/functional-site/#/" + landing_page_url_prefix + "/" + o.ws_name + "/" + o.name;
          return "[" + o.name + "](" + link + ")"  +
               " (" + o.bare_type + "<sub>v" + o.version + "</sub>)." +
               " Last saved: " +
               "*" + o.saved_by + "*  " + o.simple_date;
        }

    })
})(jQuery);
