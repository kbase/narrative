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
        'kbaseAuthenticatedWidget',
        'kb_common/jsonRpc/dynamicServiceClient'
    ], (
        KBWidget,
        bootstrap,
        $,
        Config,
        kbaseAuthenticatedWidget,
        DynamicServiceClient
) => {
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
        getLinks: function () {
           const client =  new DynamicServiceClient({
                module: 'JbrowseServer',
                url: Config.url('service_wizard'),
                token: this.token,
                version: 'dev'
            })
            return client.lookupModule()
                .spread((status) => {
                    return status.url;
                });
        },
        buildIframe: function(url){
            const variation_ref = this.options.upas.variationID
            this.$elem.append("<b>Genome browser view</b>")
            const jbrowse_url = [url, "jbrowse", variation_ref, "index.html"].join("/")
            const iframe_code = '<iframe  src="' + jbrowse_url + '" style="height:500px;width:100%;" allowfullscreen></iframe>'
            this.$elem.append(iframe_code)
        },
        render: function() {
            this.$elem.empty()
            this.getLinks()
                .then((url) => (
                 this.buildIframe(url)
               )
            )
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
