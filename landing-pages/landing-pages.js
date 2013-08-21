
$(function() {
    // add navigation to page
    $('#navigation').load('../common/templates/nav.html', function(){
        //fix me
        $('#signin-button').kbaseLogin({style: 'text', 
            login_callback: reload_window, logout_callback: reload_window});
        USER_TOKEN = $("#signin-button").kbaseLogin('session').token;

        router()
    })

})

function navEvent() {
    console.log('nav event');
    $(document).trigger("navEvent");
}


function router() {
    // App routes
    Path.map("#/seq-search").to(function(){
        seq_search_view();
    }).enter(navEvent);

    // Data routes
    Path.map("#/genomes").to(function(){ empty_page() });
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
        media_view();
    }).enter(navEvent);

    Path.map("#/media/:ws_id").to(function(){ 
        media_view(this.params['ws_id']);
    }).enter(navEvent);


    // help routes
    Path.map("#/data-view-api").to(function(){ 
        help_view();
    }).enter(navEvent);

    Path.rescue(function(){ 
        page_not_found();
    })

    Path.root("#/data-view-api");
    Path.listen();
}

function empty_page() {
    $('#app').html('comming soon')
}

function page_not_found() {
    $('#app').html('no object data not found')
}

function reload_window() {
    window.location.reload();
}


/*
 *  "Views" which load widgets on page.
 */


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

    $('#app').html(simple_layout1('model-meta', 'model-tabs', 'core-map') )
    
    $('#model-meta').kbaseModelMeta({ids : [id], 
                                     workspaces : [ws_id],
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
        window.location.hash = '/fba/'+ws_id+'/'+data.fba;
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

function media_view(ws_id, id) {
    var ws_id = ws_id ? ws_id : 'KBaseMedia';    
    $('#app').html(simple_layout2('media-table'))
    $('#media-table').kbaseWSMediaTable({ws: ws_id});

    var media_modal = $('#media-modal').kbaseMediaModal({auth: USER_TOKEN});        

    $(document).off("mediaClick");
    $(document).on("mediaClick", function(e, data) {
        media_modal.show({media: data.media});
    })    
}




function help_view() {
    $('#app').load('../common/templates/data-view-api.html');

}



function seq_search_view() {
    // load template
    $('#app').load('../common/app-templates/seq-search.html', function() {

        // load app
        $('#seq-search').kbaseSeqSearch({});
    })
}


//
//  Layouts.  This could be part of a template system or whatever
//

function simple_layout1(id1, id2, id3) {
    var simple_layout = '<div class="row">\
                            <div class="col-md-4">\
                                <div id="'+id1+'"></div>\
                            </div>\
                            <div class="col-md-8">\
                                <div id="'+id2+'"></div>\
                            </div>\
                        </div>\
                        <div class="row">\
                            <div class="col-md-12">\
                                <div id="'+id3+'"></div>\
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


