/**
 * Output widget for visualization of genome annotation.
 * @author Roman Sutormin <rsutormin@lbl.gov>
 * @public
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

            self.kbws = new Workspace(Config.url('workspace'), {'token': self.auth().token});
            self.genomeAPI = new GenomeAnnotationAPI(Config.url('service_wizard'), {'token': self.auth().token});
            self.assemblyAPI = new AssemblyAPI(Config.url('service_wizard'), {'token': self.auth().token});

            
            self.genomeSearchAPI = new GenomeSearchUtil(Config.url('service_wizard'), {'token': self.auth().token});

            self.genericClient = new GenericClient(Config.url('service_wizard'), {'token': self.auth().token }, null, false);
            self.genericClient.sync_call("ServiceWizard.get_service_status",
                        [{'module_name': "GenomeSearchUtil", 'version': 'dev'}], 
                    function(status){
                        console.log(status[0]);
                        self.genomeSearchAPI = new GenomeSearchUtil(status[0].url, {'token': self.auth().token}, null, null, null, null, false);
                    },
                    function(error){console.error(error);});

            return this;
        },

        //Sam says that it's considered a transcriptome if there are no contigs, or if the features lack locations.
        genomeType : function(genome) {
            return 'genome';

            if (
                (! genome.contig_ids || genome.contig_ids.length == 0)
            ) {

                var has_location = false;
                $.each(
                    genome.features,
                    function (idx, feature) {

                        if (feature.location && feature.location.length) {
                            has_location = true;
                            return;
                        }
                    }
                );

                if (! has_location) {
                    return 'transcriptome';
                }
            }

            return 'genome';
        },

        tabData : function(genome) {

            var type = this.genomeType(genome);

            if (type == 'transcriptome') {
                //normally, we just have an Overview and a Genes tab.
                var names = ['Overview', 'Genes'];
                var ids = ['overview', 'genes'];

                //XXX plants baloney - but plants also get a CDS column.
                if (genome.domain == 'Plant' || genome.domain == 'Eukaryota') {
                    names.push('CDS');
                    ids.push('cds');
                }

                if (genome.ontology_mappings.length) {
                  names.push('Ontology');
                  ids.push('ontology');
                }

                return {
                    names   : names,
                    ids     : ids
                };
            }
            else {

                //normally, we just have an Overview, Contigs, and Genes tab.
                var names = ['Overview', 'Contigs', 'Genes', 'Search'];
                var ids = ['overview', 'contigs', 'genes', 'search'];

                //XXX plants baloney - but plants get different columns
                if (genome.domain == 'Plant' || genome.domain == 'Eukaryota') {
                    names = ['Overview', 'Genes', 'CDS', 'Search'];
                    ids = ['overview', 'genes', 'cds', 'search'];
                }

                if (genome.ontology_mappings.length) {
                  names.push('Ontology');
                  ids.push('ontology');
                }

                return {
                    names : names,
                    ids : ids
                };
            }
        },



     /*   getSortToggle: function(columns, default_column, ) {

            var sortToggle = {
                sort_by: []

            }

            sortToggle[''] = function()


            return sortToggle
        },*/


        /*
            input =>
            {
                genomeSearchAPI: genomeSearchAPI Client
                $div:  JQuery div that I can render to

            }
        */

        buildGeneSearchView: function(params) {



            console.log('BuildingGeneSearchView!!') 

            // parse parameters
            var $div = params['$div'];
            if(!$div.is(':empty')) {
                return; // if it has content, then do not rerender
            }
            var genomeSearchAPI = params['genomeSearchAPI'];
            var genome_ref = params['ref'];

            var idClick = null;
            if(params['idClick']) { idClick = params['idClick']; }

            // setup some defaults
            var limit = 10;
            var start = 0;
            var sort_by = ['feature_id', 1];


            // setup the main search button and the results panel and layout
            var $input = $('<input type="text" class="form-control" placeholder="Search Features">');
            $("input").prop('disabled', true);

            
            var $resultDiv = $('<div>');
            var $noResultsDiv = $('<div>').append('<center>No matching features found.</center>').hide();
            var $loadingDiv = $('<div>');
            var $errorDiv = $('<div>');
            var $pagenateDiv = $('<div>');
            var $resultsInfoDiv = $('<div>');

            var $container = $('<div>').addClass('container-fluid').css({'margin':'15px 0px', 'max-width':'100%'});
            $div.append($container);
            var $headerRow = $('<div>').addClass('row')
                                .append($('<div>').addClass('col-md-8') )
                                .append($('<div>').addClass('col-md-4').append($input));
            var $resultsRow = $('<div>').addClass('row').css({'margin-top':'15px'})
                                .append($('<div>').addClass('col-md-12').append($resultDiv));
            var $loadingRow = $('<div>').addClass('row')
                                .append($('<div>').addClass('col-md-12').append($loadingDiv));
            var $noResultsRow = $('<div>').addClass('row')
                                .append($('<div>').addClass('col-md-12').append($noResultsDiv));
            var $errorRow = $('<div>').addClass('row')
                                .append($('<div>').addClass('col-md-8').append($errorDiv));
            var $infoRow = $('<div>').addClass('row')
                                .append($('<div>').addClass('col-md-4').append($resultsInfoDiv))
                                .append($('<div>').addClass('col-md-8').append($pagenateDiv));
            $container
                .append($headerRow)
                .append($resultsRow)
                .append($loadingRow)
                .append($errorDiv)
                .append($noResultsRow)
                .append($infoRow);


            var clearInfo= function() {
                $resultsInfoDiv.empty();
            };


            // define the functions that do everything
            var setToLoad = function($panel) {
                clearInfo();
                $panel.empty();
                var $loadingDiv = $('<div>').attr('align', 'center').append($('<i class="fa fa-spinner fa-spin fa-2x">'));
                $panel.append('<br>').append($loadingDiv);
                window.setTimeout(function() {
                        $loadingDiv.append('<br>').append('Building cache, please wait...');
                        window.setTimeout(function() {
                            $loadingDiv.append('<br>').append('still working...')
                        }, 30000);
                    } , 5000);
            };

            var search = function(query, start, limit, sort_by) {
                console.log(sort_by);
                $errorDiv.empty();
                return genomeSearchAPI.search({
                                            ref: genome_ref,
                                            query: query,
                                            sort_by: [sort_by],
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

            var showViewInfo = function(start, num_showing, num_found) {
                $resultsInfoDiv.empty();
                $resultsInfoDiv.append('Showing '+(start+1) + ' to ' + (start+num_showing)+' of '+num_found);
            };
            var showNoResultsView = function() {
                $noResultsDiv.show();
                $resultsInfoDiv.empty();
                $pagenateDiv.empty();
            }

            var buildRow = function(rowData) {
                var $tr = $('<tr>');
                if(idClick) {
                    var getCallback = function(rowData) { return function() {idClick(rowData);}};
                    $tr.append($('<td>').append(
                        $('<a>').css('cursor','pointer').append(rowData['feature_id'])
                            .on('click',getCallback(rowData)))
                    );
                } else {
                    $tr.append($('<td>').append(rowData['feature_id']));
                }
                $tr.append($('<td>').append(rowData['feature_type']));
                $tr.append($('<td>').append(rowData['function']));

                var $td = $('<td>');
                if(rowData['aliases']) {
                    var aliases = rowData['aliases'];
                    var isFirst = true;
                    for (var alias in aliases) {
                        if(isFirst) isFirst=false;
                        else $td.append(', ');
                        if (aliases.hasOwnProperty(alias)) {
                            $td.append(alias);
                        }
                    }
                } 
                $tr.append($td);


                if(rowData['global_location']) {
                    var loc = rowData['global_location'];
                    $tr.append($('<td>').append(loc['start']));
                    $tr.append($('<td>').append(loc['strand']));
                    $tr.append($('<td>').append(loc['length']));
                    $tr.append($('<td>').append(
                        $('<div>').css('word-break','break-all').append(loc['contig_id'])));
                }

                /*var $td = $('<td>');
                if(rowData['location']) {
                    var locs = rowData['location'];
                    console.log(locs);
                    for(var i=0; i<locs.length; i++) {
                        if(i>0) { $td.append('<br>'); }
                        var loc = locs[i];
                        $td.append(String(loc['start'])+'&nbsp;('+loc['strand']+'):&nbsp;'+loc['contig_id']);
                    }
                }
                $tr.append($td);*/


                return $tr;
            };

            var renderResult = function($table, results) {
                $table.find("tr:gt(0)").remove();
                $loadingDiv.empty();
                $noResultsDiv.hide();

                var features = results['features']
                if(features.length>0) {
                    for(var k=0; k<features.length; k++) {
                        $table.append(buildRow(features[k]));
                    }
                    showViewInfo(results['start'], features.length, results['num_found']);
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
                            .css('cursor','pointer')
                            .append('<b>'+name+'</b>')
                            .append($sortIcon)
                            .on('click', function() {
                                click_event(id, $sortIcon)
                            });
                return {
                    id: id,
                    name: name,
                    $th: $th,
                    $sortIcon: $sortIcon
                };
            };

            var buildTableHeader = function() {
                var inFlight = false;

                var $tr = $('<tr>');
                var ASC=1; var DESC=0; var ID=0; var DIR=1;
                var cols = {};
                var sortEvent = function(id, $sortIcon) {
                    if(inFlight) { return; } // skip if a sort call is already running
                    console.log('sort click:' + id);
                    if(sort_by[ID] == id) {
                        if(sort_by[DIR] === ASC) {
                            sort_by[DIR] = DESC;
                            $sortIcon.removeClass();
                            $sortIcon.addClass('fa fa-sort-desc');
                        } else {
                            sort_by[DIR] = ASC;
                            $sortIcon.removeClass();
                            $sortIcon.addClass('fa fa-sort-asc');
                        }
                    } else {
                        cols[sort_by[ID]].$sortIcon.removeClass();
                        sort_by[ID] = id;
                        sort_by[DIR] = DESC;
                        $sortIcon.addClass('fa fa-sort-desc');
                    }

                    $table.find("tr:gt(0)").remove();
                    setToLoad($loadingDiv);
                    inFlight=true;
                    search($input.val(), start, limit, sort_by)
                        .then(function(result) { 
                                renderResult($table, result);
                                inFlight=false;
                            })
                        .fail(function(){ inFlight=false; });
                };

                var h = buildColumnHeader('Feature ID', 'feature_id', sortEvent);
                $tr.append(h.$th);
                h.$sortIcon.addClass('fa fa-sort-asc');
                cols[h.id] = h;

                var h = buildColumnHeader('Type', 'feature_type', sortEvent);
                $tr.append(h.$th);
                cols[h.id] = h;

                var h = buildColumnHeader('Function', 'function', sortEvent);
                $tr.append(h.$th);
                cols[h.id] = h;

                var h = buildColumnHeader('Aliases', 'aliases', sortEvent);
                $tr.append(h.$th);
                cols[h.id] = h;

                var h = buildColumnHeader('Start', 'start', sortEvent);
                $tr.append(h.$th);
                cols[h.id] = h;

                var h = buildColumnHeader('Strand', 'strand', sortEvent);
                $tr.append(h.$th);
                cols[h.id] = h;

                var h = buildColumnHeader('Length', 'length', sortEvent);
                $tr.append(h.$th);
                cols[h.id] = h;

                var h = buildColumnHeader('Contig', 'contig_id', sortEvent);
                $tr.append(h.$th);
                cols[h.id] = h;

                return $tr;
            }
            

            $table.append(buildTableHeader());

           
            // Ok, do stuff.  First show the loading icon
            setToLoad($loadingDiv);

            // Perform the first search
            search('', 1, limit, sort_by).then(
                    function(results) {
                        console.log(results);
                        $("input").prop('disabled', false);
                        renderResult($table, results);
                    });


            //put in a slight delay so on rapid typing we don't make a flood of calls
            var fetchTimeout = null;
            var lastQuery = null;
            $input.on('input', function() {
                // if we were waiting on other input, cancel that request
                if(fetchTimeout) { window.clearTimeout(fetchTimeout); }
                fetchTimeout = window.setTimeout(function() {
                    fetchTimeout = null;
                    $table.find("tr:gt(0)").remove();
                    setToLoad($loadingDiv);
                    console.log($input.val());
                    search($input.val(),start, limit, sort_by)
                        .then(function(result) { 
                                renderResult($table, result);
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

            var kbws = new Workspace(self.wsUrl, {'token': self.token});

            var ready = function(gnm, ctg) {
                    container.empty();
                    var tabPane = $('<div id="'+pref+'tab-content">');
                    container.append(tabPane);
                    var tabObj = new kbaseTabs(tabPane, {canDelete : true, tabs : []});

                    var genomeType = self.genomeType(gnm);

                    var ontology_mappings = [];
                    $.each(
                      gnm.features,
                      function (i,f) {
                        if (f.ontology_terms) {
                          ontology_mappings.push(f);
                        }
                      }
                    );

                    gnm.ontology_mappings = ontology_mappings;

                    var tabData = self.tabData(gnm);
                    var tabNames = tabData.names;
                    var tabIds = tabData.ids;

                    for (var i=0; i<tabIds.length; i++) {
                      var tabDiv = $('<div id="'+pref+tabIds[i]+'"> ');
                      tabObj.addTab({tab: tabNames[i], content: tabDiv, canDelete : false, show: (i == 0)});
                    }

                    var contigCount = 0;
                    if (gnm.contig_ids && gnm.contig_lengths && gnm.contig_ids.length == gnm.contig_lengths.length) {
                        contigCount = gnm.contig_ids.length;
                    } else if (ctg && ctg.contigs) {
                        contigCount = ctg.contigs.length;
                    }

                    ////////////////////////////// Overview Tab //////////////////////////////
                    $('#'+pref+'overview').append('<table class="table table-striped table-bordered" \
                            style="margin-left: auto; margin-right: auto;" id="'+pref+'overview-table"/>');
                    var overviewLabels = ['KBase ID', 'Name', 'Domain', 'Genetic code', 'Source', "Source ID", "GC", "Taxonomy", "Size",
                                          "Number of Contigs", "Number of Genes"];

                    var tax = gnm.taxonomy;
                    if (tax == null)
                        tax = '';
                    var gc_content = gnm.gc_content;
                    if (gc_content) {
                        gc_content = Number(gc_content);
                        if (gc_content < 1.0)
                            gc_content *= 100;
                        gc_content = gc_content.toFixed(2) + " %";
                    } else {
                        gc_content = "Unknown";
                    }

                    var overviewData = [gnm.id, '<a href="/#dataview/'+self.ws_name+'/'+self.ws_id+'" target="_blank">'+gnm.scientific_name+'</a>',
                                        gnm.domain, gnm.genetic_code, gnm.source, gnm.source_id, gc_content, tax, gnm.dna_size,
                                        contigCount, gnm.features.length];

                    //XXX baloney Plants hack.
                    //Plant genes need different information, and we want to display the gene and transcript counts separately
                    //so if the domain is plants, add on the extra label, pop off the existing length value, and push on the length of genes and
                    //transcripts individually.
                    if (gnm.domain == 'Plant' || gnm.domain == 'Eukaryota') {
                        overviewLabels.push('Number of Transcripts');
                        var types = {};
                        $.each(gnm.features, function(i,v) {
                            if (types[v.type] == undefined) {types[v.type] = 0};
                            types[v.type]++;
                        });

                        overviewData.pop();
                        overviewData.push(types['locus']);
                        overviewData.push(types['CDS']);
                    }
                    //XXX end plants baloney here. There's more below for the Genes table.

                    //XXX this is hopelessly brittle since it relies upon injecting/removing specific fields at exact locations in the parallel arrays.
                    //these should be refactored - a single master list of all possible fields as objects ( { name : 'Kbase ID', value : gnm.id, id : 'kbase_id' } )
                    //and then different lists built with the lookup keys depending upon the genome type, the way that the tab ids are built up above. I don't want
                    //to do that right now. :-/

                    if (genomeType != 'genome') {
                        //XXX plants baloney - don't display the subtype if it's plant or eukaryota domain
                        if (gnm.domain != 'Plant' && gnm.domain != 'Eukaryota') {
                          overviewLabels.splice(3, 0, 'Subtype');
                        }
                        overviewData.splice(3, 0, genomeType);
                    }

                    if (genomeType == 'transcriptome') {
                        overviewLabels.splice(7,1);
                        overviewData.splice(7,1);
                        overviewLabels.splice(9,1);
                        overviewData.splice(9,1);
                    }
                    //end brittleness.


                    var overviewTable = $('#'+pref+'overview-table');
                    for (var i=0; i<overviewData.length; i++) {
                        if (overviewLabels[i] === 'Taxonomy') {
                            overviewTable.append('<tr><td  width="33%">' + overviewLabels[i] + '</td> \
                                    <td><textarea style="width:100%;" cols="2" rows="3" readonly>'+overviewData[i]+'</textarea></td></tr>');
                        } else {
                            overviewTable.append('<tr><td>'+overviewLabels[i]+'</td> \
                                    <td>'+overviewData[i]+'</td></tr>');
                        }
                    }

                    ////ontology tab - should be lazily loaded, but we can't since we need to check for existence to know if we display the tab at all.
                    if (gnm.ontology_mappings.length) {
                      var ontologyTab = $('#' + pref + 'ontology');
                      ontologyTab.empty();
                      ontologyTab.append('<table cellpadding="0" cellspacing="0" border="0" id="'+pref+'ontology-table" \
                      class="table table-bordered table-striped" style="width: 100%; margin-left: 0px; margin-right: 0px;"/>');

                      var ontologySettings = {
                          "paginationType": "full_numbers",
                          "displayLength": 10,
                          "sorting": [[ 0, "asc" ], [1, "asc"]],
                          "columns": [
                              {title: "Gene ID", data: "id"},
                              {title: "# of ontology terms", data: "num"},
                              {title: "Ontology term name", data: "name"},
                              {title: "Ontology term ID", data: "term"},
                              {title: "Evidence count", data: "evidence_count"},
                          ],
                          createdRow: function (row, data, index) {

                              var $linkCell = $('td', row).eq(3);
                              var k = $linkCell.text();
                              $linkCell.empty();

                              $linkCell.append($.jqElem('a')
                                        .on('click', function(e) {
                                          var $tabDiv = $.jqElem('div').kbaseOntologyDictionary({ term_id : k});
                                          tabObj.addTab({tab: k, content: $tabDiv.$elem, canDelete : true, show: true});
                                        })
                                        .append(k));

                          }
                      };

                      var ontologyTable = $('#'+pref+'ontology-table').DataTable(ontologySettings);
                      var ontologyData  = [];

                      $.each(
                        gnm.ontology_mappings,
                        function(i, v) {
                          //ick. Need to double loop to tally up number of terms in advance. There's gotta be a more efficient way to do this.
                          v.num_terms = 0;
                          $.each(
                            v.ontology_terms,
                            function (k, o) {
                              v.num_terms += Object.keys(o).length
                            }
                          );
                          $.each(
                            v.ontology_terms,
                            function (k, o) {
                              $.each(
                                v.ontology_terms[k],
                                function (k, t) {
                                  ontologyData.push(
                                    {
                                      'id' : v.id,
                                      'num' : v.num_terms,
                                      'term' : k,
                                      'evidence_count' : t.evidence.length,
                                      'name' : t.term_name,
                                    }
                                  )
                                }
                              )
                            }
                          )
                        }
                      );
                      console.log("OD ", ontologyData[0]);

                      //ontologyTable.fnAddData(ontologyData);
                      ontologyTable.rows.add(ontologyData).draw();

                    }

                    ///////////////////// Contigs and Genes (lazy loading) /////////////////////
                    var contigsDiv = $('#'+pref+'contigs');
                    contigsDiv.append("<div><img src=\""+self.loadingImage+"\">&nbsp;&nbsp;loading contig data...</div>");

                    var genesDiv = $('#'+pref+'genes');
                    genesDiv.append("<div><img src=\""+self.loadingImage+"\">&nbsp;&nbsp;loading genes data...</div>");

                    //XXX plants baloney - only plants have a CDS tab.
                    var cdsDiv = $('#'+pref+'cds');
                    if (cdsDiv) {
                        cdsDiv.append("<div><img src=\""+self.loadingImage+"\">&nbsp;&nbsp;loading cds data...</div>");
                    }

                    var genesAreShown = false;

                    var liElems = tabPane.find('li');
                    for (var liElemPos = 0; liElemPos < liElems.length; liElemPos++) {
                        var liElem = $(liElems.get(liElemPos));
                        var aElem = liElem.find('a');
                        if (aElem.length != 1)
                            continue;
                        var dataTab = aElem.attr('data-tab');
                        //XXX plants baloney - only plants have a CDS tab.
                        if (dataTab === 'Contigs' || dataTab === 'Genes' || dataTab === 'CDS') {
                            aElem.on('click', function() {
                                if (!genesAreShown) {
                                    genesAreShown = true;
                                    self.prepareGenesAndContigs(pref, kbws, gnm, tabObj);
                                }
                            });
                        } else if (dataTab === 'Search' ) {
                            aElem.on('click', function() {
                                self.buildGeneSearchView({
                                    $div: $('#'+pref+'search'),
                                    genomeSearchAPI: self.genomeSearchAPI,
                                    ref: self.ws_name + "/" + self.ws_id,
                                    idClick: null //function(feature) {
                                    //    console.log(feature);
                                    //}
                                })
                            });
                        }



                    }





            };

            container.empty();
            container.append("<div><img src=\""+self.loadingImage+"\">&nbsp;&nbsp;loading genome data...</div>");

            var included = ["/complete","/contig_ids","/contig_lengths","contigset_ref","assembly_ref", "/dna_size",
                            "/domain","/gc_content","/genetic_code","/id","/md5","num_contigs",
                            "/scientific_name","/source","/source_id","/tax_id","/taxonomy",
                            "/features/[*]/type", "/features/[*]/unknownfield", "/features/[*]/location", "/features/[*]/ontology_terms","/features/[*]/id"];
            kbws.get_object_subset([{ref: self.ws_name + "/" + self.ws_id, included: included}], function(data) {
                var gnm = data[0].data;
                if (gnm.contig_ids && gnm.contig_lengths && gnm.contig_ids.length == gnm.contig_lengths.length) {
                    ready(gnm, null);
                } else {
                    var contigSetRef = gnm.contigset_ref;
                    if (gnm.contigset_ref) {
                        kbws.get_object_subset([{ref: contigSetRef, included: ['contigs/[*]/unknownfield']}], function(data2) {
                            var ctg = data2[0].data;
                            ready(gnm, ctg);
                        }, function(data2) {
                            container.empty();
                            container.append('<p>[Error] ' + data2.error.message + '</p>');
                        });
                    } else if (gnm.assembly_ref) {

                        ready(gnm,null);
                    } else {
                        container.empty();
                        container.append('Genome object has unsupported structure (no contig-set or assembly)!');
                    }
                }
            }, function(data) {
                container.empty();
                container.append('<p>[Error] ' + data.error.message + '</p>');
            });
            return this;
        },

        prepareGenesAndContigs: function(pref, kbws, gnm, tabPane) {
            var self = this;
            var subsetRequests = [{ref: self.ws_name + "/" + self.ws_id, included:
                ["/features/[*]/aliases","/features/[*]/annotations",
                 "/features/[*]/function","/features/[*]/id","/features/[*]/location",
                 "/features/[*]/protein_translation_length",
                 "/features/[*]/dna_translation_length","/features/[*]/type"]
            }];
            if (!(gnm.contig_ids && gnm.contig_lengths && gnm.contig_ids.length == gnm.contig_lengths.length)) {
                var contigSetRef = gnm.contigset_ref;
                subsetRequests.push({ref: contigSetRef, included: ['contigs/[*]/id', 'contigs/[*]/length']});
            }
            kbws.get_object_subset(subsetRequests, function(data) {
                gnm.features = data[0].data.features;

                ////////////////////////////// Genes Tab //////////////////////////////
                var geneTab = $('#'+pref+'genes');
                geneTab.empty();
                geneTab.append('<table cellpadding="0" cellspacing="0" border="0" id="'+pref+'genes-table" \
                class="table table-bordered table-striped" style="width: 100%; margin-left: 0px; margin-right: 0px;"/>');
                var genesData = [];
                var geneMap = {};
                var contigMap = {};

                var cdsData = [] //XXX plants baloney. Extra tab for CDS data. See below on line 372 or so.
                var mrnaData = [] //XXX plants baloney. We throw away mrnaData. See below on line 372 or so.

                if (data.length > 1) {
                    var ctg = data[1].data;
                    for (var pos in ctg.contigs) {
                        var contigId = ctg.contigs[pos].id;
                        var contigLen = ctg.contigs[pos].length;
                        contigMap[contigId] = {name: contigId, length: contigLen, genes: []};
                    }
                } else {
                    for (var pos in gnm.contig_ids) {
                        var contigId = gnm.contig_ids[pos];
                        var contigLen = gnm.contig_lengths[pos];
                        contigMap[contigId] = {name: contigId, length: contigLen, genes: []};
                    }
                }

                function geneEvents() {
                    $('.'+pref+'gene-click').unbind('click');
                    $('.'+pref+'gene-click').click(function() {
                        var geneId = [$(this).data('geneid')];
                        showGene(geneId);
                    });
                }

                var genomeType = self.genomeType(gnm);

                for (var genePos in gnm.features) {
                    var gene = gnm.features[genePos];
                    gene.arrPos = genePos;
                    var geneId = gene.id;
                    var contigName = null;
                    var geneStart = null;
                    var geneDir = null;
                    var geneLen = null;
                    if (gene.location && gene.location.length > 0) {
                        contigName = gene.location[0][0];
                        geneStart = gene.location[0][1];
                        geneDir = gene.location[0][2];
                        geneLen = gene.location[0][3];
                    }

                    if (genomeType == 'transcriptome') {
                        geneLen = gene.dna_translation_length || gene.protein_translation_length || '';
                    }

                    var geneType = gene.type;
                    var geneFunc = gene['function'];
                    if (!geneFunc)
                        geneFunc = '-';

                    //XXX plants baloney - if it's non plant, it just goes into the genes array.
                    //but if it is plants, then we split it up - same data, two different tabs.
                    //locus data goes on the genes tab, cds data goes on the cds tab.
                    //We're also creating an mrnaData array for mrna data, but we're just throwing that out later.

                    var dataArray = [];
                    if ((gnm.domain != 'Plant' && gnm.domain != 'Eukaryota') || gene.type == 'locus') {
                      dataArray = genesData;
                    }
                    else if (gene.type == 'CDS') {
                      dataArray = cdsData;
                    }
                    else if (gene.type == 'mRNA') {
                      dataArray = mrnaData;
                    }

                    dataArray.push({
                        // id: '<a href="/#dataview/'+self.ws_name+'/'+self.ws_id+'?sub=Feature&subid='+geneId+'" target="_blank">'+geneId+'</a>',
                        id: '<a class="'+pref+'gene-click" data-geneid="'+geneId+'">'+geneId+'</a>',
                        // contig: contigName,
                        contig: '<a class="' + pref + 'contig-click" data-contigname="'+contigName+'">' + contigName + '</a>',
                        start: geneStart,
                        dir: geneDir,
                        len: geneLen,
                        type: geneType,
                        func: geneFunc
                    });
                    geneMap[geneId] = gene;
                    var contig = contigMap[contigName];
                    if (contigName != null && !contig) {
                        contig = {name: contigName, length: 0, genes: []};
                        contigMap[contigName] = contig;
                    }
                    if (contig) {
                        var geneStop = Number(geneStart);
                        if (geneDir == '+')
                            geneStop += Number(geneLen);
                        if (contig.length < geneStop) {
                            contig.length = geneStop;
                        }
                        contig.genes.push(gene);
                    }
                }
                var genesSettings = {
                    "sPaginationType": "full_numbers",
                    "iDisplayLength": 10,
                    "aaSorting": [[ 1, "asc" ], [2, "asc"]],
                    "aoColumns": [
                                  {sTitle: "Gene ID", mData: "id"},
                                  {sTitle: "Contig", mData: "contig"},
                                  {sTitle: "Start", mData: "start"},
                                  {sTitle: "Strand", mData: "dir"},
                                  {sTitle: "Length", mData: "len"},
                                  {sTitle: "Type", mData: "type"},
                                  {sTitle: "Function", mData: "func"}
                                  ],
                                  "aaData": [],
                                  "oLanguage": {
                                      "sSearch": "Search gene:",
                                      "sEmptyTable": "No genes found."
                                  },
                                  "fnDrawCallback": function() { geneEvents(); contigEvents(); }
                };

                //XXX plants baloney - plants are a special case. If it's in plants or eukaryota, then we use the simpler display with less data.
                if (genomeType == 'transcriptome' || gnm.domain == 'Plant' || gnm.domain == 'Eukaryota') {
                    genesSettings.aoColumns = [
                        {sTitle: "Gene ID", mData: "id"},
                        {sTitle: "Length", mData: "len"},
                        {sTitle: "Function", mData: "func"}
                    ];

                    // XXX more plants baloney. Remove the length column
                    if (gnm.domain == 'Plant' || gnm.domain == 'Eukaryota') {
                        genesSettings["aaSorting"] = [[ 0, "asc" ], [1, "asc"]];
                        genesSettings.aoColumns.splice(1,1);
                    }
                    // XXX done with plants
                }

                var genesTable = $('#'+pref+'genes-table').dataTable(genesSettings);
                if (genesData.length) {
                    genesTable.fnAddData(genesData);
                }

                //XXX plants baloney - build up the CDS div, if necessary.
                if (gnm.domain == 'Plant' || gnm.domain == 'Eukaryota') {

                    var cdsTab = $('#'+pref+'cds');
                    cdsTab.empty();
                    cdsTab.append('<table cellpadding="0" cellspacing="0" border="0" id="'+pref+'cds-table" \
                    class="table table-bordered table-striped" style="width: 100%; margin-left: 0px; margin-right: 0px;"/>');

                    var cdsSettings = {
                        "sPaginationType": "full_numbers",
                        "iDisplayLength": 10,
                        "aaSorting": [[ 0, "asc" ], [1, "asc"]],
                        "aoColumns": [
                            {sTitle: "Gene ID", mData: "id"},
                            {sTitle: "Function", mData: "func"}
                        ]
                    };

                    var cdsTable = $('#'+pref+'cds-table').dataTable(cdsSettings);
                    if (cdsData.length) {
                        cdsTable.fnAddData(cdsData);
                    }
                }
                //XXX done with plants

                ////////////////////////////// Contigs Tab //////////////////////////////
                var contigTab = $('#'+pref+'contigs');
                contigTab.empty();
                contigTab.append($('<div>').append('<table cellpadding="0" cellspacing="0" border="0" id="'+pref+'contigs-table" '+
                    'class="table table-bordered table-striped" style="width: 100%; margin-left: 0px; margin-right: 0px;"/>'));
                var contigsData = [];

                function contigEvents() {
                    $('.'+pref+'contig-click').unbind('click');
                    $('.'+pref+'contig-click').click(function() {
                        var contigId = [$(this).data('contigname')];
                        showContig(contigId);
                    });
                }

                for (var key in contigMap) {
                    if (!contigMap.hasOwnProperty(key))
                        continue;
                    var contig = contigMap[key];
                    contigsData.push({name: '<a class="'+pref+'contig-click" data-contigname="'+contig.name+'">'+contig.name+'</a>',
                        length: contig.length, genecount: contig.genes.length});
                }
                var contigsSettings = {
                        "sPaginationType": "full_numbers",
                        "iDisplayLength": 10,
                        "aaSorting": [[ 1, "desc" ]],
                        "aoColumns": [
                                      {sTitle: "Contig name", mData: "name"},
                                      {sTitle: "Length", mData: "length"},
                                      {sTitle: "Genes", mData: "genecount"}
                                      ],
                                      "aaData": [],
                                      "oLanguage": {
                                          "sSearch": "Search contig:",
                                          "sEmptyTable": "No contigs found."
                                      },
                                      "fnDrawCallback": contigEvents
                };
                var contigsTable = $('#'+pref+'contigs-table').dataTable(contigsSettings);
                contigsTable.fnAddData(contigsData);

                ////////////////////////////// New Tab //////////////////////////////
                var lastElemTabNum = 0;

                function openTabGetId(tabName) {
                    if (tabPane.hasTab(tabName))
                        return null;
                    lastElemTabNum++;
                    var tabId = '' + pref + 'elem' + lastElemTabNum;
                    var tabDiv = $('<div id="'+tabId+'"> ');
                    tabPane.addTab({tab: tabName, content: tabDiv, canDelete : true, show: true, deleteCallback: function(name) {
                        tabPane.removeTab(name);
                        tabPane.showTab(tabPane.activeTab());
                    }});
                    return tabId;
                }

                function showGene(geneId) {
                    var tabId = openTabGetId(geneId);
                    if (tabId == null) {
                        tabPane.showTab(geneId);
                        return;
                    }
                    var gene = geneMap[geneId];
                    var contigName = null;
                    var geneStart = null;
                    var geneDir = null;
                    var geneLen = null;
                    if (gene.location && gene.location.length > 0) {
                        contigName = gene.location[0][0];
                        geneStart = gene.location[0][1];
                        geneDir = gene.location[0][2];
                        geneLen = gene.location[0][3];
                    }
                    var geneType = gene.type;
                    var geneFunc = gene['function'];
                    var geneAnn = '';
                    if (gene['annotations'])
                        geneAnn = gene['annotations'];
                    $('#'+tabId).append('<table class="table table-striped table-bordered" \
                            style="margin-left: auto; margin-right: auto;" id="'+tabId+'-table"/>');
                    var elemLabels = ['Gene ID', 'Contig name', 'Gene start', 'Strand', 'Gene length', "Gene type", "Function", "Annotations"];
                    var elemData = ['<a href="/#dataview/'+self.ws_name+'/'+self.ws_id+'?sub=Feature&subid='+geneId+'" target="_blank">'+geneId+'</a>',
                                    '<a class="'+tabId+'-click2" data-contigname="'+contigName+'">' + contigName + '</a>',
                                    geneStart, geneDir, geneLen, geneType, geneFunc, geneAnn];
                    var elemTable = $('#'+tabId+'-table');
                    for (var i=0; i<elemData.length; i++) {
                        if (elemLabels[i] === 'Function') {
                            elemTable.append('<tr><td>' + elemLabels[i] + '</td> \
                                    <td><textarea style="width:100%;" cols="2" rows="3" readonly>'+elemData[i]+'</textarea></td></tr>');
                        } else if (elemLabels[i] === 'Annotations') {
                            elemTable.append('<tr><td>' + elemLabels[i] + '</td> \
                                    <td><textarea style="width:100%;" cols="2" rows="3" readonly>'+elemData[i]+'</textarea></td></tr>');
                        } else {
                            elemTable.append('<tr><td>'+elemLabels[i]+'</td> \
                                    <td>'+elemData[i]+'</td></tr>');
                        }
                    }
                    elemTable.append('<tr id="seq-loader"><td colspan=2><img src="' + self.loadingImage + '"></td></tr>');
                    Promise.resolve(kbws.get_object_subset([{
                        ref: self.ws_name + "/" + self.ws_id,
                        included: ['/features/' + gene.arrPos + '/protein_translation',
                                   '/features/' + gene.arrPos + '/dna_sequence']
                    }])).then(function(data) {
                        elemTable.find('#seq-loader').remove();
                        data = data[0].data;
                        if (data.features) {
                            var f = data.features[0];
                            if (f.protein_translation) {
                                elemTable.append('<tr><td>Protein Translation</td><td><div class="kb-ga-seq">' + f.protein_translation + '</div></td></tr>');
                            }
                            if (f.dna_sequence) {
                                elemTable.append('<tr><td>Nucleotide Sequence</td><td><div class="kb-ga-seq">' + f.dna_sequence + '</div></td></tr>');
                            }
                        }
                    });
                    $('.'+tabId+'-click2').click(function() {
                        showContig($(this).data('contigname'));
                    });
                    tabPane.showTab(geneId);
                }

                function showContig(contigName) {
                    var tabId = openTabGetId(contigName);
                    if (tabId == null) {
                        tabPane.showTab(contigName);
                        return;
                    }
                    var contig = contigMap[contigName];
                    $('#'+tabId).append('<table class="table table-striped table-bordered" \
                            style="margin-left: auto; margin-right: auto;" id="'+tabId+'-table"/>');
                    var elemLabels = ['Contig name', 'Length', 'Gene count'];
                    var elemData = [contigName, contig.length, contig.genes.length];
                    var elemTable = $('#'+tabId+'-table');
                    for (var i=0; i<elemData.length; i++) {
                        elemTable.append('<tr><td>'+elemLabels[i]+'</td><td>'+elemData[i]+'</td></tr>');
                    }
                    var cgb = new ContigBrowserPanel();
                    cgb.data.options.contig = contig;
                    cgb.data.options.svgWidth = self.width - 28;
                    cgb.data.options.onClickFunction = function(svgElement, feature) {
                        showGene(feature.feature_id);
                    };
                    cgb.data.options.token = self.token;
                    cgb.data.$elem = $('<div style="width:100%; height: 200px;"/>');
                    cgb.data.$elem.show(function(){
                        cgb.data.update();
                    });
                    $('#'+tabId).append(cgb.data.$elem);
                    cgb.data.init();
                    tabPane.showTab(contigName);
                }
            }, function(data) {
                container.empty();
                container.append('<p>[Error] ' + data.error.message + '</p>');
            });
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
