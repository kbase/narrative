(function( $, undefined ) {

return KBWidget({
    name: "kbaseModelTabs",    
    version: "1.0.0",  
    parent : kbaseAuthenticatedWidget,
    options: {
    },
    
    loadingImage: window.kbconfig.loading_gif,
    //fbaURL: "https://kbase.us/services/fba_model_services",
    //fbaURL: "http://140.221.84.183:7036",
    fbaURL: window.kbconfig.urls.fba,

    getData: function() {
        return {
            id: this.options.id,
            type: "Model",
            workspace: this.options.ws,
            title: "Model Details"
        };
    },
    
    currentws:'',
    
    init: function(options) {
        this._super(options);
        const self = this;        
        const models = options.id;
        const workspaces = options.ws;
        self.currentws = options.ws;
        
        if ('modelsData' in options) {
            return render(options);
        } else {
            const container = this.$elem;
            container.append("<div id=\"modeltabs-loading\"><img src=\""+self.loadingImage+"\">&nbsp&nbsploading model...</div>");
            
            const fba = new fbaModelServices(this.fbaURL, {auth: self.authToken()});
            fba.get_models({auth: self.authToken(), workspaces:[options.ws], models:[options.id] }, (data) => {
                    self.$elem.find("#modeltabs-loading").remove();
                    options.modelsData = data;
                    self.render(options);
                }, (data) => {
                    self.$elem.find("#modeltabs-loading").remove();
                    container.append("<div>Error loading FBA model.</div>");
                    console.error("Error loading FBA model!");
                    console.error(data);
                });
            
        }
        return this;
    },
    render: function(options) {
        const data = options.modelsData;
        const model = data[0];
        const self = this;
        const container = this.$elem;

        const randId = this._uuidgen();

        container.append("<h4>" + options.id + "</h4>")
        container.append("<i>"+model.reactions.length +" reactions, "+model.compounds.length+" compounds, "+
                         parseInt(model.integrated_gapfillings.length+model.unintegrated_gapfillings.length)+" gapfill runs</i><br>")
        
        const tables = ['Reactions', 'Compounds', 'Compartment', 'Biomass', 'Gapfill', 'Gapgen'];
        const tableIds = [randId+'reaction', randId+'compound', randId+'compartment', randId+'biomass', randId+'gapfill', randId+'gapgen'];

        // build tabs
        const tabs = $('<ul id="'+randId+'table-tabs" class="nav nav-tabs"> \
                        <li class="active" > \
                        <a href="#'+tableIds[0]+'" data-toggle="tab" style="text-decoration:none">'+tables[0]+'</a> \
                      </li></ul>');
        for (var i=1; i<tableIds.length; i++) {
            tabs.append('<li><a href="#'+tableIds[i]+'" data-toggle="tab" style="text-decoration:none">'+tables[i]+'</a></li>');
        }

        // add tabs
        container.append(tabs);

        const tab_pane = $('<div id="tab-content" class="tab-content">')
        // add table views (don't hide first one)
        tab_pane.append('<div class="tab-pane in active" id="'+tableIds[0]+'"> \
                            <table cellpadding="0" cellspacing="0" border="0" id="'+tableIds[0]+'-table" \
                            class="table table-bordered table-striped" style="width: 100%; margin:0;"></table>\
                        </div>');

        for (var i=1; i<tableIds.length; i++) {
            const tableDiv = $('<div class="tab-pane in" id="'+tableIds[i]+'"> ');
            var table = $('<table cellpadding="0" cellspacing="0" border="0" id="'+tableIds[i]+'-table" \
                            class="table table-striped table-bordered" style="margin:0;">');
            tableDiv.append(table);
            tab_pane.append(tableDiv);
        }

        container.append(tab_pane)

        // event for showing tabs
        $('#'+randId+'table-tabs a').click(function (e) {
            e.preventDefault();
            $(this).tab('show');
        })

        const tableSettings = {
            "sPaginationType": "full_numbers",
            "iDisplayLength": 5,
            "aaData": [],
            "oLanguage": {
                "sSearch": "Search all:"
            }
        }


        
        //console.log("kbaseModelTabsNarrative");
        //console.log(model);

        // compartment table
        var dataDict = model.compartments;
        var keys = ["id", "index", "name", "pH", "potential"];
        var labels = ["id", "index", "name", "pH", "potential"];
        var cols = getColumns(keys, labels);
        tableSettings.aoColumns = cols;
        var table = $('#'+randId+'compartment-table').dataTable(tableSettings);
        table.fnAddData(dataDict);

        // reaction table
        var dataDict = formatRxnObjs(model.reactions);
        

 
        var keys = ["id","name", "definition",
                    "features","id"];
        var labels = ["Id (compartment)", "Name", "Equation",
                    "Genome Features Mapped to this Reaction"];
        var cols = getColumnsRxns(keys, labels);
        const rxnTableSettings = $.extend({}, tableSettings, {fnDrawCallback: rxnEvents});   
        rxnTableSettings.aoColumns = cols;
        var table = $('#'+randId+'reaction-table').dataTable(rxnTableSettings);
        table.fnAddData(dataDict);

        // compound table
        var dataDict = model.compounds;
        var keys = ["compartment", "compound", "name"];
        var labels = ["compartment", "compound", "name"];
        var cols = getColumns(keys, labels);
        tableSettings.aoColumns = cols;
        var table = $('#'+randId+'compound-table').dataTable(tableSettings);
        table.fnAddData(dataDict);

        // biomass table
        var dataDict = model.biomasses;
        var keys = ["definition", "id", "name"];
        var labels = ["definition", "id", "name"];
        var cols = getColumns(keys, labels);
        tableSettings.aoColumns = cols;
        var table = $('#'+randId+'biomass-table').dataTable(tableSettings);
        table.fnAddData(dataDict);

        // gapfilling table
        
        //var dataDict = model.integrated_gapfillings;
        //console.log(dataDict)
        var keys = ["id", "index", "name", "pH","potential"];
        var labels = ["id", "index", "name", "pH","potential"];
        var cols = getColumns(keys, labels);
        tableSettings.aoColumns = cols;
        var table = $('#gapfill-table').dataTable(tableSettings);
        gapFillTable(data);

        // gapgen table
        const model_gapgen = model.gapgen;
        var keys = ["id", "index", "name", "pH","potential"];
        var labels = ["id", "index", "name", "pH","potential"];
        var cols = getColumns(keys, labels);
        tableSettings.aoColumns = cols;
        var table = $('#'+randId+'gapgen-table').dataTable(tableSettings);

        function formatRxnObjs(rxnObjs) {
            const rxn_objs = []
            for (const i in rxnObjs) {
                const rxn = $.extend({}, rxnObjs[i] );
                
                const id = rxn.id.split('_')[0]
                const compart = rxn.id.split('_')[1]
                rxn.id = id + " ("+compart+")";
                //rxn.reaction = '<a class="rxn-click" data-rxn="'+rxn.reaction+'">'
                //            +rxn.reaction+'</a> ('+rxn.compartment+')'
                rxn.reaction = rxn.reaction+' ('+rxn.compartment+')';
                rxn.features = rxn.features.join('<br>')
                rxn_objs.push(rxn)
            }
            return rxn_objs;
        }

        function getColumnsRxns(keys, labels) {
            const cols = [];

            for (let i=0; i<keys.length; i++) {
                if (i===0) {
                    cols.push({sTitle: labels[i], mData: keys[i], sWidth:"15%"})
                } else {
                    cols.push({sTitle: labels[i], mData: keys[i]})
                }
            }
            return cols;
        }
        function getColumns(keys, labels) {
            const cols = [];

            for (let i=0; i<keys.length; i++) {
                cols.push({sTitle: labels[i], mData: keys[i]})
            }
            return cols;
        }

        function rxnEvents() {
            $('.rxn-click').unbind('click');
            $('.rxn-click').click(function() {
                const rxn = [$(this).data('rxn')];
                self.trigger('rxnClick', {rxns: rxn});
            });            
        }


        function gapFillTable(models) {
            let gapTable = undefined;
            let active = false;

            const init_data = {
              "sPaginationType": "full_numbers",
              "fnDrawCallback": events,      
              "iDisplayLength": 20,
              "aoColumns": [
                  { "sTitle": "Integrated?", "sWidth": "10%"},
                  {"bVisible":    false},
                  { "sTitle": "Gapfill Name (Object Reference)", "sWidth": "40%"},
                  { "sTitle": "Media"},
                  { "sTitle": "Media Object Reference", "sWidth": "20%"},
                  {"bVisible": false},
                  {"bVisible": false}
              ],     
              "oLanguage": {
                "sSearch": "Search all:",
                "sEmptyTable": "No gapfill objects for this model."
              }
            }

            const initTable = function(settings){
                if (settings) {
                    gapTable = $('#'+randId+'gapfill-table').dataTable(settings);
                } else { 
                    gapTable = $('#'+randId+'gapfill-table').dataTable(init_data);
                }

                //add_search_boxes()
            }

            function add_search_boxes() {
                const single_search = '<th rowspan="1" colspan="1"><input type="text" \
                                          name="search_reactions" placeholder="Search" \
                                          class="search_init input-mini"> \
                                     </th>';
                const searches = $('<tr>');
                $('#'+randId+'gapfill-table thead tr th').each(function(){
                    $(this).css('border-bottom', 'none');
                    searches.append(single_search);
                })

                $('#'+randId+'gapfill-table thead').append(searches);
                $("thead input").keyup( function () {
                    gapTable.fnFilter( this.value, $("thead input").index(this) );
                });

                active = true;                
            }

            this.load_table = function(models) {
                const gaps = [];

                const intGapfills = models[0].integrated_gapfillings;

                for (var i in intGapfills) {
                    const intGap = intGapfills[i];
                    if (intGap.length == 6) {
                        intGap.splice(0, 0, "Yes");
                        intGap.splice(2, 1, intGap[1]+"&nbsp ("+intGap[2]+')&nbsp&nbsp'+
                                        '<a class="show-gap" data-ref="'+intGap[1]+'" >view solution details</a>');
                    }
                }

                const unIntGapfills = models[0].unintegrated_gapfillings;
                for (var i in unIntGapfills) {
                    const unIntGap = unIntGapfills[i];
                    if (unIntGap.length == 6) {            
                        unIntGap.splice(0, 0, "No")
                        unIntGap.splice(2, 1,  unIntGap[1]+"&nbsp ("+unIntGap[2]+')&nbsp&nbsp'+
                                        '<a class="show-gap" data-ref="'+unIntGap[1]+'" >view/hide solution details</a>');
                    }
                }

                const gapfills = unIntGapfills.concat(intGapfills)                    
                

                init_data.aaData = gapfills;
                initTable();
                gapTable.fnSort( [[1,'desc']] );
                //gapTable.fnAddData(gapfills);
                //gapTable.fnAdjustColumnSizing()
            }

            this.load_table(models);

            function events() {
                // tooltip for version hover
                //$('.show-gap').tooltip({html: true, title:'show more info \
                //    <i class="icon-list-alt icon-white history-icon"></i>'
                //    , placement: 'right'});

                self.$elem.find('.show-gap').unbind('click');
                self.$elem.find('.show-gap').click(function() {
                    const gapRef = $(this).data('ref');

                    const tr = $(this).closest('tr')[0];
                    if ( gapTable.fnIsOpen( tr ) ) {
                        gapTable.fnClose( tr );
                    } else {
                        gapTable.fnOpen( tr, '', "info_row" );
                        $(this).closest('tr').next('tr').children('.info_row').append('<p class="muted loader-gap-sol"> \
                            <img src="'+self.loadingImage+'"> loading solutions...</p>')                
                        showGapfillSolutions(tr, gapRef)   
                    }
                });
            }

            function showGapfillSolutions(tr, gapRef) {
                const fba = new fbaModelServices(self.fbaURL);
                
                const gapAJAX = fba.get_gapfills({gapfills: [gapRef], workspaces: [self.currentws], auth: self.authToken()});
                $.when(gapAJAX).done((data) => {
                    $('.loader-gap-sol').remove();
                    //console.debug("gapfill:")
                    //console.debug(data);
                    var data = data[0];  // only one gap fill solution at a time is clicked
                    const sols = data.solutions;

                    //$(tr).next().children('td').append('<h5>Gapfill Details</h5>');

                    const solList = $('<div>').append("<br> "+ sols.length +" solutions found by this gapfill run<br>");
                    
                    for (const i in sols) {
                        const sol = sols[i];
                        //var solID = sol.id; // not correct currently, should be gapfill ID + ".gfsol.#"
                        const solID = gapRef+".gfsol."+(parseInt(i)+1)

                        solList.append("<br><i>solution id:</i>&nbsp&nbsp<b>"+solID+"<b><br>")
                        
                        const rxnAdditions = sol.reactionAdditions;
                        if (rxnAdditions.length == 0) {
                            const rxnInfo = $('<p>No reaction additions in this solution</p>')
                        } else {
                            var table = $('<table/>')
                                .addClass('table table-striped table-bordered')
                                .css({'margin-left': 'auto', 'margin-right': 'auto'});

                            const createTableRow = function(rxn_id, equation) {
                                    return "<tr><td>" + rxn_id + "</td><td>" + equation + "</td></tr>";
                            };
                            table.append(createTableRow("<b>New Rxn</b>","<b>Equation</b>"))
                            for (const j in rxnAdditions) {
                                const rxnArray = rxnAdditions[j];
                                table.append(createTableRow(rxnArray[0], rxnArray[4]));
                            }
                        }
                        solList.append(table)
                        solList.append("<br>")
                        
                    }
                    $(tr).next().children('td').append(solList.html());

                });

            }

        }

        //this._rewireIds(this.$elem, this);
        return this;
    },  //end init

    /**
     * uuid generator
     *
     * @private
     */
     _uuidgen: function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);});
     },

})
}( jQuery ) );