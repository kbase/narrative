

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
		'SetAPI-client-api',
		'bluebird'
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
		SetAPI_client_api,
		Promise
	) {

    'use strict';

    return KBWidget({

	    name: "kbaseGenericSetViewer",
	    parent : kbaseAuthenticatedWidget,

        version: "1.0.0",

        init : function init(options) {
          this._super(options);
          console.log("INIT WITH : ", options);

          /*var ws = new Workspace(Config.url('workspace'), {'token': this.authToken()});
          ws.get_objects([{ name : options.obj_ref, workspace : options.wsName }])
            .then( function (d) {
              console.log("NEED THE D : ", d);
              ws.get_objects([{ ref : d[0].data.items[0].ref }])
                .then( function (e) {
                  console.log("SUB DATA : ", e);
                });
            })
            .fail ( function (e) {
              console.log("BOOM : ", e);
            });
          */
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

          this.setAPI = new SetAPI(
                              Config.url('service_wizard'),
                              {'token': this.authToken()});
console.log("REF IS : ", $self.obj_ref);
          this.setAPI.get_reads_set_v1({ 'ref' : $self.obj_ref, include_item_info : 1 })
            .then(function(results) {
              console.log('set results! : ', results);
            })
            .fail(function(e) {
              console.log('set api failed with : ', e);
            });
          ;


          this.$elem.append("Generic set viewer!");
        }

    });

} );
