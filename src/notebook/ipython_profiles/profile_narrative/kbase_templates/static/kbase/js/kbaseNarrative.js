/**
 * This is the entry point for the Narrative's front-end. It initializes
 * the login session, fires up the data and function widgets, and creates
 * the kbaseNarrativeWorkspace wrapper around the IPython notebook that 
 * does fun things like manage widgets and cells and kernel events to talk to them.
 */
"use strict";

$('#kb-del-btn').click(function(e) {
    if (IPython && IPython.notebook)
        IPython.notebook.delete_cell();
});

$('#kb-save-btn').click(function(e) {
    if (IPython && IPython.notebook) {
        var narrName = IPython.notebook.notebook_name;
        // we do not allow users to leave thier narratives untitled
        if (narrName.trim().toLowerCase()==='untitled' || narrName.trim().length === 0) {
            IPython.save_widget.rename_notebook("Please name your Narrative before saving.", false);
        } else {
            IPython.notebook.save_checkpoint();
        }
    }
});

$('#kb-narr-name #name').click(function(e) {
    if (IPython && IPython.save_widget) {
        IPython.save_widget.rename_notebook("Rename your Narrative.", true);
        var narrName = IPython.notebook.notebook_name;
        // this code needs to move to the save widget since rename_notebook is async!!
        //$('#kb-narr-name #name').text(narrName);
    }
});

(function() {
    var $dataList = $('<div>');
    $dataList["kbaseNarrativeSharePanel"]({});
    $('#kb-share-btn').popover({ 
        html : true,
        placement : "bottom",
        title: function() {
            return "Share this Narrative & Data";
        },
        content: function() {
            return $dataList;
        }
    });
})();

var EndpointTester = function(url, target) {
    this.loadingImage = 'static/kbase/images/ajax-loader.gif';
    this.okayText = 'ok';
    this.downText = 'down';
    this.url = url;
    this.$target = target;
};

EndpointTester.prototype.test = function(url) {
    this.$target.html('<img src="' + this.loadingImage + '">');
    var postTestParams = {
        type: 'POST',
        data: '{"params":{}, "version":"1.1", "method":"", "id":"' + Math.random() + '"}',
        url: this.url,
        success: $.proxy(function() { this.$target.html(this.okayText); }, this),
        error: $.proxy(function(error) { 
            console.log('error!');
            console.log(error);
            this.$target.html(this.downText); 
        }, this),
    };
    var getTestParams = {
        type: 'GET',
        url: this.url,
        success: $.proxy(function() { this.$target.html(this.okayText); }, this),
        error: $.proxy(function(error) { 
            $.ajax(postTestParams);
            this.$target.html(this.downText); 
        }, this),        
    }
    $.ajax(getTestParams);
};

var narrative = {};
narrative.init = function() {
    var narr_ws = null;
    var readonly = false; /* whether whole narrative is read-only */
    var authToken = null;

    var versionHtml = 'KBase Narrative<br>Alpha version';
    var endpointTesters = [];
    if (window.kbconfig && 
        window.kbconfig.name && 
        window.kbconfig.version) {
        var $versionDiv = $('<div>')
                          .append('<b>Version:</b> ' + window.kbconfig.version);
        if (window.kbconfig.git_commit_hash && window.kbconfig.git_commit_time)
            $versionDiv.append('<br><b>Git Commit:</b> ' + window.kbconfig.git_commit_hash + ' -- ' + window.kbconfig.git_commit_time);

        // not used, but left in as legacy if we go back to it.
        // $versionInfo = window.kbconfig.name + '<br>' + window.kbconfig.version;

        if (window.kbconfig.urls) {
            var urlList = Object.keys(window.kbconfig.urls).sort();
            var $versionTable = $('<table>')
                                .addClass('table table-striped table-bordered');
            $.each(urlList, 
                function(idx, val) {
                    var url = window.kbconfig.urls[val].toString();
                    // if url looks like a url (starts with http), include it.
                    if (url && url.toLowerCase().indexOf('http') == 0) {
                        var $testTarget = $('<td>');
                        $versionTable.append($('<tr>')
                                             .append($('<td>').append(val))
                                             .append($('<td>').append(url)));
                        //                      .append($testTarget));
                        // endpointTesters.push(new EndpointTester(url, $testTarget));
                    }
                }
            );
            $versionDiv.append($versionTable);
        }
    }

    var $versionModal = $('<div tabindex=-1 role="dialog" aria-labelledby="kb-version-label" aria-hidden="true">')
                        .addClass('modal fade')
                        .append($('<div>')
                                .addClass('modal-dialog')
                                .append($('<div>')
                                    .addClass('modal-content')
                                    .append($('<div>')
                                            .addClass('modal-header')
                                            .append($('<h4>')
                                                    .addClass('modal-title')
                                                    .attr('id', 'kb-version-label')
                                                    .append('KBase Narrative Properties')))
                                    .append($('<div>')
                                            .addClass('modal-body')
                                            .append($versionDiv))
                                    .append($('<div>')
                                            .addClass('modal-footer')
                                            .append(
                                                $('<button type="button" data-dismiss="modal">')
                                                .addClass('btn btn-default')
                                                .append('Dismiss')))));

//    var $versionBtn = $('<a href="#">About</a>')
    $('#kb-about-btn').click(function(event) {
                          event.preventDefault();
                          event.stopPropagation();
                          $versionModal.modal('show');
                          for (var i=0; i<endpointTesters.length; i++) {
                              endpointTesters[i].test();
                          }
                      });

//    $('#kb-version-stamp').empty().append($versionBtn);
    $('#notebook').append($versionModal);
    $('[data-toggle="tooltip"]').tooltip()
    /*
     * Before we get everything loading, just grey out the whole %^! page
     */
    var $sidePanel = $('#kb-side-panel').kbaseNarrativeSidePanel({ autorender: false });

    var curCell = null;
    $([IPython.events]).on('select.Cell', function(event, data) {
        if (curCell && data.cell != this.curCell)
            curCell.celltoolbar.hide();
        curCell = data.cell;
        if (!curCell.metadata['kb-cell'])
            curCell.celltoolbar.show();
    });

    /*
     * Once everything else is loaded and the Kernel is idle,
     * Go ahead and fill in the rest of the Javascript stuff.
     */
    $([IPython.events]).one('status_started.Kernel', function() {
        // NAR-271 - Firefox needs to be told where the top of the page is. :P
        window.scrollTo(0,0);

        IPython.notebook.set_autosave_interval(0);
        IPython.CellToolbar.activate_preset("KBase");


        var ws_name = null;
        if (IPython && IPython.notebook && IPython.notebook.metadata) {
            ws_name = IPython.notebook.metadata.ws_name;
            var narrname = IPython.notebook.notebook_name;
            var username = IPython.notebook.metadata.creator;
            $('#kb-narr-name #name').text(narrname);
            $('#kb-narr-creator').text(username);
            $('.kb-narr-namestamp').css({'display':'block'});

            var token = null;
            if (window.kb && window.kb.token)
                token = window.kb.token;

            $.ajax({
                type: 'GET',
                url: 'https://kbase.us/services/genome_comparison/users?usernames=' + username + '&token=' + token,
                dataType: 'json',
                crossDomain: true,
                success: function(data, res, jqXHR) {
                    if (username in data.data && data.data[username].fullName) {
                        var fullName = data.data[username].fullName;
                        $('#kb-narr-creator').text(fullName + ' (' + username + ')');
                    }
                }
            });

        }
        if (ws_name) {
            /* It's ON like DONKEY KONG! */
            $('a#workspace-link').attr('href',
                    $('a#workspace-link').attr('href') +
                    'objects/' + ws_name);
            var narr_ws = $('#notebook_panel').kbaseNarrativeWorkspace({
                loadingImage: "/static/kbase/images/ajax-loader.gif",
                ws_id: IPython.notebook.metadata.ws_name
            });
            $sidePanel.render();
            $(document).trigger('setWorkspaceName.Narrative', {'wsId' : ws_name, 'narrController': narr_ws});
            // $dataWidget.setNarrWs(narr_ws); //as a callback
            // $dataWidget.setWorkspace(ws_name);
            // setTimeout(function() { $jobsWidget.refresh(); }, 750);
        }
        else {
            /* ??? */
        }
    });
};
