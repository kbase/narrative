
/*
 *   Add nav bar and signin to html.
 *   Set workspace and starting url router
 */

$(function() {
    // add navigation to page
    $('#navigation').load('assets/templates/nav.html', function(){
        //fix me
        $('#signin-button').kbaseLogin({style: 'text', 
            login_callback: reload_window, logout_callback: reload_window});
        USER_TOKEN = $("#signin-button").kbaseLogin('session').token;
    
        // global state object to store state
        state = new State();

        // set the currently selected workspace.
        set_selected_workspace();

        //simple caching mechanism
        //objectspace = new ObjectSpace();

        router();
    })
})


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




/*
 *   landing page app helper functions
 */

function empty_page() {
    $('#app').html('coming soon');
}

function page_not_found() {
    $('#app').html('object data not found');
}

function reload_window() {
    window.location.reload();
}

function get_selected_ws() {
    return state.get('selected')[0];
}

function set_selected_workspace() {
    if (state.get('selected')) {
        $('#selected-workspace').html(state.get('selected')[0]);
    }
}

function navEvent() {
    console.log('nav event');
    $(document).trigger("navEvent");
}

function removeCards() {
    $("#genomes").KBaseGenomeCardManager("removeAllCards");
    $("#genomes").KBaseGenomeCardManager("poke");
    $("#genomes").remove();
}

/*
 *   "Views" which load widgets on page.
 */

function genome_view(params) {
    /* params has
     * genomeID = the id for the genome in question
     * workspaceID = the id for a workspace containing the genome (if it exists)
     */
    $('#app').html(simple_layout2('genomes'));

    if (!params)
        $("#genomes").append("No id given");
    else {
        $("#genomes").KBaseGenomeCardManager(params);
        // if (params.genomeId)
        //     $("#genomes").append(" - " + params.genomeId);
        // if (params.workspaceId)
        //     $("#genomes").append(" - " + params.workspaceId);
    }
}

function ws_model_view(ws_id) {
    var ws_id = ws_id ? ws_id : 'KBaseCDMModels';

    $('#app').html(simple_layout2('ws-models') )
    
    $('#ws-models').kbaseWSModelTable({ws : ws_id,
                                      auth: USER_TOKEN});

    $(document).off("modelClick");
    $(document).on("modelClick", function(e, data) {
        window.location.hash = '/models/'+ws_id+'/'+data.model;
    })
}

function model_view(ws_id, id) {
    var ws_id = ws_id ? ws_id : 'KBaseFBA';
    var id = id ? id : 'kb|g.19.fbamdl.0';

    $('#app').html(simple_layout1('model-meta', 'model-opts',
                                  'model-tabs', 'core-map') )
    
    $('#model-meta').kbaseModelMeta({ids : [id], 
                                     workspaces : [ws_id],
                                     auth: USER_TOKEN});

    $('#model-opts').kbaseModelOpts({id : id, 
                                 workspace : ws_id,
                                 auth: USER_TOKEN});   

    $('#model-tabs').kbaseModelTabs({ids : [id], 
                                     workspaces : [ws_id],
                                     auth: USER_TOKEN});

    $('#core-map').kbaseModelCore({ids : [id], 
                                   workspaces : [ws_id],
                                   auth: USER_TOKEN});
    
    var rxn_modal = $('#rxn-modal').kbaseRxnModal({auth: USER_TOKEN});
    
    $(document).off("rxnClick");
    $(document).on("rxnClick", function(e, data) {
        rxn_modal.show({rxns: data.rxns});
    })
}

function ws_fba_view(ws_id) {
    var ws_id = ws_id ? ws_id : 'KBaseFBA';

    $('#app').html(simple_layout2('ws-fbas') )
    
    $('#ws-fbas').kbaseWSFbaTable({ws : ws_id,
                                     auth: USER_TOKEN});

    $(document).off("fbaClick");
    $(document).on("fbaClick", function(e, data) {
        window.location.hash = '/fbas/'+ws_id+'/'+data.fba;
    });
}

function fba_view(ws_id, id) {
    $('#app').html(simple_layout2('fba-table'))
    $('#fba-table').kbaseFbaTabs({ids: [id], 
                                  workspaces: [ws_id]});
    var rxn_modal = $('#rxn-modal').kbaseRxnModal({auth: USER_TOKEN});

    $(document).off("rxnClick");
    $(document).on("rxnClick", function(e, data) {
        rxn_modal.show({rxns: data.rxns});
    })
}

function rxn_view(ws_id, id) {
    var ws_id = ws_id ? ws_id : 'KBaseFBA';
    var id = id ? id : 'kb|g.19.fbamdl.0';

    $('#app').html(simple_layout2('bio-rxn-table'))

    $('#bio-rxn-table').kbaseBioRxnTable({});
    var rxn_modal = $('#rxn-modal').kbaseRxnModal({auth: USER_TOKEN});

    $(document).off("rxnClick");
    $(document).on("rxnClick", function(e, data) {
        rxn_modal.show({rxns: data.rxns});
    })
}

function cpd_view(ws_id, id) {
    var ws_id = ws_id ? ws_id : 'KBaseFBA';
    var id = id ? id : 'kb|g.19.fbamdl.0';

    $('#app').html(simple_layout2('bio-cpd-table'))
    $('#bio-cpd-table').kbaseBioCpdTable({});
}

function ws_media_view(ws_id) {
    var ws_id = ws_id ? ws_id : 'KBaseMedia';    
    $('#app').html(simple_layout2('media-table'))

    var media_table = $('#media-table').kbaseWSMediaTable({ws: ws_id});

    $(document).off("mediaClick");
    $(document).on("mediaClick", function(e, data) {
        window.location.hash = /media/+ws_id+'/'+data.media;
    });   
}

function media_view(ws_id, id) {
    var ws_id = ws_id ? ws_id : 'KBaseMedia';    
    $('#app').html(simple_layout2('media-editor'))

    var media_view = $('#media-editor').kbaseMediaEditor({auth: USER_TOKEN, 
                                                            ws: ws_id,
                                                            id:id});
    var save_ws_modal = $('#save-ws-modal').kbaseSimpleWSSelect({auth: USER_TOKEN,
                                                                 defaultWS: get_selected_ws()});

    $(document).off("saveToWSClick");
    $(document).on("saveToWSClick", function(e, data) {
        console.log('save to ws click event');
        save_ws_modal.show();
    });

    $(document).off("selectedWS");
    $(document).on("selectedWS", function(e, data) {
        console.log(data.ws);
    });
}

function help_view() {
    $('#app').load('assets/templates/data-view-api.html', function() {
        $('.api-url-submit').click(function() {
            var form = $(this).parents('form')
            var url = '/'+form.attr('type')+'/'+form.find('#input1').val();
            if (form.find('#input2').val()) {
                url = url+'/'+form.find('#input2').val();
            }
            window.location.hash = url;
        });
    });
}



/*
 * Analysis Views
 */
function run_fba_view(ws_id, id) {
    $('#app').html(simple_layout4('media-table', 'formulation-form', 'fba-opts') )
    
    $('#media-table').kbaseWSMediaTable({ws : ws_id,
                                     auth: USER_TOKEN,
                                    title: "Select a media:"});

    $('#formulation-form').kbaseFormulationForm({ws : ws_id,
                                 auth: USER_TOKEN,
                                title: "Formulation"});

    $('#fba-opts').kbaseRunFba({ws : ws_id, id: id, auth: USER_TOKEN});
}




/*
 *  "Apps"
 */

function workspace_view() {
    // load template
    $('#app').load('assets/app-templates/ws-browser.html', function() {
        $('#app').html(simple_layout3('ws-selector', 'ws-object-table') );

        objectTable = $('#ws-object-table').kbaseWSObjectTable({auth:USER_TOKEN})

        wsSelector = $('#ws-selector').kbaseWSSelector({userToken: USER_TOKEN,
                                                selectHandler: selectHandler});

        //Fixme: Need to add events here.
    })
}




/*
 *  Layouts.  This could be part of a template system or whatever
 */

function simple_layout1(id1, id2, id3, id4) {
    var simple_layout = '<div class="row">\
                            <div class="col-md-4">\
                                <div class="row">\
                                    <div id="'+id1+'"></div>\
                                </div>\
                                <div class="row">\
                                    <div id="'+id2+'"></div>\
                                </div>\
                            </div>\
                            <div class="col-md-8">\
                                <div id="'+id3+'"></div>\
                            </div>\
                        </div>\
                        <div class="row">\
                            <div class="col-md-12">\
                                <div id="'+id4+'"></div>\
                            </div>\
                        </div>'
    return simple_layout;
}

function simple_layout2(id1) {
    var simple_layout = '<div class="row">\
                            <div class="col-md-12">\
                                <div id="'+id1+'"></div>\
                            </div>\
                        </div>'
    return simple_layout;
}

function simple_layout3(id1, id2) {
    var simple_layout = '<div class="row">\
                            <div class="col-md-3">\
                                <div id="'+id1+'"></div>\
                            </div>\
                            <div class="col-md-9">\
                                <div id="'+id2+'"></div>\
                            </div>\
                        </div>'
    return simple_layout;
}


function simple_layout4(id1, id2, id3) {
    var simple_layout = '<div class="row">\
                            <div class="col-md-12">\
                                <div id="'+id1+'"></div>\
                            </div>\
                        </div>\
                        <div class="row">\
                            <div class="col-md-6">\
                                <div id="'+id2+'"></div>\
                            </div>\
                            <div class="col-md-6">\
                                <div id="'+id3+'"></div>\
                            </div>\
                        </div>'                     
    return simple_layout;
}









/***************************  END landing page stuff  ********************************/



/*
 *   workspace browser handler
 */

var first = true;
var prevPromises = []; // store previous promises to cancel
function selectHandler(selected) {
    workspaces = wsSelector.workspaces;
    set_selected_workspace()

    // tell the previous promise(s) not to fire
    prevPromises.cancel = true;

    // workspaces might have data loaded already
    var promises = [];
    prevPromises = promises;

    // loop through selected workspaces and download objects if they haven't been downloaded yet
    for (var i=0; i<selected.length; i++) {
        var workspace = selected[i];

        var objType = $.type(workspace.objectData);
        if (objType === 'undefined') {
            // no data and not being downloaded
            var p = workspace.getAllObjectsMeta();
            workspace.objectData = p; // save the promise
            promises.push(p);

            // provide closure over workspace
            (function(workspace) {
                p.done(function(data) {
                // save the data and tell workspace selector that the workspace has it's data
                    workspace.objectData = data;
                    wsSelector.setLoaded(workspace);
                });
            })(workspace);
        } else if (objType === 'object') {
            // data being downloaded (objectData is a promise)
            promises.push(workspace.objectData);
        }
    }

    if (promises.length > 0) {
        // may take some time to load
        objectTable.loading(true);
    }

    // when all the promises are done...
    $.when.apply($, promises).done(function() {
        if (promises.cancel) {
            // do nothing if it was cancelled
            return;
        }

        // reload the object table
        objectTable.reload(selected).done(function() {
            if (promises.cancel) {
                return;
            }

            if (first) {
                firstSelect();
                first = false;
            }
        });
    });

    // this function is called upon the first selection event
    //  it sets absolute position for the data table so that it scrolls nicely
    function firstSelect() {
        objectTable.fixColumnSize();

        // move table element into new scrollable div with absolute position
        var otable = $('#object-table');
        var parts = otable.children().children();
                
        var header = parts.eq(0);
        var table = parts.eq(1);
        var footer = parts.eq(2);

        header.css({
            position: 'absolute',
            top: '0px',
            left: '0px',
            right: '0px'
        });

        table.css({
            position: 'absolute',
            top: (header.height() + 2) + 'px',
            left: '0px',
            right: '0px',
            bottom: (footer.height() + 2) + 'px'
        });

        table.find('.dataTables_scrollBody').css({
            position: 'absolute',
            height: '',
            width: '',
            top: table.find('.dataTables_scrollHead').height(),
            left: '0px',
            right: '0px',
            bottom: '0px'
        });

        footer.css({
            position: 'absolute',
            bottom: '0px',
            left: '0px',
            right: '0px'
        });
    }
}



/*
 *  Function to store state in local storage.
 */
function State() {
    // Adapted from here: http://diveintohtml5.info/storage.html
    var ls;
    try {
        ls = 'localStorage' in window && window['localStorage'] !== null;
    } catch (e) {
        ls = false;
    }

    //var user = (auth.isLoggedIn() ? auth.getUserData().user_id : 'public');

    this.get = function(key) {
        if (!ls) {
            return null;
        }

        //key = user + '.' + key;

        var val = localStorage.getItem(key);

        try {
            val = JSON.parse(val);
        } catch(e) {
            return null;
        };

        return val;
    };

    this.set = function(key, val) {
        if (!ls) {
            return null;
        }

        //key = user + '.' + key;
        
        try {
            val = JSON.stringify(val);
        } catch(e) {
            return null;
        }

        return localStorage.setItem(key, val);
    };
}



