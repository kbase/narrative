


/*
 *   Version 1 (path.js routing)
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


// Version 2 (angular routing)

$routeProvider
    .when('/workspace-browser', 
        {templateUrl: 'views/ws-browser.html',
         controller: WSBrowser})

    .when('/genomes/CDS/:id',
        {templateUrl: 'views/objects/genome.html',
         controller: GenomeDetail})
    .when('/genomes/:ws',
        {templateUrl: 'views/objects/genome.html',
         controller: GenomeDetail})
    .when('/genomes/:ws/:id',
        {templateUrl: 'views/objects/genome.html',
         controller: GenomeDetail})

    .when('/genes/CDS/:id',
        {templateUrl: 'views/objects/gene.html',
         controller: GeneDetail })
    .when('/genes/:ws/:id',
        {templateUrl: 'views/objects/gene.html',
         controller: GeneDetail })

    .when('/models',
        {templateUrl: 'views/object-list.html',
         controller: WSObjects})        
    .when('/models/:ws',
        {templateUrl: 'views/object-list.html',
         controller: WSObjects})
    .when('/models/:ws/:id', 
        {templateUrl: 'views/objects/model.html',
         controller: ModelDetail})
    .when('/cards/models/:ws/:id', 
        {templateUrl: 'views/objects/modelcards.html',
         controller: ModelDetailCards})

    .when('/media',
        {templateUrl: 'views/object-list.html',
         controller: WSObjects})
    .when('/media/:ws',
        {templateUrl: 'views/object-list.html',
         controller: WSObjects})
    .when('/media/:ws/:id',
        {templateUrl: 'views/objects/media.html',
         controller: MediaDetail})

    .when('/fbas/:ws', 
        {templateUrl: 'views/object-list.html',
         controller: WSObjects})
    .when('/fbas/:ws/:id',
        {templateUrl: 'views/objects/fba.html',
         controller: FBADetail})
    .when('/cards/fbas/:ws/:id',
        {templateUrl: 'views/objects/fbacards.html',
         controller: FBADetailCards})

    .when('/rxns', 
        {templateUrl: 'views/object-list.html',
         controller: WSObjects})
    .when('/rxns/:ids', 
        {templateUrl: 'views/objects/rxn.html',
         controller: RxnDetail}) 
    .when('/rxns/:ws/:ids', 
        {templateUrl: 'views/objects/coming-soon.html',
         controller: RxnDetail})

    .when('/cpds', 
        {templateUrl: 'views/object-list.html',
         controller: WSObjects})
    .when('/cpds/:ids', 
        {templateUrl: 'views/objects/cpd.html',
         controller: CpdDetail})           

    .when('/meme',
        {templateUrl: 'views/meme-list.html',
         controller: WSObjects})
    .when('/meme/:ws',
        {templateUrl: 'views/meme-list.html',
         controller: WSObjects})
    .when('/meme/:ws/:id',
        {templateUrl: 'views/objects/meme.html',
         controller: MemeDetail})

    .when('/spec/:kind/:id',
        {templateUrl: 'views/objects/spec.html',
         controller: SpecDetail})

    .when('/bambi/:ws/:id',
        {templateUrl: 'views/objects/bambi.html',
         controller: BambiDetail})
    
    .when('/iris', 
        {templateUrl: 'views/iris.html',
         controller: IRIS})   

    .when('/landing-pages-help',
        {templateUrl: 'views/landing-pages-help.html',
         controller: LPHelp})

    .when('/404',
        {templateUrl: 'views/404.html'})

    .when('/',
        {templateUrl: 'views/landing-pages-help.html',
         controller: LPHelp})


    .otherwise({redirectTo: '/404'})



