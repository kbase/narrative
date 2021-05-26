/**
 * "Public Data" tab on data side panel.
 * @author Roman Sutormin <rsutormin@lbl.gov>
 * @public
 */
define([
    'kbwidget',
    'jquery',
    'numeral',
    'narrativeConfig',
    'kbaseAuthenticatedWidget',
    'base/js/namespace',
    'kb_common/jsonRpc/dynamicServiceClient',
    'kb_common/jsonRpc/genericClient',
    'kb_common/html',
    'util/icon',
    'widgets/narrative_core/publicDataSources/workspaceDataSource',
    'widgets/narrative_core/publicDataSources/search2DataSource',
    'yaml!kbase/config/publicDataSources.yaml',

    'bootstrap',
], (
    KBWidget,
    $,
    numeral,
    Config,
    kbaseAuthenticatedWidget,
    Jupyter,
    DynamicServiceClient,
    ServiceClient,
    html,
    Icon,
    WorkspaceDataSource,
    SearchDataSource,
    DataSourceConfig
) => {
    'use strict';

    function formatValue(value) {
        if (typeof value === 'undefined' || (typeof value === 'string' && value.length === 0)) {
            return '<span style="color: #AAA; font-weight: normal; font-style: italic">n/a</span>';
        } else {
            return String(value);
        }
    }

    function formatItem(item) {
        return `
            <span role='row' data-test-id='${item.id}'>
            <span style='color: #AAA; font-weight: normal; font-style: italic' data-test-id='label' role='cell'>${
                item.label
            }</span>: 
            &nbsp;
            <span data-test-id='value' role='cell'>${formatValue(item.value)}</span>
            </span>
        `;
    }

    // metadata is represented as an array of simple objects with
    // props label, value -or-
    // an array of the same.
    //
    function metadataToTable(metadata) {
        const $table = $('<table role="table">').css('font-size', '80%');

        metadata.forEach((item) => {
            let value;
            if (item.value instanceof Array) {
                value = item.value
                    .map((value) => {
                        return formatItem(value);
                    })
                    .join('&nbsp;&nbsp;&nbsp;');
            } else {
                value = formatValue(item.value);
            }

            const $row = $(`<tr role='row' data-test-id='${item.id || item.label}'>`)
                .css('margin-bottom', '2px')
                .append(
                    $('<td role="cell" data-test-id="label">')
                        .css('width', '7em')
                        .css('font-weight', 'normal')
                        .css('font-style', 'italic')
                        .css('padding-right', '4px')
                        .css('color', '#AAA')
                        .css('vertical-align', 'top')
                        .css('padding-bottom', '2px')
                        .text(item.label)
                )
                .append(
                    $('<td role="cell" data-test-id="value">')
                        // .css('font-weight', 'bold')
                        .css('vertical-align', 'top')
                        .css('padding-bottom', '2px')
                        .html(value)
                );

            $table.append($row);
        });
        return $table;
    }

    function renderTotals(found, total) {
        const $totals = $('<span>').addClass('kb-data-list-type');
        if (total === 0) {
            $totals.append($('<span>None available</span>'));
        } else if (found === 0) {
            $totals
                .append(
                    $('<span data-test-id="found-count">').css('font-weight', 'bold').text('None')
                )
                .append($('<span>').text(' found out of '))
                .append(
                    $('<span data-test-id="total-count">')
                        .css('font-weight', 'bold')
                        .text(numeral(total).format('0,0'))
                )
                .append($('<span>').text(' available'));
        } else if (total > found) {
            $totals
                .append(
                    $('<span data-test-id="found-count">')
                        .css('font-weight', 'bold')
                        .text(numeral(found).format('0,0'))
                )
                .append($('<span>').text(' found out of '))
                .append(
                    $('<span data-test-id="total-count">')
                        .css('font-weight', 'bold')
                        .text(numeral(total).format('0,0'))
                )
                .append($('<span>').text(' available'));
        } else {
            $totals
                .append($('<span>').text(numeral(total).format('0,0')))
                .append($('<span>').text(' available'));
        }
        return $totals;
    }

    /*
    getNextAutoSuffix
    For a given object target name, and a set of objects, and a suffix generated
    by a previous failed attempt to save the object, return either:
    - null if the target name is not found in the object set
    - 1 if the target name was found, but no target names with a suffix
    - the greatest of the failed suffix passed in or the greatest suffix in the data
      set, incremented by one.
    */
    function getNextAutoSuffix(targetName, narrativeObjects, nextSuffix) {
        const targetNameRe = new RegExp('^' + targetName + '$');
        const correctedTargetNameRe = new RegExp('^' + targetName + '_([\\d]+)$');
        let foundRoot;
        let maxSuffix;
        narrativeObjects.forEach((object) => {
            const name = object[1];
            let m = targetNameRe.exec(name);
            if (m) {
                foundRoot = true;
                return;
            }
            m = correctedTargetNameRe.exec(name);
            if (m) {
                maxSuffix = Math.max(maxSuffix || 0, parseInt(m[1], 10));
                return;
            }
        });

        // The suffix logic is carefully crafted to accommodate retry (via nextSuffix)
        // and automatic next suffix via the max suffix determined above.
        if (maxSuffix) {
            if (nextSuffix) {
                // a previous attempt to copy failed due to the object already existing.
                // We honor the maxSuffix found if greater, otherwise use this one.
                if (maxSuffix > nextSuffix) {
                    return maxSuffix + 1;
                }
                return nextSuffix;
            }
            return maxSuffix + 1;
        } else if (foundRoot) {
            if (nextSuffix) {
                return nextSuffix;
            }
            return 1;
        }
        return null;
    }

    const dataSourceTypes = {
        search: {
            serviceDependencies: {
                searchapi2: 'searchapi2',
            },
            baseObject: SearchDataSource,
        },
        workspace: {
            serviceDependencies: {
                ServiceWizard: 'service_wizard',
            },
            baseObject: WorkspaceDataSource,
        },
    };

    return KBWidget({
        name: 'kbaseNarrativeSidePublicTab',
        parent: kbaseAuthenticatedWidget,
        version: '1.0.0',
        options: {
            $importStatus: $('<div>'),
            addToNarrativeButton: null,
            selectedItems: null,
            landingPageURL: Config.url('landing_pages'),
            provenanceViewerBaseURL: Config.url('provenance_view'),
            ws_name: null,
        },
        token: null,
        wsName: null,
        searchUrlPrefix: Config.url('search'),
        loadingImage: Config.get('loading_gif'),
        workspaceUrl: Config.url('workspace'),
        workspace: null,
        narrativeService: null,
        mainListPanelHeight: '535px',
        maxNameLength: 60,
        totalPanel: null,
        resultPanel: null,
        objectList: null,
        currentCategory: null,
        currentQuery: null,
        currentPage: null,
        totalAvailable: null,
        currentFilteredlResults: null,
        itemsPerPage: 20,
        narrativeObjects: {},
        narrativeObjectsClean: null,

        init: function (options) {
            this._super(options);

            this.data_icons = Config.get('icons').data;
            this.icon_colors = Config.get('icons').colors;
            this.wsName = Jupyter.narrative.getWorkspaceName();

            this.dataSourceConfigs = DataSourceConfig.sources;

            this.loaded = false;

            return this;
        },

        loadObjects: function () {
            this.narrativeObjectsClean = false;
            $(document).trigger('dataLoadedQuery.Narrative', [
                null,
                this.IGNORE_VERSION,
                function (objects) {
                    this.narrativeObjects = objects;
                    this.narrativeObjectsClean = true;
                }.bind(this),
            ]);
        },

        render: function () {
            if (!this.token || !this.wsName) {
                return;
            }

            // load data the first render.
            if (!this.loaded) {
                this.loadObjects();
                this.loaded = true;
                $(document).on('dataUpdated.Narrative', () => {
                    $(document).trigger('dataLoadedQuery.Narrative', [
                        null,
                        this.IGNORE_VERSION,
                        function (objects) {
                            this.narrativeObjects = objects;
                            this.narrativeObjectsClean = true;
                        }.bind(this),
                    ]);
                });
            }

            this.infoPanel = $('<div>');
            this.dataPolicyPanel = $('<div>');
            this.$elem.empty().append(this.infoPanel).append(this.dataPolicyPanel);

            this.narrativeService = new DynamicServiceClient({
                module: 'NarrativeService',
                url: Config.url('service_wizard'),
                token: this.token,
            });
            this.workspace = new ServiceClient({
                module: 'Workspace',
                url: Config.url('workspace'),
                token: this.token,
            });

            const margin = { margin: '10px 0px 10px 0px' };
            const $typeInput = $('<select class="form-control">').css(margin);

            this.dataSourceConfigs.forEach((config, index) => {
                $typeInput.append(
                    '<option value="' + String(index) + '">' + config.name + '</option>'
                );
            });

            const $dataSourceLogo = $('<span>')
                .addClass('input-group-addon')
                .css('width', '40px')
                .css('border', 'none')
                .css('padding', '0 4px')
                .css('border', 'none')
                .css('border-radius', '0')
                .css('background-color', 'transparent');
            this.$dataSourceLogo = $dataSourceLogo;

            const $inputGroup = $('<div>').addClass('input-group').css('width', '100%');

            const typeFilter = $('<div class="col-sm-4">').append(
                $inputGroup.append($typeInput).append($dataSourceLogo)
            );

            const $filterInput = $(
                '<input type="text" class="form-control" placeholder="Filter data..." data-test-id="search-input">'
            );
            const $filterInputField = $('<div class="input-group">')
                .css(margin)
                .append($filterInput)
                .append(
                    $('<div class="input-group-addon btn btn-default">')
                        .append($('<span class="fa fa-search">'))
                        .css('padding', '4px 8px')
                        .click(() => {
                            $filterInput.change();
                        })
                )
                .append(
                    $('<div class="input-group-addon btn btn-default">')
                        .append($('<span class="fa fa-times">'))
                        .css('padding', '4px 8px')
                        .click(() => {
                            $filterInput.val('');
                            inputFieldLastValue = '';
                            $filterInput.change();
                            $filterInput.focus();
                        })
                );

            /*
                search and render when the type dropdown changes.
            */
            $typeInput.change(() => {
                const newDataSourceID = parseInt($typeInput.val());
                const dataSource = this.dataSourceConfigs[newDataSourceID];
                this.$dataSourceLogo.empty();
                if (dataSource) {
                    if (dataSource.logoUrl) {
                        this.$dataSourceLogo.append($('<img>').attr('src', dataSource.logoUrl));
                    }
                }
                $filterInput.focus();
                this.searchAndRender(newDataSourceID, $filterInput.val());
            });

            /*
                search and render only when input change is detected.
            */
            let inputFieldLastValue = null;
            $filterInput.change(() => {
                inputFieldLastValue = $filterInput.val();
                renderInputFieldState();
                const dataSourceID = parseInt($typeInput.val());
                this.searchAndRender(dataSourceID, $filterInput.val());
            });

            function renderInputFieldState() {
                if ($filterInput.val() === '') {
                    $filterInput.css('background-color', 'transparent');
                    return;
                }
                if (inputFieldLastValue !== $filterInput.val()) {
                    $filterInput.css('background-color', 'rgba(255, 245, 158, 1)');
                } else {
                    $filterInput.css('background-color', 'rgba(209, 226, 255, 1)');
                }
            }

            $filterInput.keyup(() => {
                renderInputFieldState();
            });

            const searchFilter = $('<div class="col-sm-8">').append($filterInputField);

            const header = $('<div class="row">')
                .css({ margin: '0px 10px 0px 10px' })
                .append(typeFilter)
                .append(searchFilter);
            this.$elem.append(header);
            this.totalPanel = $('<div>').css({ margin: '0px 0px 0px 10px' });
            this.$elem.append(this.totalPanel);

            this.resultPanel = $('<div role="table" data-test-id="result">');

            this.resultsFooterMessage = $('<div>')
                .css('display', 'flex')
                .css('flex-direction', 'row')
                .css('align-items', 'center')
                .css('justify-content', 'center');

            this.resultFooter = $('<div>')
                .css('background-color', 'rgba(200,200,200,0.5')
                .css('padding', '6px')
                .css('font-style', 'italic')
                .css('text-align', 'center')
                .append(this.resultsFooterMessage);

            this.resultArea = $('<div>')
                .css('overflow-x', 'hidden')
                .css('overflow-y', 'auto')
                .css('height', this.mainListPanelHeight)
                .on('scroll', (e) => {
                    if (e.target.scrollTop + e.target.clientHeight >= e.target.scrollHeight) {
                        this.renderMore();
                    }
                })
                .append(this.resultPanel)
                .append(this.resultFooter);

            this.$elem.append(this.resultArea);
            const dataSourceID = parseInt($typeInput.val(), 10);
            this.searchAndRender(dataSourceID, $filterInput.val());
            // Invocation of focus must be delayed until the next timer loop,
            // probably because the element is not yet visible. Perhaps the
            // tab content has an overlay.
            window.setTimeout(() => {
                $filterInput.focus();
            }, 0);
            return this;
        },

        hideResultFooter: function () {
            this.resultFooter.addClass('hide');
        },

        showResultFooter: function () {
            this.resultFooter.removeClass('hide');
        },

        searchAndRender: function (category, query) {
            if (query) {
                query = query.trim();
                if (query.length == 0) {
                    query = '*';
                } else if (query.indexOf('"') < 0) {
                    const parts = query.split(/\s+/);
                    for (const i in parts) {
                        if (parts[i].indexOf('*', parts[i].length - 1) < 0) {
                            parts[i] = parts[i] + '*';
                        }
                    }
                    query = parts.join(' ');
                }
            } else {
                query = '*';
            }

            // Duplicate queries are suppressed.
            if (
                this.currentQuery &&
                this.currentQuery === query &&
                category === this.currentCategory
            ) {
                return;
            }

            // Reset the query data structures.
            this.objectList = [];
            this.currentCategory = category;
            this.currentQuery = query;
            this.currentPage = null;
            this.totalAvailable = null;
            this.currentFilteredResults = null;

            return this.renderInitial();
        },

        renderTotalsPanel: function () {
            const $totals = renderTotals(this.currentFilteredResults, this.totalAvailable);
            this.totalPanel.html($totals);
        },

        renderInitial: function () {
            // Get and render the first batch of data.
            // Note that the loading ui is only displayed on the initial load.
            // Reset the ui.
            this.totalPanel.empty();
            this.resultPanel.empty();
            this.resultsFooterMessage.empty();
            this.totalPanel.append(
                $('<span>')
                    .addClass('kb-data-list-type')
                    .append('<img src="' + this.loadingImage + '"/> searching...')
            );

            this.hideError();
            this.showResultFooter();
            this.currentPage = 1;

            return this.renderFromDataSource(this.currentCategory, true);
        },

        renderError: function () {
            this.totalPanel.empty();
            this.hideResultFooter();
            this.resultsFooterMessage.empty();
            this.totalPanel.html(
                '<div class="alert alert-danger">An error occurred executing this search!</div>'
            );
        },

        renderMore: function () {
            this.hideError();

            // suss out whether we really need more...
            if (this.currentPage !== null && this.currentFilteredResults !== null) {
                const maxPage = Math.ceil(this.currentFilteredResults / this.itemsPerPage);
                if (this.currentPage >= maxPage) {
                    return;
                }
            }

            // We use a flag here as a lock on rendering more, so that a renderMore
            // request will complete before advancing the page and firing off another
            // data fetch and render request.
            if (this.renderingMore) {
                return;
            }
            this.renderingMore = true;

            this.currentPage += 1;

            return this.renderFromDataSource(this.currentCategory, false).finally(() => {
                this.renderingMore = false;
            });
        },

        fetchFromDataSource: function (dataSource) {
            const query = {
                input: this.currentQuery,
                page: this.currentPage,
            };

            return dataSource.search(query);
        },

        getDataSource: function (dataSourceID) {
            let dataSource;
            const dataSourceConfig = this.dataSourceConfigs[dataSourceID];
            if (this.currentDataSource && this.currentDataSource.config === dataSourceConfig) {
                dataSource = this.currentDataSource;
            } else {
                const dataSourceType = dataSourceTypes[dataSourceConfig.sourceType];

                const urls = Object.keys(dataSourceType.serviceDependencies).reduce(
                    (accumUrls, key) => {
                        const configKey = dataSourceType.serviceDependencies[key];
                        accumUrls[key] = Config.url(configKey);
                        return accumUrls;
                    },
                    {}
                );
                dataSource = Object.create(dataSourceType.baseObject).init({
                    config: dataSourceConfig,
                    urls,
                    token: this.token,
                    pageSize: this.itemsPerPage,
                });
                this.currentDataSource = dataSource;
            }
            return dataSource;
        },

        renderFromDataSource: function (dataSourceID, initial) {
            const dataSource = this.getDataSource(dataSourceID);
            this.resultsFooterMessage.html(`
                <span>fetching another ${this.itemsPerPage} items</span> 
                <span class='fa fa-spinner fa-spin' style='margin-left: 1ex'/>
            `);

            return this.fetchFromDataSource(dataSource, initial)
                .then((result) => {
                    // a null result means that the search was not run for some
                    // reason -- most likely it was canceled due to overlapping
                    // queries.
                    if (result) {
                        if (initial) {
                            this.totalPanel.empty();
                            this.resultPanel.empty();
                            this.resultsFooterMessage.empty();
                        }
                        result.forEach((item, index) => {
                            this.addRow(dataSource, item, index);
                        });

                        this.totalAvailable = dataSource.availableDataCount;
                        this.currentFilteredResults = dataSource.filteredDataCount;

                        let message;
                        if (dataSource.filteredDataCount) {
                            if (dataSource.fetchedDataCount === dataSource.filteredDataCount) {
                                message = 'all ' + this.currentFilteredResults + ' fetched';
                            } else {
                                message =
                                    'fetched ' +
                                    dataSource.fetchedDataCount +
                                    ' of ' +
                                    this.currentFilteredResults;
                            }
                            this.showResultFooter();
                        } else {
                            message = '';
                            this.hideResultFooter();
                        }
                        this.resultsFooterMessage.text(message);

                        this.renderTotalsPanel();
                    }

                    this.currentDataSource = dataSource;
                })
                .catch((err) => {
                    console.error('Error rendering from data source', dataSource, err);
                    this.showError(err);
                    this.renderError();
                });
        },

        clearRows: function () {
            this.resultPanel.empty();
        },

        addRow: function (dataSource, row) {
            const $row = this.renderObjectRow(dataSource, row);
            this.resultPanel.append($row);
        },

        escapeSearchQuery: function (str) {
            return str.replace(/[%]/g, '').replace(/[:"\\]/g, '\\$&');
        },

        /*
        renderObjectRow
        */
        renderObjectRow: function (dataSource, object) {
            const self = this;
            const type = object.type.split('.')[1].split('-')[0];
            const copyText = ' Add';

            let shortName = object.name;
            let isShortened = false;
            if (shortName.length > this.maxNameLength) {
                shortName = shortName.substring(0, this.maxNameLength - 3) + '…';
                isShortened = true;
            }

            // TODO: more failsafe method for building these urls.
            // e.g. not clear wht the form of the config url is:
            // path or url?
            // terminal / or not?
            // absolute or relative (initial /)
            const objectRef = object.workspaceReference.ref;
            const landingPageLink = this.options.landingPageURL + objectRef;
            const provenanceLink = [this.options.provenanceViewerBaseURL, objectRef].join('/');

            const $name = $('<span>')
                .addClass('kb-data-list-name')
                .attr('role', 'cell')
                .attr('data-test-id', 'name')
                .append('<a href="' + landingPageLink + '" target="_blank">' + shortName + '</a>');
            if (isShortened) {
                $name.tooltip({ title: object.name, placement: 'bottom' });
            }

            // Mouseover toolbar
            const $btnToolbar = $('<span>')
                .addClass('btn-toolbar')
                .css('position', 'absolute')
                .css('right', '6px')
                .css('top', '0')
                .attr('role', 'toolbar')
                .hide();
            const btnClasses = 'btn btn-xs btn-default';
            const css = { color: '#888' };
            const $openLandingPage = $('<span>')
                // tooltips showing behind pullout, need to fix!
                //.tooltip({title:'Explore data', 'container':'#'+this.mainListId})
                .addClass(btnClasses)
                .append($('<span>').addClass('fa fa-binoculars').css(css))
                .click((e) => {
                    e.stopPropagation();
                    window.open(landingPageLink);
                });

            const $openProvenance = $('<span>')
                .addClass(btnClasses)
                .css(css)
                //.tooltip({title:'View data provenance and relationships', 'container':'body'})
                .append($('<span>').addClass('fa fa-sitemap fa-rotate-90').css(css))
                .click((e) => {
                    e.stopPropagation();
                    window.open(provenanceLink);
                });
            $btnToolbar.append($openLandingPage).append($openProvenance);

            // Action Column

            const $addDiv = $('<div>').append(
                $('<button>')
                    .addClass('kb-primary-btn')
                    .css({ 'white-space': 'nowrap', padding: '10px 15px' })
                    .append($('<span>').addClass('fa fa-chevron-circle-left'))
                    .append(copyText)
                    .on('click', function () {
                        // probably should move action outside of render func, but oh well
                        $(this).attr('disabled', 'disabled');
                        $(this).html('<img src="' + self.loadingImage + '">');

                        let targetName = object.name;

                        // object name cannot start with digits.
                        if (/^[\d]/.test(targetName)) {
                            targetName = targetName.replace(/^[\d]+/, '_');
                        }

                        // to avoid weird object names, replace entities with underscores.
                        targetName = targetName.replace(/&[^;]*;/g, '_');

                        // replace characters which are invalid for a workspace object name with underscores.
                        targetName = targetName.replace(/[^a-zA-Z0-9.\-_]/g, '_');

                        self.copy(object, targetName, this);
                    })
            );

            const $actionColumn = $('<div>')
                .css('flex', '0 0 90px')
                .css('display', 'flex')
                .css('align-items', 'center')
                .css('vertical-align', 'middle')
                .append($addDiv.hide());

            // Icon Column
            const $logo = $('<span>');

            Icon.buildDataIcon($logo, type);

            const $iconColumn = $('<div>')
                .css('flex', '0 0 50px')
                .css('display', 'flex')
                .css('align-items', 'center')
                .css('border-right', '1px rgba(200,200,200,0.6) solid')
                .css('vertical-align', 'middle')
                .append($logo);

            // Main Column
            const $titleElement = $('<div>')
                .css('position', 'relative')
                .append($btnToolbar.hide())
                .append($name);

            let $bodyElement;
            if (object.metadata && object.metadata.length) {
                $bodyElement = metadataToTable(object.metadata);
            } else {
                $bodyElement = null;
            }

            const $resultColumn = $('<div role="cell">')
                .css('flex', '1 1 0px')
                .css('padding-left', '4px')
                .css('padding-right', '15px')
                .append($titleElement)
                .append($bodyElement);

            const $row = $('<div role="row">')
                .css('margin', '2px')
                .css('padding', '4px')
                .css('display', 'flex')
                .css('flex-direction', 'row')

                // show/hide ellipses on hover, show extra info on click
                .mouseenter(() => {
                    $addDiv.show();
                    $btnToolbar.show();
                })
                .mouseleave(() => {
                    $addDiv.hide();
                    $btnToolbar.hide();
                })
                .append($actionColumn)
                .append($iconColumn)
                .append($resultColumn);

            const $divider = $('<hr>').addClass('kb-data-list-row-hr').css('width', '100%');

            const $rowContainer = $('<div>').append($divider).append($row);

            if ('rowNumber' in object) {
                $rowContainer.attr('data-row-number', String(object.rowNumber));
            }

            return $rowContainer;
        },

        /*
            TODO: rethink the logic here.

            copy should only be applicable if the workspace is writable. This check should either
            be here or should be a precondition (just let if fail otherwise.)

            the check for existence fo the object should not throw an error; the null value
            means the object could not be read, and since we have read access to this narrative,
            that is the only possible error.
        */

        copy: function (object, targetName, thisBtn, nextSuffix, tries) {
            if (tries > 10) {
                throw new Error('Too many rename tries (10)');
            }

            const type = 'KBaseGenomes.Genome';

            // Determine whether the targetName already exists, or if
            // copies exist and if so the maximum suffix.
            // This relies upon the narrativeObjects being updated from the data list.

            // If there are other objects in this narrative, we need to first attempt to
            // see if other objects with this name exist, and if so, obtain a suffix which
            // may ensure this is a unique object name.
            let suffix;
            if (this.narrativeObjects[type]) {
                suffix = getNextAutoSuffix(targetName, this.narrativeObjects[type], nextSuffix);
            }

            // If we have determined a suffix (to try), append it to the base object name
            // like _<suffix>
            const correctedTargetName = suffix ? targetName + '_' + suffix : targetName;

            // Attempt to get object info for the target object name. If it exists,
            // we try again with a hopefully unique filename.
            // If it fails with a specific error message indicating that the object could
            // not be found, hoorah, we can at least try (still may fail if can't write.)
            // Otherwise if some other error occured, provide a prompt and the user may
            // try manually again. (Not sure about that ??)
            // TODO: request ws api changes to support this. It is bad that we force a 500
            // error for the failure case (which is actually success!)
            // There really should be an "stat_object" call which provides object info
            return this.workspace
                .callFunc('get_object_info_new', [
                    {
                        objects: [
                            {
                                ref: this.wsName + '/' + correctedTargetName,
                            },
                        ],
                        ignoreErrors: 1,
                    },
                ])
                .spread((infos) => {
                    // If an object already exists with this name, the attempt again,
                    // incrementing the suffix by 1. NB this will loop until a unique
                    // filename is found.
                    if (infos[0] !== null) {
                        return this.copy(
                            object,
                            targetName,
                            thisBtn,
                            suffix ? suffix + 1 : 1,
                            tries ? tries + 1 : 1
                        );
                    }
                    return this.copyFinal(object, correctedTargetName, thisBtn);
                })
                .catch((error) => {
                    console.error('Error getting object info for copy', error);
                    this.showError(error);
                });
        },

        copyFinal: function (object, targetName, thisBtn) {
            return this.narrativeService
                .callFunc('copy_object', [
                    {
                        ref: object.workspaceReference.ref,
                        target_ws_name: this.wsName,
                        target_name: targetName,
                    },
                ])
                .spread(() => {
                    $(thisBtn).prop('disabled', false);
                    $(thisBtn).html('<span class="fa fa-chevron-circle-left"/> Add');
                    this.trigger('updateDataList.Narrative');
                })
                .catch((error) => {
                    $(thisBtn).html('Error');
                    if (error.error && error.error.message) {
                        if (error.error.message.indexOf('may not write to workspace') >= 0) {
                            this.options.$importStatus.html(
                                $('<div>')
                                    .css({
                                        color: '#F44336',
                                        width: '500px',
                                    })
                                    .append(
                                        'Error: you do not have permission to add data to this Narrative.'
                                    )
                            );
                        } else {
                            this.options.$importStatus.html(
                                $('<div>')
                                    .css({
                                        color: '#F44336',
                                        width: '500px',
                                    })
                                    .append('Error: ' + error.error.message)
                            );
                        }
                    } else {
                        this.options.$importStatus.html(
                            $('<div>')
                                .css({
                                    color: '#F44336',
                                    width: '500px',
                                })
                                .append('Unknown error!')
                        );
                    }
                    console.error(error);
                    this.showError(error);
                });
        },

        showError: function (error) {
            let errorMsg;
            if (error.error && error.error.message) {
                // handle errors thrown by kbase service clients
                errorMsg = error.error.message;
            } else if (error.message) {
                // standard error objects
                errorMsg = error.message;
            } else {
                errorMsg = error;
            }

            this.infoPanel.empty();
            this.infoPanel.append('<div class="alert alert-danger">Error: ' + errorMsg + '</span>');
        },

        hideError: function () {
            this.infoPanel.empty();
        },

        loggedInCallback: function (event, auth) {
            this.token = auth.token;
            return this;
        },

        loggedOutCallback: function () {
            this.token = null;
            return this;
        },
    });
});
