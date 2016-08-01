
define (
	[
		'kbwidget',
		'bootstrap',
		'jquery',
    'kbase-client-api',
		'jquery-dataTables',
		'kbaseAuthenticatedWidget',
		'kbaseTable'
	], function(
		KBWidget,
		bootstrap,
		$,
    kbase_client_api,
		jquery_dataTables,
		kbaseAuthenticatedWidget,
		kbaseTable
	) {
    'use strict';

    return KBWidget({
        name: "kbaseGenomeAnnotationAssembly",
        parent : kbaseAuthenticatedWidget,
        version: "1.0.0",
        options: {


        },

        init: function init(options) {
            this._super(options);

            if (this.options.wsNameOrId != undefined) {
              this.wsKey = this.options.wsNameOrId.match(/^\d+/)
                ? 'wsid'
                : 'workspace'
              ;
            }

            if (this.options.objNameOrId != undefined) {
              this.objKey = this.options.objNameOrId.match(/^\d+/)
                ? 'objid'
                : 'name'
              ;
            }


            var $self = this;

            var dictionary_params = {};
            dictionary_params[this.wsKey] = this.options.wsNameOrId;
            dictionary_params[this.objKey] = this.options.objNameOrId;

            $self.ws = new Workspace(window.kbconfig.urls.workspace, {token : this.authToken()});

            this.appendUI(this.$elem);

            //$self.ws.get_objects([dictionary_params]).then(function(data) {
            $self.ws.get_objects([dictionary_params])
              .then(function (data) {
                data = data[0].data;
                console.log("GOT ME DATA!", data);
              })
                .fail(function (d) {
                    $self.$elem.empty();
                    $self.$elem
                        .addClass('alert alert-danger')
                        .html("Could not load object : " + d.error.message);
                });


            return this;
        },

        appendUI: function appendUI($elem) {
          $elem.append("One day, there will be a widget here.")
        },

    });

});
