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
var KBaseNarrativeViewers = function(mclient, done) {
    this.viewers = {};
    this.landing_page_urls = {};
    this.type_names = {};
    this.specs = {};
    this.method_ids = [];
    var self = this;
    // Get application types, and populate data structures
    mclient.list_categories({'load_methods': 1, 'load_apps': 0, 'load_types': 1},
        function(data) {
    		var methodInfo = data[1];
            var aTypes = data[3];
            _.each(aTypes, function(val, key) {
                if (val.loading_error) {
                    console.error("Error loading method [" + key + "]: " + val.loading_error);
                }
                else if (val.view_method_ids && val.view_method_ids.length > 0) {
                    //console.debug("adding view method[" + key + "]=", val);
                    var mid = val.view_method_ids[0];
                    if (!methodInfo[mid]) {
                    	console.log('Can\'t find method info for id: ' + mid);
                    } else if (methodInfo[mid].loading_error) {
                    	console.log('There is an error for method info with id [' + mid + ']: ' + methodInfo[mid].loading_error);
                    } else {
                    	self.viewers[key] = mid;
                    	self.landing_page_urls[key] = val.landing_page_url_prefix;
                    	self.type_names[key] = val.name;
                    	self.method_ids.push(mid);
                    }
                }
                else {
                    //console.warn("No output types for: " + key);
                }
            });
            // Get method specs from all method_ids associated with some type in the previous loop
            // and populate `specs` with the data.
            self.method_ids = _.uniq(self.method_ids);
            mclient.get_method_spec({'ids':self.method_ids},
                function(specs) {
                    _.each(specs, function(value, key) {
                        //console.debug("Set spec[" + value.info.id + "]");
                        self.specs[value.info.id] = value;
                    });
                    if (done) {
                        done();
                    }
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
              param = o.name;
          }
          else if (mapping.constant_value) {
              param = mapping.constant_value;
          }
          else if (mapping.narrative_system_variable) {
              switch (mapping.narrative_system_variable) {
                  case 'workspace':
                      param = o.ws_name;
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
          		param = o['ws_name'] + '/' + param;
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
        //console.debug("No viewer found for type=" + o.bare_type);
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
    output.widget_title = this.type_names[o.bare_type];  //spec.info.name;
    output.landing_page_url_prefix = this.landing_page_urls[o.bare_type];
    var output_widget = spec.widgets.output;
    try {
      var w = elt[output_widget](output);
      return w;
    }
    catch(err){
      console.error("error making widget: " + output_widget);
    }
    // return elt[output_widget](output);
};

/**
 * Default viewer.
 *
 * Parameters:
 *    elt - jQuery element that the viewer should be attached to
 *    data_cell - The kbaseNarrativeDataCell widget with the data, etc.
 */
var KBaseNarrativeDefaultViewer = function(elt, data_cell) {
    var o = data_cell.obj_info;
    var md_desc = '';
    if (_.isEmpty(o.meta)) {
        md_desc += "No metadata";
    } else {
      md_desc += "Metadata\n";
      this.prev = false;
      _.each(_.pairs(o.meta), function(p) {
        if (this.prev) {
          md_desc += "\n";
        }
        md_desc += p[0] + ": " + p[1];
        this.prev = true;
      });
    }
    return elt.append($('<pre>').append(md_desc));
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
            cell: null  // IPython cell
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
            //console.debug("kbaseNarrativeDataCell.init.start");
            this._super(options);
            this.obj_info = options.info;
            this.obj_info.bare_type = /[^-]*/.exec(this.obj_info.type);
            this.obj_info.simple_date = /[^+]*/.exec(this.obj_info.save_date);
            this.ip_cell = options.cell;
            this._initMethodStoreClient();
            if (kb_g_viewers == null) {
		// we have to wait until the type/method specs are loaded the first time
		var self = this;
		
		var done = function() {
		    //console.debug("kbaseNarrativeDataCell.init.done with load");
		    kb_g_viewers = this.all_viewers;
		    self.render(options.info);
		}
		this.all_viewers = new KBaseNarrativeViewers(this.method_client,done);
            } else {
		// if they are already loaded, we can just grab it and render
		this.all_viewers = kb_g_viewers;
		//console.debug("kbaseNarrativeDataCell.init.done");
		this.render(options.info);
	    }
            
            return this; 
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
            var $label = $('<span>').addClass('label label-info').append('Data');
            var baseClass = 'kb-cell-output';
            var panelClass = 'panel-default';
            var headerClass = 'kb-out-desc'; 

            var is_default = false; // default-viewer
            var self = this;
            var widgetTitleElem = self.$elem.closest('.kb-cell-output').find('.panel').find('.panel-heading').find('.kb-out-desc').find('b');
            var mainPanel = $('<div>');
            self.$elem.append(mainPanel);
            var $view = this.all_viewers.create_viewer(mainPanel, self);

            var landing_page_url_prefix = null;
            var type_tokens = self.obj_info.type.split('.')
            var type_module = type_tokens[0];
            var type = type_tokens[1].split('-')[0];
            var ws_landing_page_map = window.kbconfig.landing_page_map;
            if (ws_landing_page_map && ws_landing_page_map[type_module] && ws_landing_page_map[type_module][type]) {
            	landing_page_url_prefix = ws_landing_page_map[type_module][type];
            }
            var widget_title = '';
            if (_.isNull($view)) {
                KBaseNarrativeDefaultViewer(mainPanel, self);
                widget_title = type;
                is_default = true;
            }
            else {
                widget_title = $view.options.widget_title;
                if (!landing_page_url_prefix)
                	landing_page_url_prefix = $view.options.landing_page_url_prefix;
            }
            if (!landing_page_url_prefix)
            	landing_page_url_prefix = 'json';
            widgetTitleElem.empty();
            widgetTitleElem.append(widget_title);
            widgetTitleElem.append('&nbsp;<a href="'+self.shortMarkdownDesc(self.obj_info, 
            		landing_page_url_prefix)+'" target="_blank">'+self.obj_info.name+'</a>');
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
          return link;
        },

        /**
         * Converts a timestamp to a simple string.
         * Do this American style - HH:MM:SS MM/DD/YYYY
         *
         * @param {string} timestamp - a timestamp in number of milliseconds since the epoch.
         * @return {string} a human readable timestamp
         */
        readableTimestamp: function(timestamp) {
            var format = function(x) {
                if (x < 10)
                    x = '0' + x;
                return x;
            };

            var d = new Date(timestamp);
            var hours = format(d.getHours());
            var minutes = format(d.getMinutes());
            var seconds = format(d.getSeconds());
            var month = d.getMonth()+1;
            var day = format(d.getDate());
            var year = d.getFullYear();

            return hours + ":" + minutes + ":" + seconds + ", " + month + "/" + day + "/" + year;
        }

    })
})(jQuery);
