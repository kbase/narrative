/**
 * Output widget for visualization of genome annotation.
 * @public
 */

/*

Known issues/tasks:
1) resize window sets svg width to zero of contig browser of non-visible tabs, so they dissappear
2) we don't know the length of the contig when rendering the gene context browser, so scale goes
   beyond the actual contig
3) color the features based on type, other things?
4) adjust height based on number of tracks
5) show assembly info on overview tab

*/

define([
    'jquery',
    'kbwidget',
    'kbaseAuthenticatedWidget',
    'narrativeConfig',

    'jquery-dataTables',

    'kbaseTable',
    'kbaseTabs',
    'ContigBrowserPanel',
    'util/string',
    'kb_common/jsonRpc/dynamicServiceClient',
], (
    $,
    KBWidget,
    kbaseAuthenticatedWidget,
    Config,

    jquery_dataTables,

    kbaseTable,
    kbaseTabs,
    ContigBrowserPanel,
    StringUtil,
    DynamicServiceClient
) => {
    'use strict';

    function isValidObjInfo(potentialObjInfo) {
        const requiredKeys = ['ws_id', 'name', 'id', 'version', 'bare_type', 'type', 'meta'];
        return !requiredKeys.some((key) => {
            return !(key in potentialObjInfo);
        });
    }

    function buildError(err) {
        let errorMessage;
        if (typeof err === 'string') {
            errorMessage = err;
        } else if (err.error) {
            errorMessage = JSON.stringify(err['error']);
            if (err.error.message) {
                errorMessage = err.error.message;
                if (err.error.error) {
                    errorMessage += '<br><b>Trace</b>:' + err.error.error;
                }
            } else {
                errorMessage = JSON.stringify(err.error);
            }
        } else {
            errorMessage = err.message;
        }
        return $('<div>').addClass('alert alert-danger').append(errorMessage);
    }

    function numberWithCommas(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    function WidgetState() {
        const UNINITIALIZED = 0;
        const OK = 1;
        const ERROR = 2;
        let state = null;
        let _info = null;
        function ok(stateInfo) {
            state = OK;
            _info = stateInfo;
        }
        function error(stateInfo) {
            state = ERROR;
            _info = stateInfo;
        }
        function isUninitialized() {
            return state === UNINITIALIZED;
        }
        function isOk() {
            return state === OK;
        }
        function isError() {
            return state === ERROR;
        }
        function info() {
            return _info;
        }
        return {
            ok: ok,
            error: error,
            isUninitialized: isUninitialized,
            isOk: isOk,
            isError: isError,
            info: info,
        };
    }

    return KBWidget({
        name: 'kbaseGenomeView',
        parent: kbaseAuthenticatedWidget,
        version: '1.0.0',
        token: null,
        width: 1150,
        options: {
            ws_id: null,
            ws_name: null,
        },
        loadingImage: Config.get('loading_gif'),
        wsUrl: Config.url('workspace'),
        timer: null,
        lastElemTabNum: 0,
        genome_info: null,

        // WidgetState
        state: WidgetState(),

        init: function (options) {
            this._super(options);

            let errorMessage;
            if (options.ws && options.id) {
                this.genome_ref = [options.ws, options.id].join('/');
            } else if (options._obj_info) {
                // make sure this is a complete object info object, if not,
                // log an error and show the error in the widget.
                if (!isValidObjInfo(options._obj_info)) {
                    errorMessage = 'Invalid obj_info provided to this widget';
                    console.error(errorMessage);
                    this.state.error({
                        message: errorMessage,
                    });
                    this.showError(errorMessage);
                    return;
                } else {
                    this.genome_info = options._obj_info;
                    this.genome_ref =
                        this.genome_info.ws_id +
                        '/' +
                        this.genome_info.id +
                        '/' +
                        this.genome_info.version;
                }
            } else {
                errorMessage = 'Insufficient information for this widget';
                console.error(errorMessage);
                this.state.error({
                    message: errorMessage,
                });
                return;
            }
            this.state.ok();

            if (this.auth()) {
                this.token = this.auth().token;
            }

            this.attachClients();

            return this;
        },

        attachClients: function () {
            this.genomeAnnotationAPI = new DynamicServiceClient({
                module: 'GenomeAnnotationAPI',
                url: Config.url('service_wizard'),
                token: this.token,
            });
            this.genomeSearchUtil = new DynamicServiceClient({
                module: 'GenomeSearchUtil',
                url: Config.url('service_wizard'),
                token: this.token,
            });
        },

        tabData: function () {
            const names = ['Overview', 'Browse Features', 'Browse Contigs'];
            const ids = ['overview', 'browse_features', 'browse_contigs'];

            return {
                names: names,
                ids: ids,
            };
        },

        link_to_ontology: function (id) {
            const goUrl = 'http://amigo.geneontology.org/amigo/term/';
            const tokens = id.split(':');
            if (tokens.length > 1) {
                if (tokens[0] === 'GO') {
                    return $('<a href="' + goUrl + id + '" target="_blank">').append(id);
                }
            }
            return id;
        },

        /*
            input =>
            {
                genomeSearchUtil: genomeSearchUtil Client
                $div:  JQuery div that I can render on
                idClick: callback when a feature is clicked
                contigClick: callback when a contig id is clicked

            }
        */
        buildGeneSearchView: function (params) {
            const self = this;

            const BIG_COL_WIDTH = '25%';

            // parse parameters
            const $div = params['$div'];
            if (!$div.is(':empty')) {
                return; // if it has content, then do not rerender
            }
            const genome_ref = params['ref'];

            let idClick = null;
            if (params['idClick']) {
                idClick = params['idClick'];
            }
            let contigClick = null;
            if (params['contigClick']) {
                contigClick = params['contigClick'];
            }

            // setup some defaults and variables (should be moved to class variables)
            const limit = 10;
            let start = 0;
            const sort_by = ['feature_id', 1];

            let n_results = 0;

            // setup the main search button and the results panel and layout
            const $input = $(
                '<input type="text" class="form-control" placeholder="Search Features">'
            );
            $input.prop('disabled', true);

            const isLastQuery = function (result) {
                if (start !== result['start']) {
                    return false;
                }
                if ($input.val() !== result['query']) {
                    return false;
                }
                return true;
            };

            const $resultDiv = $('<div>');
            const $noResultsDiv = $('<div>')
                .append('<center>No matching features found.</center>')
                .hide();
            const $loadingDiv = $('<div>');
            const $errorDiv = $('<div>');
            const $pagenateDiv = $('<div>').css('text-align', 'left');
            const $resultsInfoDiv = $('<div>');

            const $container = $('<div>')
                .addClass('container-fluid')
                .css({ margin: '15px 0px', 'max-width': '100%' });
            $div.append($container);
            const $headerRow = $('<div>')
                .addClass('row')
                .append($('<div>').addClass('col-md-4').append($pagenateDiv))
                .append($('<div>').addClass('col-md-4').append($loadingDiv))
                .append($('<div>').addClass('col-md-4').append($input));
            const $resultsRow = $('<div>')
                .addClass('row')
                .css({ 'margin-top': '15px' })
                .append($('<div>').addClass('col-md-12').append($resultDiv));
            const $noResultsRow = $('<div>')
                .addClass('row')
                .append($('<div>').addClass('col-md-12').append($noResultsDiv));
            const $infoRow = $('<div>')
                .addClass('row')
                .append($('<div>').addClass('col-md-4').append($resultsInfoDiv))
                .append($('<div>').addClass('col-md-8'));
            $container
                .append($headerRow)
                .append($resultsRow)
                .append($errorDiv)
                .append($noResultsRow)
                .append($infoRow);

            const $pageBack = $('<button class="btn btn-default">').append(
                '<i class="fa fa-caret-left" aria-hidden="true">'
            );
            const $pageForward = $('<button class="btn btn-default">').append(
                '<i class="fa fa-caret-right" aria-hidden="true">'
            );

            $pagenateDiv.append($pageBack);
            $pagenateDiv.append($pageForward);
            $pagenateDiv.hide();

            const clearInfo = function () {
                $resultsInfoDiv.empty();
                $pagenateDiv.hide();
            };

            // define the functions that do everything
            const setToLoad = function ($panel) {
                $panel.empty();
                const $loadingDiv = $('<div>')
                    .attr('align', 'left')
                    .append($('<i class="fa fa-spinner fa-spin fa-2x">'));
                $panel.append($loadingDiv);
                window.setTimeout(() => {
                    $loadingDiv.append('&nbsp; Building cache...');
                    window.setTimeout(() => {
                        $loadingDiv.append(' almost there...');
                    }, 25000);
                }, 2500);
            };

            const search = function (query, start, limit, sort_by) {
                $errorDiv.empty();
                const local_sort_by = [];
                if (sort_by[0] === 'start') {
                    local_sort_by.push(['contig_id', 1]);
                }
                local_sort_by.push(sort_by);
                return self.genomeSearchUtil
                    .callFunc('search', [
                        {
                            ref: genome_ref,
                            query: query,
                            sort_by: local_sort_by,
                            start: start,
                            limit: limit,
                        },
                    ])
                    .spread((d) => {
                        return d;
                    })
                    .catch((err) => {
                        console.error(err);
                        $loadingDiv.empty();
                        $errorDiv.append(buildError(err));
                    });
            };

            const showPaginate = function () {
                $pagenateDiv.show();
            };

            const showViewInfo = function (start, num_showing, num_found) {
                $resultsInfoDiv.empty();
                $resultsInfoDiv.append(
                    'Showing ' + (start + 1) + ' to ' + (start + num_showing) + ' of ' + num_found
                );
            };
            const showNoResultsView = function () {
                $noResultsDiv.show();
                $resultsInfoDiv.empty();
                $pagenateDiv.hide();
            };

            const buildRow = function (rowData) {
                const $tr = $('<tr>');
                let hasFunc = false;
                let hasOntology = false;
                let hasAlias = false;

                if (idClick) {
                    var getCallback = function (rowData) {
                        return function () {
                            idClick(rowData);
                        };
                    };
                    $tr.append(
                        $('<td>').append(
                            $('<a>')
                                .css('cursor', 'pointer')
                                .append(rowData['feature_id'])
                                .on('click', getCallback(rowData))
                        )
                    );
                } else {
                    $tr.append(
                        $('<td>').append(
                            $('<div>').css('word-break', 'break-all').append(rowData['feature_id'])
                        )
                    );
                }
                $tr.append($('<td>').append(rowData['feature_type']));
                $tr.append($('<td>').append(rowData['function']));
                if (rowData['function']) {
                    hasFunc = true;
                }

                let $td = $('<td>');
                if (rowData['ontology_terms']) {
                    const o_terms = rowData['ontology_terms'];
                    var $elem = $td;
                    if (Object.keys(rowData['ontology_terms']).length > 2) {
                        $elem = $('<div>').css({
                            resize: 'vertical',
                            overflow: 'auto',
                            height: '3em',
                        });
                        $td.append($elem);
                    }
                    var isFirst = true;
                    for (const term in o_terms) {
                        if (isFirst) isFirst = false;
                        else $elem.append('<br>');
                        if (o_terms.hasOwnProperty(term)) {
                            $elem.append(self.link_to_ontology(term)).append('- ' + o_terms[term]);
                            hasOntology = true;
                        }
                    }
                }
                $tr.append($td);

                $td = $('<td>');
                if (rowData['aliases']) {
                    const aliases = rowData['aliases'];
                    $elem = $td;
                    if (Object.keys(rowData['aliases']).length > 4) {
                        $elem = $('<div>').css({
                            resize: 'vertical',
                            overflow: 'auto',
                            height: '3em',
                        });
                        $td.append($elem);
                    }
                    isFirst = true;
                    for (const alias in aliases) {
                        if (isFirst) isFirst = false;
                        else $elem.append(', ');
                        if (aliases.hasOwnProperty(alias)) {
                            $elem.append(alias);
                            hasAlias = true;
                        }
                    }
                }
                $tr.append($td);

                if (rowData['global_location']['contig_id']) {
                    const loc = rowData['global_location'];
                    $tr.append($('<td>').append(numberWithCommas(loc['start'])));
                    $tr.append($('<td>').append(loc['strand']));
                    $tr.append($('<td>').append(numberWithCommas(loc['length'])));
                    if (contigClick) {
                        getCallback = function () {
                            return function () {
                                contigClick(loc['contig_id']);
                            };
                        };
                        $tr.append(
                            $('<td>').append(
                                $('<div>')
                                    .css({ 'word-break': 'break-all' })
                                    .append(
                                        $('<a>')
                                            .css('cursor', 'pointer')
                                            .append(loc['contig_id'])
                                            .on('click', getCallback(loc['contig_id']))
                                    )
                            )
                        );
                    } else {
                        $tr.append(
                            $('<td>').append(
                                $('<div>').css('word-break', 'break-all').append(loc['contig_id'])
                            )
                        );
                    }
                } else {
                    $tr.append($('<td>')).append($('<td>')).append($('<td>')).append($('<td>'));
                }

                return {
                    $tr: $tr,
                    hasFunc: hasFunc,
                    hasOntology: hasOntology,
                    hasAlias: hasAlias,
                };
            };

            const renderResult = function ($table, results) {
                $table.find('tr:gt(0)').remove();
                $loadingDiv.empty();
                $noResultsDiv.hide();
                clearInfo();

                const features = results['features'];
                if (features.length > 0) {
                    let hasFunc = false;
                    let hasOntology = false;
                    let hasAlias = false;
                    for (let k = 0; k < features.length; k++) {
                        const row = buildRow(features[k]);
                        $table.append(row.$tr);
                        if (row.hasFunc) {
                            hasFunc = true;
                        }
                        if (row.hasOntology) {
                            hasOntology = true;
                        }
                        if (row.hasAlias) {
                            hasAlias = true;
                        }
                    }
                    n_results = results['num_found'];
                    showViewInfo(results['start'], features.length, results['num_found']);
                    showPaginate(results['num_found']);
                    if (hasFunc) {
                        $table.find('.feature-tbl-function').css('width', BIG_COL_WIDTH);
                    } else {
                        $table.find('.feature-tbl-function').css('width', '1%');
                    }
                    if (hasOntology) {
                        $table.find('.feature-tbl-ontology_terms').css('width', BIG_COL_WIDTH);
                    } else {
                        $table.find('.feature-tbl-ontology_terms').css('width', '1%');
                    }
                    if (hasAlias) {
                        $table.find('.feature-tbl-aliases').css('width', BIG_COL_WIDTH);
                    } else {
                        $table.find('.feature-tbl-aliases').css('width', '1%');
                    }
                } else {
                    showNoResultsView();
                }
            };

            // Setup the actual table
            const $table = $('<table>')
                .addClass('table table-striped table-bordered table-hover')
                .css({ 'margin-left': 'auto', 'margin-right': 'auto' });
            $resultDiv.append($table);

            const buildColumnHeader = function (name, id, click_event) {
                const $sortIcon = $('<i>').css('margin-left', '8px');
                const $th = $('<th>')
                    .append('<b>' + name + '</b>')
                    .append($sortIcon);
                if (click_event) {
                    $th.css('cursor', 'pointer').on('click', () => {
                        click_event(id, $sortIcon);
                    });
                }
                return {
                    id: id,
                    name: name,
                    $th: $th,
                    $sortIcon: $sortIcon,
                };
            };

            const buildTableHeader = function () {
                let inFlight = false;

                const $colgroup = $('<colgroup>');

                const $tr = $('<tr>');
                const ASC = 0;
                const DESC = 1;
                const ID = 0;
                const DIR = 1;
                const cols = {};
                const sortEvent = function (id, $sortIcon) {
                    if (inFlight) {
                        return;
                    } // skip if a sort call is already running
                    if (sort_by[ID] == id) {
                        if (sort_by[DIR] === DESC) {
                            sort_by[DIR] = ASC;
                            $sortIcon.removeClass();
                            $sortIcon.addClass('fa fa-sort-asc');
                        } else {
                            sort_by[DIR] = DESC;
                            $sortIcon.removeClass();
                            $sortIcon.addClass('fa fa-sort-desc');
                        }
                    } else {
                        cols[sort_by[ID]].$sortIcon.removeClass();
                        sort_by[ID] = id;
                        sort_by[DIR] = DESC;
                        $sortIcon.addClass('fa fa-sort-desc');
                    }

                    setToLoad($loadingDiv);
                    inFlight = true;
                    start = 0;
                    search($input.val(), start, limit, sort_by)
                        .then((result) => {
                            if (isLastQuery(result)) {
                                renderResult($table, result);
                            }
                            inFlight = false;
                            start = 0;
                        })
                        .catch(() => {
                            inFlight = false;
                        });
                };

                const buildSingleColHeader = function (
                    key,
                    title,
                    width,
                    showSortedIcon,
                    sortEvent,
                    target
                ) {
                    target.$colgroup.append(
                        $('<col span=1>')
                            .addClass('feature-tbl-' + key)
                            .css('width', width)
                    );
                    const h = buildColumnHeader(title, key, sortEvent);
                    target.$tr.append(h.$th);
                    if (showSortedIcon) {
                        h.$sortIcon.addClass('fa fa-sort-desc');
                    }
                    target.cols[h.id] = h;
                };

                const target = {
                    $colgroup: $colgroup,
                    $tr: $tr,
                    cols: cols,
                };

                buildSingleColHeader(
                    'feature_id',
                    'Feature&nbsp;ID',
                    '1%',
                    true,
                    sortEvent,
                    target
                );
                buildSingleColHeader('feature_type', 'Type', '1%', false, sortEvent, target);
                buildSingleColHeader(
                    'function',
                    'Function',
                    BIG_COL_WIDTH,
                    false,
                    sortEvent,
                    target
                );
                buildSingleColHeader(
                    'ontology_terms',
                    'Ontology',
                    BIG_COL_WIDTH,
                    false,
                    null,
                    target
                );
                buildSingleColHeader('aliases', 'Aliases', BIG_COL_WIDTH, false, null, target);
                buildSingleColHeader('start', 'Start', '1%', false, sortEvent, target);
                buildSingleColHeader('strand', 'Strand', '1%', false, sortEvent, target);
                buildSingleColHeader('length', 'Length', '1%', false, sortEvent, target);
                buildSingleColHeader('contig_id', 'Contig', '5%', true, sortEvent, target);

                return { $colgroup: $colgroup, $theader: $tr };
            };

            const headers = buildTableHeader();
            $table.append(headers.$colgroup);
            $table.append(headers.$theader);

            // Ok, do stuff.  First show the loading icon
            setToLoad($loadingDiv);

            // Perform the first search
            search('', start, limit, sort_by).then((results) => {
                $input.prop('disabled', false);
                renderResult($table, results);
            });

            $pageBack.on('click', () => {
                if (start === 0) return;
                if (start - limit < 0) {
                    start = 0;
                } else {
                    start = start - limit;
                }
                setToLoad($loadingDiv);
                search($input.val(), start, limit, sort_by).then((result) => {
                    if (isLastQuery(result)) {
                        renderResult($table, result);
                    }
                });
            });
            $pageForward.on('click', () => {
                if (start + limit > n_results) {
                    return;
                }
                start = start + limit;
                setToLoad($loadingDiv);
                search($input.val(), start, limit, sort_by).then((result) => {
                    if (isLastQuery(result)) {
                        renderResult($table, result);
                    }
                });
            });

            //put in a slight delay so on rapid typing we don't make a flood of calls
            let fetchTimeout = null;
            $input.on('input', () => {
                // if we were waiting on other input, cancel that request
                if (fetchTimeout) {
                    window.clearTimeout(fetchTimeout);
                }
                fetchTimeout = window.setTimeout(() => {
                    fetchTimeout = null;
                    setToLoad($loadingDiv);
                    start = 0;
                    search($input.val(), start, limit, sort_by).then((result) => {
                        if (isLastQuery(result)) {
                            renderResult($table, result);
                        }
                    });
                }, 300);
            });
        },

        buildContigSearchView: function (params) {
            const self = this;
            // parse parameters
            const $div = params['$div'];
            if (!$div.is(':empty')) {
                return; // if it has content, then do not rerender
            }
            const genome_ref = params['ref'];

            let contigClick = null;
            if (params['contigClick']) {
                contigClick = params['contigClick'];
            }

            // setup some defaults and variables (should be moved to class variables)
            const limit = 10;
            let start = 0;
            const sort_by = ['contig_id', 1];

            let n_results = 0;

            function numberWithCommas(x) {
                return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            }

            // setup the main search button and the results panel and layout
            const $input = $(
                '<input type="text" class="form-control" placeholder="Search Contigs">'
            );
            $input.prop('disabled', true);

            const isLastQuery = function (result) {
                if (start !== result['start']) {
                    return false;
                }
                if ($input.val() !== result['query']) {
                    return false;
                }
                return true;
            };

            const $resultDiv = $('<div>');
            const $noResultsDiv = $('<div>')
                .append('<center>No matching contigs found.</center>')
                .hide();
            const $loadingDiv = $('<div>');
            const $errorDiv = $('<div>');
            const $pagenateDiv = $('<div>').css('text-align', 'left');
            const $resultsInfoDiv = $('<div>');

            const $container = $('<div>')
                .addClass('container-fluid')
                .css({ margin: '15px 0px', 'max-width': '100%' });
            $div.append($container);
            const $headerRow = $('<div>')
                .addClass('row')
                .append($('<div>').addClass('col-md-4').append($pagenateDiv))
                .append($('<div>').addClass('col-md-4').append($loadingDiv))
                .append($('<div>').addClass('col-md-4').append($input));
            const $resultsRow = $('<div>')
                .addClass('row')
                .css({ 'margin-top': '15px' })
                .append($('<div>').addClass('col-md-12').append($resultDiv));
            const $noResultsRow = $('<div>')
                .addClass('row')
                .append($('<div>').addClass('col-md-12').append($noResultsDiv));
            const $infoRow = $('<div>')
                .addClass('row')
                .append($('<div>').addClass('col-md-4').append($resultsInfoDiv))
                .append($('<div>').addClass('col-md-8'));
            $container
                .append($headerRow)
                .append($resultsRow)
                .append($errorDiv)
                .append($noResultsRow)
                .append($infoRow);

            const $pageBack = $('<button class="btn btn-default">').append(
                '<i class="fa fa-caret-left" aria-hidden="true">'
            );
            const $pageForward = $('<button class="btn btn-default">').append(
                '<i class="fa fa-caret-right" aria-hidden="true">'
            );

            $pagenateDiv.append($pageBack);
            $pagenateDiv.append($pageForward);
            $pagenateDiv.hide();

            const clearInfo = function () {
                $resultsInfoDiv.empty();
                $pagenateDiv.hide();
            };

            // define the functions that do everything
            const setToLoad = function ($panel) {
                $panel.empty();
                const $loadingDiv = $('<div>')
                    .attr('align', 'left')
                    .append($('<i class="fa fa-spinner fa-spin fa-2x">'));
                $panel.append($loadingDiv);
                window.setTimeout(() => {
                    $loadingDiv.append('&nbsp; Building cache...');
                    window.setTimeout(() => {
                        $loadingDiv.append(' almost there...');
                    }, 25000);
                }, 2500);
            };

            function search_contigs(query, start, limit, sort_by) {
                $errorDiv.empty();
                return self.genomeSearchUtil
                    .callFunc('search_contigs', [
                        {
                            ref: genome_ref,
                            query: query,
                            sort_by: [sort_by],
                            start: start,
                            limit: limit,
                        },
                    ])
                    .spread((d) => {
                        return d;
                    })
                    .catch((err) => {
                        console.error(err);
                        $loadingDiv.empty();
                        $errorDiv.append(buildError(err));
                    });
            }

            const showPaginate = function () {
                $pagenateDiv.show();
            };

            const showViewInfo = function (start, num_showing, num_found) {
                $resultsInfoDiv.empty();
                $resultsInfoDiv.append(
                    'Showing ' + (start + 1) + ' to ' + (start + num_showing) + ' of ' + num_found
                );
            };
            const showNoResultsView = function () {
                $noResultsDiv.show();
                $resultsInfoDiv.empty();
                $pagenateDiv.hide();
            };

            const buildRow = function (rowData) {
                const $tr = $('<tr>');
                if (contigClick) {
                    const getCallback = function (rowData) {
                        return function () {
                            contigClick(rowData['contig_id']);
                        };
                    };
                    $tr.append(
                        $('<td>').append(
                            $('<a>')
                                .css('cursor', 'pointer')
                                .append(rowData['contig_id'])
                                .on('click', getCallback(rowData))
                        )
                    );
                } else {
                    $tr.append($('<td>').append(rowData['contig_id']));
                }
                $tr.append($('<td>').append(numberWithCommas(rowData['length'])));
                $tr.append($('<td>').append(numberWithCommas(rowData['feature_count'])));

                return $tr;
            };

            const renderResult = function ($table, results) {
                $table.find('tr:gt(0)').remove();
                $loadingDiv.empty();
                $noResultsDiv.hide();
                clearInfo();

                const contigs = results['contigs'];
                if (contigs.length > 0) {
                    for (let k = 0; k < contigs.length; k++) {
                        $table.append(buildRow(contigs[k]));
                    }
                    n_results = results['num_found'];
                    showViewInfo(results['start'], contigs.length, results['num_found']);
                    showPaginate(results['num_found']);
                } else {
                    showNoResultsView();
                }
            };

            // Setup the actual table
            const $table = $('<table>')
                .addClass('table table-striped table-bordered table-hover')
                .css({ 'margin-left': 'auto', 'margin-right': 'auto' });
            $resultDiv.append($table);

            const buildColumnHeader = function (name, id, click_event) {
                const $sortIcon = $('<i>').css('margin-left', '8px');
                const $th = $('<th>')
                    .append('<b>' + name + '</b>')
                    .append($sortIcon);
                if (click_event) {
                    $th.css('cursor', 'pointer').on('click', () => {
                        click_event(id, $sortIcon);
                    });
                }
                return {
                    id: id,
                    name: name,
                    $th: $th,
                    $sortIcon: $sortIcon,
                };
            };

            const buildTableHeader = function () {
                let inFlight = false;

                const $colgroup = $('<colgroup>');

                const $tr = $('<tr>');
                const ASC = 0;
                const DESC = 1;
                const ID = 0;
                const DIR = 1;
                const cols = {};
                const sortEvent = function (id, $sortIcon) {
                    if (inFlight) {
                        return;
                    } // skip if a sort call is already running
                    if (sort_by[ID] == id) {
                        if (sort_by[DIR] === DESC) {
                            sort_by[DIR] = ASC;
                            $sortIcon.removeClass();
                            $sortIcon.addClass('fa fa-sort-asc');
                        } else {
                            sort_by[DIR] = DESC;
                            $sortIcon.removeClass();
                            $sortIcon.addClass('fa fa-sort-desc');
                        }
                    } else {
                        cols[sort_by[ID]].$sortIcon.removeClass();
                        sort_by[ID] = id;
                        sort_by[DIR] = DESC;
                        $sortIcon.addClass('fa fa-sort-desc');
                    }

                    setToLoad($loadingDiv);
                    inFlight = true;
                    start = 0;
                    search_contigs($input.val(), start, limit, sort_by)
                        .then((result) => {
                            if (isLastQuery(result)) {
                                renderResult($table, result);
                            }
                            inFlight = false;
                            start = 0;
                        })
                        .catch(() => {
                            inFlight = false;
                        });
                };

                $colgroup.append($('<col span=1>').css('width', '20%'));
                let h = buildColumnHeader('Contig ID', 'contig_id', sortEvent);
                $tr.append(h.$th);
                h.$sortIcon.addClass('fa fa-sort-desc');
                cols[h.id] = h;

                $colgroup.append($('<col span=1>').css('width', '5%'));
                h = buildColumnHeader('Length', 'length', sortEvent);
                $tr.append(h.$th);
                cols[h.id] = h;

                $colgroup.append($('<col span=1>').css('width', '20%'));
                h = buildColumnHeader('Feature Count', 'feature_count', sortEvent);
                $tr.append(h.$th);
                cols[h.id] = h;

                return { $colgroup: $colgroup, $theader: $tr };
            };

            const headers = buildTableHeader();
            $table.append(headers.$colgroup);
            $table.append(headers.$theader);

            // Ok, do stuff.  First show the loading icon
            setToLoad($loadingDiv);

            // Perform the first search
            search_contigs('', start, limit, sort_by).then((results) => {
                $input.prop('disabled', false);
                renderResult($table, results);
            });

            $pageBack.on('click', () => {
                if (start === 0) return;
                if (start - limit < 0) {
                    start = 0;
                } else {
                    start = start - limit;
                }
                setToLoad($loadingDiv);
                search_contigs($input.val(), start, limit, sort_by).then((result) => {
                    if (isLastQuery(result)) {
                        renderResult($table, result);
                    }
                });
            });
            $pageForward.on('click', () => {
                if (start + limit > n_results) {
                    return;
                }
                start = start + limit;
                setToLoad($loadingDiv);
                search_contigs($input.val(), start, limit, sort_by).then((result) => {
                    if (isLastQuery(result)) {
                        renderResult($table, result);
                    }
                });
            });

            //put in a slight delay so on rapid typing we don't make a flood of calls
            let fetchTimeout = null;
            $input.on('input', () => {
                // if we were waiting on other input, cancel that request
                if (fetchTimeout) {
                    window.clearTimeout(fetchTimeout);
                }
                fetchTimeout = window.setTimeout(() => {
                    fetchTimeout = null;
                    setToLoad($loadingDiv);
                    start = 0;
                    search_contigs($input.val(), start, limit, sort_by).then((result) => {
                        if (isLastQuery(result)) {
                            renderResult($table, result);
                        }
                    });
                }, 300);
            });
        },

        // showError will display an error as the only rendered element of this widget.
        showError: function (err) {
            this.$elem.empty();
            // This wrapper is required because the output widget displays a "Details..." button
            // with float right; without clearing this button will reside inside the error
            // display area.
            const $errorBox = $('<div>').css('clear', 'both');
            $errorBox.append(buildError(err));
            this.$elem.append($errorBox);
        },

        render: function () {
            const self = this;
            const pref = StringUtil.uuid();

            const container = this.$elem;
            // Okay, hmm, this widget only works when authorized.
            // This should never occur since the Narrative can't display without
            // authorization...
            if (self.token == null) {
                this.showError("You're not logged in");
                return;
            }

            function numberWithCommas(x) {
                return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            }

            const ready = function (genomeData) {
                const gnm = genomeData;

                container.empty();
                const $tabPane = $('<div id="' + pref + 'tab-content">');
                container.append($tabPane);
                const tabObj = new kbaseTabs($tabPane, { canDelete: true, tabs: [] });

                const tabData = self.tabData(gnm);
                const tabNames = tabData.names;
                const tabIds = tabData.ids;

                for (var i = 0; i < tabIds.length; i++) {
                    const tabDiv = $('<div id="' + pref + tabIds[i] + '"> ');
                    tabObj.addTab({
                        tab: tabNames[i],
                        content: tabDiv,
                        canDelete: false,
                        show: i == 0,
                    });
                }

                ////////////////////////////// Overview Tab //////////////////////////////
                const $overviewPanel = $('#' + pref + 'overview');
                const $overviewTable = $('<table>')
                    .addClass('table table-striped table-bordered table-hover')
                    .css({ 'margin-left': 'auto', 'margin-right': 'auto' })
                    .css({ 'word-wrap': 'break-word', 'table-layout': 'fixed' })
                    .append($('<colgroup>').append($('<col span="1" style="width: 25%;">')));

                const $tableDiv = $('<div>').addClass('col-md-8').append($overviewTable);
                const $taxonomyDiv = $('<div>').addClass('col-md-4');
                const $layout = $('<div>').addClass('row').append($tableDiv).append($taxonomyDiv);

                $overviewPanel.append($('<div>').css('margin-top', '15px').append($layout));

                const id =
                    '<a href="/#dataview/' +
                    gnm.ref +
                    '" target="_blank">' +
                    gnm.ws_obj_name +
                    '</a>';

                const scientific_name = gnm.scientific_name;
                const domain = gnm.domain;
                const genetic_code = gnm.genetic_code;
                const source = gnm.source;
                const source_id = gnm.source_id;

                const taxonomy = $('<td>');
                const taxLevels = gnm.taxonomy.split(';');
                for (let t = 0; t < taxLevels.length; t++) {
                    for (let space = 0; space < t; space++) {
                        if (space === 0) {
                            taxonomy.append('<br>');
                        }
                        taxonomy.append('&nbsp;&nbsp;');
                    }
                    taxonomy.append(taxLevels[t]);
                }
                if (taxonomy.html() === '') {
                    taxonomy.empty().append('None available.');
                }
                $taxonomyDiv.append(
                    $('<table>')
                        .addClass('table table-striped table-bordered table-hover')
                        .append($('<tr>').append($('<td>').append('<b>Taxonomy</b>')))
                        .append($('<tr>').append(taxonomy))
                );

                let size = gnm.size;
                if (size) {
                    size = numberWithCommas(size);
                }

                const overviewLabels = [
                    'KBase Object Name',
                    'Scientific Name',
                    'Domain',
                    'Genetic Code',
                    'Source',
                    'Source ID',
                    'Size',
                ];

                const overviewData = [
                    id,
                    scientific_name,
                    domain,
                    genetic_code,
                    source,
                    source_id,
                    size,
                ];

                for (i = 0; i < overviewData.length; i++) {
                    $overviewTable.append(
                        $('<tr>')
                            .append($('<td>').append($('<b>').append(overviewLabels[i])))
                            .append($('<td>').append(overviewData[i]))
                    );
                }

                const liElems = $tabPane.find('li');
                for (let liElemPos = 0; liElemPos < liElems.length; liElemPos++) {
                    const liElem = $(liElems.get(liElemPos));
                    const aElem = liElem.find('a');
                    if (aElem.length != 1) continue;
                    const dataTab = aElem.attr('data-tab');
                    var genome_ref = self.genome_ref;
                    if (dataTab === 'Browse Features') {
                        aElem.on('click', () => {
                            self.buildGeneSearchView({
                                $div: $('#' + pref + 'browse_features'),
                                ref: genome_ref,
                                idClick: function (featureData) {
                                    self.showFeatureTab(genome_ref, featureData, pref, tabObj);
                                },
                                contigClick: function (contigId) {
                                    self.showContigTab(genome_ref, contigId, pref, tabObj);
                                },
                            });
                        });
                    } else if (dataTab === 'Browse Contigs') {
                        aElem.on('click', () => {
                            self.buildContigSearchView({
                                $div: $('#' + pref + 'browse_contigs'),
                                ref: genome_ref,
                                contigClick: function (contigId) {
                                    self.showContigTab(genome_ref, contigId, pref, tabObj);
                                },
                            });
                        });
                    }
                }
            };

            container.empty();
            container.append(
                $('<div>')
                    .attr('align', 'center')
                    .append($('<i class="fa fa-spinner fa-spin fa-2x">'))
            );

            const genome_ref = self.genome_ref;

            if (self.genome_info) {
                ready(self.normalizeGenomeDataFromNarrative(self.genome_info, genome_ref, ready));
            } else {
                // get info from metadata
                self.genomeAnnotationAPI
                    .callFunc('get_genome_v1', [
                        {
                            genomes: [
                                {
                                    ref: self.genome_ref,
                                },
                            ],
                            no_data: 1,
                        },
                    ])
                    .spread((data) => {
                        ready(
                            self.normalizeGenomeDataFromQuery(data['genomes'][0], genome_ref, ready)
                        );
                    })
                    .catch((err) => {
                        console.error(err);
                        container.empty();
                        container.append(buildError(err));
                    });
            }
            return this;
        },

        normalizeGenomeDataFromNarrative: function (genome_info, genome_ref, noDataCallback) {
            const genomeData = this.normalizeGenomeMetadata(
                genome_info['meta'],
                genome_ref,
                noDataCallback
            );
            genomeData['ws_obj_name'] = genome_info['name'];
            genomeData['version'] = genome_info['version'];
            genomeData['ref'] =
                genome_info['ws_id'] + '/' + genome_info['name'] + '/' + genome_info['version'];
            return genomeData;
        },

        normalizeGenomeDataFromQuery: function (wsReturnedData, genome_ref, noDataCallback) {
            const info = wsReturnedData['info'];
            const metadata = info[10];
            const genomeData = this.normalizeGenomeMetadata(metadata, genome_ref, noDataCallback);
            genomeData['ws_obj_name'] = info[1];
            genomeData['version'] = info[4];
            genomeData['ref'] = info[6] + '/' + info[1] + '/' + info[4];
            return genomeData;
        },

        normalizeGenomeMetadata: function (metadata, genome_ref, noDataCallback) {
            const genomeData = {
                scientific_name: '',
                domain: '',
                genetic_code: '',
                source: '',
                source_id: '',
                taxonomy: '',
                size: '',
            };

            if (metadata['Name']) {
                genomeData.scientific_name = metadata['Name'];
            } else {
                // no scientific name, so ug.  we should refetch and get the basic information
                this.getGenomeDataDirectly(genome_ref, noDataCallback);
            }

            if (metadata['Domain']) {
                genomeData.domain = metadata['Domain'];
            }
            if (metadata['Genetic code']) {
                genomeData.genetic_code = metadata['Genetic code'];
            }
            if (metadata['Source']) {
                genomeData.source = metadata['Source'];
            }
            if (metadata['Source ID']) {
                genomeData.source_id = metadata['Source ID'];
            }
            if (metadata['Taxonomy']) {
                genomeData.taxonomy = metadata['Taxonomy'];
            }
            if (metadata['Size']) {
                genomeData.size = metadata['Size'];
            }

            return genomeData;
        },

        getGenomeDataDirectly: function (genome_ref, noDataCallback) {
            const included = [
                'domain',
                'genetic_code',
                'id',
                'num_features',
                'scientific_name',
                'source',
                'source_id',
                'taxonomy',
            ];
            this.genomeAnnotationAPI
                .callFunc('get_genome_v1', [
                    {
                        genomes: [
                            {
                                ref: this.genome_ref,
                            },
                        ],
                        included_fields: included,
                    },
                ])
                .spread((data) => {
                    const info = data['genomes'][0]['info'];
                    const genomeData = data['genomes'][0]['data'];
                    genomeData['ws_obj_name'] = info[1];
                    genomeData['version'] = info[4];
                    genomeData['ref'] = info[6] + '/' + info[1] + '/' + info[4];

                    // normalize these data fields too
                    if (!genomeData['domain']) {
                        genomeData.domain = '';
                    }
                    if (!genomeData['genetic_code']) {
                        genomeData.genetic_code = '';
                    }
                    if (!genomeData['source']) {
                        genomeData.source = '';
                    }
                    if (!genomeData['source_id']) {
                        genomeData.source_id = '';
                    }
                    if (!genomeData['taxonomy']) {
                        genomeData.taxonomy = '';
                    }
                    if (!genomeData['size']) {
                        genomeData.size = '';
                    }

                    noDataCallback(genomeData);
                });
        },

        renderContigData: function (genome_ref, contig_id, outputDivs) {
            const $length = outputDivs.$length;
            const $n_features = outputDivs.$n_features;
            return this.genomeSearchUtil
                .callFunc('search_contigs', [
                    {
                        ref: genome_ref,
                        query: contig_id,
                    },
                ])
                .spread((result) => {
                    let contigData = {};
                    if (result['contigs'].length == 0) {
                        $length.append('Information not available.');
                        $n_features.append('Information not available.');
                    } else {
                        for (let c = 0; c < result['contigs'].length; c++) {
                            if (contig_id === result['contigs'][c]['contig_id']) {
                                contigData = result['contigs'][c];
                                $length.append(numberWithCommas(result['contigs'][c]['length']));
                                $n_features.append(
                                    numberWithCommas(result['contigs'][c]['feature_count'])
                                );
                                break;
                            }
                        }
                    }
                    return contigData;
                })
                .catch((err) => {
                    console.error(err);
                    $length.empty();
                    $length.append(buildError(err));
                });
        },

        showContigTab: function (genome_ref, contig_id, pref, tabPane) {
            const self = this;

            function openTabGetId(tabName) {
                if (tabPane.hasTab(tabName)) return null;
                self.lastElemTabNum++;
                const tabId = '' + pref + 'elem' + self.lastElemTabNum;
                const $tabDiv = $('<div id="' + tabId + '"> ');
                tabPane.addTab({
                    tab: tabName,
                    content: $tabDiv,
                    canDelete: true,
                    show: true,
                    deleteCallback: function (name) {
                        tabPane.removeTab(name);
                        tabPane.showTab(tabPane.activeTab());
                    },
                });
                return $tabDiv;
            }

            // setup mini contig browser
            function translate_feature_data(featureData) {
                const cbFormat = {};
                cbFormat['raw'] = featureData; //Store this in order to span new tabs
                cbFormat['id'] = featureData['feature_id'];
                cbFormat['location'] = [];
                if (featureData['global_location']['contig_id']) {
                    for (let k = 0; k < featureData['location'].length; k++) {
                        // only show things on the main contig
                        const loc = featureData['location'][k];
                        if (featureData['global_location']['contig_id'] === loc['contig_id']) {
                            cbFormat['location'].push([
                                loc['contig_id'],
                                loc['start'],
                                loc['strand'],
                                loc['length'],
                            ]);
                        }
                    }
                }
                cbFormat['function'] = featureData['function'];
                return cbFormat;
            }

            function getFeaturesInRegionAndRenderBrowser(
                genome_ref,
                contig_id,
                start,
                length,
                contig_length,
                $div
            ) {
                return self.genomeSearchUtil
                    .callFunc('search_region', [
                        {
                            ref: genome_ref,
                            query_contig_id: contig_id,
                            query_region_start: start,
                            query_region_length: length,
                            page_start: 0,
                            page_limit: 2000,
                        },
                    ])
                    .spread((result) => {
                        $div.empty();

                        const contigWindowData = {
                            name: contig_id,
                            length: contig_length,
                            genes: [],
                        };

                        for (let f = 0; f < result['features'].length; f++) {
                            contigWindowData['genes'].push(
                                translate_feature_data(result['features'][f])
                            );
                        }
                        const cgb = new ContigBrowserPanel();
                        cgb.data.options.contig = contigWindowData;
                        cgb.data.options.onClickFunction = function (svgElement, feature) {
                            self.showFeatureTab(
                                genome_ref,
                                feature['original_data']['raw'],
                                pref,
                                tabPane
                            );
                        };
                        cgb.data.options.start = start;
                        cgb.data.options.length = length;
                        cgb.data.options.showButtons = false;
                        cgb.data.options.token = self.token;
                        cgb.data.$elem = $('<div style="width:100%; height: 120px;"/>');
                        cgb.data.$elem.show(() => {
                            cgb.data.update();
                        });
                        $div.append(cgb.data.$elem);
                        cgb.data.init();
                    })
                    .catch((err) => {
                        console.error(err);
                        $div.empty();
                        $div.append(buildError(err));
                    });
            }

            function showContig(genome_ref, contig_id) {
                const $div = openTabGetId(contig_id);
                if ($div === null) {
                    tabPane.showTab(contig_id);
                    return;
                }

                const $tbl = $('<table>')
                    .addClass('table table-striped table-bordered table-hover')
                    .css({ 'margin-left': 'auto', 'margin-right': 'auto' });
                $tbl.append($('<colgroup>').append($('<col span=1>').css('width', '15%')));
                const $browserCtrlDiv = $('<div>');
                const $browserDiv = $('<div>');

                // basic layout
                const $container = $('<div>')
                    .addClass('container-fluid')
                    .css({ margin: '15px 0px', 'max-width': '100%' });
                $div.append($container);
                const $tblRow = $('<div>')
                    .addClass('row')
                    .append($('<div>').addClass('col-md-12').append($tbl));
                const $browserCtrlRow = $('<div>')
                    .addClass('row')
                    .css({ 'margin-top': '15px', 'text-align': 'center' })
                    .append($('<div>').addClass('col-md-12').append($browserCtrlDiv));
                const $browserRow = $('<div>')
                    .addClass('row')
                    .css({ 'margin-top': '15px', 'text-align': 'center' })
                    .append($('<div>').addClass('col-md-12').append($browserDiv));
                $container.append($tblRow).append($browserCtrlRow).append($browserRow);

                // ID
                const $id = $('<tr>')
                    .append($('<td>').append('<b>Contig ID</b>'))
                    .append($('<td>').append(contig_id));
                $tbl.append($id);

                // Length
                const $lengthField = $('<div>');
                const $len = $('<tr>')
                    .append($('<td>').append('<b>Length</b>'))
                    .append($('<td>').append($lengthField));
                $tbl.append($len);

                // N Features
                const $featureField = $('<div>');
                const $nf = $('<tr>')
                    .append($('<td>').append('<b>Number of Features</b>'))
                    .append($('<td>').append($featureField));
                $tbl.append($nf);

                self.renderContigData(genome_ref, contig_id, {
                    $length: $lengthField,
                    $n_features: $featureField,
                }).then((contigData) => {
                    // Browser
                    $browserRow.append($('<i class="fa fa-spinner fa-spin fa-2x">'));
                    let start = 0;
                    const twentyKb = 20000;
                    let length = twentyKb;
                    const contig_length = contigData['length'];

                    const $contigScrollBack = $('<button class="btn btn-default">')
                        .append('<i class="fa fa-caret-left" aria-hidden="true">')
                        .append(' back 20kb')
                        .on('click', () => {
                            if (start - twentyKb < 0) {
                                return;
                            }
                            $browserRow.append($('<i class="fa fa-spinner fa-spin fa-2x">'));
                            start = start - twentyKb;
                            length = twentyKb;
                            getFeaturesInRegionAndRenderBrowser(
                                genome_ref,
                                contig_id,
                                start,
                                length,
                                contig_length,
                                $browserRow
                            );
                        });

                    const $contigScrollForward = $('<button class="btn btn-default">')
                        .append('forward 20kb ')
                        .append('<i class="fa fa-caret-right" aria-hidden="true">')
                        .on('click', () => {
                            if (start + twentyKb > contig_length) {
                                return;
                            }
                            $browserRow.append($('<i class="fa fa-spinner fa-spin fa-2x">'));
                            if (start + twentyKb > contig_length) {
                                return;
                            }
                            start = start + twentyKb;
                            length = twentyKb;
                            getFeaturesInRegionAndRenderBrowser(
                                genome_ref,
                                contig_id,
                                start,
                                length,
                                contig_length,
                                $browserRow
                            );
                        });

                    $browserCtrlDiv.append($contigScrollBack).append($contigScrollForward);

                    getFeaturesInRegionAndRenderBrowser(
                        genome_ref,
                        contig_id,
                        start,
                        length,
                        contig_length,
                        $browserRow
                    );
                });
            }

            showContig(genome_ref, contig_id);
        },

        showFeatureTab: function (genome_ref, featureData, pref, tabPane) {
            const self = this;

            function numberWithCommas(x) {
                return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            }

            function openTabGetId(tabName) {
                if (tabPane.hasTab(tabName)) return null;
                self.lastElemTabNum++;
                const tabId = '' + pref + 'elem' + self.lastElemTabNum;
                const $tabDiv = $('<div id="' + tabId + '"> ');
                tabPane.addTab({
                    tab: tabName,
                    content: $tabDiv,
                    canDelete: true,
                    show: true,
                    deleteCallback: function (name) {
                        tabPane.removeTab(name);
                        tabPane.showTab(tabPane.activeTab());
                    },
                });
                return $tabDiv;
            }

            function printProtein(sequence, charWrap) {
                const $div = $('<div>').css({
                    'font-family': '"Lucida Console", Monaco, monospace',
                });

                $div.append($('<span>').css({ color: 'orange' }).append('Small Nonpolar'));
                $div.append(' | ');
                $div.append($('<span>').css({ color: 'green' }).append('Hydrophobic'));
                $div.append(' | ');
                $div.append($('<span>').css({ color: 'magenta' }).append('Polar'));
                $div.append(' | ');
                $div.append($('<span>').css({ color: 'red' }).append('Neg Charged'));
                $div.append(' | ');
                $div.append($('<span>').css({ color: 'blue' }).append('Pos Charged'));
                $div.append('<br>');

                const $posTD = $('<td>').css({ 'text-align': 'right', border: '0', color: '#777' });
                const $seqTD = $('<td>').css({ border: '0' });
                let lines = 1;
                for (let i = 0; i < sequence.length; i++) {
                    if (i > 0 && i % charWrap === 0) {
                        $posTD
                            .append('<br>')
                            .append(i + 1)
                            .append(':&nbsp;');
                        $seqTD.append('<br>');
                        lines++;
                    } else if (i == 0) {
                        $posTD.append(i + 1).append(':&nbsp;');
                    }

                    let color = '#000';
                    /*http://www.bioinformatics.nl/~berndb/aacolour.html
                    The colour scheme in Lesk, Introduction to Bioinformatics, uses 5 groups (note Histidine):
                    Small nonpolar  G, A, S, T  Orange
                    Hydrophobic C, V, I, L, P, F, Y, M, W   Green
                    Polar   N, Q, H Magenta
                    Negatively charged  D, E    Red
                    Positively charged  K, R    Blue*/
                    const aa = sequence[i];
                    if (aa === 'G' || aa === 'A' || aa === 'S' || aa === 'T') color = 'orange';
                    if (
                        aa === 'C' ||
                        aa === 'V' ||
                        aa === 'I' ||
                        aa === 'L' ||
                        aa === 'P' ||
                        aa === 'F' ||
                        aa === 'Y' ||
                        aa === 'M' ||
                        aa === 'W'
                    )
                        color = 'green';
                    if (aa === 'N' || aa === 'Q' || aa === 'H') color = 'magenta';
                    if (aa === 'D' || aa === 'E') color = 'red';
                    if (aa === 'K' || aa === 'R') color = 'blue';
                    $seqTD.append($('<span>').css({ color: color }).append(aa));
                }
                $div.append(
                    $('<table>')
                        .css({ border: '0', 'border-collapse': 'collapse' })
                        .append($('<tr>').css({ border: '0' }).append($posTD).append($seqTD))
                );

                if (lines > 10) {
                    $div.css({ height: '10em', overflow: 'auto', resize: 'vertical' });
                }
                return $div;
            }

            function printDNA(sequence, charWrap) {
                const $div = $('<div>').css({
                    'font-family': '"Lucida Console", Monaco, monospace',
                });

                const $posTD = $('<td>').css({ 'text-align': 'right', border: '0', color: '#777' });
                const $seqTD = $('<td>').css({ border: '0', color: '#000' });
                let lines = 1;
                for (let i = 0; i < sequence.length; i++) {
                    if (i > 0 && i % charWrap === 0) {
                        $posTD
                            .append('<br>')
                            .append(i + 1)
                            .append(':&nbsp;');
                        $seqTD.append('<br>');
                        lines++;
                    } else if (i == 0) {
                        $posTD.append(i + 1).append(':&nbsp;');
                    }
                    const base = sequence[i];
                    $seqTD.append(base);
                }
                $div.append(
                    $('<table>')
                        .css({ border: '0', 'border-collapse': 'collapse' })
                        .append($('<tr>').css({ border: '0' }).append($posTD).append($seqTD))
                );
                if (lines > 5) {
                    $div.css({ height: '6em', overflow: 'auto', resize: 'vertical' });
                }

                return $div;
            }

            function getFeatureLocationBounds(locationObject) {
                const loc = {};
                if (locationObject['strand'] && locationObject['strand'] === '-') {
                    loc['end'] = locationObject['start'];
                    loc['start'] = loc['end'] - locationObject['length'];
                } else {
                    // assume it is on + strand
                    loc['start'] = locationObject['start'];
                    loc['end'] = loc['start'] + locationObject['length'];
                }
                return loc;
            }

            function showGene(featureData) {
                if (featureData['feature_array'] === null) {
                    featureData['feature_array'] = 'features';
                }
                const fid = featureData['feature_id'];
                const $div = openTabGetId(fid);
                if ($div === null) {
                    tabPane.showTab(fid);
                    return;
                }
                const $tbl = $('<table>')
                    .addClass('table table-striped table-bordered table-hover')
                    .css({ 'margin-left': 'auto', 'margin-right': 'auto' });
                $tbl.append($('<colgroup>').append($('<col span=1>').css('width', '15%')));

                // basic layout
                const $container = $('<div>')
                    .addClass('container-fluid')
                    .css({ margin: '15px 0px', 'max-width': '100%' });
                $div.append($container);
                const $tblRow = $('<div>')
                    .addClass('row')
                    .append($('<div>').addClass('col-md-12').append($tbl));
                $container.append($tblRow);

                const tblLabels = [];
                const tblData = [];

                tblLabels.push('Feature ID');
                // Landing pages don't work for all features yet
                //tblData.push('<a href="/#dataview/'+self.genome_ref+'?sub=Feature&subid='+fid+'" target="_blank">'+fid+'</a>');
                tblData.push(fid);

                tblLabels.push('Aliases');
                const $aliases = $('<div>');
                if (featureData['aliases']) {
                    const aliases = featureData['aliases'];
                    var isFirst = true;
                    for (const alias in aliases) {
                        if (aliases.hasOwnProperty(alias)) {
                            if (isFirst) isFirst = false;
                            else $aliases.append(', ');
                            $aliases.append(alias);
                        }
                    }
                    if (isFirst) {
                        $aliases.append('None');
                    }
                }
                tblData.push($aliases);

                tblLabels.push('Type');
                tblData.push(featureData['feature_type']);

                tblLabels.push('Product Function');
                if (featureData['function']) {
                    tblData.push(featureData['function']);
                } else {
                    tblData.push('None');
                }

                const $functions = $('<div>');
                tblLabels.push('Function Descriptions');
                tblData.push($functions);

                tblLabels.push('Ontology Terms');
                const $ontology_terms = $('<div>');
                if (featureData['ontology_terms']) {
                    const o_terms = featureData['ontology_terms'];
                    isFirst = true;
                    for (const term in o_terms) {
                        if (o_terms.hasOwnProperty(term)) {
                            if (isFirst) isFirst = false;
                            else $ontology_terms.append('<br>');
                            $ontology_terms
                                .append(self.link_to_ontology(term))
                                .append('- ' + o_terms[term]);
                        }
                    }
                    if (isFirst) {
                        $ontology_terms.append('None');
                    }
                }
                tblData.push($ontology_terms);

                tblLabels.push('Location');
                const $loc = $('<div>');
                if (featureData['global_location']['contig_id']) {
                    $loc.append('Contig:&nbsp;');
                    $loc.append(
                        $('<a>')
                            .append(featureData['global_location']['contig_id'])
                            .css({ cursor: 'pointer' })
                            .on('click', () => {
                                self.showContigTab(
                                    genome_ref,
                                    featureData['global_location']['contig_id'],
                                    pref,
                                    tabPane
                                );
                            })
                    );
                    $loc.append('<br>');
                    if (featureData['location']) {
                        const locs = featureData['location'];
                        const $locDiv = $('<div>');
                        let crop = false;
                        for (var i = 0; i < locs.length; i++) {
                            if (i > 0) {
                                $locDiv.append('<br>');
                            }
                            if (i > 6) {
                                crop = true;
                            }
                            const loc = locs[i];
                            const bounds = getFeatureLocationBounds(loc);
                            $locDiv.append(
                                numberWithCommas(bounds['start']) +
                                    '&nbsp;-&nbsp;' +
                                    numberWithCommas(bounds['end']) +
                                    '&nbsp;(' +
                                    loc['strand'] +
                                    '&nbsp;Strand)'
                            );
                        }
                        $loc.append($locDiv);
                        if (crop) {
                            $locDiv.css({ height: '10em', overflow: 'auto', resize: 'vertical' });
                        }
                    }
                } else {
                    $loc.append('None');
                }

                tblData.push($loc);

                const $contigBrowser = $('<div>')
                    .append($('<i class="fa fa-spinner fa-spin">'))
                    .append(' &nbsp;fetching nearby feature data...');
                tblLabels.push('Feature Context');
                tblData.push($contigBrowser);

                const $relationships = $('<div>');
                tblLabels.push('Relationships');
                tblData.push($relationships);

                const $protLen = $('<div>');
                tblLabels.push('Protein Length');
                tblData.push($protLen);

                const $protSeq = $('<div>')
                    .append($('<i class="fa fa-spinner fa-spin">'))
                    .append(' &nbsp;fetching sequence data...');
                tblLabels.push('Protein Translation');
                tblData.push($protSeq);

                const $dnaLen = $('<div>');
                tblLabels.push('DNA Length');
                tblData.push($dnaLen);

                const $dnaSeq = $('<div>');
                tblLabels.push('DNA Sequence');
                tblData.push($dnaSeq);

                const $flags = $('<div>');
                tblLabels.push('Flags');
                tblData.push($flags);

                const $notes = $('<div>');
                tblLabels.push('Notes');
                tblData.push($notes);

                const $warnings = $('<div>');
                tblLabels.push('Warnings');
                tblData.push($warnings);

                for (i = 0; i < tblLabels.length; i++) {
                    $tbl.append(
                        $('<tr>')
                            .append($('<td>').append($('<b>').append(tblLabels[i])))
                            .append($('<td>').append(tblData[i]))
                    );
                }

                // get sequence and other information
                self.genomeAnnotationAPI
                    .callFunc('get_genome_v1', [
                        {
                            genomes: [
                                {
                                    ref: genome_ref,
                                    feature_array: featureData['feature_array'],
                                    included_feature_position_index: [featureData['feature_idx']],
                                },
                            ],
                        },
                    ])
                    .spread((data) => {
                        const featureFullRecord = data.genomes[0].data.features[0];
                        if (featureFullRecord['protein_translation']) {
                            $protLen
                                .empty()
                                .append(
                                    numberWithCommas(
                                        featureFullRecord['protein_translation'].length
                                    )
                                );
                            $protSeq
                                .empty()
                                .append(printProtein(featureFullRecord['protein_translation'], 50));
                        } else {
                            $protSeq.empty().append('Not Available');
                        }
                        if (featureFullRecord['dna_sequence']) {
                            $dnaLen
                                .empty()
                                .append(numberWithCommas(featureFullRecord['dna_sequence'].length));
                            $dnaSeq.empty().append(printDNA(featureFullRecord['dna_sequence'], 50));
                        } else {
                            $dnaSeq.empty().append('Not Available');
                        }
                        if (featureFullRecord['warnings']) {
                            $warnings.empty().append(featureFullRecord['warnings'].join('<br>'));
                        }
                        if (featureFullRecord['notes']) {
                            $notes.empty().append(featureFullRecord['notes']);
                        }
                        if (featureFullRecord['flags']) {
                            $flags.empty().append(featureFullRecord['flags'].join(', '));
                        }
                        if (featureFullRecord['functional_descriptions']) {
                            $functions
                                .empty()
                                .append(featureFullRecord['functional_descriptions'].join('<br>'));
                        }
                        if (featureFullRecord['parent_gene']) {
                            $relationships.append(
                                'Parent Gene: ' + featureFullRecord['parent_gene'] + '<br>'
                            );
                        }
                        if (featureFullRecord['parent_mrna']) {
                            $relationships.append(
                                'Parent mRNA: ' + featureFullRecord['parent_mrna'] + '<br>'
                            );
                        }
                        if (featureFullRecord['children']) {
                            $relationships.append(
                                'Children: ' + featureFullRecord['children'] + '<br>'
                            );
                        }
                        if (featureFullRecord['mrnas']) {
                            featureFullRecord['mrnas'].forEach((mrna) => {
                                $relationships.append('Child mRNA: ' + mrna + '<br>');
                            });
                        }
                        if (featureFullRecord['cdss']) {
                            featureFullRecord['cdss'].forEach((cds) => {
                                $relationships.append('Child CDS: ' + cds + '<br>');
                            });
                        }
                    })
                    .catch((err) => {
                        console.error(err);
                        $protLen.empty();
                        $protSeq.empty();
                        $dnaLen.empty();
                        $dnaSeq.empty();
                        $protSeq.append(buildError(err));
                    });

                // setup mini contig browser
                const translate_feature_data = function (featureData) {
                    const cbFormat = {};
                    cbFormat['raw'] = featureData; //Store this in order to span new tabs
                    cbFormat['id'] = featureData['feature_id'];
                    cbFormat['location'] = [];
                    for (let k = 0; k < featureData['location'].length; k++) {
                        // only show things on the main contig
                        const loc = featureData['location'][k];
                        if (featureData['global_location']['contig_id'] === loc['contig_id']) {
                            cbFormat['location'].push([
                                loc['contig_id'],
                                loc['start'],
                                loc['strand'],
                                loc['length'],
                            ]);
                        }
                    }
                    cbFormat['function'] = featureData['function'];
                    return cbFormat;
                };

                // returns a promise with an arg that gives you the contig length
                function getContigData(genome_ref, contig_id) {
                    return self.genomeSearchUtil
                        .callFunc('search_contigs', [
                            {
                                ref: genome_ref,
                                query: contig_id,
                            },
                        ])
                        .spread((result) => {
                            let contigData = {};
                            if (result['contigs'].length > 0) {
                                for (let c = 0; c < result['contigs'].length; c++) {
                                    if (contig_id === result['contigs'][c]['contig_id']) {
                                        contigData = result['contigs'][c];
                                        break;
                                    }
                                }
                            }
                            return contigData;
                        })
                        .catch((e) => {
                            console.error(e);
                        });
                }

                if (!featureData['global_location']['contig_id']) {
                    $contigBrowser.empty().append('Genomic context is not available.');
                } else {
                    getContigData(genome_ref, featureData['global_location']['contig_id']).then(
                        (contigData) => {
                            const contigDataForBrowser = {
                                name: featureData.global_location.contig_id,
                                genes: [translate_feature_data(featureData)],
                            };

                            const range = 10000; //10kb
                            const bounds = getFeatureLocationBounds(featureData.global_location);

                            let search_start = bounds.start - range;
                            if (search_start < 0) {
                                search_start = 0;
                            }
                            const search_stop = bounds.end + range;
                            let search_length = search_stop - search_start;
                            contigDataForBrowser.length = search_stop;
                            if (contigData.length) {
                                contigDataForBrowser.length = contigData.length;
                            }
                            // do not get a range any larger than 40kb.
                            if (search_length > 40000) {
                                search_length = 40000;
                            }

                            self.genomeSearchUtil
                                .callFunc('search_region', [
                                    {
                                        ref: genome_ref,
                                        query_contig_id:
                                            featureData['global_location']['contig_id'],
                                        query_region_start: search_start,
                                        query_region_length: search_length,
                                        page_start: 0,
                                        page_limit: 2000,
                                    },
                                ])
                                .spread((result) => {
                                    $contigBrowser.empty();
                                    for (let f = 0; f < result['features'].length; f++) {
                                        contigDataForBrowser['genes'].push(
                                            translate_feature_data(result['features'][f])
                                        );
                                    }
                                    const cgb = new ContigBrowserPanel();
                                    cgb.data.options.contig = contigDataForBrowser;
                                    cgb.data.options.onClickFunction = function (
                                        svgElement,
                                        feature
                                    ) {
                                        self.showFeatureTab(
                                            genome_ref,
                                            feature['original_data']['raw'],
                                            pref,
                                            tabPane
                                        );
                                    };
                                    cgb.data.options.start = search_start;
                                    cgb.data.options.length = search_length;
                                    cgb.data.options.centerFeature = featureData['feature_id'];
                                    cgb.data.options.showButtons = false;
                                    cgb.data.options.token = self.token;
                                    cgb.data.$elem = $('<div style="width:100%; height: 200px;"/>');
                                    cgb.data.$elem.show(() => {
                                        cgb.data.update();
                                    });
                                    $contigBrowser.append(cgb.data.$elem);
                                    cgb.data.init();
                                })
                                .catch((err) => {
                                    console.error(err);
                                    $contigBrowser.empty();
                                    $contigBrowser.append(buildError(err));
                                });
                        }
                    );
                }
                tabPane.showTab(fid);
            }

            showGene(featureData);
        },

        loggedInCallback: function (event, auth) {
            if (!this.state.isOk()) {
                const errorMessage =
                    'Widget is in invalid state -- cannot render: ' + this.state.info().message;
                console.error(errorMessage);
                this.showError(errorMessage);
                return;
            }
            this.token = auth.token;
            this.attachClients();
            this.render();
            return this;
        },

        loggedOutCallback: function () {
            if (!this.state.isOk()) {
                const errorMessage =
                    'Widget is in invalid state -- cannot render: ' + this.state.info().message;
                console.error(errorMessage);
                this.showError(errorMessage);
                return;
            }
            this.token = null;
            this.attachClients();
            this.render();
            return this;
        },
    });
});
