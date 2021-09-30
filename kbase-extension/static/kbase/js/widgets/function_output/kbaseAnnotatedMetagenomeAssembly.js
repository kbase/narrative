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

    function buildError(err) {
        let errorMessage;
        if (typeof err === 'string') {
            errorMessage = err;
        } else if (err.error) {
            errorMessage = JSON.stringify(err.error);
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
        name: 'kbaseAnnotatedMetagenomeAssemblyView',
        parent: kbaseAuthenticatedWidget,
        version: '1.0.0',
        token: null,
        width: 1150,
        options: {
            id: null,
            ws: null,
            upa: null,
        },
        loadingImage: Config.get('loading_gif'),
        wsUrl: Config.url('workspace'),
        timer: null,
        lastElemTabNum: 0,
        metagenome_info: null,

        state: WidgetState(),

        init: function (options) {
            this._super(options);
            if (options.upas) {
                this.metagenome_ref = options.upas.id;
            } else if (options.ws && options.id) {
                this.metagenome_ref = [options.ws, options.id].join('/');
            } else {
                let errorMessage;
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
            this.metagenomeAPI = new DynamicServiceClient({
                module: 'MetagenomeAPI',
                url: Config.url('service_wizard'),
                token: this.token,
                version: 'dev',
            });
        },

        showError: function (err) {
            this.$elem.empty();
            // This wrapper is required because the output widget displays a "Details..." button
            // with float right; without clearing this button will reside inside the error
            // display area.
            const $errorBox = $('<div>').css('clear', 'both');
            $errorBox.append(buildError(err));
            this.$elem.append($errorBox);
        },

        tabData: function () {
            const names = ['Overview', 'Browse Features', 'Browse Contigs'];
            const ids = ['overview', 'browse_features', 'browse_contigs'];

            return {
                names: names,
                ids: ids,
            };
        },

        buildGeneSearchView: function (params) {
            const self = this;

            const BIG_COL_WIDTH = '25%';

            // parse parameters
            const $div = params.$div;
            if (!$div.is(':empty')) {
                return; // if it has content, then do not rerender
            }
            const metagenome_ref = params.ref;

            let idClick = null;
            if (params.idClick) {
                idClick = params.idClick;
            }
            let contigClick = null;
            if (params.contigClick) {
                contigClick = params.contigClick;
            }

            // setup some defaults and variables (should be moved to class variables)
            const limit = 10;
            let start = 0;
            const sort_by = ['id', 1];

            let n_results = 0;

            // setup the main search button and the results panel and layout
            const $input = $(
                '<input type="text" class="form-control" placeholder="Search Features">'
            );
            $input.prop('disabled', true);

            const $resultDiv = $('<div>');
            const $noResultsDiv = $('<div>')
                .append(
                    '<center>No matching features found.</center><br><center>Note: If this object was recently created, there may be a delay in feature tab functionality due to indexing.</center>'
                )
                .hide();
            let $loadingDiv = $('<div>');
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
                $loadingDiv = $('<div>')
                    .attr('align', 'left')
                    .append($('<i class="fa fa-spinner fa-spin fa-2x">'));
                $panel.append($loadingDiv);
            };

            const search = function (query, start, limit, sort_by) {
                $errorDiv.empty();
                const local_sort_by = [];
                if (sort_by[0] === 'start') {
                    local_sort_by.push(['contig_id', 1]);
                }
                local_sort_by.push(sort_by);
                return self.metagenomeAPI
                    .callFunc('search', [
                        {
                            ref: metagenome_ref,
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
                const hasOntology = false;
                const hasAlias = false;

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
                                .append(rowData.feature_id)
                                .on('click', getCallback(rowData))
                        )
                    );
                } else {
                    $tr.append(
                        $('<td>').append(
                            $('<div>').css('word-break', 'break-all').append(rowData.feature_id)
                        )
                    );
                }
                $tr.append($('<td>').append(rowData.feature_type));
                $tr.append($('<td>').append(rowData.function));
                if (rowData.function) {
                    hasFunc = true;
                }

                let $td = $('<td>');
                $tr.append($td);

                $td = $('<td>');
                $tr.append($td);

                if (rowData.global_location.contig_id) {
                    const loc = rowData.global_location;
                    $tr.append($('<td>').append(numberWithCommas(loc.start)));
                    $tr.append($('<td>').append(loc.strand));
                    $tr.append($('<td>').append(numberWithCommas(loc.stop)));
                    if (contigClick) {
                        getCallback = function () {
                            return function () {
                                contigClick(loc.contig_id);
                            };
                        };
                        $tr.append(
                            $('<td>').append(
                                $('<div>')
                                    .css({ 'word-break': 'break-all' })
                                    .append(
                                        $('<a>')
                                            .css('cursor', 'pointer')
                                            .append(loc.contig_id)
                                            .on('click', getCallback(loc.contig_id))
                                    )
                            )
                        );
                    } else {
                        $tr.append(
                            $('<td>').append(
                                $('<div>').css('word-break', 'break-all').append(loc.contig_id)
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
                const features = results.features;
                if (features.length > 0) {
                    let hasFunc = false;
                    let hasOntology = false;
                    let hasAlias = false;
                    features.forEach((feature) => {
                        const row = buildRow(feature);
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
                    });
                    n_results = results.num_found;
                    showViewInfo(results.start, features.length, results.num_found);
                    showPaginate(results.num_found);
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
                let inFlight = false,
                    $colgroup = $('<colgroup>'),
                    $tr = $('<tr>'),
                    ASC = 0,
                    DESC = 1,
                    ID = 0,
                    DIR = 1,
                    cols = {};

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
                            renderResult($table, result);
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

                buildSingleColHeader('id', 'Feature&nbsp;ID', '1%', true, sortEvent, target);
                buildSingleColHeader('type', 'Type', '1%', false, sortEvent, target);
                buildSingleColHeader(
                    'functions',
                    'Function',
                    BIG_COL_WIDTH,
                    false,
                    sortEvent,
                    target
                );
                buildSingleColHeader(
                    'functional_descriptions',
                    'Func. Desc.',
                    BIG_COL_WIDTH,
                    false,
                    null,
                    target
                );
                buildSingleColHeader('aliases', 'Aliases', BIG_COL_WIDTH, false, null, target);
                buildSingleColHeader('starts', 'Start', '1%', false, sortEvent, target);
                buildSingleColHeader('strands', 'Strand', '1%', false, sortEvent, target);
                buildSingleColHeader('stops', 'Length', '1%', false, sortEvent, target);
                buildSingleColHeader('contig_ids', 'Contig', '5%', true, sortEvent, target);

                return {
                    $colgroup: $colgroup,
                    $theader: $tr,
                };
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
                if (start === 0) {
                    return;
                }
                if (start - limit < 0) {
                    start = 0;
                } else {
                    start = start - limit;
                }
                setToLoad($loadingDiv);
                search($input.val(), start, limit, sort_by).then((result) => {
                    renderResult($table, result);
                });
            });
            $pageForward.on('click', () => {
                if (start + limit > n_results) {
                    return;
                }
                start = start + limit;
                setToLoad($loadingDiv);
                search($input.val(), start, limit, sort_by).then((result) => {
                    renderResult($table, result);
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
                        renderResult($table, result);
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
            const metagenome_ref = params.ref;

            let contigClick = null;
            if (params.contigClick) {
                contigClick = params.contigClick;
            }

            // setup some defaults and variables (should be moved to class variables)
            const limit = 10;
            let start = 0;
            const sort_by = ['contig_id', 1];

            let n_results = 0;

            const $resultDiv = $('<div>');
            const $noResultsDiv = $('<div>')
                .append(
                    '<center>No matching contigs found.</center><br><center>Note: If this object was recently created, there may be a delay in contig tab functionality due to indexing.</center>'
                )
                .hide();
            let $loadingDiv = $('<div>');
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
                .append($('<div>').addClass('col-md-4').append($loadingDiv));
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
                $loadingDiv = $('<div>')
                    .attr('align', 'left')
                    .append($('<i class="fa fa-spinner fa-spin fa-2x">'));
                $panel.append($loadingDiv);
            };

            function search_contigs(start, limit, sort_by) {
                $errorDiv.empty();
                return self.metagenomeAPI
                    .callFunc('search_contigs', [
                        {
                            ref: metagenome_ref,
                            sort_by: sort_by,
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
                            contigClick(rowData.contig_id);
                        };
                    };
                    $tr.append(
                        $('<td>').append(
                            $('<a>')
                                .css('cursor', 'pointer')
                                .append(rowData.contig_id)
                                .on('click', getCallback(rowData))
                        )
                    );
                } else {
                    $tr.append($('<td>').append(rowData.contig_id));
                }
                $tr.append($('<td>').append(numberWithCommas(rowData.length)));
                $tr.append($('<td>').append(numberWithCommas(rowData.feature_count)));

                return $tr;
            };

            const renderResult = function ($table, results) {
                $table.find('tr:gt(0)').remove();
                $loadingDiv.empty();
                $noResultsDiv.hide();
                clearInfo();

                const contigs = results.contigs;
                if (contigs.length > 0) {
                    for (let k = 0; k < contigs.length; k += 1) {
                        $table.append(buildRow(contigs[k]));
                    }
                    n_results = results.num_found;
                    showViewInfo(results.start, contigs.length, results.num_found);
                    showPaginate();
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
                    search_contigs(start, limit, sort_by)
                        .then((result) => {
                            renderResult($table, result);
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

                return {
                    $colgroup: $colgroup,
                    $theader: $tr,
                };
            };

            const headers = buildTableHeader();
            $table.append(headers.$colgroup);
            $table.append(headers.$theader);

            // Ok, do stuff.  First show the loading icon
            setToLoad($loadingDiv);

            // Perform the first search
            search_contigs(start, limit, sort_by).then((results) => {
                renderResult($table, results);
            });

            $pageBack.on('click', () => {
                if (start === 0) {
                    return;
                }
                if (start - limit < 0) {
                    start = 0;
                } else {
                    start = start - limit;
                }
                setToLoad($loadingDiv);
                search_contigs(start, limit, sort_by).then((result) => {
                    renderResult($table, result);
                });
            });
            $pageForward.on('click', () => {
                if (start + limit > n_results) {
                    return;
                }
                start = start + limit;
                setToLoad($loadingDiv);
                search_contigs(start, limit, sort_by).then((result) => {
                    renderResult($table, result);
                });
            });
        },

        renderContigData: function (metagenome_ref, contig_id, outputDivs) {
            const $length = outputDivs.$length;
            const $n_features = outputDivs.$n_features;
            return this.metagenomeAPI
                .callFunc('get_contig_info', [
                    {
                        ref: metagenome_ref,
                        contig_id: contig_id,
                    },
                ])
                .spread((result) => {
                    const contigData = result.contig;
                    $length.append(numberWithCommas(result.contig.length));
                    $n_features.append(numberWithCommas(result.contig.feature_count));
                    return contigData;
                })
                .catch((err) => {
                    console.error(err);
                    $length.empty();
                    $length.append(buildError(err));
                });
        },

        ////////////////////////
        ////show contig tab/////
        ////////////////////////
        showContigTab: function (metagenome_ref, contig_id, pref, tabPane) {
            const self = this;

            function openTabGetId(tabName) {
                if (tabPane.hasTab(tabName)) {
                    return null;
                }
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
                cbFormat.raw = featureData; //Store this in order to span new tabs
                cbFormat.id = featureData.feature_id;
                cbFormat.location = [];
                if (featureData.global_location.contig_id) {
                    featureData.location.forEach((loc) => {
                        // only show things on the main contig
                        if (featureData.global_location.contig_id === loc.contig_id) {
                            cbFormat.location.push([
                                loc.contig_id,
                                loc.start,
                                loc.strand,
                                loc.stop,
                            ]);
                        }
                    });
                }
                cbFormat.function = featureData.function;
                return cbFormat;
            }

            function getFeaturesInRegionAndRenderBrowser(
                metagenome_ref,
                contig_id,
                start,
                length,
                contig_length,
                $div
            ) {
                return self.metagenomeAPI
                    .callFunc('search_region', [
                        {
                            ref: metagenome_ref,
                            contig_id: contig_id,
                            region_start: start,
                            region_length: length,
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

                        result.features.forEach((feature) => {
                            contigWindowData.genes.push(translate_feature_data(feature));
                        });

                        const cgb = new ContigBrowserPanel();
                        cgb.data.options.contig = contigWindowData;
                        cgb.data.options.onClickFunction = function (svgElement, feature) {
                            self.showFeatureTab(
                                metagenome_ref,
                                feature.original_data.raw,
                                pref,
                                tabPane
                            );
                        };
                        cgb.data.options.start = start;
                        cgb.data.options.length = length;
                        cgb.data.options.showButtons = false;
                        cgb.data.options.token = self.token;
                        cgb.data.$elem = $(
                            '<div style="width:100%; height: 120px; overflow: auto;"/>'
                        );
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
            function showContig(metagenome_ref, contig_id) {
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

                self.renderContigData(metagenome_ref, contig_id, {
                    $length: $lengthField,
                    $n_features: $featureField,
                }).then((contigData) => {
                    // Browser
                    $browserRow.append($('<i class="fa fa-spinner fa-spin fa-2x">'));
                    let start = 0;
                    const twentyKb = 20000;
                    let length = twentyKb;
                    const contig_length = contigData.length;

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
                                metagenome_ref,
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
                                metagenome_ref,
                                contig_id,
                                start,
                                length,
                                contig_length,
                                $browserRow
                            );
                        });

                    $browserCtrlDiv.append($contigScrollBack).append($contigScrollForward);

                    getFeaturesInRegionAndRenderBrowser(
                        metagenome_ref,
                        contig_id,
                        start,
                        length,
                        contig_length,
                        $browserRow
                    );
                });
            }

            showContig(metagenome_ref, contig_id);
        },

        render: function () {
            const pref = StringUtil.uuid();
            const self = this;

            const container = this.$elem;
            if (self.token == null) {
                this.showError("You're not logged in");
                return;
            }

            const get_feature_type_counts = function (metagenome_ref) {
                return self.metagenomeAPI
                    .callFunc('get_feature_type_counts', [
                        {
                            ref: metagenome_ref,
                        },
                    ])
                    .spread((d) => {
                        return d;
                    })
                    .catch((err) => {
                        console.error(err);
                    });
            };

            ///////// Overview Tab /////////
            const ready = function (metagenomeData) {
                const mgnm = metagenomeData;

                const metagenome_ref = self.metagenome_ref;
                let feature_type_counts = {};
                const feature_type_vals = [];
                const feature_type_labels = [];

                get_feature_type_counts(metagenome_ref).then((result) => {
                    feature_type_counts = result['feature_type_counts'];

                    for (const property in feature_type_counts) {
                        feature_type_labels.push('Number of '.concat(property).concat('s'));
                        feature_type_vals.push(feature_type_counts[property]);
                    }

                    container.empty();
                    const $tabPane = $('<div id="' + pref + 'tab-content">');
                    container.append($tabPane);
                    const tabObj = new kbaseTabs($tabPane, { canDelete: true, tabs: [] });

                    const tabData = self.tabData(mgnm);
                    const tabNames = tabData.names;
                    const tabIds = tabData.ids;

                    for (let i = 0; i < tabIds.length; i += 1) {
                        const tabDiv = $('<div id="' + pref + tabIds[i] + '"> ');
                        tabObj.addTab({
                            tab: tabNames[i],
                            content: tabDiv,
                            canDelete: false,
                            show: i == 0,
                        });
                    }
                    const $overviewPanel = $('#' + pref + 'overview');
                    const $overviewTable = $('<table>')
                        .addClass('table table-striped table-bordered table-hover')
                        .css({ 'margin-left': 'auto', 'margin-right': 'auto' })
                        .css({ 'word-wrap': 'break-word', 'table-layout': 'fixed' })
                        .append($('<colgroup>').append($('<col span="1" style="width: 25%;">')));

                    const $tableDiv = $('<div>').append($overviewTable); //.addClass('col-md-8').append($overviewTable);
                    const $layout = $('<div>') //.addClass('row')
                        .append($tableDiv);

                    $overviewPanel.append($('<div>').css('margin-top', '15px').append($layout));

                    const id =
                        '<a href = "/#dataview/' +
                        mgnm.ref +
                        '" target="_blank">' +
                        mgnm.ws_obj_name +
                        '</a>';

                    const source = mgnm.source;
                    const source_id = mgnm.source_id;
                    let size = mgnm.size;
                    if (size) {
                        size = numberWithCommas(size);
                    }
                    const gc_content = mgnm.gc_content;
                    const num_features = mgnm.num_features;
                    const num_contigs = mgnm.num_contigs;
                    const environment = mgnm.environment;

                    const feat_type_labels = [];
                    for (let i = 0; i < feature_type_counts.length; i += 1) {
                        feat_type_labels.push('Number of '.concat(feat_str).concat('s'));
                    }

                    const overviewLabels = [
                        'KBase Object Name',
                        'Source',
                        'Source ID',
                        'Size',
                        'GC Content',
                        'Number of Features',
                        'Number of Contigs',
                        'Environment',
                    ].concat(feature_type_labels);

                    const overviewData = [
                        id,
                        source,
                        source_id,
                        size,
                        gc_content,
                        num_features,
                        num_contigs,
                        environment,
                    ].concat(feature_type_vals);

                    for (let i = 0; i < overviewData.length; i += 1) {
                        $overviewTable.append(
                            $('<tr>')
                                .append($('<td>').append($('<b>').append(overviewLabels[i])))
                                .append($('<td>').append(overviewData[i]))
                        );
                    }

                    const liElems = $tabPane.find('li');

                    const browse_features_func = function (metagenome_ref) {
                        self.buildGeneSearchView({
                            $div: $('#' + pref + 'browse_features'),
                            ref: metagenome_ref,
                            idClick: function (featureData) {
                                self.showFeatureTab(metagenome_ref, featureData, pref, tabObj);
                            },
                            contigClick: function (contigId) {
                                self.showContigTab(metagenome_ref, contigId, pref, tabObj);
                            },
                        });
                    };

                    const browse_contig_func = function (metagenome_ref) {
                        self.buildContigSearchView({
                            $div: $('#' + pref + 'browse_contigs'),
                            ref: metagenome_ref,
                            contigClick: function (contigId) {
                                self.showContigTab(metagenome_ref, contigId, pref, tabObj);
                            },
                        });
                    };

                    for (let liElemPos = 0; liElemPos < liElems.length; liElemPos += 1) {
                        const liElem = $(liElems.get(liElemPos));
                        const aElem = liElem.find('a');
                        if (aElem.length == 1) {
                            const dataTab = aElem.attr('data-tab');
                            if (dataTab === 'Browse Features') {
                                aElem.on('click', () => browse_features_func(metagenome_ref));
                            } else if (dataTab === 'Browse Contigs') {
                                aElem.on('click', () => browse_contig_func(metagenome_ref));
                            }
                        }
                    }
                });
            };
            container.empty();
            container.append(
                $('<div>')
                    .attr('align', 'center')
                    .append($('<i class="fa fa-spinner fa-spin fa-2x">'))
            );

            const metagenome_ref = self.metagenome_ref;

            if (self.metagenome_info) {
                ready(
                    self.normalizeMetagenomeDataFromNarrative(
                        self.metagenome_info,
                        metagenome_ref,
                        ready
                    )
                );
            } else {
                // get info from metadata
                self.metagenomeAPI
                    .callFunc('get_annotated_metagenome_assembly', [
                        {
                            ref: self.metagenome_ref,
                            included_fields: [], // include no fields
                        },
                    ])
                    .spread((data) => {
                        ready(
                            self.normalizeMetagenomeDataFromQuery(
                                data.genomes[0],
                                metagenome_ref,
                                ready
                            )
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

        normalizeMetagenomeDataFromQuery: function (wsReturnedData) {
            const info = wsReturnedData.info;
            const metadata = info[10];
            const genomeData = this.normalizeMetagenomeMetadata(metadata);
            genomeData.ws_obj_name = info[1];
            genomeData.version = info[4];
            genomeData.ref = info[6] + '/' + info[1] + '/' + info[4];
            return genomeData;
        },

        normalizeMetagenomeDataFromNarrative: function (metagenome_info) {
            const genomeData = this.normalizeMetagenomeMetadata(metagenome_info.meta);
            genomeData.ws_obj_name = metagenome_info.name;
            genomeData.version = metagenome_info.version;
            genomeData.ref =
                metagenome_info.ws_id + '/' + metagenome_info.name + '/' + metagenome_info.version;
            return genomeData;
        },

        normalizeMetagenomeMetadata: function (metadata) {
            const genomeData = {
                genetic_code: '',
                source: '',
                source_id: '',
                size: '',
                gc_content: '',
                num_contigs: '',
                num_features: '',
            };

            if (metadata['Genetic code']) {
                genomeData.genetic_code = metadata['Genetic code'];
            }
            if (metadata.Source) {
                genomeData.source = metadata.Source;
            }
            if (metadata['Source ID']) {
                genomeData.source_id = metadata['Source ID'];
            }
            if (metadata.Size) {
                genomeData.size = metadata.Size;
            }
            if (metadata['GC Content']) {
                genomeData.gc_content = metadata['GC Content'];
            }
            if (metadata.Environment) {
                genomeData.environment = metadata.Environment;
            }
            if (metadata['Number features']) {
                genomeData.num_features = metadata['Number features'];
            }
            if (metadata['Number contigs']) {
                genomeData.num_contigs = metadata['Number contigs'];
            }

            return genomeData;
        },

        showFeatureTab: function (metagenome_ref, featureData, pref, tabPane) {
            const self = this;

            function openTabGetId(tabName) {
                if (tabPane.hasTab(tabName)) {
                    return null;
                }
                self.lastElemTabNum += 1;
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

            function printDNA(sequence, charWrap) {
                const $div = $('<div>').css({
                    'font-family': '"Lucida Console", Monaco, monospace',
                });

                const $posTD = $('<td>').css({ 'text-align': 'right', border: '0', color: '#777' });
                const $seqTD = $('<td>').css({ border: '0', color: '#000' });
                let lines = 1;
                for (let i = 0; i < sequence.length; i += 1) {
                    if (i > 0 && i % charWrap === 0) {
                        $posTD
                            .append('<br>')
                            .append(i + 1)
                            .append(':&nbsp;');
                        $seqTD.append('<br>');
                        lines += 1;
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
                if (locationObject.strand && locationObject.strand === '-') {
                    loc.end = locationObject.start;
                    loc.start = loc.end - locationObject.stop;
                } else {
                    // assume it is on + strand
                    loc.start = locationObject.start;
                    loc.end = loc.start + locationObject.stop;
                }
                return loc;
            }

            function showGene(featureData) {
                if (featureData.feature_array === null) {
                    featureData.feature_array = 'features';
                }
                const fid = featureData.feature_id;
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
                tblData.push(fid);

                tblLabels.push('Aliases');
                const $aliases = $('<div>');
                if (featureData.aliases) {
                    const aliases = featureData.aliases;
                    let isFirst = true;
                    for (const alias in aliases) {
                        if (isFirst) {
                            isFirst = false;
                        } else {
                            $aliases.append(', ');
                        }
                        $aliases.append(alias);
                    }
                    if (isFirst) {
                        $aliases.append('None');
                    }
                }
                tblData.push($aliases);

                tblLabels.push('Type');
                tblData.push(featureData.feature_type);

                tblLabels.push('Product Function');
                if (featureData.function) {
                    tblData.push(featureData.function);
                } else {
                    tblData.push('None');
                }

                const $functions = $('<div>');
                tblLabels.push('Function Descriptions');
                tblData.push($functions);

                tblLabels.push('Location');
                const $loc = $('<div>');
                if (featureData.global_location.contig_id) {
                    $loc.append('Contig:&nbsp;');
                    $loc.append(
                        $('<a>')
                            .append(featureData.global_location.contig_id)
                            .css({ cursor: 'pointer' })
                            .on('click', () => {
                                self.showContigTab(
                                    metagenome_ref,
                                    featureData.global_location.contig_id,
                                    pref,
                                    tabPane
                                );
                            })
                    );
                    $loc.append('<br>');
                    if (featureData.location) {
                        const locs = featureData.location;
                        const $locDiv = $('<div>');
                        let crop = false;
                        for (let i = 0; i < locs.length; i += 1) {
                            if (i > 0) {
                                $locDiv.append('<br>');
                            }
                            if (i > 6) {
                                crop = true;
                            }
                            var loc = locs[i];
                            var bounds = getFeatureLocationBounds(loc);
                            $locDiv.append(
                                numberWithCommas(bounds.start) +
                                    '&nbsp;-&nbsp;' +
                                    numberWithCommas(bounds.end) +
                                    '&nbsp;(' +
                                    loc.strand +
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

                const $dnaLen = $('<div>');
                tblLabels.push('DNA Length');
                tblData.push($dnaLen);

                const $dnaSeq = $('<div>');
                tblLabels.push('DNA Sequence');
                tblData.push($dnaSeq);

                const $warnings = $('<div>');
                tblLabels.push('Warnings');
                tblData.push($warnings);

                for (let i = 0; i < tblLabels.length; i += 1) {
                    $tbl.append(
                        $('<tr>')
                            .append($('<td>').append($('<b>').append(tblLabels[i])))
                            .append($('<td>').append(tblData[i]))
                    );
                }

                if (featureData.size) {
                    $dnaLen.empty().append(numberWithCommas(featureData.size));
                }
                if (featureData.dna_sequence) {
                    $dnaSeq.empty().append(printDNA(featureData.dna_sequence, 100));
                } else {
                    $dnaSeq.empty().append('Not Available');
                }
                if (featureData.warnings) {
                    $warnings.empty().append(featureData.warnings.join('<br>'));
                }
                if (featureData.functional_descriptions) {
                    $functions.empty().append(featureData.functional_descriptions.join('<br>'));
                }
                if (featureData.parent_gene) {
                    $relationships.append('Parent Gene: ' + featureData.parent_gene + '<br>');
                }
                if (featureData.inference_data) {
                    $relationships.append('Inference Data: ' + featureData.inference_data + '<br>');
                }

                // setup mini contig browser
                const translate_feature_data = function (featureData) {
                    const cbFormat = {};
                    cbFormat.raw = featureData; //Store this in order to span new tabs
                    cbFormat.id = featureData.feature_id;
                    cbFormat.location = [];
                    for (let k = 0; k < featureData.location.length; k += 1) {
                        // only show things on the main contig
                        loc = featureData.location[k];
                        if (featureData.global_location.contig_id === loc.contig_id) {
                            cbFormat.location.push([
                                loc.contig_id,
                                loc.start,
                                loc.strand,
                                loc.stop,
                            ]);
                        }
                    }
                    cbFormat.function = featureData.function;
                    return cbFormat;
                };

                if (!featureData.global_location.contig_id) {
                    $contigBrowser.empty().append('Genomic context is not available.');
                } else {
                    const contigDataForBrowser = {
                        name: featureData.global_location.contig_id,
                        genes: [translate_feature_data(featureData)],
                    };
                    const range = 10000;
                    var bounds = getFeatureLocationBounds(featureData.global_location);

                    let search_start = bounds.start - range;
                    if (search_start < 0) {
                        search_start = 0;
                    }
                    const search_stop = bounds.end + range;
                    let search_length = search_stop - search_start;
                    contigDataForBrowser.length = search_stop;

                    if (search_length > 40000) {
                        search_length = 40000;
                    }

                    self.metagenomeAPI
                        .callFunc('search_region', [
                            {
                                ref: metagenome_ref,
                                contig_id: featureData.global_location.contig_id,
                                region_start: search_start,
                                region_length: search_length,
                                page_start: 0,
                                page_limit: 100,
                            },
                        ])
                        .spread((result) => {
                            $contigBrowser.empty();
                            result.features.forEach((feature) => {
                                contigDataForBrowser.genes.push(translate_feature_data(feature));
                            });

                            const cgb = new ContigBrowserPanel();
                            cgb.data.options.contig = contigDataForBrowser;
                            cgb.data.options.onClickFunction = function (svgElement, feature) {
                                self.showFeatureTab(
                                    metagenome_ref,
                                    feature.original_data.raw,
                                    pref,
                                    tabPane
                                );
                            };
                            cgb.data.options.start = search_start;
                            cgb.data.options.length = search_length;
                            cgb.data.options.centerFeature = featureData.feature_id;
                            cgb.data.options.showButtons = false;
                            cgb.data.options.token = self.token;
                            cgb.data.$elem = $(
                                '<div style="width:100%; height: 200px; overflow: auto"/>'
                            );
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
    });
});
