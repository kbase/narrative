/**
 * Output widget for visualization of genome annotation.
 * @public
 */

/*

Known issues/tasks:
1) resize window sets svg width to zero of contig browser of non-visible tabs, so they dissappear
2) we don't know the length of the contig when rendering the gene context browser, so scale goes
   beyond the actual contig
3) color the features based on type, other things?
4) adjust height based on number of tracks
5) show assembly info on overview tab

*/


define (
    [
        'kbwidget',
        'kbaseAuthenticatedWidget',
        'narrativeConfig',

        'jquery',
        'bluebird',

        'jquery-dataTables',
        'jquery-dataTables-bootstrap',

        'kbase-client-api',
        'kbaseTable',
        'kbaseTabs',
        'ContigBrowserPanel',
        'util/string',

        'kbase-generic-client-api',
        'GenomeAnnotationAPI-client-api',        
        'AssemblyAPI-client-api',        
        'TaxonAPI-client-api',
        'GenomeSearchUtil-client-api'

  ], function(
    KBWidget,
        kbaseAuthenticatedWidget,
        Config,

        $,
        Promise,

        jquery_dataTables,
        bootstrap,

        kbase_client_api,
        kbaseTable,
        kbaseTabs,
        ContigBrowserPanel,
        StringUtil,
        
        GenericClient,
        GenomeAnnotationAPI_client_api,
        AssemblyAPI_client_api,
        TaxonAPI_client_api,
        GenomeSearchUtil_client_api

    ) {
    return KBWidget({
        name: "kbaseGenomeView",
        parent : kbaseAuthenticatedWidget,
        version: "1.0.0",
        ws_id: null,
        ws_name: null,
        token: null,
        width: 1150,
        options: {
            ws_id: null,
            ws_name: null
        },
        loadingImage: Config.get('loading_gif'),
        wsUrl: Config.url('workspace'),
        timer: null,
        lastElemTabNum: 0,

        init: function(options) {
            this._super(options);

            var self = this;
            self.ws_name = options.ws_name;
            self.ws_id = options.ws_id;
            if (options.ws && options.id) {
                  self.ws_id = options.id;
                  self.ws_name = options.ws;
            }

            self.genome_ref = self.ws_name + '/' + self.ws_id;
            if(options._obj_info) {
                self.genome_info = options._obj_info;
                self.genome_ref = self.genome_info['ws_id'] + '/' + self.genome_info['id'] + '/' + self.genome_info['version'];
            }

            var token = null;
            if(self.auth()) {
                token = {'token': self.auth().token};
                self.token = token;
            }

            self.kbws = new Workspace(Config.url('workspace'), token);
            self.genomeAPI = new GenomeAnnotationAPI(Config.url('service_wizard'), token);
            self.assemblyAPI = new AssemblyAPI(Config.url('service_wizard'), token);

            
            self.genomeSearchAPI = new GenomeSearchUtil(Config.url('service_wizard'), token);

            self.genericClient = new GenericClient(Config.url('service_wizard'), token, null, false);
            self.genericClient.sync_call("ServiceWizard.get_service_status",
                        [{'module_name': "GenomeSearchUtil", 'version': 'release'}], 
                    function(status){
                        self.genomeSearchAPI = new GenomeSearchUtil(status[0].url, token, null, null, null, null, false);
                    },
                    function(error){console.error(error);});

            return this;
        },


        tabData : function(genome) {
            var names = ['Overview', 'Browse Features', 'Browse Contigs'];
            var ids = ['overview', 'browse_features', 'browse_contigs'];
            return {
                names : names,
                ids : ids
            };
        },

        link_to_ontology : function(id) {
            var goUrl = 'http://amigo.geneontology.org/amigo/term/';
            var tokens = id.split(':');
            if(tokens.length > 1) {
                if(tokens[0]==='GO') {
                    return $('<a href="'+goUrl+id+'" target="_blank">')
                                .append(id);
                }
            }
            return id;
        },

        /*
            input =>
            {
                genomeSearchAPI: genomeSearchAPI Client
                $div:  JQuery div that I can render on
                idClick: callback when a feature is clicked
                contigClick: callback when a contig id is clicked

            }
        */
        buildGeneSearchView: function(params) {
            var self = this;

            var BIG_COL_WIDTH = '25%';

            // parse parameters
            var $div = params['$div'];
            if(!$div.is(':empty')) {
                return; // if it has content, then do not rerender
            }
            var genomeSearchAPI = params['genomeSearchAPI'];
            var genome_ref = params['ref'];

            var idClick = null;
            if(params['idClick']) { idClick = params['idClick']; }
            var contigClick = null;
            if(params['contigClick']) { contigClick = params['contigClick']; }

            // setup some defaults and variables (should be moved to class variables)
            var limit = 10;
            var start = 0;
            var sort_by = ['feature_id', 1];

            var n_results = 0;

            function numberWithCommas(x) {
                return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            }

            // setup the main search button and the results panel and layout
            var $input = $('<input type="text" class="form-control" placeholder="Search Features">');
            $input.prop('disabled', true);

            var isLastQuery = function(result) {
                if(start !== result['start']) {
                    return false;
                }
                if($input.val() !== result['query']) {
                    return false;
                }
                return true;
            };
            
            var $resultDiv = $('<div>');
            var $noResultsDiv = $('<div>').append('<center>No matching features found.</center>').hide();
            var $loadingDiv = $('<div>');
            var $errorDiv = $('<div>');
            var $pagenateDiv = $('<div>').css('text-align','left');
            var $resultsInfoDiv = $('<div>');

            var $container = $('<div>').addClass('container-fluid').css({'margin':'15px 0px', 'max-width':'100%'});
            $div.append($container);
            var $headerRow = $('<div>').addClass('row')
                                .append($('<div>').addClass('col-md-4').append($pagenateDiv) )
                                .append($('<div>').addClass('col-md-4').append($loadingDiv))
                                .append($('<div>').addClass('col-md-4').append($input));
            var $resultsRow = $('<div>').addClass('row').css({'margin-top':'15px'})
                                .append($('<div>').addClass('col-md-12').append($resultDiv));
            var $noResultsRow = $('<div>').addClass('row')
                                .append($('<div>').addClass('col-md-12').append($noResultsDiv));
            var $errorRow = $('<div>').addClass('row')
                                .append($('<div>').addClass('col-md-8').append($errorDiv));
            var $infoRow = $('<div>').addClass('row')
                                .append($('<div>').addClass('col-md-4').append($resultsInfoDiv))
                                .append($('<div>').addClass('col-md-8'));
            $container
                .append($headerRow)
                .append($resultsRow)
                .append($errorDiv)
                .append($noResultsRow)
                .append($infoRow);



            var $pageBack = $('<button class="btn btn-default">').append('<i class="fa fa-caret-left" aria-hidden="true">');
            var $pageForward = $('<button class="btn btn-default">').append('<i class="fa fa-caret-right" aria-hidden="true">');

            $pagenateDiv.append($pageBack);
            $pagenateDiv.append($pageForward);
            $pagenateDiv.hide();


            var clearInfo= function() {
                $resultsInfoDiv.empty();
                $pagenateDiv.hide();
            };


            // define the functions that do everything
            var setToLoad = function($panel) {
                //clearInfo();
                $panel.empty();
                var $loadingDiv = $('<div>').attr('align', 'left').append($('<i class="fa fa-spinner fa-spin fa-2x">'));
                $panel.append($loadingDiv);
                window.setTimeout(function() {
                        $loadingDiv.append('&nbsp; Building cache...');
                        window.setTimeout(function() {
                            $loadingDiv.append(' almost there...')
                        }, 25000);
                    } , 2500);
            };

            var search = function(query, start, limit, sort_by) {
                $errorDiv.empty();
                var local_sort_by = [];
                if(sort_by[0]==='start') {
                    local_sort_by.push(['contig_id',1]);
                }
                local_sort_by.push(sort_by);
                return genomeSearchAPI.search({
                                            ref: genome_ref,
                                            query: query,
                                            sort_by: local_sort_by,
                                            start: start,
                                            limit: limit
                                        })
                                        .then(function(d) {
                                            console.log('genomeSearchAPI.search()',d);
                                            return d;
                                        })
                                        .fail(function(e) {
                                            console.error(e);
                                            $loadingDiv.empty();
                                            var errorMssg = '';
                                            if(e['error']) {
                                                errorMssg = JSON.stringify(e['error']);
                                                if(e['error']['message']){
                                                    errorMssg = e['error']['message'];
                                                    if(e['error']['error']){
                                                        errorMssg += '<br><b>Trace</b>:' + e['error']['error'];
                                                    }
                                                } else {
                                                    errorMssg = JSON.stringify(e['error']);
                                                }
                                            } else { e['error']['message']; }
                                            $errorDiv.append($('<div>').addClass('alert alert-danger').append(errorMssg));
                                        });
            };


            var showPaginate = function() {
                $pagenateDiv.show();
            };

            var showViewInfo = function(start, num_showing, num_found) {
                $resultsInfoDiv.empty();
                $resultsInfoDiv.append('Showing '+(start+1) + ' to ' + (start+num_showing)+' of '+num_found);
            };
            var showNoResultsView = function() {
                $noResultsDiv.show();
                $resultsInfoDiv.empty();
                $pagenateDiv.hide();
            }

            var buildRow = function(rowData) {
                var $tr = $('<tr>');
                var hasFunc = false;
                var hasOntology = false;
                var hasAlias = false;

                if(idClick) {
                    var getCallback = function(rowData) { return function() {idClick(rowData);}};
                    $tr.append($('<td>').append(
                        $('<a>').css('cursor','pointer').append(rowData['feature_id'])
                            .on('click',getCallback(rowData)))
                    );
                } else {
                    $tr.append($('<td>').append($('<div>').css('word-break','break-all').append(rowData['feature_id'])));
                }
                $tr.append($('<td>').append(rowData['feature_type']));
                $tr.append($('<td>').append(rowData['function']));
                if(rowData['function']) { hasFunc = true; }

                var $td = $('<td>');
                if(rowData['ontology_terms']) {
                    var o_terms = rowData['ontology_terms'];
                    var $elem = $td;
                    if(Object.keys(rowData['ontology_terms']).length>2) {
                        $elem = $('<div>').css({'resize':'vertical', 'overflow':'auto', 'height':'3em'});
                        $td.append($elem);
                    }
                    var isFirst = true;
                    for (var term in o_terms) {
                        if(isFirst) isFirst=false;
                        else $elem.append('<br>');
                        if (o_terms.hasOwnProperty(term)) {
                            $elem.append(self.link_to_ontology(term)).append('- ' + o_terms[term]);
                            hasOntology = true;
                        }
                    }
                } 
                $tr.append($td);

                var $td = $('<td>');
                if(rowData['aliases']) {
                    var aliases = rowData['aliases'];
                    var $elem = $td;
                    if(Object.keys(rowData['aliases']).length>4) {
                        $elem = $('<div>').css({'resize':'vertical', 'overflow':'auto', 'height':'3em'});
                        $td.append($elem);
                    }
                    var isFirst = true;
                    for (var alias in aliases) {
                        if(isFirst) isFirst=false;
                        else $elem.append(', ');
                        if (aliases.hasOwnProperty(alias)) {
                            $elem.append(alias);
                            hasAlias = true;
                        }
                    }
                } 
                $tr.append($td);

                if(rowData['global_location']['contig_id']) {
                    var loc = rowData['global_location'];
                    $tr.append($('<td>').append(numberWithCommas(loc['start'])));
                    $tr.append($('<td>').append(loc['strand']));
                    $tr.append($('<td>').append(numberWithCommas(loc['length'])));
                    if(contigClick) {
                        var getCallback = function(rowData) { return function() {contigClick(loc['contig_id']);}};
                        $tr.append($('<td>').append(
                            $('<div>').css({'word-break':'break-all'}).append(
                                $('<a>').css('cursor','pointer').append(loc['contig_id'])
                                    .on('click',getCallback(loc['contig_id'])))));
                    } else {
                        $tr.append($('<td>').append($('<div>').css('word-break','break-all').append(loc['contig_id'])));
                    }
                } else {
                    $tr.append($('<td>')).append($('<td>')).append($('<td>')).append($('<td>'));
                }

                return {
                    $tr:$tr,
                    hasFunc: hasFunc,
                    hasOntology: hasOntology,
                    hasAlias: hasAlias
                };
            };

            var renderResult = function($table, results) {
                $table.find("tr:gt(0)").remove();
                $loadingDiv.empty();
                $noResultsDiv.hide();
                clearInfo();

                var features = results['features']
                if(features.length>0) {
                    var hasFunc = false;
                    var hasOntology = false;
                    var hasAlias = false;
                    for(var k=0; k<features.length; k++) {
                        var row = buildRow(features[k]);
                        $table.append(row.$tr);
                        if(row.hasFunc) { hasFunc = true; }
                        if(row.hasOntology) { hasOntology = true; }
                        if(row.hasAlias) { hasAlias = true; }
                    }
                    n_results = results['num_found'];
                    showViewInfo(results['start'], features.length, results['num_found']);
                    showPaginate(results['num_found']);
                    console.log('here');
                    if(hasFunc) {
                        $table.find('.feature-tbl-function').css('width',BIG_COL_WIDTH);
                    } else {
                        $table.find('.feature-tbl-function').css('width','1%');
                    }
                    if(hasOntology) {
                        $table.find('.feature-tbl-ontology_terms').css('width',BIG_COL_WIDTH);
                    } else {
                        $table.find('.feature-tbl-ontology_terms').css('width','1%');
                    }
                    if(hasAlias) {
                        $table.find('.feature-tbl-aliases').css('width',BIG_COL_WIDTH);
                    } else {
                        $table.find('.feature-tbl-aliases').css('width','1%');
                    }

                } else {
                    showNoResultsView();
                }
            };

            // Setup the actual table
            var $table = $('<table>')
                            .addClass('table table-striped table-bordered table-hover')
                            .css({'margin-left':'auto', 'margin-right':'auto'})
            $resultDiv.append($table);

            
            var buildColumnHeader = function(name, id, click_event) {
                var $sortIcon = $('<i>').css('margin-left','8px');
                var $th = $('<th>')
                            .append('<b>'+name+'</b>')
                            .append($sortIcon);
                if(click_event) {
                    $th
                        .css('cursor','pointer')
                        .on('click', function() {
                            click_event(id, $sortIcon)
                        });
                }
                return {
                    id: id,
                    name: name,
                    $th: $th,
                    $sortIcon: $sortIcon
                };
            };

            var buildTableHeader = function() {
                var inFlight = false;

                var $colgroup = $('<colgroup>');

                var $tr = $('<tr>');
                var ASC=0; var DESC=1; var ID=0; var DIR=1;
                var cols = {};
                var sortEvent = function(id, $sortIcon) {
                    if(inFlight) { return; } // skip if a sort call is already running
                    if(sort_by[ID] == id) {
                        if(sort_by[DIR] === DESC) {
                            sort_by[DIR] = ASC;
                            $sortIcon.removeClass();
                            $sortIcon.addClass('fa fa-sort-asc');
                        } else {
                            sort_by[DIR] = DESC;
                            $sortIcon.removeClass();
                            $sortIcon.addClass('fa fa-sort-desc');
                        }
                    } else {
                        cols[sort_by[ID]].$sortIcon.removeClass();
                        sort_by[ID] = id;
                        sort_by[DIR] = DESC;
                        $sortIcon.addClass('fa fa-sort-desc');
                    }

                    setToLoad($loadingDiv);
                    inFlight=true;
                    start=0;
                    search($input.val(), start, limit, sort_by)
                        .then(function(result) {
                                if(isLastQuery(result)) { renderResult($table, result); }
                                inFlight=false;
                                start=0;
                            })
                        .fail(function(){ inFlight=false; });
                };

                var buildSingleColHeader = function(key, title, width, showSortedIcon, sortEvent, target) {
                    target.$colgroup.append($('<col span=1>').addClass('feature-tbl-'+key).css('width',width))
                    var h = buildColumnHeader(title, key, sortEvent);
                    target.$tr.append(h.$th);
                    if(showSortedIcon) {
                        h.$sortIcon.addClass('fa fa-sort-desc');
                    }
                    target.cols[h.id] = h;
                }

                var target = {
                    $colgroup: $colgroup,
                    $tr: $tr,
                    cols: cols
                };

                buildSingleColHeader('feature_id', 'Feature&nbsp;ID', '1%', true, sortEvent, target);
                buildSingleColHeader('feature_type', 'Type', '1%', false, sortEvent, target);
                buildSingleColHeader('function', 'Function', BIG_COL_WIDTH, false, sortEvent, target);
                buildSingleColHeader('ontology_terms', 'Ontology', BIG_COL_WIDTH, false, null, target);
                buildSingleColHeader('aliases', 'Aliases', BIG_COL_WIDTH, false, null, target);
                buildSingleColHeader('start', 'Start', '1%', false, sortEvent, target);
                buildSingleColHeader('strand', 'Strand', '1%', false, sortEvent, target);
                buildSingleColHeader('length', 'Length', '1%', false, sortEvent, target);
                buildSingleColHeader('contig_id', 'Contig', '5%', true, sortEvent, target);

                return { $colgroup:$colgroup, $theader:$tr };
            }
            
            var headers = buildTableHeader()
            $table.append(headers.$colgroup);
            $table.append(headers.$theader);

           
            // Ok, do stuff.  First show the loading icon
            setToLoad($loadingDiv);

            // Perform the first search
            search('', start, limit, sort_by).then(
                    function(results) {
                        $input.prop('disabled', false);
                        renderResult($table, results);
                    });



            $pageBack.on('click',function () {
                if(start===0) return;
                if((start-limit)<0) {
                    start = 0;
                } else {
                    start = start-limit;
                }
                setToLoad($loadingDiv);
                search($input.val(),start, limit, sort_by)
                        .then(function(result) {
                                if(isLastQuery(result)) { renderResult($table, result); }
                            });
            });
            $pageForward.on('click',function () {
                if(start+limit>n_results) {
                    return;
                }
                start = start+limit;
                setToLoad($loadingDiv);
                search($input.val(),start, limit, sort_by)
                        .then(function(result) {
                                if(isLastQuery(result)) { renderResult($table, result); }
                            });
            });


            //put in a slight delay so on rapid typing we don't make a flood of calls
            var fetchTimeout = null;
            var lastQuery = null;
            $input.on('input', function() {
                // if we were waiting on other input, cancel that request
                if(fetchTimeout) { window.clearTimeout(fetchTimeout); }
                fetchTimeout = window.setTimeout(function() {
                    fetchTimeout = null;
                    setToLoad($loadingDiv);
                    start=0;
                    search($input.val(),start, limit, sort_by)
                        .then(function(result) {
                                if(isLastQuery(result)) { renderResult($table, result); }
                            });
                }, 300)
            });

        },



         /*
            input =>
            {
                genomeSearchAPI: genomeSearchAPI Client
                $div:  JQuery div that I can render on
                contigClick: callback when a contig id is clicked

            }
        */
        buildContigSearchView: function(params) {

            // parse parameters
            var $div = params['$div'];
            if(!$div.is(':empty')) {
                return; // if it has content, then do not rerender
            }
            var genomeSearchAPI = params['genomeSearchAPI'];
            var genome_ref = params['ref'];

            var contigClick = null;
            if(params['contigClick']) { contigClick = params['contigClick']; }

            // setup some defaults and variables (should be moved to class variables)
            var limit = 10;
            var start = 0;
            var sort_by = ['contig_id', 1];

            var n_results = 0;

            function numberWithCommas(x) {
                return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            }


            // setup the main search button and the results panel and layout
            var $input = $('<input type="text" class="form-control" placeholder="Search Contigs">');
            $input.prop('disabled', true);

            var isLastQuery = function(result) {
                if(start !== result['start']) {
                    return false;
                }
                if($input.val() !== result['query']) {
                    return false;
                }
                return true;
            };
            
            var $resultDiv = $('<div>');
            var $noResultsDiv = $('<div>').append('<center>No matching contigs found.</center>').hide();
            var $loadingDiv = $('<div>');
            var $errorDiv = $('<div>');
            var $pagenateDiv = $('<div>').css('text-align','left');
            var $resultsInfoDiv = $('<div>');

            var $container = $('<div>').addClass('container-fluid').css({'margin':'15px 0px', 'max-width':'100%'});
            $div.append($container);
            var $headerRow = $('<div>').addClass('row')
                                .append($('<div>').addClass('col-md-4').append($pagenateDiv) )
                                .append($('<div>').addClass('col-md-4').append($loadingDiv))
                                .append($('<div>').addClass('col-md-4').append($input));
            var $resultsRow = $('<div>').addClass('row').css({'margin-top':'15px'})
                                .append($('<div>').addClass('col-md-12').append($resultDiv));
            var $noResultsRow = $('<div>').addClass('row')
                                .append($('<div>').addClass('col-md-12').append($noResultsDiv));
            var $errorRow = $('<div>').addClass('row')
                                .append($('<div>').addClass('col-md-8').append($errorDiv));
            var $infoRow = $('<div>').addClass('row')
                                .append($('<div>').addClass('col-md-4').append($resultsInfoDiv))
                                .append($('<div>').addClass('col-md-8'));
            $container
                .append($headerRow)
                .append($resultsRow)
                .append($errorDiv)
                .append($noResultsRow)
                .append($infoRow);



            var $pageBack = $('<button class="btn btn-default">').append('<i class="fa fa-caret-left" aria-hidden="true">');
            var $pageForward = $('<button class="btn btn-default">').append('<i class="fa fa-caret-right" aria-hidden="true">');

            $pagenateDiv.append($pageBack);
            $pagenateDiv.append($pageForward);
            $pagenateDiv.hide();


            var clearInfo= function() {
                $resultsInfoDiv.empty();
                $pagenateDiv.hide();
            };


            // define the functions that do everything
            var setToLoad = function($panel) {
                //clearInfo();
                $panel.empty();
                var $loadingDiv = $('<div>').attr('align', 'left').append($('<i class="fa fa-spinner fa-spin fa-2x">'));
                $panel.append($loadingDiv);
                window.setTimeout(function() {
                        $loadingDiv.append('&nbsp; Building cache...');
                        window.setTimeout(function() {
                            $loadingDiv.append(' almost there...')
                        }, 25000);
                    } , 2500);
            };

            var search_contigs = function(query, start, limit, sort_by) {
                $errorDiv.empty();
                return genomeSearchAPI.search_contigs({
                                            ref: genome_ref,
                                            query: query,
                                            sort_by: [sort_by],
                                            start: start,
                                            limit: limit
                                        })
                                        .then(function(d) {
                                            console.log('genomeSearchAPI.search_contigs()',d);
                                            return d;
                                        })
                                        .fail(function(e) {
                                            console.error(e);
                                            $loadingDiv.empty();
                                            var errorMssg = '';
                                            if(e['error']) {
                                                errorMssg = JSON.stringify(e['error']);
                                                if(e['error']['message']){
                                                    errorMssg = e['error']['message'];
                                                    if(e['error']['error']){
                                                        errorMssg += '<br><b>Trace</b>:' + e['error']['error'];
                                                    }
                                                } else {
                                                    errorMssg = JSON.stringify(e['error']);
                                                }
                                            } else { e['error']['message']; }
                                            $errorDiv.append($('<div>').addClass('alert alert-danger').append(errorMssg));
                                        });
            };


            var showPaginate = function() {
                $pagenateDiv.show();
            };

            var showViewInfo = function(start, num_showing, num_found) {
                $resultsInfoDiv.empty();
                $resultsInfoDiv.append('Showing '+(start+1) + ' to ' + (start+num_showing)+' of '+num_found);
            };
            var showNoResultsView = function() {
                $noResultsDiv.show();
                $resultsInfoDiv.empty();
                $pagenateDiv.hide();
            }

            var buildRow = function(rowData) {
                var $tr = $('<tr>');
                if(contigClick) {
                    var getCallback = function(rowData) { return function() { contigClick(rowData['contig_id']); }};
                    $tr.append($('<td>').append(
                        $('<a>').css('cursor','pointer').append(rowData['contig_id'])
                            .on('click',getCallback(rowData)))
                    );
                } else {
                    $tr.append($('<td>').append(rowData['contig_id']));
                }
                $tr.append($('<td>').append(numberWithCommas(rowData['length'])));
                $tr.append($('<td>').append(numberWithCommas(rowData['feature_count'])));

                return $tr;
            };

            var renderResult = function($table, results) {
                $table.find("tr:gt(0)").remove();
                $loadingDiv.empty();
                $noResultsDiv.hide();
                clearInfo();

                var contigs = results['contigs'];
                if(contigs.length>0) {
                    for(var k=0; k<contigs.length; k++) {
                        $table.append(buildRow(contigs[k]));
                    }
                    n_results = results['num_found'];
                    showViewInfo(results['start'], contigs.length, results['num_found']);
                    showPaginate(results['num_found']);
                } else {
                    showNoResultsView();
                }
            };

            // Setup the actual table
            var $table = $('<table>')
                            .addClass('table table-striped table-bordered table-hover')
                            .css({'margin-left':'auto', 'margin-right':'auto'})
            $resultDiv.append($table);

            
            var buildColumnHeader = function(name, id, click_event) {
                var $sortIcon = $('<i>').css('margin-left','8px');
                var $th = $('<th>')
                            .append('<b>'+name+'</b>')
                            .append($sortIcon);
                if(click_event) {
                    $th
                        .css('cursor','pointer')
                        .on('click', function() {
                            click_event(id, $sortIcon)
                        });
                }
                return {
                    id: id,
                    name: name,
                    $th: $th,
                    $sortIcon: $sortIcon
                };
            };

            var buildTableHeader = function() {
                var inFlight = false;

                var $colgroup = $('<colgroup>');

                var $tr = $('<tr>');
                var ASC=0; var DESC=1; var ID=0; var DIR=1;
                var cols = {};
                var sortEvent = function(id, $sortIcon) {
                    if(inFlight) { return; } // skip if a sort call is already running
                    if(sort_by[ID] == id) {
                        if(sort_by[DIR] === DESC) {
                            sort_by[DIR] = ASC;
                            $sortIcon.removeClass();
                            $sortIcon.addClass('fa fa-sort-asc');
                        } else {
                            sort_by[DIR] = DESC;
                            $sortIcon.removeClass();
                            $sortIcon.addClass('fa fa-sort-desc');
                        }
                    } else {
                        cols[sort_by[ID]].$sortIcon.removeClass();
                        sort_by[ID] = id;
                        sort_by[DIR] = DESC;
                        $sortIcon.addClass('fa fa-sort-desc');
                    }

                    setToLoad($loadingDiv);
                    inFlight=true;
                    start=0;
                    search_contigs($input.val(), start, limit, sort_by)
                        .then(function(result) {
                                if(isLastQuery(result)) { renderResult($table, result); }
                                inFlight=false;
                                start=0;
                            })
                        .fail(function(){ inFlight=false; });
                };

                $colgroup.append($('<col span=1>').css('width','20%'))
                var h = buildColumnHeader('Contig ID', 'contig_id', sortEvent);
                $tr.append(h.$th);
                h.$sortIcon.addClass('fa fa-sort-desc');
                cols[h.id] = h;

                $colgroup.append($('<col span=1>').css('width','5%'))
                var h = buildColumnHeader('Length', 'length', sortEvent);
                $tr.append(h.$th);
                cols[h.id] = h;


                $colgroup.append($('<col span=1>').css('width','20%'))
                var h = buildColumnHeader('Feature Count', 'feature_count', sortEvent);
                $tr.append(h.$th);
                cols[h.id] = h;

                return { $colgroup:$colgroup, $theader:$tr };
            }
            
            var headers = buildTableHeader()
            $table.append(headers.$colgroup);
            $table.append(headers.$theader);

           
            // Ok, do stuff.  First show the loading icon
            setToLoad($loadingDiv);

            // Perform the first search
            search_contigs('', start, limit, sort_by).then(
                    function(results) {
                        $input.prop('disabled', false);
                        renderResult($table, results);
                    });



            $pageBack.on('click',function () {
                if(start===0) return;
                if((start-limit)<0) {
                    start = 0;
                } else {
                    start = start-limit;
                }
                setToLoad($loadingDiv);
                search_contigs($input.val(),start, limit, sort_by)
                        .then(function(result) {
                                if(isLastQuery(result)) { renderResult($table, result); }
                            });
            });
            $pageForward.on('click',function () {
                if(start+limit>n_results) {
                    return;
                }
                start = start+limit;
                setToLoad($loadingDiv);
                search_contigs($input.val(),start, limit, sort_by)
                        .then(function(result) {
                                if(isLastQuery(result)) { renderResult($table, result); }
                            });
            });


            //put in a slight delay so on rapid typing we don't make a flood of calls
            var fetchTimeout = null;
            var lastQuery = null;
            $input.on('input', function() {
                // if we were waiting on other input, cancel that request
                if(fetchTimeout) { window.clearTimeout(fetchTimeout); }
                fetchTimeout = window.setTimeout(function() {
                    fetchTimeout = null;
                    setToLoad($loadingDiv);
                    start=0;
                    search_contigs($input.val(),start, limit, sort_by)
                        .then(function(result) {
                                if(isLastQuery(result)) { renderResult($table, result); }
                            });
                }, 300)
            });

        },




        render: function() {
            var self = this;
            var pref = StringUtil.uuid();

            var container = this.$elem;
            if (self.token == null) {
                container.empty();
                container.append("<div>[Error] You're not logged in</div>");
                return;
            }

            function numberWithCommas(x) {
                return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            }

            var ready = function(genomeData) {
                    var gnm = genomeData;

                    container.empty();
                    var $tabPane = $('<div id="'+pref+'tab-content">');
                    container.append($tabPane);
                    var tabObj = new kbaseTabs($tabPane, {canDelete : true, tabs : []});

                    var tabData = self.tabData(gnm);
                    var tabNames = tabData.names;
                    var tabIds = tabData.ids;

                    for (var i=0; i<tabIds.length; i++) {
                      var tabDiv = $('<div id="'+pref+tabIds[i]+'"> ');
                      tabObj.addTab({tab: tabNames[i], content: tabDiv, canDelete : false, show: (i == 0)});
                    }

                    ////////////////////////////// Overview Tab //////////////////////////////
                    var $overviewPanel = $('#'+pref+'overview');
                    var $overviewTable = $('<table>')
                                            .addClass('table table-striped table-bordered table-hover')
                                            .css({'margin-left':'auto', 'margin-right':'auto'})
                                            .css({'word-wrap':'break-word', 'table-layout':'fixed'})
                                            .append($('<colgroup>')
                                                        .append($('<col span="1" style="width: 25%;">')));

                    var $tableDiv = $('<div>').addClass('col-md-8').append($overviewTable);
                    var $taxonomyDiv = $('<div>').addClass('col-md-4');
                    var $layout = $('<div>').addClass('row')
                                                    .append($tableDiv)
                                                    .append($taxonomyDiv);

                    $overviewPanel.append($('<div>').css('margin-top','15px').append($layout));


                    var id = '<a href="/#dataview/'+gnm.ref+'" target="_blank">' + gnm.ws_obj_name + '</a>'

                    var scientific_name = gnm.scientific_name
                    var domain = gnm.domain;
                    var genetic_code = gnm.genetic_code;
                    var source = gnm.source;
                    var source_id = gnm.source_id;

                    var taxonomy = $('<td>');
                    var taxLevels = gnm.taxonomy.split(';');
                    for(var t=0; t<taxLevels.length; t++) {
                        for(var space=0; space<t; space++) {
                            if(space===0) { taxonomy.append('<br>'); }
                            taxonomy.append('&nbsp;&nbsp;');
                        }
                        taxonomy.append(taxLevels[t]);
                    }
                    if(taxonomy.html()==='') {
                        taxonomy.empty().append('None available.');
                    }
                    $taxonomyDiv.append($('<table>').addClass('table table-striped table-bordered table-hover')
                                            .append($('<tr>').append($('<td>').append('<b>Taxonomy</b>')))
                                            .append($('<tr>').append(taxonomy)));

                    var n_features = gnm.n_features;
                    if(n_features) {
                        n_features = numberWithCommas(n_features);
                    }

                    var overviewLabels = [
                            'KBase Object Name',
                            'Scientific Name',
                            'Domain',
                            'Genetic Code',
                            'Source',
                            'Source ID',
                            'Number of Features'
                        ];

                    var overviewData = [
                            id,
                            scientific_name,
                            domain,
                            genetic_code,
                            source,
                            source_id,
                            n_features
                        ];

                    for (var i=0; i<overviewData.length; i++) {
                        $overviewTable.append(
                            $('<tr>')
                                .append($('<td>').append($('<b>').append(overviewLabels[i])))
                                .append($('<td>').append(overviewData[i])));
                    }

                    var liElems = $tabPane.find('li');
                    for (var liElemPos = 0; liElemPos < liElems.length; liElemPos++) {
                        var liElem = $(liElems.get(liElemPos));
                        var aElem = liElem.find('a');
                        if (aElem.length != 1)
                            continue;
                        var dataTab = aElem.attr('data-tab');
                        var genome_ref = self.genome_ref;
                        if (dataTab === 'Browse Features' ) {
                            aElem.on('click', function() {
                                self.buildGeneSearchView({
                                    $div: $('#'+pref+'browse_features'),
                                    genomeSearchAPI: self.genomeSearchAPI,
                                    ref: genome_ref,
                                    idClick: function(featureData) {
                                                self.showFeatureTab(genome_ref, featureData, pref, tabObj);
                                            },
                                    contigClick: function(contigId) {
                                                self.showContigTab(genome_ref, contigId, pref, tabObj);
                                            }
                                })
                            });
                        } else if (dataTab === 'Browse Contigs' ) {
                            aElem.on('click', function() {
                                self.buildContigSearchView({
                                    $div: $('#'+pref+'browse_contigs'),
                                    genomeSearchAPI: self.genomeSearchAPI,
                                    ref: genome_ref,
                                    contigClick: function(contigId) {
                                                self.showContigTab(genome_ref, contigId, pref, tabObj);
                                            }
                                })
                            });
                        }
                    }


            };

            container.empty();
            container.append($('<div>').attr('align', 'center').append($('<i class="fa fa-spinner fa-spin fa-2x">')));


            var genome_ref = self.genome_ref;



            if(self.genome_info) {
                ready(self.normalizeGenomeDataFromNarrative(self.genome_info, genome_ref, ready));
            } else {
                // get info from metadata
                self.genomeAPI
                        .get_genome_v1({ 
                            genomes: [{
                                ref: self.genome_ref
                            }],
                            'no_data':1
                        })
                        .then(function(data) {
                            console.log('genomeAPI.get_genome_v1(ref='+genome_ref+')',data['genomes'][0]);
                            ready(self.normalizeGenomeDataFromQuery(data['genomes'][0], genome_ref, ready));
                        })
                        .fail(function(e) {
                            console.error(e);
                            var errorMssg = '';
                            if(e['error']) {
                                errorMssg = JSON.stringify(e['error']);
                                if(e['error']['message']){
                                    errorMssg = e['error']['message'];
                                    if(e['error']['error']){
                                        errorMssg += '<br><b>Trace</b>:' + e['error']['error'];
                                    }
                                } else {
                                    errorMssg = JSON.stringify(e['error']);
                                }
                            }
                            container.empty();
                            container.append($('<div>').addClass('alert alert-danger').append(errorMssg));
                        });
            }

            return this;
        },


        normalizeGenomeDataFromNarrative: function(genome_info, genome_ref, noDataCallback) {
            var self = this;
            var genomeData = self.normalizeGenomeMetadata(genome_info['meta'], genome_ref, noDataCallback);
            genomeData['ws_obj_name'] = genome_info['name'];
            genomeData['version'] = genome_info['version'];
            genomeData['ref'] = genome_info['ws_id'] + '/' + genome_info['name'] + '/' + genome_info['version'];
            return genomeData;
        },

        normalizeGenomeDataFromQuery: function(wsReturnedData, genome_ref, noDataCallback) {
            var self = this;
            var info = wsReturnedData['info'];
            var metadata = info[10];
            var genomeData = self.normalizeGenomeMetadata(metadata, genome_ref, noDataCallback);
            genomeData['ws_obj_name'] = info[1];
            genomeData['version'] = info[4];
            genomeData['ref'] = info[6] + '/' + info[1] + '/' + info[4];
            return genomeData;
        },

        normalizeGenomeMetadata: function(metadata, genome_ref, noDataCallback) {
            var self = this;
            var genomeData = {
                scientific_name: '',
                domain: '',
                genetic_code: '',
                source: '',
                source_id: '',
                taxonomy: '',
                n_features: ''
            };

            if(metadata['Name']) {
                genomeData.scientific_name = metadata['Name'];
            } else {
                // no scientific name, so ug.  we should refetch and get the basic information
                self.getGenomeDataDirectly(genome_ref, noDataCallback);
            }
            if(metadata['Domain']) {
                genomeData.domain = metadata['Domain'];
            }
            if(metadata['Genetic code']) {
                genomeData.genetic_code = metadata['Genetic code'];
            }
            if(metadata['Source']) {
                genomeData.source = metadata['Source'];
            }
            if(metadata['Source ID']) {
                genomeData.source_id = metadata['Source ID'];
            }
            if(metadata['Taxonomy']) {
                genomeData.taxonomy = metadata['Taxonomy'];
            }
            if(metadata['Number features']) {
                genomeData.n_features = metadata['Number features'];
            }
            return genomeData;
        },

        getGenomeDataDirectly: function(genome_ref, noDataCallback) {
            var self = this;

            var included = ["domain","genetic_code","id","num_features",
                            "scientific_name","source","source_id","taxonomy"];
            self.genomeAPI
                        .get_genome_v1({ 
                            genomes: [{
                                ref: self.genome_ref
                            }],
                            'included_fields' : included
                        })
                        .then(function(data) {
                            console.log('genomeAPI.get_genome_v1(ref='+genome_ref+')',data['genomes'][0]);

                            var info = data['genomes'][0]['info'];
                            var genomeData = data['genomes'][0]['data'];
                            genomeData['ws_obj_name'] = info[1];
                            genomeData['version'] = info[4];
                            genomeData['ref'] = info[6] + '/' + info[1] + '/' + info[4];

                            // normalize these data fields too
                            if(!genomeData['domain']) {
                                genomeData.domain = '';
                            }
                            if(!genomeData['genetic_code']) {
                                genomeData.genetic_code = '';
                            }
                            if(!genomeData['source']) {
                                genomeData.source = '';
                            }
                            if(!genomeData['source_id']) {
                                genomeData.source_id = '';
                            }
                            if(!genomeData['taxonomy']) {
                                genomeData.taxonomy = '';
                            }
                            if(!genomeData['num_features']) {
                                genomeData.n_features = '';
                            }

                            noDataCallback(genomeData);
                        });
        },



        showContigTab: function(genome_ref, contig_id, pref, tabPane) {

            var self = this;

            function openTabGetId(tabName) {
                if (tabPane.hasTab(tabName))
                        return null;
                self.lastElemTabNum++;
                var tabId = '' + pref + 'elem' + self.lastElemTabNum;
                var $tabDiv = $('<div id="'+tabId+'"> ');
                tabPane.addTab({tab: tabName, content: $tabDiv, canDelete : true, show: true, deleteCallback: function(name) {
                    tabPane.removeTab(name);
                    tabPane.showTab(tabPane.activeTab());
                }});
                return $tabDiv;
            }

            function numberWithCommas(x) {
                return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            }

            // setup mini contig browser
            function translate_feature_data(featureData) {
                var cbFormat = {};
                cbFormat['raw'] = featureData; //Store this in order to span new tabs
                cbFormat['id'] = featureData['feature_id'];
                cbFormat['location'] = [];
                if(featureData['global_location']['contig_id']) {
                    for(var k=0; k<featureData['location'].length; k++) {
                        // only show things on the main contig
                        var loc = featureData['location'][k];
                        if(featureData['global_location']['contig_id']===loc['contig_id']) {
                            cbFormat['location'].push([
                                    loc['contig_id'],
                                    loc['start'],
                                    loc['strand'],
                                    loc['length']
                                ]);
                        }
                    }
                }
                cbFormat['function'] = featureData['function'];
                return cbFormat;
            };


            function getFeaturesInRegionAndRenderBrowser(genome_ref, contig_id, start, length, contig_length, $div) {
                return self.genomeSearchAPI
                        .search_region({
                            ref: genome_ref,
                            query_contig_id: contig_id,
                            query_region_start: start,
                            query_region_length: length,
                            page_start: 0,
                            page_limit: 2000
                        })
                        .then(function(result) {
                            $div.empty();

                            var contigWindowData = {
                                name: contig_id,
                                length: contig_length,
                                genes: []
                            }

                            console.log('genomeSearchAPI.search_region()',result);
                            for(var f=0; f<result['features'].length; f++) {
                                contigWindowData['genes'].push(translate_feature_data(result['features'][f]));
                            }
                            var cgb = new ContigBrowserPanel();
                            cgb.data.options.contig = contigWindowData;
                            //cgb.data.options.svgWidth = self.width - 28;
                            cgb.data.options.onClickFunction = function(svgElement, feature) {
                                self.showFeatureTab(genome_ref, feature['original_data']['raw'], pref, tabPane);
                            };
                            cgb.data.options.start= start;
                            cgb.data.options.length= length;
                            cgb.data.options.showButtons = false;
                            cgb.data.options.token = self.token;
                            cgb.data.$elem = $('<div style="width:100%; height: 120px;"/>');
                            cgb.data.$elem.show(function(){
                                cgb.data.update();
                            });
                            $div.append(cgb.data.$elem);
                            cgb.data.init();
                        })
                        .fail(function(e) {
                                console.error(e);
                                $div.empty();
                                var errorMssg = '';
                                if(e['error']) {
                                    errorMssg = JSON.stringify(e['error']);
                                    if(e['error']['message']){
                                        errorMssg = e['error']['message'];
                                        if(e['error']['error']){
                                            errorMssg += '<br><b>Trace</b>:' + e['error']['error'];
                                        }
                                    } else {
                                        errorMssg = JSON.stringify(e['error']);
                                    }
                                } else { e['error']['message']; }
                                $div.append($('<div>').addClass('alert alert-danger').append(errorMssg));
                            });
            };


            function renderContigData(genome_ref, contig_id, outputDivs) {

                var $length = outputDivs.$length;
                var $n_features = outputDivs.$n_features;
                return self.genomeSearchAPI
                        .search_contigs({
                            ref: genome_ref,
                            query: contig_id
                        })
                        .then(function(result) {
                            console.log('genomeSearchAPI.search_contigs()',result);
                            var contigData = {};
                            if(result['contigs'].length ==0) {
                                $length.append('Information not available.')
                                $n_features.append('Information not available.')
                            } else {
                                for(var c=0; c<result['contigs'].length; c++) {
                                    if(contig_id === result['contigs'][c]['contig_id']) {
                                        contigData = result['contigs'][c];
                                        $length.append(numberWithCommas(result['contigs'][c]['length']));
                                        $n_features.append(numberWithCommas(result['contigs'][c]['feature_count']));
                                        break;
                                    }
                                }
                            }
                            return contigData;
                        })
                        .fail(function(e) {
                                console.error(e);
                                $length.empty();
                                var errorMssg = '';
                                if(e['error']) {
                                    errorMssg = JSON.stringify(e['error']);
                                    if(e['error']['message']){
                                        errorMssg = e['error']['message'];
                                        if(e['error']['error']){
                                            errorMssg += '<br><b>Trace</b>:' + e['error']['error'];
                                        }
                                    } else {
                                        errorMssg = JSON.stringify(e['error']);
                                    }
                                }
                                $length.append($('<div>').addClass('alert alert-danger').append(errorMssg));
                        });
            };


            function showContig(genome_ref, contig_id) {

                var $div = openTabGetId(contig_id);
                if ($div === null) {
                    tabPane.showTab(contig_id);
                    return;
                }

                var $tbl = $('<table>').addClass('table table-striped table-bordered table-hover')
                                .css({'margin-left':'auto', 'margin-right':'auto'});
                $tbl.append($('<colgroup>').append($('<col span=1>').css('width','15%')));
                var $browserCtrlDiv = $('<div>');
                var $browserDiv = $('<div>');

                // basic layout
                var $container = $('<div>').addClass('container-fluid').css({'margin':'15px 0px', 'max-width':'100%'});
                $div.append($container);
                var $tblRow = $('<div>').addClass('row')
                                        .append($('<div>').addClass('col-md-12').append($tbl));
                var $browserCtrlRow = $('<div>').addClass('row').css({'margin-top':'15px', 'text-align':'center'})
                                        .append($('<div>').addClass('col-md-12').append($browserCtrlDiv));
                var $browserRow = $('<div>').addClass('row').css({'margin-top':'15px', 'text-align':'center'})
                                        .append($('<div>').addClass('col-md-12').append($browserDiv));
                $container.append($tblRow).append($browserCtrlRow).append($browserRow);


                // ID
                var $id = $('<tr>')
                            .append($('<td>').append('<b>Contig ID</b>'))
                            .append($('<td>').append(contig_id));
                $tbl.append($id);

                // Length
                var $lengthField = $('<div>');
                var $len = $('<tr>')
                            .append($('<td>').append('<b>Length</b>'))
                            .append($('<td>').append($lengthField));
                $tbl.append($len);

                // N Features
                var $featureField = $('<div>');
                var $nf = $('<tr>')
                            .append($('<td>').append('<b>Number of Features</b>'))
                            .append($('<td>').append($featureField));
                $tbl.append($nf);

                var contigDataPromise = renderContigData(
                    genome_ref, contig_id,
                    {
                        $length:$lengthField,
                        $n_features:$featureField
                    });

                contigDataPromise.then(function(contigData) {
                    // Browser
                    $browserRow.append($('<i class="fa fa-spinner fa-spin fa-2x">'));
                    var start = 0;
                    var tenKb = 10000;
                    var twentyKb = 20000;
                    var length = twentyKb;
                    var contig_length = contigData['length'];

                    var $contigScrollBack = $('<button class="btn btn-default">')
                                                .append('<i class="fa fa-caret-left" aria-hidden="true">')
                                                .append(' back 20kb')
                                                .on('click', function() {
                                                    if(start-twentyKb < 0) { return; }
                                                    $browserRow.append($('<i class="fa fa-spinner fa-spin fa-2x">'));
                                                    start = start - twentyKb;
                                                    length = twentyKb;
                                                    getFeaturesInRegionAndRenderBrowser(genome_ref, contig_id, start, length, contig_length, $browserRow);
                                                });
                    var $contigScrollForward = $('<button class="btn btn-default">')
                                                .append('forward 20kb ')
                                                .append('<i class="fa fa-caret-right" aria-hidden="true">')
                                                .on('click', function() {
                                                    if(start+twentyKb>contig_length) { return; }
                                                    $browserRow.append($('<i class="fa fa-spinner fa-spin fa-2x">'));
                                                    if(start+twentyKb>contig_length) { return; }
                                                    start = start + twentyKb;
                                                    length = twentyKb;
                                                    getFeaturesInRegionAndRenderBrowser(genome_ref, contig_id, start, length, contig_length, $browserRow);
                                                });

                    $browserCtrlDiv.append($contigScrollBack).append($contigScrollForward);

                    getFeaturesInRegionAndRenderBrowser(genome_ref, contig_id, start, length, contig_length, $browserRow);
                });
            }

            showContig(genome_ref, contig_id);

        },


        showFeatureTab: function(genome_ref, featureData, pref, tabPane) {
            var self = this;

            function numberWithCommas(x) {
                return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            }

            function openTabGetId(tabName) {
                if (tabPane.hasTab(tabName))
                        return null;
                self.lastElemTabNum++;
                var tabId = '' + pref + 'elem' + self.lastElemTabNum;
                var $tabDiv = $('<div id="'+tabId+'"> ');
                tabPane.addTab({tab: tabName, content: $tabDiv, canDelete : true, show: true, deleteCallback: function(name) {
                    tabPane.removeTab(name);
                    tabPane.showTab(tabPane.activeTab());
                }});
                return $tabDiv;
            }


            function printProtein(sequence, charWrap) {
                var $div = $('<div>').css({'font-family': '"Lucida Console", Monaco, monospace'});
                
                $div.append($('<span>').css({color:'orange'}).append('Small Nonpolar'));
                $div.append(' | ');
                $div.append($('<span>').css({color:'green'}).append('Hyrdrophobic'));
                $div.append(' | ');
                $div.append($('<span>').css({color:'magenta'}).append('Polar'));
                $div.append(' | ');
                $div.append($('<span>').css({color:'red'}).append('Neg Charged'));
                $div.append(' | ');
                $div.append($('<span>').css({color:'blue'}).append('Pos Charged'));
                $div.append('<br>');

                var $posTD = $('<td>').css({'text-align': 'right', 'border':'0', 'color':'#777'});
                var $seqTD = $('<td>').css({'border':'0'});
                var lines = 1;
                for (var i = 0; i < sequence.length; i++) {
                    if(i>0 && i%charWrap===0) {
                        $posTD.append('<br>').append(i+1).append(':&nbsp;');
                        $seqTD.append('<br>');
                        lines++;
                    } else if (i==0) {
                        $posTD.append(i+1).append(':&nbsp;');
                    }

                    var color = '#000';
                    /*http://www.bioinformatics.nl/~berndb/aacolour.html
                    The colour scheme in Lesk, Introduction to Bioinformatics, uses 5 groups (note Histidine):
                    Small nonpolar  G, A, S, T  Orange
                    Hydrophobic C, V, I, L, P, F, Y, M, W   Green
                    Polar   N, Q, H Magenta
                    Negatively charged  D, E    Red
                    Positively charged  K, R    Blue*/
                    var aa = sequence[i];
                    if(aa==='G' || aa==='A' || aa==='S' || aa==='T') color='orange';
                    if(aa==='C' || aa==='V' || aa==='I' || aa==='L' || aa==='P' || 
                       aa==='F' || aa==='Y' || aa==='M' || aa==='W' ) color='green';
                    if(aa==='N' || aa==='Q' || aa==='H') color='magenta';
                    if(aa==='D' || aa==='E') color='red';
                    if(aa==='K' || aa==='R') color='blue';
                    $seqTD.append($('<span>').css({'color':color}).append(aa));
                }
                $div.append($('<table>').css({'border':'0','border-collapse':'collapse'}).append(
                        $('<tr>').css({'border':'0'}).append($posTD).append($seqTD)));

                if(lines>10) {
                    $div.css({'height':'10em', 'overflow':'auto', 'resize':'vertical'});
                }
                return $div;
            }

            function printDNA(sequence, charWrap) {
                var $div = $('<div>').css({'font-family': '"Lucida Console", Monaco, monospace'});
                
                var $posTD = $('<td>').css({'text-align': 'right', 'border':'0', 'color':'#777'});
                var $seqTD = $('<td>').css({'border':'0', 'color':'#000'});
                var lines=1;
                for (var i = 0; i < sequence.length; i++) {
                    if(i>0 && i%charWrap===0) {
                        $posTD.append('<br>').append(i+1).append(':&nbsp;');
                        $seqTD.append('<br>');
                        lines++;
                    } else if (i==0) {
                        $posTD.append(i+1).append(':&nbsp;');
                    }
                    var base = sequence[i];
                    $seqTD.append(base);
                }
                $div.append($('<table>').css({'border':'0','border-collapse':'collapse'}).append(
                        $('<tr>').css({'border':'0'}).append($posTD).append($seqTD)));
                if(lines>5) {
                    $div.css({'height':'6em', 'overflow':'auto', 'resize':'vertical'});
                }

                return $div;
            }


            function getFeatureLocationBounds(locationObject) {
                var loc = {};
                if(locationObject['strand'] && locationObject['strand'] === '-') {
                    loc['end'] = locationObject['start'];
                    loc['start'] = loc['end'] - locationObject['length'];

                } else {
                    // assume it is on + strand
                    loc['start'] = locationObject['start'];
                    loc['end'] = loc['start'] + locationObject['length'];
                }
                return loc;
            }


            function showGene(featureData) {
                var fid = featureData['feature_id'];
                var $div = openTabGetId(fid);
                if ($div === null) {
                    tabPane.showTab(fid);
                    return;
                }
                var $tbl = $('<table>').addClass('table table-striped table-bordered table-hover')
                            .css({'margin-left':'auto', 'margin-right':'auto'});
                $tbl.append($('<colgroup>').append($('<col span=1>').css('width','15%')));


                // basic layout
                var $container = $('<div>').addClass('container-fluid').css({'margin':'15px 0px', 'max-width':'100%'});
                $div.append($container);
                var $tblRow = $('<div>').addClass('row')
                                    .append($('<div>').addClass('col-md-12').append($tbl));
                $container.append($tblRow);

                var tblLabels = [];
                var tblData = [];

                tblLabels.push('Feature ID');
                tblData.push('<a href="/#dataview/'+self.genome_ref+'?sub=Feature&subid='+fid+'" target="_blank">'+fid+'</a>');

                tblLabels.push('Aliases');
                var $aliases = $('<div>');
                if(featureData['aliases']) {
                    var aliases = featureData['aliases'];
                    var isFirst = true;
                    for (var alias in aliases) {
                        if (aliases.hasOwnProperty(alias)) {
                            if(isFirst) isFirst=false;
                            else $aliases.append(', ');
                            $aliases.append(alias);
                        }
                    }
                    if(isFirst) {
                        $aliases.append('None');
                    }
                } 
                tblData.push($aliases);

                tblLabels.push('Type');
                tblData.push(featureData['feature_type']);

                tblLabels.push('Function');
                if(featureData['function']) {
                    tblData.push(featureData['function']);
                } else {
                    tblData.push('None');
                }

                tblLabels.push('Ontology Terms');
                var $ontology_terms = $('<div>');
                if(featureData['ontology_terms']) {
                    var o_terms = featureData['ontology_terms'];
                    var isFirst = true;
                    for (var term in o_terms) {
                        if (o_terms.hasOwnProperty(term)) {
                            if(isFirst) isFirst=false;
                            else $ontology_terms.append('<br>');
                            $ontology_terms.append(self.link_to_ontology(term)).append('- ' + o_terms[term]);
                        }
                    }
                    if(isFirst) {
                        $ontology_terms.append('None');
                    }
                } 
                tblData.push($ontology_terms);

                tblLabels.push('Location');
                var $loc = $('<div>');
                if(featureData['global_location']['contig_id']) {
                    $loc.append('Contig:&nbsp;');
                    $loc.append($('<a>').append(featureData['global_location']['contig_id'])
                                    .css({'cursor':'pointer'})
                                    .on('click', function() {
                                        self.showContigTab(genome_ref, featureData['global_location']['contig_id'], pref, tabPane);
                                    }));
                    $loc.append('<br>');
                    if(featureData['location']) {
                        var locs = featureData['location'];
                        var $locDiv = $('<div>');
                        var crop = false;
                        for(var i=0; i<locs.length; i++) {
                            if(i>0) { $locDiv.append('<br>'); }
                            if(i>6) { crop=true; }
                            var loc = locs[i];
                            var bounds = getFeatureLocationBounds(loc);
                            $locDiv.append(numberWithCommas(bounds['start'])+'&nbsp;-&nbsp;' +numberWithCommas(bounds['end'])+'&nbsp;('+loc['strand']+'&nbsp;Strand)');
                        }
                        $loc.append($locDiv);
                        if(crop) {
                            $locDiv.css({'height':'10em', 'overflow':'auto', 'resize':'vertical'});
                        }
                    }
                } else {
                    $loc.append('None');
                }
                
                tblData.push($loc);


                var $contigBrowser = $('<div>').append($('<i class="fa fa-spinner fa-spin">'))
                                        .append(' &nbsp;fetching nearby feature data...');
                tblLabels.push('Feature Context');
                tblData.push($contigBrowser);


                var $protLen = $('<div>');
                tblLabels.push('Protein Length');
                tblData.push($protLen);

                var $protSeq = $('<div>').append($('<i class="fa fa-spinner fa-spin">'))
                                        .append(' &nbsp;fetching sequence data...');
                tblLabels.push('Protein Translation');
                tblData.push($protSeq);

                var $dnaLen = $('<div>');
                tblLabels.push('DNA Length');
                tblData.push($dnaLen);

                var $dnaSeq = $('<div>');
                tblLabels.push('DNA Sequence');
                tblData.push($dnaSeq);


                for (var i=0; i<tblLabels.length; i++) {
                    $tbl.append($('<tr>')
                                    .append($('<td>').append($('<b>').append(tblLabels[i])))
                                    .append($('<td>').append(tblData[i])));
                }

                // get sequence and other information
                self.genomeAPI
                        .get_genome_v1({ 
                            genomes: [{
                                ref: genome_ref,
                                included_feature_position_index: [featureData['feature_idx']]
                            }]
                        })
                        .then(function(data) {
                            console.log('genomeAPI.get_genome_v1(fidx='+featureData['feature_idx']+')',data)
                            featureFullRecord = data.genomes[0].data.features[0];
                            if(featureFullRecord['protein_translation']) {
                                $protLen.empty().append(numberWithCommas(featureFullRecord['protein_translation'].length));
                                $protSeq.empty().append(printProtein(featureFullRecord['protein_translation'],50));
                            } else {
                                $protSeq.empty().append('Not Available');
                            }
                            if(featureFullRecord['dna_sequence']) {
                                $dnaLen.empty().append(numberWithCommas(featureFullRecord['dna_sequence'].length));
                                $dnaSeq.empty().append(printDNA(featureFullRecord['dna_sequence'],50));
                            } else {
                                $dnaSeq.empty().append('Not Available');
                            }
                        })
                        .fail(function(e) {
                            console.error(e);
                            $protLen.empty();
                            $protSeq.empty();
                            $dnaLen.empty();
                            $dnaSeq.empty();
                            var errorMssg = '';
                            if(e['error']) {
                                errorMssg = JSON.stringify(e['error']);
                                if(e['error']['message']){
                                    errorMssg = e['error']['message'];
                                    if(e['error']['error']){
                                        errorMssg += '<br><b>Trace</b>:' + e['error']['error'];
                                    }
                                } else {
                                    errorMssg = JSON.stringify(e['error']);
                                }
                            } else { e['error']['message']; }
                                $protSeq.append($('<div>').addClass('alert alert-danger').append(errorMssg));
                        });


                // setup mini contig browser
                var translate_feature_data = function(featureData) {
                    var cbFormat = {};
                    cbFormat['raw'] = featureData; //Store this in order to span new tabs
                    cbFormat['id'] = featureData['feature_id'];
                    cbFormat['location'] = [];
                    for(var k=0; k<featureData['location'].length; k++) {
                        // only show things on the main contig
                        var loc = featureData['location'][k];
                        if(featureData['global_location']['contig_id']===loc['contig_id']) {
                            cbFormat['location'].push([
                                    loc['contig_id'],
                                    loc['start'],
                                    loc['strand'],
                                    loc['length']
                                ]);
                        }
                    }
                    cbFormat['function'] = featureData['function'];
                    return cbFormat;
                }

                // returns a promise with an arg that gives you the contig length
                function getContigData(genome_ref, contig_id) {
                    return self.genomeSearchAPI
                        .search_contigs({
                            ref: genome_ref,
                            query: contig_id
                        })
                        .then(function(result) {
                            console.log('genomeSearchAPI.search_contigs()',result);
                            var contigData = {};
                            if(result['contigs'].length>0) {
                                for(var c=0; c<result['contigs'].length; c++) {
                                    if(contig_id === result['contigs'][c]['contig_id']) {
                                        contigData = result['contigs'][c];
                                        break;
                                    }
                                }
                            }
                            return contigData;
                        })
                        .fail(function(e) {
                                console.error(e);
                        });
                }


                if(!featureData['global_location']['contig_id']) {
                    $contigBrowser.empty().append('Genomic context is not available.');
                } else {
                    getContigData(genome_ref, featureData['global_location']['contig_id'])
                        .then(function(contigData) {
                            var contigDataForBrowser = {
                                name: featureData['global_location']['contig_id'],
                                genes: [translate_feature_data(featureData)]
                            }

                            var range = 10000; //10kb
                            var bounds = getFeatureLocationBounds(featureData['global_location']);

                            var search_start = bounds.start-range;
                            if(search_start < 0) {
                                search_start = 0;
                            }
                            var search_stop = bounds.end+range;
                            var search_length = search_stop - search_start;
                            contigDataForBrowser['length'] = search_stop;
                            if(contigData['length']) {
                                contigDataForBrowser['length'] = contigData['length'];
                            }
                            // do not get a range any larger than 40kb.
                            if(search_length>40000) {
                                search_length = 40000;
                            }

                            self.genomeSearchAPI.search_region({
                                                    ref: genome_ref,
                                                    query_contig_id: featureData['global_location']['contig_id'],
                                                    query_region_start: search_start,
                                                    query_region_length: search_length,
                                                    page_start: 0,
                                                    page_limit: 2000
                                                })
                                                .then(function(result) {
                                                    $contigBrowser.empty();
                                                    console.log('genomeSearchAPI.search_region()',result);
                                                    for(var f=0; f<result['features'].length; f++) {
                                                        contigDataForBrowser['genes'].push(translate_feature_data(result['features'][f]));
                                                    }
                                                    var cgb = new ContigBrowserPanel();
                                                    cgb.data.options.contig = contigDataForBrowser;
                                                    //cgb.data.options.svgWidth = self.width - 28;
                                                    cgb.data.options.onClickFunction = function(svgElement, feature) {
                                                        self.showFeatureTab(genome_ref, feature['original_data']['raw'], pref, tabPane);
                                                    };
                                                    cgb.data.options.start= search_start;
                                                    cgb.data.options.length= search_length;
                                                    cgb.data.options.centerFeature = featureData['feature_id'];
                                                    cgb.data.options.showButtons = false;
                                                    cgb.data.options.token = self.token;
                                                    cgb.data.$elem = $('<div style="width:100%; height: 120px;"/>');
                                                    cgb.data.$elem.show(function(){
                                                        cgb.data.update();
                                                    });
                                                    $contigBrowser.append(cgb.data.$elem);
                                                    cgb.data.init();

                                                })
                                                .fail(function(e) {
                                                    console.error(e);
                                                    $contigBrowser.empty();
                                                    var errorMssg = '';
                                                    if(e['error']) {
                                                        errorMssg = JSON.stringify(e['error']);
                                                        if(e['error']['message']){
                                                            errorMssg = e['error']['message'];
                                                            if(e['error']['error']){
                                                                errorMssg += '<br><b>Trace</b>:' + e['error']['error'];
                                                            }
                                                        } else {
                                                            errorMssg = JSON.stringify(e['error']);
                                                        }
                                                    } else { e['error']['message']; }
                                                    $contigBrowser.append($('<div>').addClass('alert alert-danger').append(errorMssg));
                                                });
                        });
                    }
                    tabPane.showTab(fid);
                }

                showGene(featureData);
        },

        showOntology : function(ontologyID) {

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
        },
    });
});
