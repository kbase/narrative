

define (
	[
		'kbwidget',
		'bootstrap',
		'jquery',
		'kbaseAuthenticatedWidget',
		'kbaseTabs',
		'kbaseHistogram',
		'kbase-client-api',
		'kbaseTable',
		'jquery-dataTables-bootstrap',
		'narrativeConfig',
		'bluebird',
		'kbase-generic-client-api',
		'kbaseTable',
	], function(
		KBWidget,
		bootstrap,
		$,
		kbaseAuthenticatedWidget,
		kbaseTabs,
		kbaseHistogram,
		kbase_client_api,
		kbaseTable,
		jquery_dataTables,
		Config,
		Promise,
		GenericClient,
		KBaseTable
	) {

    'use strict';

    return KBWidget({

	    name: "kbaseGenericSetViewer",
	    parent : kbaseAuthenticatedWidget,

	    methodMap : {
        "KBaseSets.DifferentialExpressionMatrixSet" : 'get_differential_expression_matrix_set_v1',
        "KBaseSets.FeatureSetSet"                   : 'get_feature_set_set_v1',
        "KBaseSets.ExpressionSet"                   : 'get_expression_set_v1',
        "KBaseSets.ReadsAlignmentSet"               : 'get_reads_alignment_set_v1',
        "KBaseSets.ReadsSet"                        : 'get_reads_set_v1',
        "KBaseSets.AssemblySet"                     : 'get_assembly_set_v1',
        "KBaseSets.GenomeSet"                       : 'get_genome_set_v1',
      },

        version: "1.0.0",

        init : function init(options) {
          this._super(options);

          var $self = this;
          if (options._obj_info) {
            $self.obj_info = options._obj_info;
            $self.obj_ref = $self.obj_info.ws_id + '/' +
                            $self.obj_info.id + '/' +
                            $self.obj_info.version;
            $self.link_ref = $self.obj_info.ws_id + '/' +
                             $self.obj_info.name + '/' +
                             $self.obj_info.version;
            //$self.update_overview_info_from_nar_info($self.obj_info);
          } else {
            $self.obj_ref = $self.options.wsId + '/' +
                            $self.options.objId;
            $self.link_ref = $self.obj_ref;
            $self.set_overview.name = $self.options.objId;
            //$self.set_overview.link_ref = $self.link_ref;
          }

          this.genericClient = new GenericClient(
                              Config.url('service_wizard'),
                              {'token': this.authToken()});

          var bare_type = this.options._obj_info.bare_type[0];
          var method = this.methodMap[bare_type];

          //this.setAPI[method]({ 'ref' : $self.obj_ref, include_item_info : 1 })
          this.genericClient.sync_call('SetAPI.' + method, [{ 'ref' : $self.obj_ref, include_item_info : 1 }])
            .then(function(results) {
              results = results[0].data;

              var $tableElem = $.jqElem('div');
              var $table = new KBaseTable($tableElem,
                {
                  structure : {
                    keys : ['Description', 'Items'],
                    rows : {
                      Description : results.description,
                      Items :
                        $.jqElem('ul')
                          .append(
                            results.items.map( function(i) {
                              return $.jqElem('li')
                                .append(
                                  $.jqElem('a')
                                    .append(i.info[1])
                                    .on('click', function(e) {
                                      alert("Will add in the viewer for this object...when it's available")
                                    })
                                )
                                .append(' [' + i.info[2] + ']')
                            })
                          )
                    }
                  }
                }
              );
              $self.$elem.empty();
              $self.$elem.append($tableElem);

            })
            .catch(function(e) {
              $self.$elem.empty();
              $self.$elem
                .addClass('alert alert-danger')
                .html("Could not load object : " + e.error.error.message);
            });
          ;

          this.$elem
            .append('Loading data...<br>&nbsp;please wait...<br>')
            .append(
                $.jqElem('div')
                    .attr('align', 'center')
                    .append($.jqElem('i').addClass('fa fa-spinner').addClass('fa fa-spin fa fa-4x'))
            )
        }

    });

} );
