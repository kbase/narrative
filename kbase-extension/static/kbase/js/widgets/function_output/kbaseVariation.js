/**
 * Output widget for genome variation in Jbrowse 
 * @author  Priya Ranjan <pranjan77@gmail.com>
 * @public
 */

 define (
	[
		'kbwidget',
		'bootstrap',
		'jquery',
        'narrativeConfig',
		'kbaseAuthenticatedWidget'
	], function(
		KBWidget,
		bootstrap,
		$,
        Config,
		kbaseAuthenticatedWidget
	) {
    return KBWidget({
        name: "kbaseVariation",
        parent : kbaseAuthenticatedWidget,
        version: "0.0.1",
        ws_id: null,
        token: null,
        job_id: null,
        width: 1150,
        height: 1000,
        options: {
            workspaceID: null,
            variationID: null,
            variationObjVer: null,
        },
        loadingImage: Config.get('loading_gif'),
        wsUrl: Config.get('workspace'),
        timer: null,

        init: function(options) {
            this._super(options);
            return this;
        },
        render: function() {
            this.$elem.append("hello world"); 
            this.$elem.append(this.options.workspaceID); 
            this.$elem.append(this.options.variationID);

            //TODO: Figure out how to get variation_ref
            variation_ref = "51264/9/1"
            //TODO: Figure out how to use service-wizard url to get latest version of JbrowseServer dynamic service url
            jbrowse_dyn_url = "https://ci.kbase.us/dynserv/e4c6fabee3f35fb9e7e3b8496cb799119422246d.JbrowseServer"
            url = jbrowse_dyn_url + "/" + "jbrowse/" + variation_ref + "/index.html"  
            iframe_code = '<iframe  src="' + url + '" style="height:500px;width:100%;" allowfullscreen></iframe>'
            this.$elem.append(iframe_code)            
        },

        loggedInCallback: function(event, auth) {
            this.token = auth.token;
            this.render();
            return this;
        },

        loggedOutCallback: function(event, auth) {
            this.token = null;
            this.render();
            return this;
        }

    });
});
