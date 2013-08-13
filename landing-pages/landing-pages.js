
$(function() {
    // add navigation to page
    $('#navigation').load('../common/templates/nav.html', function(){
        router()
    })
})


function router() {
    Path.map("#/models").to(function(){
        models();
    });
    Path.map("#/models/:ws_id/:id").to(function(){
        models(this.params['ws_id'], this.params['id']);
    });

    Path.map("#/media").to(function(){ empty_page() });
    Path.map("#/organisms").to(function(){ empty_page() });
    Path.map("#/fba").to(function(){ empty_page() });
    Path.map("#/rxns/:ws_id/:id").to(function(){ empty_page() });
    Path.map("#/rxns").to(function(){ empty_page() });
    Path.map("#/cpds").to(function(){ empty_page() });

    Path.rescue(function(){ 
        page_not_found() 
    });

    Path.root("#/models");
    Path.listen();
}

function empty_page() {
    $('#app').html('comming soon')
}

function page_not_found() {
    $('#app').html('no object data not found')
}


// load widgets on page
function models(ws_id, id) {
    var ws_id = ws_id ? ws_id : 'KBaseFBA';
    var id = id ? id : 'kb|g.19.fbamdl.0';


    $('#app').html(simple_layout)

    //fix me
    $('#signin-button').kbaseLogin({style: 'text', 
        login_callback: reload_window, logout_callback: reload_window});
    var USER_TOKEN = $("#signin-button").kbaseLogin('session').token;
    
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
    
    $(document).on("rxnClick", function(e, data) {
        rxn_modal.show({rxns: data.rxns});
    })

    function reload_window() {
        window.location.reload();
    }
}

var simple_layout = '<div class="row">\
                        <div class="col-lg-4">\
                            <div id="model-meta"></div>\
                        </div>\
                        <div class="col-lg-8">\
                            <div id="model-tabs"></div>\
                        </div>\
                    </div>\
                    <div class="row">\
                        <div class="col-lg-12">\
                            <div id="core-map"></div>\
                        </div>\
                    </div>'
