

$(document).ready(function(){

    var fba = ['kb|g.0.fbamdl.301.fba.3'];
    var ws = ['KBaseFBA'];

    $('.test-page').append('<b>Workspace:</b> '+fba+'<br>\
                <b>ID:</b> '+ws)

    $('.test-page').fbaView({ids: fba,
                               workspaces: ws});

});