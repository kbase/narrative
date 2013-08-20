
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
    console.log('trigged nav event')
    $(document).trigger("navEvent");
}


function router() {
    // App routes
    Path.map("#/seq-search").to(function(){
        seq_search_view();
    }).enter(navEvent);

    // Data routes
    Path.map("#/models").to(function(){
        model_view();
    }).enter(navEvent);

    Path.map("#/models/:ws_id/:id").to(function(){
        model_view(this.params['ws_id'], this.params['id']);
    }).enter(navEvent);

    Path.map("#/organisms").to(function(){ empty_page() });
    Path.map("#/fba").to(function(){ empty_page() });
    Path.map("#/rxns/:ws_id/:id").to(function(){ empty_page() });

    Path.map("#/rxns").to(function(){
        rxn_view();
    }).enter(navEvent);

    Path.map("#/cpds").to(function(){ 
        cpd_view();
    }).enter(navEvent);

    Path.map("#/media").to(function(){ 
        media_view();
    }).enter(navEvent);


    Path.map("#/media").to(function(){ 
        media_view();
    }).enter(navEvent);



    Path.rescue(function(){ 
        page_not_found();
    })

    Path.root("#/models");
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
    
    var rxn_modal = $('#rxn-modal').kbaseRxnMeta({auth: USER_TOKEN});
    
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
    var rxn_modal = $('#rxn-modal').kbaseRxnMeta({auth: USER_TOKEN});

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
    $('#app').html(simple_layout2('bio-media-table'))
    $('#bio-media-table').kbaseBioMediaTable({});

    var media_modal = $('#media-modal').kbaseMediaModal({auth: USER_TOKEN});        

    $(document).off("mediaClick");
    $(document).on("mediaClick", function(e, data) {
        media_modal.show({media: data.media});
    })    
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
                            <div class="col-lg-4">\
                                <div id="'+id1+'"></div>\
                            </div>\
                            <div class="col-lg-8">\
                                <div id="'+id2+'"></div>\
                            </div>\
                        </div>\
                        <div class="row">\
                            <div class="col-lg-12">\
                                <div id="'+id3+'"></div>\
                            </div>\
                        </div>'
    return simple_layout;
}

function simple_layout2(id1) {
    var simple_layout = '<div class="row">\
                            <div class="col-lg-12">\
                                <div id="'+id1+'"></div>\
                            </div>\
                        </div>'
    return simple_layout;
}


