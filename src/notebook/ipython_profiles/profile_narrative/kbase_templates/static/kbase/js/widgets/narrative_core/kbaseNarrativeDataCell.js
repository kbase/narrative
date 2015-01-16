/**
 * Narrative data cell.
 *
 * Uses kbaseNarrativeViewers.js to "view" itself.
 *
 * @public
 */

// Viewer methods
// --------------

function KBaseNarrativeViewer(o) {
  var vnames = KBaseNarrativeViewerNames;
  var name = vnames.default;
  var key = o.bare_type;
  if (_.has(vnames, key)) {
    name = vnames[key];
  }
  return KBaseNarrativeViewers[name];
}

// Mapping from KBase types to viewer names.
// XXX: This could be configured from an external source.
var KBaseNarrativeViewerNames = {
  default: "genericViewer",
  "KBaseGenomes.Genome": "genomeViewer",
  "KBaseTrees.Tree": "treeViewer",
}

// Viewer functions.
var KBaseNarrativeViewers = {
  /**
   * Generic viewer.
   */
  genericViewer: function(elt, self) {
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
  },
  /**
   * Genome viewer. 
   */
  genomeViewer: function(elt, self) {
    var o = self.obj_info;
    return elt.kbaseGenomeView({'id': o['id'], 'ws': o['ws_id']});
  },
  /** 
   * Species tree viewer.
   */
  treeViewer: function(elt, self) {
    var o = self.obj_info;
    return elt.kbaseTree({'treeID': o['id'],
                          'workspaceID': o['ws_id'],
                           'height': '1000' // need for scroll
                         });
  }
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
            //this._initMethodStoreClient();
            return this.render(options.info);
        },

        _initMethodStoreClient: function() {
            if (this.method_client === null) {
              this.method_client = new NarrativeMethodStore(this._getMethodStoreURL());
            }
        },

        _getMethodStoreURL: function() { return window.kbconfig.urls.narrative_method_store },

        /**
         * Instantiate viewer widget for a data object.
         *
         * @param object_info (object) Object with info about data item
         * @return Whatever the 'viewer' function returns.
         */
        render: function() {
          var viewer = new KBaseNarrativeViewer(this.obj_info);
          // Run viewer at this point in the narrative
          var $view = viewer(this.$elem, this);
          // Prepend the short description if nec.
          if (viewer != KBaseNarrativeViewers.genericViewer) {
            var html = $(marked.parser(marked.lexer(
              this.shortMarkdownDesc(this.obj_info))));
            html.find("a[href]").not('[href^="#"]').attr("target", "_blank");
            this.$elem.before(html);
          }
          // Make sure that we have unselected the cell
          this.ip_cell.unselect();
          // Return the rendered widget
          return $view;
        },

        shortMarkdownDesc: function(o) {
          var link = "https://"; // force https
          if (window.location.hostname == '0.0.0.0' ||
              window.location.hostname == '127.0.0.1') {
            link += "narrative-dev.kbase.us"; // for testing
          }
          else {
            link += window.location.host;
          }
          link += "/functional-site/#/fbas/" + o.ws_name + "/" + o.name;
          return "[" + o.name + "](" + link + ")"  +
               " (" + o.bare_type + "<sub>v" + o.version + "</sub>)." +
               " Last saved: " + 
               "*" + o.saved_by + "*  " + o.simple_date;
        }

    })
})(jQuery);



