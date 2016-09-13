/**
 * Output widget for visualization of genome annotation.
 * @public
 */

/*

Known issues:
1) resize window sets svg width to zero of contig browser of non-visible tabs, so they dissappear
2) we don't know the length of the contig when rendering the gene context browser, so scale goes
   beyond the actual contig

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
                        [{'module_name': "GenomeSearchUtil", 'version': 'dev'}], 
                    function(status){
                        self.genomeSearchAPI = new GenomeSearchUtil(status[0].url, token, null, null, null, null, false);
                    },
                    function(error){console.error(error);});

            return this;
        },


        tabData : function(genome) {
            //normally, we just have an Overview, Contigs, and Genes tab.
            var names = ['Overview', 'Browse Features'];
            var ids = ['overview', 'browse_features'];

            /*if (genome.ontology_mappings.length) {
                names.push('Ontology');
                ids.push('ontology');
            }*/

            return {
                names : names,
                ids : ids
            };
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
                        }
                    }
                } 
                $tr.append($td);

                if(rowData['global_location']) {
                    var loc = rowData['global_location'];
                    $tr.append($('<td>').append(numberWithCommas(loc['start'])));
                    $tr.append($('<td>').append(loc['strand']));
                    $tr.append($('<td>').append(numberWithCommas(loc['length'])));
                    if(contigClick) {
                        var getCallback = function(rowData) { return function() {contigClick(loc['contig_id']);}};
                        $tr.append($('<td>').append(
                            $('<a>').css('cursor','pointer').append(loc['contig_id'])
                                .on('click',getCallback(loc['contig_id'])))
                        );
                    } else {
                        $tr.append($('<td>').append($('<div>').css('word-break','break-all').append(loc['contig_id'])));
                    }
                }
                return $tr;
            };

            var renderResult = function($table, results) {
                $table.find("tr:gt(0)").remove();
                $loadingDiv.empty();
                $noResultsDiv.hide();
                clearInfo();

                var features = results['features']
                if(features.length>0) {
                    for(var k=0; k<features.length; k++) {
                        $table.append(buildRow(features[k]));
                    }
                    n_results = results['num_found'];
                    showViewInfo(results['start'], features.length, results['num_found']);
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
                    search($input.val(), start, limit, sort_by)
                        .then(function(result) {
                                if(isLastQuery(result)) { renderResult($table, result); }
                                inFlight=false;
                                start=0;
                            })
                        .fail(function(){ inFlight=false; });
                };

                $colgroup.append($('<col span=1>').css('width','20%'))
                var h = buildColumnHeader('Feature ID', 'feature_id', sortEvent);
                $tr.append(h.$th);
                h.$sortIcon.addClass('fa fa-sort-desc');
                cols[h.id] = h;

                $colgroup.append($('<col span=1>').css('width','5%'))
                var h = buildColumnHeader('Type', 'feature_type', sortEvent);
                $tr.append(h.$th);
                cols[h.id] = h;


                $colgroup.append($('<col span=1>').css('width','20%'))
                var h = buildColumnHeader('Function', 'function', sortEvent);
                $tr.append(h.$th);
                cols[h.id] = h;

                $colgroup.append($('<col span=1>').css('width','20%'))
                var h = buildColumnHeader('Aliases', 'aliases', null);
                $tr.append(h.$th);
                cols[h.id] = h;


                $colgroup.append($('<col span=1>').css('width','5%'))
                var h = buildColumnHeader('Start', 'start', sortEvent);
                $tr.append(h.$th);
                cols[h.id] = h;


                $colgroup.append($('<col span=1>').css('width','5%'))
                var h = buildColumnHeader('Strand', 'strand', sortEvent);
                $tr.append(h.$th);
                cols[h.id] = h;

                $colgroup.append($('<col span=1>').css('width','5%'))
                var h = buildColumnHeader('Length', 'length', sortEvent);
                $tr.append(h.$th);
                cols[h.id] = h;

                var h = buildColumnHeader('Contig', 'contig_id', sortEvent);
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
                   /* if (gnm.domain == 'Plant' || gnm.domain == 'Eukaryota') {
                        overviewLabels.push('Number of Transcripts');
                        var types = {};
                        $.each(gnm.features, function(i,v) {
                            if (types[v.type] == undefined) {types[v.type] = 0};
                            types[v.type]++;
                        });

                        overviewData.pop();
                        overviewData.push(types['locus']);
                        overviewData.push(types['CDS']);
                    }*/
                    //XXX end plants baloney here. There's more below for the Genes table.



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

                    var liElems = tabPane.find('li');
                    for (var liElemPos = 0; liElemPos < liElems.length; liElemPos++) {
                        var liElem = $(liElems.get(liElemPos));
                        var aElem = liElem.find('a');
                        if (aElem.length != 1)
                            continue;
                        var dataTab = aElem.attr('data-tab');
                        if (dataTab === 'Browse Features' ) {
                            aElem.on('click', function() {
                                var genome_ref = self.ws_name + "/" + self.ws_id;
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

        showContigTab: function(genome_ref, contigId, pref, tabPane) {

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
            };


            function getFeaturesInRegionAndRenderBrowser(genome_ref, contig_id, start, length, contig_length, $div) {
                self.genomeSearchAPI
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


            function getContigData(genome_ref, contigId) {
                return {contig_id:contigId, length:500, gc_content:'50%', n_features:'3' };

                /*self.genomeSearchAPI
                        .search_region({
                            ref: genome_ref,
                            query_contig_id: contig_id,
                            query_region_start: start,
                            query_region_length: length,
                            page_start: 0,
                            page_limit: 2000
                        })
                        .then(function(result) {*/

            };


            function showContig(contigData) {

                var contig_id = contigData['contig_id'];
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
                var $tblRow = $('<div>').addClass('row').css({'margin-top':'15px'})
                                        .append($('<div>').addClass('col-md-12').append($tbl));
                var $browserCtrlRow = $('<div>').addClass('row').css({'margin-top':'15px'})
                                        .append($('<div>').addClass('col-md-12').append($browserCtrlDiv));
                var $browserRow = $('<div>').addClass('row').css({'margin-top':'15px'})
                                        .append($('<div>').addClass('col-md-12').append($browserDiv));
                $container.append($tblRow).append($browserCtrlRow).append($browserRow);


                // ID
                var $id = $('<tr>')
                            .append($('<td>').append('Contig ID'))
                            .append($('<td>').append(contig_id));
                $tbl.append($id);

                // Length
                /*var $len = $('<tr>')
                            .append($('<td>').append('Length'))
                            .append($('<td>').append(numberWithCommas(contigData['length'])));
                $tbl.append($len);

                // GC
                var $gc = $('<tr>')
                            .append($('<td>').append('GC Content'))
                            .append($('<td>').append(contigData['gc_content']));
                $tbl.append($gc);

                // N Features
                var $nFeatures = $('<tr>')
                            .append($('<td>').append('Number of Features'))
                            .append($('<td>').append(contigData['n_features']));
                $tbl.append($nFeatures);*/


                // Browser
                $browserRow.append($('<i class="fa fa-spinner fa-spin fa-2x">'));
                var start = 0;
                var tenKb = 10000;
                var twentyKb = 20000;
                var length = twentyKb;
                var contig_length = start + twentyKb;




                var $contigScrollBack = $('<button class="btn btn-default">')
                                            .append('<i class="fa fa-caret-left" aria-hidden="true">')
                                            .append(' back 20kb')
                                            .on('click', function() {
                                                if(start-twentyKb < 0) { return; }
                                                $browserRow.append($('<i class="fa fa-spinner fa-spin fa-2x">'));
                                                start = start - twentyKb;
                                                length = twentyKb;
                                                contig_length = start + twentyKb;
                                                getFeaturesInRegionAndRenderBrowser(genome_ref, contig_id, start, length, contig_length, $browserRow);
                                            });
                var $contigScrollForward = $('<button class="btn btn-default">')
                                            .append('forward 20kb ')
                                            .append('<i class="fa fa-caret-right" aria-hidden="true">')
                                            .on('click', function() {
                                                $browserRow.append($('<i class="fa fa-spinner fa-spin fa-2x">'));
                                                start = start + twentyKb;
                                                length = twentyKb;
                                                contig_length = start + twentyKb;
                                                getFeaturesInRegionAndRenderBrowser(genome_ref, contig_id, start, length, contig_length, $browserRow);
                                            });

                $browserCtrlDiv.append($contigScrollBack).append($contigScrollForward);

                getFeaturesInRegionAndRenderBrowser(genome_ref, contig_id, start, length, contig_length, $browserRow);

            }

            var contigData = getContigData(genome_ref, contigId);
            showContig(contigData);

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

                var $posTD = $('<td>').css({'text-align': 'right', 'border':'0'});
                var $seqTD = $('<td>').css({'border':'0'});
                for (var i = 0; i < sequence.length; i++) {
                    if(i>0 && i%charWrap===0) {
                        $posTD.append('<br>');
                        $seqTD.append('<br>');
                        $posTD.append($('<span>').css({color:'#777'}).append(i+1).append(':&nbsp;'));
                    } else if (i==0) {
                        $posTD.append($('<span>').css({color:'#777'}).append(i+1).append(':&nbsp;'));
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

                return $div;
            }

            function printDNA(sequence, charWrap) {
                var $div = $('<div>').css({'font-family': '"Lucida Console", Monaco, monospace'});
                
                var $posTD = $('<td>').css({'text-align': 'right', 'border':'0'});
                var $seqTD = $('<td>').css({'border':'0'});
                for (var i = 0; i < sequence.length; i++) {
                    if(i>0 && i%charWrap===0) {
                        $posTD.append('<br>');
                        $seqTD.append('<br>');
                        $posTD.append($('<span>').css({color:'#777'}).append(i+1).append(':&nbsp;'));
                    } else if (i==0) {
                        $posTD.append($('<span>').css({color:'#777'}).append(i+1).append(':&nbsp;'));
                    }

                    var color = '#000';
                    var base = sequence[i];
                    $seqTD.append($('<span>').css({'color':color}).append(base));
                }
                $div.append($('<table>').css({'border':'0','border-collapse':'collapse'}).append(
                        $('<tr>').css({'border':'0'}).append($posTD).append($seqTD)));

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
                var $tblRow = $('<div>').addClass('row').css({'margin-top':'15px'})
                                    .append($('<div>').addClass('col-md-12').append($tbl));
                $container.append($tblRow);

                var tblLabels = [];
                var tblData = [];


                tblLabels.push('Feature ID');
                tblData.push('<a href="/#dataview/'+self.ws_name+'/'+self.ws_id+'?sub=Feature&subid='+fid+'" target="_blank">'+fid+'</a>');

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
                tblData.push(featureData['function']);


                tblLabels.push('Location');
                var $loc = $('<div>');
                $loc.append('Contig:&nbsp;');
                $loc.append($('<a>').append(featureData['global_location']['contig_id'])
                                .css({'cursor':'pointer'})
                                .on('click', function() {
                                    self.showContigTab(genome_ref, featureData['global_location']['contig_id'], pref, tabPane);
                                }));
                $loc.append('<br>');

                if(featureData['location']) {
                    var locs = featureData['location'];
                    for(var i=0; i<locs.length; i++) {
                        if(i>0) { $loc.append('<br>'); }
                        var loc = locs[i];
                        var bounds = getFeatureLocationBounds(loc);
                        $loc.append(numberWithCommas(bounds['start'])+'&nbsp;-&nbsp;' +numberWithCommas(bounds['end'])+'&nbsp;('+loc['strand']+'&nbsp;Strand)');
                    }
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
                                    .append($('<td>').append(tblLabels[i]))
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

                var contigData = {
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
                contigData['length'] = search_stop;

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
                                            contigData['genes'].push(translate_feature_data(result['features'][f]));
                                        }
                                        var cgb = new ContigBrowserPanel();
                                        cgb.data.options.contig = contigData;
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
