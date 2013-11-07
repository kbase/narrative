
/*
 *  Directives
 *  
 *  These can be thought of as the 'widgets' on a page.  
 *  Scope comes from the controllers.
 *
*/


angular.module('mv-directives', []);
angular.module('mv-directives')
    .directive('mvmodelcore', function($location) {
        return {
            link: function(scope, element, attrs) {
                var ws = scope.ws;
                var ids = scope.ids;

                if (!ids) return;

                // make requests and display core model diagram
                var prom1 = kb.req('fba', 'get_fbas',
                            {fbas: ids, workspaces: ws});
                $(element).loading('loading fba...');
                $.when(prom1).done(function(fbas_data) {
                    var model_ws = fbas_data[0].model_workspace;
                    var model_id = fbas_data[0].model;

                    var prom2 = kb.req('fba', 'get_models',
                            {models: [model_id], workspaces: [model_ws]});
                    $(element).loading('loading model...');
                    $.when(prom2).done(function(models_data){
                        $(element).kbaseModelCore({ids: ids, 
                                                    workspaces: ws,
                                                    modelsData: models_data,
                                                    fbasData: fbas_data});
                        $(element).rmLoading();

                        $(document).on('coreRxnClick', function(e, data) {
                            $('.popover').each(function() { $(this).remove() });                             
                            var url = '/rxns/'+data.ids.join('&');
                            scope.$apply( $location.path(url) );
                        });  
                    })

                })
            }
        };
    })


    // Workspace browser widgets (directives)
    .directive('selectedobjs', function() {
        return {
            templateUrl: 'views/mv/selected-objects.html',
            link: function(scope, element, attrs) {
                $(element).hide();
            }
        };
    })
    .directive('wsselector', function($location) {
        return {
            
            controller: function($scope) {
                $scope.selectedObjs = []

                for (var i in $scope.ws) {
                    var found;
                    var entry = {ws: $scope.ws[i], id: $scope.ids[i]};

                    for (var j in $scope.selectedObjs) {
                        if (angular.equals($scope.selectedObjs[j], entry)) {
                            found = true;
                            break;
                        }
                    }

                    if (found) continue;
                    
                    $scope.selectedObjs.push(entry)
                }



                $scope.$watch('selectedObjs', function() {
                    console.log('saw change')
                    console.log($scope.selectedObjs)        
                    // update url strings
                    $scope.ws = [];
                    $scope.ids = [];
                    for (var i in $scope.selectedObjs) {
                        var obj = $scope.selectedObjs[i];
                         $scope.ws.push(obj.ws);
                         $scope.ids.push(obj.id);  
                    }
                    $scope.ws_param =  $scope.ws.join('+');
                    $scope.ids_param =  $scope.ids.join('+');

                    // show object selection sidebar
                    if (!$('.selectedobjs').is(':visible')) {
                        $('.side-bar-switch').children('button').removeClass('active');            
                        $('.show-objs').addClass('active');
                        $scope.showSelectedObjs();
                    }
                    
                    $location.search({ws: $scope.ws_param , ids: $scope.ids_param})

                }, true); 

            },            

            template: '<div class="ws-selector">'+
                        '<div class="ws-selector-header">'+
                            '<a class="show-filters">Filter <span class="caret"></span></a>'+
                            '<a class="new-ws pull-right">New+</a>'+
                            '<div class="perm-filters" style="display:none;">'+
                                '<div class="checkbox pull-left" style="margin: 35px 25px;">'+
                                  '<label><input type="checkbox" value="">owner</label>'+
                                '</div>'+
                                '<div class="pull-left">'+
                                    '<div class="checkbox">'+                              
                                      '<label><input type="checkbox" value="">admin</label>'+
                                    '</div>'+
                                    '<div class="checkbox">'+
                                      '<label><input type="checkbox" class="perm-filter" value="">write</label>'+
                                    '</div>'+
                                    '<div class="checkbox">'+
                                      '<label><input type="checkbox" value="">read</label>'+                                                                                          
                                    '</div>'+
                                 '</div>'+
                            '</div>'+

                            '<input type="text" class="search-query" placeholder="Filter Workspaces">'+
                        '</div>'+


                        '<div id="select-box" class="select-box scroll-pane">'+
                          '<table class="table table-bordered"></table>'+
                        '</div>'+
                      '</div>'
                      ,

            link: function(scope, element, attrs, routeParams) {
                var nav_height = 100+42;

                var prom = kb.req('ws', 'list_workspaces');
                $('.select-box').loading();
                $.when(prom).done(function(data) {
                    $('.select-box').rmLoading()
                    for (var i in data) {
                        var ws = data[i];
                        var short_ws = ws[0].slice(0,12) + '...'

                        $(".select-box table").append('<tr><td class="select-ws ellipsis" data-ws="'+ws[0]+'">\
                                <span class="badge">'+ws[3]+'</span>'+
                                ' <span class="ellipsis">'+ws[0]+'</span></td></tr>');
                    }


                    // Scroll plugin for side bar.  
                    // I don't know what's going on here.  Fix later.
                    /*
                    $('.scroll-pane').jScrollPane();
                    $('.scroll-pane').css('height', $(window).height()-
                        $('.ws-selector-header').height() - nav_height )                    

                    $('.scroll-pane').jScrollPane();
                    $('.scroll-pane').css('height', $(window).height()-
                        $('.ws-selector-header').height() - nav_height ) 
                    */
                    $('.scroll-pane').css('height', $(window).height()-
                        $('.ws-selector-header').height() - nav_height )                     
                    events();
                });



                function events() {
                    // events for search box
                    $('.search-query').keyup(function() {
                        $('.select-box').find('td').show();
                            var input = $(this).val();
                            $('.select-box').find('td').each(function(){
                            if ($(this).text().toLowerCase().indexOf(input.toLowerCase()) != -1) {
                                return true;
                            } else {
                                $(this).hide();
                            }
                        });
                    });

                    // events for filters at top of ws selector
                    $('.show-filters').click(function() {
                        $(this).parent().find('.perm-filters').slideToggle(function() {

                            //$('.scroll-pane').jScrollPane({});

                            // if filters are shown, adjust scrollbox height.
                            if ( $('.perm-filters').css('display') == "none") {
                                $('.scroll-pane').css('height', $(window).height()-
                                    $('.ws-selector-header').height() - nav_height  );                                
                            } else {
                                $('.scroll-pane').css('height', $(window).height()-
                                    $('.ws-selector-header').height() - nav_height );                                
                            }

                        });
 

                    });

                    // event for selecting a workspace on the sidebar
                    $('.select-ws').click(function() {
                        var ws = $(this).data('ws');
                        console.log('clicked workspcae')
                        $('.select-ws').removeClass('selected-ws')
                        $(this).addClass('selected-ws')
                        scope.$apply( $location.path('/mv/objtable/'+ws+'/') );
                    });


                    // event for resizing ws selector scroll bars
                    $(window).resize(function () {
                        // only adjust of ws selector is visible
                        if ($(element).is(':visible')) {
                            setTimeout(function() {
                                //$('.scroll-pane').jScrollPane({});
                                $('.scroll-pane').css('height', $(window).height()
                                    - $('.ws-selector-header').height() - nav_height )   
                            }, 250); 
                        }
                    });

                }

            }  /* end link */

        };
    })

    .directive('objtable', function($location) {
        return {

            link: function(scope, element, attrs) {
                var ws = scope.selected_ws;

                var tableSettings = {
                    "sPaginationType": "full_numbers",
                    "iDisplayLength": 5,
                    "aaData": [],
                    "fnDrawCallback": events,
                  "aoColumns": [
                      { "sTitle": "id"}, //"sWidth": "10%"
                      { "sTitle": "type", "sWidth": "10%"},
                      { "sTitle": "moddate"},
                      { "sTitle": "lastmodifier"},
                      { "sTitle": "owner"},

                  ],                         
                    "oLanguage": {
                        "sSearch": "Search:"
                    }
                }

                $(element).html('')
                $(element).loading('loading '+ws+'...')

                var prom = kb.req('ws', 'list_workspace_objects', {workspace: ws});
                $.when(prom).done(function(data){
                    $(element).rmLoading();
                    $(element).append('<table id="obj-table-'+ws+'" \
                        class="table table-bordered table-striped" style="width: 100%;"></table>')    

                    var wsobjs = formatObjs(data);
                    tableSettings.aaData = wsobjs;
                    var table = $('#obj-table-'+ws).dataTable(tableSettings);
                })


                function formatObjs(objs) {
                    var wsobjs = []

                    for (var i in objs) {
                        var obj = objs[i];
                        var id = obj[0];
                        var type = obj[1];
                        var instance = obj[3];

                        var wsarray = [id,
                                       type,
                                       obj[2],
                                       obj[4],
                                       obj[5]];


                        if (type == 'FBA') {
                            wsarray[0] = '<a class="obj-id" data-obj-id="'+id+'" data-obj-type="'+type+'">'
                                        +id+'</a> ('+instance+')'+
                                        '<a class="add-to-mv pull-right">'+
                                        'add <span class="glyphicon glyphicon-plus-sign"></span> '+
                                        '</a>';
                        } else {
                            wsarray[0] = '<a class="obj-id" data-obj-id="'+id+'" data-obj-type="'+type+'">'
                                    +id+'</a> ('+instance+')';
                        }

                        wsobjs.push(wsarray);
                    }
                    return wsobjs
                }

                function events() {
                    $('.obj-id').unbind('click');                    
                    $('.obj-id').click(function(){
                        var type = $(this).data('obj-type');
                        var id = $(this).data('obj-id');

                        if (type == 'Genome') {
                            scope.$apply( $location.path('/genomes/'+ws+'/'+id) );
                        } else if (type == 'Model') {
                            scope.$apply( $location.path('/models/'+ws+'/'+id) );
                        } else if (type == 'FBA') {
                            scope.$apply( $location.path('/fbas/'+ws+'/'+id) );
                        } else if (type == 'Media') {
                            scope.$apply( $location.path('/media/'+ws+'/'+id) );
                        }
                    })

                    $('.add-to-mv').unbind('click');
                    $('.add-to-mv').click(function(){
                        var type = $(this).prev('.obj-id').data('obj-type');
                        var id = $(this).prev('.obj-id').data('obj-id');
                        scope.selectedObjs.push({ws:ws, id:id, type:type});
                        scope.$apply()                        
                    })
                }


            }

        };
    })










    .directive('heatmap', function($location) {
        return {
            link: function(scope, element, attrs) {
                $(element).append('<div class="heatmap-view"></div>')

                var ws = scope.ws;
                var ids = scope.ids;
                if (!ids) return;

                // Fixme: make these classes once using omnigraffle with d3
                var flux_threshold = 0.001;
                var heat_colors = ['#731d1d','#8a2424', '#b35050', '#d05060', '#f28e8e'];
                var neg_heat_colors = ['#4f4f04','#7c7c07', '#8b8d08', '#acc474', '#dded00'];
                var gapfill_color = '#f000ff';
                var gene_stroke = '#777';
                var g_present_color = '#8bc7e5';

                var prom1 = kb.req('fba', 'get_fbas',
                            {fbas: ids, workspaces: ws});
                $(element).loading('loading fba...');
                $.when(prom1).done(function(fbas) {
                    var model_ws = [];
                    var model_ids = [];
                    for (var i in fbas) {
                        model_ws.push(fbas[i].model_workspace);
                        model_ids.push(fbas[i].model);
                    }

                    var prom2 = kb.req('fba', 'get_models',
                            {models: model_ids, workspaces: model_ws});
                    $(element).loading('loading model...');
                    $.when(prom2).done(function(models){
                        console.log(fbas, models)
                        $(element).rmLoading()
                        var org_names = [];
                        for (var i in models) {
                            org_names.push(models[i].name)
                        }                        
                        console.log('orgnames', org_names)
                        
                        all_rxns = union_of_rxns(models);
                        all_rxns.sort();
                        rows = heatmap_rows(models, fbas, all_rxns);
                        all_rxns = group_id_sort(rows, all_rxns);
                        rows = heatmap_rows(models, fbas, all_rxns);
                        var res = order_orgs_by_count(rows, org_names);
                        rows = res.rows;
                        org_names = res.org_names;
                        console.log('orgnames2', org_names)



                        heatmap_d3(all_rxns, org_names, rows);
                    });
                });


                function union_of_rxns(models) {
                    var rxns = [];
                    for (var i in models) {
                            var model_rxns = models[i].reactions;
                            for (var j in model_rxns) {
                                model_rxn = model_rxns[j].reaction;
                                if (rxns.indexOf(model_rxn) == -1) {
                                    rxns.push(model_rxn);
                            }
                        }
                    }
                    return rxns;
                }


                function group_id_sort(rows, rxns) {
                    var org_count = rows.length;
                    var rxn_count = rows[0].length;

                    var rxn_order = [];

                    // for number of org, for best count
                    for (var z=0; z < org_count; z++) {

                        // for each reaction
                        for (var i=0; i < rxn_count; i++) {
                            var rxn_id = rxns[i];

                            // get each orgs value
                            var set = [];
                            for (var j = 0; j < org_count; j++) {
                                var val = rows[j][i].color
                                if (val != 'white') set.push(val);
                            }

                            if (set.length == org_count - z) {
                                rxn_order.push(rxn_id)
                            } 
                        }
                    }

                    return rxn_order;
                }

                function heatmap_rows(models, fbas, rxns, show_neg) {
                    var show_neg = true

                    // first get ordered list of flux objs of equal width
                    var model_fbas = [];
                    for (var n in models) {
                        var model = models[n];
                        rxn_list = model.reactions;

                        var match = false;
                        for (var k in fbas) {
                            if (fbas[k].model == model.id ) {
                                model_fbas.push(fbas[k]);
                                match = true; break;
                            }            
                        }
                        if (!match) model_fbas.push([]);            
                    }

                    console.log('model_fbas', model_fbas, model_fbas.length)

                    var rows = [];
                    for (var i in models) {
                        var model_rxns = model_rxn_ids(models[i]);
                        var flux_lists = model_fbas[i].reactionFluxes;
                        var rxn_objs = model_rxn_objs(models[i]);

                        var row = []
                        for (var j in rxns) {
                            var dict = {};
                            var has_flux = false;

                            for (var k in flux_lists) {
                                var rxn_flux = flux_lists[k];

                                if (rxn_flux[0].slice(0,rxn_flux[0].indexOf('_')) == rxns[j]) {
                                    has_flux = true;
                                    var flux_value = rxn_flux[1];
                                    dict.value = rxns[j]

                                    dict.flux = flux_value;
                                    break; //verify
                                }
                            }

                            if (has_flux & show_neg) {
                                dict.color = get_flux_color(flux_value, true)
                            } else if (has_flux) {
                                dict.color = get_flux_color(flux_value, false)                
                            } else if (model_rxns.indexOf(rxns[j]) != -1) {
                                dict.color = g_present_color;
                            } else {
                                dict.color = 'white';
                            }

                            var gapfilled = false;

                            // set tooltip content
                            for (var z in rxn_objs) {
                                var rxn_obj = rxn_objs[z];
                                if (rxn_obj.reaction == rxns[j]) {
                                    dict.hover = core_tooltip(rxn_obj, flux_value);
                                    if (rxn_obj.gapfilled) {
                                        dict.stroke = gapfill_color;
                                    }
                                    break;
                                }
                            }
                            row.push(dict);
                        }

                        rows.push(row);
                    }

                    return rows
                }

                function order_orgs_by_count(rows, orgs) {
                    var rows_ordered = [];
                    var orgs_ordered = [];

                    var lens = [];
                    for (var i in rows){
                        var count = 0;
                        for (var j in rows[i]) {
                            if (rows[i][j].color == g_present_color) count++;
                        }
                        lens.push(count);
                    }
                    lens.sort().reverse();
                    for (var i in rows) {
                        var count = 0;
                        for (var k in rows[i]) {
                            if (rows[i][k].color == g_present_color) count++;
                        }

                        for (var j in lens){
                            var opt_len = lens[j];
                            if (count == opt_len) {
                                rows_ordered.push(rows[i]);
                                orgs_ordered.push(orgs[i]+'  ('+count+' reactions)')
                            }
                        }
                    }
                    return {'org_names':orgs_ordered, 'rows':rows_ordered};
                }

                function model_rxn_ids(model) {
                    var rxn_ids = [];
                    for (var i in model.reactions) {
                        rxn_ids.push(model.reactions[i].reaction);
                    }
                    return rxn_ids;
                }

                function model_rxn_objs(model) {
                    var rxn_objs = [];
                    for (var i in model.reactions) {
                        rxn_objs.push(model.reactions[i]); // .reaction
                    }
                    return rxn_objs;
                }                

                function heatmap_d3(x_data, y_data, rows) {
                    //$('.heatmap-view').children().remove()

                    var svg = d3.select('.heatmap-view').append("svg")
                                                        .attr("width", 20000)
                                                        .attr("height", 500);

                    var w = 12;
                    var h = 15;

                    // to precompute starting postion of heatmap
                    y_widths = [];
                    for (var i in y_data) {
                        var label = svg.append("text").attr("y", start_y+i*h+h-2)
                                    .text(y_data[i]).attr("font-size", '12px');
                        y_widths.push(label.node().getBBox().width);
                    }
                    $('text').remove(); // what a hack, fixme

                    var start_x = Math.max.apply(Math, y_widths) + 5;
                    var start_y = 100;

                    for (var i=0; i < y_data.length; i++) {
                        var y_label = svg.append("text").attr("y", start_y+i*h+h-2)
                                    .text(y_data[i]).attr("font-size", '12px')
                                    .on("mouseover", function(){d3.select(this).attr("fill", "black");})
                                    .on("mouseout", function(){d3.select(this).attr("fill", "#333");});
                        var bb = y_label.node().getBBox();

                        y_label.attr('transform', 'translate('+String(start_x-bb.width-4)+',0)');

                        for (var j=0; j < x_data.length; j++) {
                            if (i == 0) {
                                var pos = start_x+j*w+w;

                                var x_label = svg.append("text")
                                    .attr("x", pos)
                                    .attr("y", start_y-5)
                                    .text(x_data[j])
                                    .attr("font-size", '10px')
                                    .attr("transform", 'rotate(-45,'+pos+','+start_y+')')
                                    .on("mouseover", function(){d3.select(this).attr("fill", "black");
                                        d3.select(this).attr("font-weight", "700");})
                                    .on("mouseout", function(){d3.select(this).attr("fill", "#333");
                                        d3.select(this).attr("font-weight", "none");});
                            }

                            var data = rows[i][j];
                            var rect = svg.append("rect")
                                          .attr("x", start_x+j*w)
                                          .attr("y", start_y+i*h)
                                          .attr("width", w)
                                          .attr("height", h)
                                          .attr("fill", data.color)
                                          .attr("stroke", function(){
                                            if (data.stroke){
                                                return data.stroke;
                                            } else {
                                                return gene_stroke;
                                            }
                                          }).attr('data-value', data.value)
                                          .attr('class', 'model-rxn')
                            $(rect.node()).popover({content: data.hover,
                                    title: y_data[i],
                                    trigger: 'hover', html: true,
                                    container: 'body', placement: 'bottom'})

                        }
                    }

                    //$('.model-rxn').click(function(){
                    //    reaction_view([$(this).data('value')])
                    //});
                }


                function compare_g_ids(id1, id2) {
                    return id1.search(id2);
                }

                function get_genome_id(ws_id) {
                    console.log('workspace_id', ws_id)
                    var pos = ws_id.indexOf('.');
                    var g_id = ws_id.slice(0, ws_id.indexOf('.', pos+1));
                    console.log('gid', g_id)
                    return g_id;
                }

                function get_flux_color(flux, show_neg) {

                    if (show_neg) {
                        if (flux > 100){
                            var c = heat_colors[0];
                        } else if (flux > 50) {
                            var c = heat_colors[1];
                        } else if (flux > 10) {
                           var c = heat_colors[2];
                        } else if (flux > 5) {
                            var c = heat_colors[3];
                        } else if (flux > .01) {
                            var c = heat_colors[4];
                        } else if (flux < -100) {
                            var c = neg_heat_colors[0];
                        } else if (flux < -50) {
                            var c = neg_heat_colors[1];
                        } else if (flux < -10) {
                            var c = neg_heat_colors[2];
                        } else if (flux < -5) {
                            var c = neg_heat_colors[3];
                        } else if (flux < -.01) {
                            var c = neg_heat_colors[4];
                        } else {
                            var c = g_present_color;
                        }
                    } else {
                        if (Math.abs(flux) > 100){
                            var c = heat_colors[0];
                        } else if (Math.abs(flux) > 50) {
                            var c = heat_colors[1];
                        } else if (Math.abs(flux) > 10) {
                            var c = heat_colors[2];
                        } else if (Math.abs(flux) > 5) {
                            var c = heat_colors[3];
                        } else if ( Math.abs(flux) > .01) {
                            var c = heat_colors[4];
                        } else {
                            var c = g_present_color;
                        }
                    }
                    return c;

                }

                function core_tooltip(rxn_obj, flux_val) {
                    var tip = '';
                    tip += '<b>Rxn:</b> '+rxn_obj.reaction +'<br>';
                    tip += '<b>Eq:</b> '+rxn_obj.definition+'<br>';
                    tip += '<b>Flux Value:</b> '+flux_val+'<br><br>';

                    return tip

                }
            }
        }
    })






