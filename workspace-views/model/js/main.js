

$(document).ready(function(){

    var model = ['kb|g.19.fbamdl.0'];
    var ws = ['KBaseFBA'];

    $('.test-page').append('<b>Workspace:</b> '+model+'<br>\
                <b>ID:</b> '+ws)

    $('.test-page').modelView({models: model,
                               workspaces: ws});

});