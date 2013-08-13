


$(function() {
    // add navigation to page
    $('#navigation').load('../common/templates/nav.html', function() {
        init_page();
    })

    // load widgets on page
    function init_page() {
        //fix me
        $('#signin-button').kbaseLogin({style: 'text', 
            login_callback: reload_window, logout_callback: reload_window});
        var USER_TOKEN = $("#signin-button").kbaseLogin('session').token;
        
        $('#model-meta').kbaseModelMeta({ids : ['kb|g.19.fbamdl.0'], 
                                         workspaces : ['KBaseFBA'],
                                         auth: USER_TOKEN});
    
        $('#model-tabs').kbaseModelTabs({ids : ['kb|g.19.fbamdl.0'], 
                                         workspaces : ['KBaseFBA'],
                                         auth: USER_TOKEN});

        $('#core-map').kbaseModelCore({ids : ['kb|g.19.fbamdl.0'], 
                                       workspaces : ['KBaseFBA'],
                                       auth: USER_TOKEN});
        
        var rxn_modal = $('#rxn-modal').kbaseRxnMeta({auth: USER_TOKEN});
        
        $(document).on("rxnClick", function(e, data) {
            rxn_modal.show({rxns: data.rxns});
        })

        function reload_window() {
            window.location.reload();
        }
    }
})