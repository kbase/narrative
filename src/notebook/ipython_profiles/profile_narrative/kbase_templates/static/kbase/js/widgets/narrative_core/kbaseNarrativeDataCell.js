/**
 * Narrative data cell.
 *
 * Uses kbaseNarrativeViewers.js to "view" itself.
 *
 * @public
 */

// Viewer methods
// --------------

var KBaseNarrativeViewer = function(o, methodStoreClient, ret) {
  console.log(o);
  if (!KBaseNarrativeViewerNames) {
      methodStoreClient.list_categories({'load_methods': 0, 'load_apps' : 0, 'load_types' : 1}, 
            $.proxy(function(data) {
                var aTypes = data[3];
                var methodIds = [];
                var methodIdSet = {};
                KBaseNarrativeViewerNames = {};
                KBaseNarrativeViewerLandingPageURLPrefixes = {};
                for (var key in aTypes) {
                    if (!aTypes.hasOwnProperty(key))
                        continue;
                    if (aTypes[key]["loading_error"]) {
                        console.log("Error loading type [" + key + "]: " + aTypes[key]["loading_error"]);
                        continue;
                    }
                    if (aTypes[key]["view_method_ids"] && aTypes[key]["view_method_ids"].length > 0) {
                        var methodId = aTypes[key]["view_method_ids"][0];
                        var urlPrefix = aTypes[key]["landing_page_url_prefix"];
                    	KBaseNarrativeViewerNames[key] = methodId;
                    	KBaseNarrativeViewerLandingPageURLPrefixes[methodId] = urlPrefix;
                        if (!methodIdSet[methodId]) {
                            methodIds.push(methodId);
                            methodIdSet[methodId] = true;
                        }
                    }
              	}
                methodStoreClient.get_method_spec({ 'ids' : methodIds },
                        $.proxy(function(specs) {
                        	KBaseNarrativeViewerSpecs = {};
                            for (var i in specs)
                                KBaseNarrativeViewerSpecs[specs[i].info.id] = specs[i];
                            ret(KBaseNarrativeViewers(o.bare_type));
                        }, this),
                        $.proxy(function(error) {
                            console.log(error);
                        }, this)
                );
            }, this),
            $.proxy(function(error) {
                console.log(error);
            }, this)
    );
  } else {
    ret(KBaseNarrativeViewers(o.bare_type));
  }
}

// Mapping from KBase types to viewer names.
// XXX: This could be configured from an external source.
var KBaseNarrativeViewerNames = null;  /*{
  default: "genericViewer",
  "KBaseGenomes.Genome": "genomeViewer",
  "KBaseTrees.Tree": "treeViewer",
}*/

var KBaseNarrativeViewerLandingPageURLPrefixes = null;

var KBaseNarrativeViewerSpecs = null;

var KBaseNarrativeDefaultViewer = function(elt, self) {
    var o = self.obj_info;
    var md_desc = self.shortMarkdownDesc(o);
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
    self.ip_cell.edit();
    self.ip_cell.set_text(md_desc);
    self.ip_cell.unselect();
    return elt;
};

// Viewer functions.
var KBaseNarrativeViewers = function(dataType) {
  var viewerName = KBaseNarrativeViewerNames[dataType];
  console.log("dataType=" + dataType + ", viewerName=" + viewerName);
  if (!viewerName) {
  /**
   * Generic viewer.
   */
   return null;
  } else {
	return function(elt, self) {
		var o = self.obj_info;
		var objId = o['id'];
		var wsName = o['ws_id'];
		var spec = KBaseNarrativeViewerSpecs[viewerName];
		var inputParamId = spec['parameters'][0]['id'];
		var output = {};
	    var mappings = spec['behavior']['output_mapping']
	    for (var mapPos in mappings) {
	    	var mapping = mappings[mapPos];
	        var paramValue = null;
	        if (mapping['input_parameter']) {
	        	paramValue = objId;
	        } else if (mapping['constant_value']) {
	            paramValue = mapping['constant_value'];
	        } else if ('narrative_system_variable') {
	            var sysProp = mapping['narrative_system_variable'];
	            if (sysProp === 'workspace') {
	            	paramValue = wsName;
	            } else {
	            	console.log('Unknown narrative system variable=' + sysProp);
	            }
	        } 
	        if (!paramValue) {
	        	console.log('Unsupported output mapping structure:');
	        	console.log(mapping);
	        	continue;
	        }
	        if (mapping['target_type_transform']) {
	        	var targetTrans = mapping['target_type_transform'];
	        	if (targetTrans === 'list') {
	        		paramValue = [paramValue];
	        	} else if (targetTrans === 'ref') {
	        		paramValue = wsName + '/' + paramValue;
	        	} else {
		        	console.log('Unsupported transformation type: ' + targetTrans);	        		
	        	}
	        }
	        var targetProp = mapping['target_property'];
	        if (!targetProp) {
	        	console.log('Target property is not defined in output mapping structure:');
	        	console.log(mapping);
	        	continue;
	        }
	        output[targetProp] = paramValue;
	    }
	    output['widget_title'] = spec['info']['name'];
	    output['landing_page_url_prefix'] = KBaseNarrativeViewerLandingPageURLPrefixes[viewerName];
        var outputWidgetName = spec['widgets']['output'];
        return elt[outputWidgetName](output);
	}
  }
  /**
   * Genome viewer. 
   */
  /*genomeViewer: function(elt, self) {
    var o = self.obj_info;
    return elt.kbaseGenomeView({'id': o['id'], 'ws': o['ws_id']});
  },*/
  /** 
   * Species tree viewer.
   */
  /*treeViewer: function(elt, self) {
    var o = self.obj_info;
    return elt.kbaseTree({'treeID': o['id'],
                          'workspaceID': o['ws_id'],
                           'height': '1000' // need for scroll
                         });
  }*/
};

// Widget
// -------

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
        
        /**
         * Initialize
         */
        init: function(options) {
            console.debug("kbaseNarrativeDataCell.init");
            this._super(options);
            this.obj_info = options.info;
            this.obj_info.bare_type = /[^-]*/.exec(this.obj_info.type);
            this.obj_info.simple_date = /[^+]*/.exec(this.obj_info.save_date);
            this.ip_cell = options.cell;
            this._initMethodStoreClient();
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
            var self = this;
            KBaseNarrativeViewer(this.obj_info, this.method_client, function(viewer) {
                // Prepend the short description if nec.
                if (viewer == null) {
                    viewer = KBaseNarrativeDefaultViewer;
                    viewer(self.$elem, self);
                } else {
                    // Run viewer at this point in the narrative
                    var $view = viewer(self.$elem, self);
                    var widget_title = $view.options.widget_title;
                    var landing_page_url_prefix = $view.options.landing_page_url_prefix;
                    var html = $(marked.parser(marked.lexer(
                            '"' + widget_title + '" ' + self.shortMarkdownDesc(self.obj_info, landing_page_url_prefix))));
                    html.find("a[href]").not('[href^="#"]').attr("target", "_blank");
                    self.$elem.before(html);
                }
                // Make sure that we have unselected the cell
                self.ip_cell.unselect();
            });
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



