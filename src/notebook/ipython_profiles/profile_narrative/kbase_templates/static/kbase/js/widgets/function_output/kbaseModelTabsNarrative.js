(function( $, undefined ) {

$.KBWidget({
    name: "kbaseModelTabs",    
    version: "1.0.0",
    options: {
    },

    getData: function() {
        return {
            id: this.options.id,
            type: "Model",
            workspace: this.options.ws,
            title: "Model Details"
        };
    },

    init: function(options) {
        this._super(options);
        var self = this;        
        var models = options.id;
        var workspaces = options.ws;
        var data = options.modelsData;

        var container = this.$elem;

        var randId = this._uuidgen();

        container.append("<h4>" + options.id + "</h4>")
        
        var tables = ['Reactions', 'Compounds', 'Compartment', 'Biomass', 'Gapfill', 'Gapgen'];
        var tableIds = [randId+'reaction', randId+'compound', randId+'compartment', randId+'biomass', randId+'gapfill', randId+'gapgen'];

        // build tabs
        var tabs = $('<ul id="'+randId+'table-tabs" class="nav nav-tabs"> \
                        <li class="active" > \
                        <a href="#'+tableIds[0]+'" data-toggle="tab" style="text-decoration:none">'+tables[0]+'</a> \
                      </li></ul>');
        for (var i=1; i<tableIds.length; i++) {
            tabs.append('<li><a href="#'+tableIds[i]+'" data-toggle="tab" style="text-decoration:none">'+tables[i]+'</a></li>');
        }

        // add tabs
        container.append(tabs);

        var tab_pane = $('<div id="tab-content" class="tab-content">')
        // add table views (don't hide first one)
        tab_pane.append('<div class="tab-pane in active" id="'+tableIds[0]+'"> \
                            <table cellpadding="0" cellspacing="0" border="0" id="'+tableIds[0]+'-table" \
                            class="table table-bordered table-striped" style="width: 100%; margin:0;"></table>\
                        </div>');

        for (var i=1; i<tableIds.length; i++) {
            var tableDiv = $('<div class="tab-pane in" id="'+tableIds[i]+'"> ');
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

        var tableSettings = {
            "sPaginationType": "full_numbers",
            "iDisplayLength": 5,
            "aaData": [],
            "oLanguage": {
                "sSearch": "Search all:"
            }
        }


        model = data[0];
        console.log("kbaseModelTabsNarrative");
        console.log(model);

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

        var keys = ["reaction", "definition",
                    "features","name"];
        var labels = ["reaction", "equation",
                    "features","name"];
        var cols = getColumns(keys, labels);
        var rxnTableSettings = $.extend({}, tableSettings, {fnDrawCallback: rxnEvents});   
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
        /*
        var dataDict = model.integrated_gapfillings;
        console.log(dataDict)
        var keys = ["id", "index", "name", "pH","potential"];
        var labels = ["id", "index", "name", "pH","potential"];
        var cols = getColumns(keys, labels);
        tableSettings.aoColumns = cols;
        var table = $('#gapfill-table').dataTable(tableSettings);
        */
        gapFillTable(data);

        // gapgen table
        var model_gapgen = model.gapgen;
        var keys = ["id", "index", "name", "pH","potential"];
        var labels = ["id", "index", "name", "pH","potential"];
        var cols = getColumns(keys, labels);
        tableSettings.aoColumns = cols;
        var table = $('#'+randId+'gapgen-table').dataTable(tableSettings);

        function formatRxnObjs(rxnObjs) {
            var rxn_objs = []
            for (var i in rxnObjs) {
                var rxn = $.extend({}, rxnObjs[i] );
                rxn.reaction = '<a class="rxn-click" data-rxn="'+rxn.reaction+'">'
                            +rxn.reaction+'</a> ('+rxn.compartment+')'
                rxn.features = rxn.features.join('<br>')
                rxn_objs.push(rxn)
            }
            return rxn_objs;
        }

        function getColumns(keys, labels) {
            var cols = [];

            for (var i=0; i<keys.length; i++) {
                cols.push({sTitle: labels[i], mData: keys[i]})
            }
            return cols;
        }

        function rxnEvents() {
            $('.rxn-click').unbind('click');
            $('.rxn-click').click(function() {
                var rxn = [$(this).data('rxn')];
                self.trigger('rxnClick', {rxns: rxn});
            });            
        }


        function gapFillTable(models) {
            var gapTable = undefined;
            var active = false;

            var init_data = {
              "sPaginationType": "full_numbers",
              "fnDrawCallback": events,      
              "iDisplayLength": 20,
              "aoColumns": [
                  { "sTitle": "Integrated", "sWidth": "10%"},
                  {"bVisible":    false},
                  { "sTitle": "Ref", "sWidth": "40%"},
                  { "sTitle": "Media"},
                  { "sTitle": "Media WS", "sWidth": "20%"},
                  {"bVisible": false},
                  {"bVisible": false}
              ],     
              "oLanguage": {
                "sSearch": "Search all:",
                "sEmptyTable": "No gapfill objects for this model."
              }
            }

            var initTable = function(settings){
                if (settings) {
                    gapTable = $('#'+randId+'gapfill-table').dataTable(settings);
                } else { 
                    gapTable = $('#'+randId+'gapfill-table').dataTable(init_data);
                }

                //add_search_boxes()
            }

            function add_search_boxes() {
                var single_search = '<th rowspan="1" colspan="1"><input type="text" \
                                          name="search_reactions" placeholder="Search" \
                                          class="search_init input-mini"> \
                                     </th>';
                var searches = $('<tr>');
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
                var gaps = [];

                var intGapfills = models[0].integrated_gapfillings;

                for (var i in intGapfills) {
                    var intGap = intGapfills[i];
                    if (intGap.length == 6) {
                        intGap.splice(0, 0, "Yes");
                        intGap.splice(2, 1, '<a class="show-gap" data-ref="'+intGap[2]+'" >'
                            +intGap[2]+'</a>');
                    }
                }

                var unIntGapfills = models[0].unintegrated_gapfillings;
                for (var i in unIntGapfills) {
                    var unIntGap = unIntGapfills[i];
                    if (unIntGap.length == 6) {            
                        unIntGap.splice(0, 0, "No")
                        unIntGap.splice(2, 1, '<a class="show-gap" data-ref="'+unIntGap[2]+'" >'+
                            unIntGap[2]+'</a>');
                    }
                }

                if (unIntGapfills ) {
                    var gapfills = unIntGapfills.concat(intGapfills)                    
                }
                var gapfills = intGapfills;

                init_data.aaData = gapfills;
                initTable();
                gapTable.fnSort( [[1,'desc']] );
                //gapTable.fnAddData(gapfills);
                //gapTable.fnAdjustColumnSizing()
            }

            this.load_table(models);

            function events() {
                // tooltip for version hover
                $('.show-gap').tooltip({html: true, title:'show more info \
                    <i class="icon-list-alt icon-white history-icon"></i>'
                    , placement: 'right'});

                $('.show-gap').unbind('click');
                $('.show-gap').click(function() {
                    var gapRef = $(this).data('ref');

                    var tr = $(this).closest('tr')[0];
                    if ( gapTable.fnIsOpen( tr ) ) {
                        gapTable.fnClose( tr );
                    } else {
                        gapTable.fnOpen( tr, '', "info_row" );
                        $(this).closest('tr').next('tr').children('.info_row').append('<p class="muted loader-gap-sol"> \
                            <img src="assets/img/ajax-loader.gif"> loading possible solutions...</p>')                
                        showGapfillSolutions(tr, gapRef)   
                    }
                });
            }

            function showGapfillSolutions(tr, gapRef) {
                var gapAJAX = fba.get_gapfills({gapfills: [gapRef], workspaces: ["NO_WORKSPACE"], auth: USER_TOKEN});
                $.when(gapAJAX).done(function(data) {
                    var data = data[0];  // only one gap fill solution at a time is clicked
                    var sols = data.solutions;

                    //$(tr).next().children('td').append('<h5>Gapfill Details</h5>');

                    var solList = $('<div class="gap-selection-list">');

                    for (var i in sols) {
                        var sol = sols[i];
                        var solID = sol.id;

                        if (sol.integrated == "1") {
                            solList.append('<div> <a type="button" class="gap-sol"\
                                data-toggle="collapse" data-target="#'+gapRef+solID.replace(/\./g,'_')+'" >'+
                                solID+'</a> <span class="caret" style="vertical-align: middle;"></span>\
                                <div class="radio inline gapfill-radio"> \
                                    <input type="radio" name="gapfillRadios" id="gapfillRadio'+i+'" value="integrated" checked>\
                                </div> <span class="label integrated-label">Integrated</span>\
                                    <button data-gapfill="'+gapRef+solID+'"\
                                     class="hide btn btn-primary btn-mini integrate-btn">Integrate</button> \
                                 </div>');
                        } else {
                            solList.append('<div> <a type="button" class="gap-sol"\
                                data-toggle="collapse" data-target="#'+gapRef+solID.replace(/\./g,'_')+'" >'+
                                solID+'</a> <span class="caret" style="vertical-align: middle;"></span>\
                                <div class="radio inline gapfill-radio"> \
                                    <input type="radio" name="gapfillRadios" id="gapfillRadio'+i+'" value="unitegrated">\
                                </div>\
                                <button data-gapfill="'+gapRef+solID+'"\
                                 class="hide btn btn-primary btn-mini integrate-btn">Integrate</button> \
                                </div>');
                        }

                        var rxnAdditions = sol.reactionAdditions;
                        if (rxnAdditions.length == 0) {
                            var rxnInfo = $('<p>No reaction additions in this solution</p>')
                        } else {
                            var rxnInfo = $('<table class="gapfill-rxn-info">');
                            var header = $('<tr><th>Reaction</th>\
                                                <th>Equation</th></tr>');
                            rxnInfo.append(header);

                            for (var j in rxnAdditions) {
                                var rxnArray = rxnAdditions[j];
                                var row = $('<tr>');
                                row.append('<td><a class="gap-rxn" data-rxn="'+rxnArray[0]+'" >'+rxnArray[0]+'</a></td>');
                                row.append('<td>'+rxnArray[4]+'</td>');
                                rxnInfo.append(row);
                            }
                        }

                        var solResults = $('<div id="'+gapRef+solID.replace(/\./g,'_')+'" class="collapse">')
                        solResults.append(rxnInfo);

                        solList.append(solResults);
                    }

                    $(tr).next().children('td').append(solList.html());
                    $('.loader-gap-sol').remove();


                    // events for gapfill page
                    $("input[name='gapfillRadios']").unbind('change');
                    $("input[name='gapfillRadios']").change(function(){
                        $('.integrate-btn').hide();
//                        $(this).parent().next('.integrate-btn').show();
                    });

                    $('.gap-sol').unbind('click')
                    $('.gap-sol').click(function() {
                        var caret = $(this).next('span');
                        if (caret.hasClass('caret')) {
                            caret.removeClass('caret');
                            caret.addClass('caret-up');
                        } else {
                            caret.removeClass('caret-up');
                            caret.addClass('caret');                    
                        }

                    })
                    // $('.integrate-btn').unbind('click');
                    // $('.integrate-btn').click(function() {
                    //     $(this).after('<span class="muted loader-integrating" > \
                    //           <img src="assets/img/ajax-loader.gif"> loading...</span>')
                    //     var gapfill_id = $(this).data('gapfill');
                    //     var model = modelspace.active_kbids()[0]
                    //     var fbaAJAX = fba.integrate_reconciliation_solutions({model: model,
                    //         model_workspace: ws,
                    //         gapfillSolutions: [gapfill_id],
                    //         gapgenSolutions: [''],
                    //         auth: USER_TOKEN, 
                    //         workspace: ws})

                    //     $.when(fbaAJAX).done(function(data){
                    //         alert('NOTE: This functionality is still under development\n', data)
                    //         $('.loader-integrating').remove()
                    //     })
                    // })

                   $('.gap-rxn').click(function(){ 
                        var rxn = $(this).data('rxn');
                        reaction_view([rxn]);
                    });

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
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);});
     },

})
}( jQuery ) );