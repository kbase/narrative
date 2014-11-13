/**
 * This is the entry point for the Narrative's front-end. It initializes
 * the login session, fires up the data and function widgets, and creates
 * the kbaseNarrativeWorkspace wrapper around the IPython notebook that 
 * does fun things like manage widgets and cells and kernel events to talk to them.
 */
"use strict";

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
    var token = null;
    var narr_ws = null;
    var readonly = false; /* whether whole narrative is read-only */

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
                                                .append('Okay')))));

    var $versionBtn = $('<a href="#">About</a>')
                      .click(function(event) {
                          event.preventDefault();
                          event.stopPropagation();
                          $versionModal.modal('show');
                          for (var i=0; i<endpointTesters.length; i++) {
                              endpointTesters[i].test();
                          }
                      });

    $('#kb-version-stamp').empty().append($versionBtn);
    $('#notebook').append($versionModal);

    /*
     * Before we get everything loading, just grey out the whole %^! page
     */
     $('#main-container').hide();
    var $dataWidget = $('#kb-ws').kbaseNarrativeDataPanel();
    $dataWidget.showLoadingMessage('Waiting for Narrative to finish loading...');

    var $functionWidget = $('#kb-function-panel').kbaseNarrativeMethodPanel({ autopopulate: false });
    $functionWidget.refreshFromService();

    var $jobsWidget = $('#kb-jobs-panel').kbaseNarrativeJobsPanel({ autopopulate: false });
    $jobsWidget.showLoadingMessage('Waiting for Narrative to finish loading...');
    
    var $appsWidget = $('#kb-apps-panel').kbaseNarrativeAppsPanel({ autopopulate: true });
    /*
     * Once everything else is loaded and the Kernel is idle,
     * Go ahead and fill in the rest of the Javascript stuff.
     */
    $([IPython.events]).one('status_started.Kernel', function() {
        // NAR-271 - Firefox needs to be told where the top of the page is. :P
        window.scrollTo(0,0);

        IPython.notebook.set_autosave_interval(0);

        var ws_name = null;
        if (IPython && IPython.notebook && IPython.notebook.metadata) {
            ws_name = IPython.notebook.metadata.ws_name;
        }
        if (ws_name) {
            /* It's ON like DONKEY KONG! */
            $('a#workspace-link').attr('href',
                    $('a#workspace-link').attr('href') +
                    'objects/' + ws_name);
            narr_ws = $('#notebook_panel').kbaseNarrativeWorkspace({
                loadingImage: "/static/kbase/images/ajax-loader.gif",
                ws_id: IPython.notebook.metadata.ws_name
            });
            $dataWidget.setNarrWs(narr_ws); //as a callback
            $dataWidget.setWorkspace(ws_name);
            setTimeout(function() { $jobsWidget.refresh(); }, 750);
        }
        else {
            /* ??? */
        }
    });
};
