


/*
 *   URL router for maping urls to "views".
 */

function router() {
    // App routes
    /*
    Path.map("#/seq-search").to(function(){
        seq_search_view();
    }).enter(navEvent);
    */

    Path.map("#/workspace-browser").to(function(){
        workspace_view();
    }).enter(navEvent);

    // Data routes
    Path.map("#/genomes")
        .to(function() {
            genome_view();
        })
        .enter(navEvent)
        .exit(removeCards);

    Path.map("#/genomes/cs/:genome_id")
        .to(function(){ 
            genome_view({'genomeID': this.params['genome_id']});
        })
        .enter(navEvent)
        .exit(removeCards);

    Path.map("#/genomes/:ws_id")
        .to(function() {
            genome_view({'workspaceID': this.params['ws_id']});
        })
        .enter(navEvent)
        .exit(removeCards);

    Path.map("#/genomes/:ws_id/:genome_id")
        .to(function() {
            genome_view(
                {
                    'workspaceID': this.params['ws_id'],
                    'genomeID': this.params['genome_id']
                }
            );
        })
        .enter(navEvent)
        .exit(removeCards);

    Path.map("#/organisms").to(function(){ empty_page() });

    Path.map("#/models").to(function(){
        ws_model_view();
    }).enter(navEvent);

    Path.map("#/models/:ws_id").to(function(){
        ws_model_view(this.params['ws_id']);
    }).enter(navEvent);    

    Path.map("#/models/:ws_id/:id").to(function(){
        model_view(this.params['ws_id'], this.params['id']);
    }).enter(navEvent);

    Path.map("#/fbas").to(function(){ 
        ws_fba_view() ;
    }).enter(navEvent);

    Path.map("#/fbas/:ws_id").to(function(){ 
        ws_fba_view(this.params['ws_id']) ;
    }).enter(navEvent);    

    Path.map("#/fbas/:ws_id/:id").to(function(){ 
        fba_view(this.params['ws_id'], this.params['id']) 
    }).enter(navEvent);

    Path.map("#/rxns").to(function(){
        rxn_view();
    }).enter(navEvent);

    Path.map("#/rxns/:ws_id/:id").to(function(){ empty_page() });

    Path.map("#/cpds").to(function(){ 
        cpd_view();
    }).enter(navEvent);

    Path.map("#/cpds/:ws_id/:id").to(function(){ empty_page() });    

    Path.map("#/media").to(function(){ 
        ws_media_view();
    }).enter(navEvent);

    Path.map("#/media/:ws_id").to(function(){ 
        ws_media_view(this.params['ws_id']);
    }).enter(navEvent);

    Path.map("#/media/:ws_id/:id").to(function(){ 
        media_view(this.params['ws_id'], this.params['id']);
    }).enter(navEvent);


    // analysis Routes
    Path.map("#/run-fba/:ws_id/:id").to(function(){ 
        run_fba_view(this.params['ws_id'], this.params['id']);
    }).enter(navEvent);


    // help page route
    Path.map("#/data-view-api").to(function(){ 
        help_view();
    }).enter(navEvent);

    Path.rescue(function(){ 
        page_not_found();
    })

    Path.root("#/data-view-api");
    Path.listen();
}



