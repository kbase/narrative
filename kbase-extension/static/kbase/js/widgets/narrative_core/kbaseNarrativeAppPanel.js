/*jslint white: true*/
/**
 * A widget that contains functions and function information for the Narrative.
 * When initialized, it uses a loading gif while waiting for functions to load
 * (unless functions were passed in on construction).
 *
 * @author Bill Riehl <wjriehl@lbl.gov>
 * @public
 */
define([
    'kbwidget',
    'jquery',
    'bluebird',
    'handlebars',
    'narrativeConfig',
    'util/display',
    'util/bootstrapDialog',
    'util/bootstrapSearch',
    'text!kbase/templates/beta_warning_body.html',
    'yaml!ext_components/kbase-ui-plugin-catalog/src/plugin/modules/data/categories.yml',
    'kbaseAccordion',
    'kbaseNarrativeControlPanel',
    'base/js/namespace',
    'kb_service/client/narrativeMethodStore',
    'uuid',
    'narrative_core/catalog/kbaseCatalogBrowser',
    'kbase/js/widgets/narrative_core/kbaseAppCard',
    'common/runtime',
    'kb_common/jsonRpc/dynamicServiceClient',
    'kbaseNarrative',
    'kbase-client-api',
    'bootstrap'
], (
    KBWidget,
    $,
    Promise,
    Handlebars,
    Config,
    DisplayUtil,
    BootstrapDialog,
    BootstrapSearch,
    BetaWarningTemplate,
    Categories,
    kbaseAccordion,
    kbaseNarrativeControlPanel,
    Jupyter,
    NarrativeMethodStore,
    Uuid,
    KBaseCatalogBrowser,
    kbaseAppCard,
    Runtime,
    DynamicServiceClient
) => {
    'use strict';
    return KBWidget({
        name: 'kbaseNarrativeAppPanel',
        parent: kbaseNarrativeControlPanel,
        version: '0.0.1',
        options: {
            loadingImage: Config.get('loading_gif'),
            autopopulate: true,
            title: 'Apps',
            methodStoreURL: Config.url('narrative_method_store'),
            moduleLink: '/#catalog/modules/',
            methodHelpLink: '/#appcatalog/app/',
            appHelpLink: '/#appcatalog/app/l.a/'
        },
        ignoreCategories: {},
        id2Elem: {},
        methodSpecs: {}, // id -> spec
        categories: {}, // id -> category info

        currentTag: null, // release/dev/beta; which version of the method spec to fetch.  default is release

        init: function (options) {
            this.app_offset = true;
            this._super(options);
            // DOM structure setup here.
            // After this, just need to update the function list

            this.currentTag = 'release';

            this.narrativeService = new DynamicServiceClient({
                module: 'NarrativeService',
                url: Config.url('service_wizard'),
                token: Runtime.make().authToken()
            });

            this.getIgnoreCategories();

            this.$searchDiv = $('<div>').hide();


            // placeholder for apps and methods once they're loaded.
            this.$methodList = $('<div>')
                .css({
                    'height': '300px',
                    'overflow-y': 'auto',
                    'overflow-x': 'hidden'
                });

            // Make a function panel for everything to sit inside.
            this.$functionPanel = $('<div>')
                .addClass('kb-function-body')
                .append($('<div>')
                    .append(this.$searchDiv))
                .append(this.$methodList);

            this.bsSearch = new BootstrapSearch(this.$searchDiv, {
                inputFunction: () => {
                    this.refreshPanel(this);
                },
                placeholder: 'Search apps'
            });

            // The 'loading' panel should just have a spinning gif in it.
            this.$loadingPanel = $('<div>')
                .addClass('kb-data-loading')
                .append('<img src="' + this.options.loadingImage + '">')
                .append($('<div>')
                    .attr('id', 'message'))
                .hide();

            // The error panel should be empty for now.
            this.$errorPanel = $('<div>')
                .hide();

            // The help element should be outside of the panel itself, so it can be manipulated separately.
            // It should hide itself when clicked.
            this.initMethodTooltip();
            this.$bodyDiv.append($('<div>')
                .addClass('kb-narr-panel-body')
                .append(this.$functionPanel)
                .append(this.$loadingPanel)
                .append(this.$errorPanel));

            $(document).on('filterMethods.Narrative', (e, filterString) => {
                if (filterString) {
                    this.$searchDiv.show({ effect: 'blind', duration: 'fast' });
                    this.bsSearch.val(filterString);
                }
            });

            $(document).on('removeFilterMethods.Narrative', () => {
                this.$searchDiv.toggle({ effect: 'blind', duration: 'fast' });
                this.bsSearch.val('');
            });

            /* 'request' should be expected to be an object like this:
             * {
             *      apps: [list, of, app, ids],
             *      methods: [list, of, method, ids]
             * }
             *
             * Either the apps or methods key can exist, or not and will be searched
             * appropriately.
             *
             * This will pass to the callback a similar structure:
             * {
             *      apps: {
             *         id: { spec },
             *         id: { spec }
             *      },
             *      methods: {
             *         id: { spec },
             *         id: { spec }
             *      }
             * }
             *
             * If a spec isn't found, then it won't appear in the return values.
             */
            $(document).on('getFunctionSpecs.Narrative',
                $.proxy(function (e, specSet, callback) {
                    if (callback) {
                        this.getFunctionSpecs(specSet, callback);
                    }
                }, this)
            );

            this.currentPanelStyle = 'category';
            this.$filterLabel = $('<span>').append(this.currentPanelStyle);
            const $filterMenu = $('<ul>')
                .addClass('dropdown-menu dropdown-menu-right')
                .css({
                    'margin-top': '20px'
                })
                .attr('aria-labeledby', 'kb-app-panel-filter')
                .append($('<li>')
                    .append('<a style="cursor:pointer" data-filter="category">Category</a>'))
                .append($('<li>')
                    .append('<a style="cursor:pointer" data-filter="input">Input Types</a>'))
                .append($('<li>')
                    .append('<a style="cursor:pointer" data-filter="output">Output Types</a>'))
                .append($('<li>')
                    .append('<a style="cursor:pointer" data-filter="a-z">Name A-Z</a>'))
                .append($('<li>')
                    .append('<a style="cursor:pointer" data-filter="z-a">Name Z-A</a>'));

            $filterMenu.find('li a').click((ev) => {
                this.currentPanelStyle = $(ev.target).data('filter');
                this.$filterLabel.text(this.currentPanelStyle);
                this.refreshPanel();
            });

            this.addButton($('<span class="dropdown">')
                .append($('<button>')
                    .addClass('btn btn-xs btn-default dropdown-toggle')
                    .attr({
                        type: 'button',
                        id: 'kb-app-panel-filter',
                        'data-toggle': 'dropdown',
                        'aria-haspopup': true,
                        'aria-expanded': true
                    })
                    .append(this.$filterLabel)
                    .append('<span class="fa fa-filter"></span>'))
                .append($filterMenu));

            // Search button
            this.addButton($('<button>')
                .addClass('btn btn-xs btn-default')
                .append('<span class="fa fa-search"></span>')
                .tooltip({
                    title: 'Search for Apps',
                    container: 'body',
                    delay: {
                        show: Config.get('tooltip').showDelay,
                        hide: Config.get('tooltip').hideDelay
                    }
                })
                .click(() => {
                    this.$searchDiv.toggle({ effect: 'blind', duration: 'fast' });
                    let new_height = this.$methodList.height();
                    if (this.app_offset) {
                        new_height = (new_height - 40) + 'px';
                    } else {
                        new_height = (new_height + 40) + 'px';
                    }
                    this.$methodList.css('height', new_height);
                    this.app_offset = !this.app_offset;
                    this.bsSearch.focus();
                }));

            // Refresh button
            this.addButton($('<button>')
                .addClass('btn btn-xs btn-default')
                .append('<span class="fa fa-refresh">')
                .tooltip({
                    title: 'Refresh app/method listings',
                    container: 'body',
                    delay: {
                        show: Config.get('tooltip').showDelay,
                        hide: Config.get('tooltip').hideDelay
                    }
                })
                .click(() => {
                    let versionTag = 'release';
                    if (this.versionState === 'B') { versionTag = 'beta'; } else if (this.versionState === 'D') { versionTag = 'dev'; }
                    this.refreshFromService(versionTag);
                    this.refreshKernelSpecManager();

                    if (this.appCatalog) {
                        this.appCatalog.refreshAndRender();
                    }
                }));

            // Toggle version btn
            let toggleTooltipText = 'Toggle between Release and Beta Versions';
            if (Config.get('dev_mode'))
                toggleTooltipText = 'Toggle between Release/Beta/Dev versions';
            this.$toggleVersionBtn = $('<button>')
                .addClass('btn btn-xs btn-default')
                .tooltip({
                    title: toggleTooltipText,
                    container: 'body',
                    delay: {
                        show: Config.get('tooltip').showDelay,
                        hide: Config.get('tooltip').hideDelay
                    }
                })
                .append('R');
            this.versionState = 'R';

            const devMode = Config.get('dev_mode');
            let showBetaWarning = true;

            const betaWarningCompiled = Handlebars.compile(BetaWarningTemplate);

            this.betaWarningDialog = new BootstrapDialog({
                title: 'Warning - entering beta mode!',
                body: betaWarningCompiled(),
                buttons: [$('<button class="btn btn-primary" data-dismiss="modal">OK</button>')],
                closeButton: true,
                enterToTrigger: true
            });
            this.betaWarningDialog.getBody().find('input').change(function () {
                showBetaWarning = $(this).is(':checked');
            }).prop('checked', showBetaWarning);

            this.$toggleVersionBtn.click(() => {
                this.$toggleVersionBtn.tooltip('hide');
                let versionTag = 'release';
                if (this.versionState === 'R') {
                    this.versionState = 'B';
                    versionTag = 'beta';
                    if (!devMode && showBetaWarning) {
                        this.betaWarningDialog.show();
                    }
                } else if (this.versionState === 'B') {
                    if (devMode) {
                        this.versionState = 'D';
                        versionTag = 'dev';
                    } else {
                        this.versionState = 'R';
                        versionTag = 'release';
                    }
                } else if (this.versionState === 'D') {
                    this.versionState = 'R';
                    versionTag = 'release';
                }
                this.$toggleVersionBtn.html(this.versionState);
                this.refreshFromService(versionTag);
                this.refreshKernelSpecManager();
                if (this.appCatalog) {
                    this.appCatalog.setTag(versionTag);
                }
            });
            this.addButton(this.$toggleVersionBtn);

            this.$appCatalogBody = $('<div>')
                .attr('data-test-id', 'app-slideout-panel');

            this.appCatalog = null;
            this.$appCatalogContainer = $('<div>')
                .append($('<div>')
                    .addClass('kb-side-header active')
                    .css({ 'width': '100%' })
                    .append('App Catalog'))
                .append(this.$appCatalogBody);

            this.$slideoutBtn = $('<button>')
                .addClass('btn btn-xs btn-default')
                .attr('data-test-id', 'app-slideout-button')
                .tooltip({
                    title: 'Hide / Show App Catalog',
                    container: 'body',
                    delay: {
                        show: Config.get('tooltip').showDelay,
                        hide: Config.get('tooltip').hideDelay
                    }
                })
                .append('<span class="fa fa-arrow-right"></span>')
                .click(() => this.spawnCatalogBrowser());

            this.addButton(this.$slideoutBtn);

            this.methClient = new NarrativeMethodStore(this.options.methodStoreURL);

            $(document).on('sidePanelOverlayHiding.Narrative', (_, panel) => {
                if (panel === this.$appCatalogContainer) {
                    this.preRenderOverlayState();
                }
            });

            $(document).on('sidePanelOverlayShowing.Narrative', (_, panel) => {
                if (panel === this.$appCatalogContainer) {
                    this.preRenderOverlayState();
                }
            });

            $(document).on('sidePanelOverlayHidden.Narrative', () => {
                this.renderOverlayState();
            });

            $(document).on('sidePanelOverlayShown.Narrative', () => {
                this.renderOverlayState();
            });

            this.refreshFromService();
            return this;
        },

        preRenderOverlayState: function () {
            if (this.$appCatalogContainer.is(':visible')) {
                this.$slideoutBtn.children().toggleClass('fa-arrow-left', false);
                this.$slideoutBtn.children().toggleClass('fa-arrow-right', true);
            } else {
                this.$slideoutBtn.children().toggleClass('fa-arrow-left', true);
                this.$slideoutBtn.children().toggleClass('fa-arrow-right', false);
            }
        },

        renderOverlayState: function () {
            if (this.$appCatalogContainer.is(':visible')) {
                // this.$slideoutBtn.children().toggleClass('fa-arrow-left', true);
                // this.$slideoutBtn.children().toggleClass('fa-arrow-right', false);
                // Need to rerender (not refresh data) because in some states, the catalog browser looks to see
                // if things are hidden or not. When this panel is hidden, then refreshed, all sections will
                // think they have no content and nothing will display.
                this.appCatalog.rerender();
            } else {
                // this.$slideoutBtn.children().toggleClass('fa-arrow-left', false);
                // this.$slideoutBtn.children().toggleClass('fa-arrow-right', true);
            }
        },

        spawnCatalogBrowser: function () {
            // only load the appCatalog on click
            if (!this.appCatalog) {
                this.appCatalog = new KBaseCatalogBrowser(
                    this.$appCatalogBody, {
                    ignoreCategories: this.ignoreCategories,
                    tag: this.currentTag
                }
                );
            }
            this.$slideoutBtn.tooltip('hide');
            this.trigger('toggleSidePanelOverlay.Narrative', [this.$appCatalogContainer]);
        },

        detach: function () {
            $(document).off('filterMethods.Narrative');
            $(document).off('removeFilterMethods.Narrative');
            $(document).off('getFunctionSpecs.Narrative');
            this.$bodyDiv.detach();
        },

        refreshKernelSpecManager: function () {
            try {
                Jupyter.notebook.kernel.execute(
                    'from biokbase.narrative.jobs.specmanager import SpecManager\n' +
                    'SpecManager().reload()'
                );
            } catch (e) {
                alert(e);
                console.error(e);
            }
        },

        setListHeight: function (height, animate) {
            if (this.$methodList) {
                if (animate) {
                    this.$methodList.animate({ 'height': height }, this.slideTime); // slideTime comes from kbaseNarrativeControlPanel
                } else {
                    this.$methodList.css({ 'height': height });
                }
            }
        },

        setReadOnlyMode: function (readOnly) {
            if (readOnly) {
                this.toggleCollapse('collapse');
            } else {
                this.toggleCollapse('restore');
            }
        },

        initMethodTooltip: function () {
            this.help = {};

            this.help.$helpPanel = $('<div>')
                .addClass('kb-function-help-popup alert alert-info')
                .hide()
                .click(() => {
                    this.help.$helpPanel.hide();
                });
            this.help.$helpTitle = $('<span>');
            this.help.$helpVersion = $('<span>')
                .addClass('version');

            const $helpHeader = $('<div>')
                .append(
                    $('<h1>')
                        .css({
                            display: 'inline',
                            'padding-right': '8px'
                        })
                        .append(this.help.$helpTitle))
                .append(this.help.$helpVersion);

            this.help.$helpBody = $('<div>')
                .addClass('body');
            this.help.$helpLinkout = $('<a>')
                .attr('href', this.options.methodHelpLink)
                .attr('target', '_blank')
                .append('More...');

            this.help.$helpPanel.append($helpHeader)
                .append(this.help.$helpBody)
                .append($('<div>').append(this.help.$helpLinkout))
                .append($('<h2>').append('Click to hide'));
            $('body').append(this.help.$helpPanel);
        },

        /**
         * Fetch ignored_category from Narrative Service and assign returned value to local ignoreCategories
         */
        getIgnoreCategories: function () {
            this.narrativeService.callFunc('get_ignore_categories', [])
                .then((ignoreCategories) => {
                    this.ignoreCategories = ignoreCategories[0];
                })
                .catch(() => {
                    // return default ignore categories
                    this.ignoreCategories = {
                        inactive: 1,
                        importers: 1,
                        viewers: 1
                    };
                });
        },

        /**
         * Returns a promise that resolves when the app is done refreshing itself.
         */
        refreshFromService: function (versionTag) {
            this.showLoadingMessage('Loading available Apps...');
            if (versionTag) {
                this.currentTag = versionTag;
            }

            return this.narrativeService.callFunc('get_all_app_info', [{
                tag: this.currentTag,
                user: Jupyter.narrative.userId
            }])
                .then((appInfo) => {
                    appInfo = appInfo[0];
                    this.methodSpecs = appInfo.app_infos;
                    this.moduleVersions = appInfo.module_versions;
                    this.trigger('appListUpdated.Narrative');
                    this.refreshPanel();
                    this.showAppPanel();
                })
                .catch((error) => {
                    console.error(error);
                    this.showError('Sorry, an error occurred while loading Apps.', error);
                });
        },

        /**
         * Gather App spec information and plop the App Cell in place.
         * @param {app} string/object - if a string, it uses that as a key into self.appSpecs
         * and tries to look up its needed info that way. Otherwise, if it's just method "info"
         * (See the NarrativeMethodStore), it will go to NMS to fetch the full spec before
         * triggering the appClicked.Narrative event.
         * @param {tag} string - optional. If present, is passed along as the release tag for that
         * app (should be one of "release", "beta", "dev"). Otherwise, we use the current user-
         * selected tag.
         */
        triggerApp: function (app, tag, parameters) {
            if (Jupyter.narrative.narrController.uiModeIs('view')) {
                new BootstrapDialog({
                    type: 'warning',
                    title: 'Warning',
                    body: 'Read-only Narrative -- you may not add apps to this Narrative',
                    alertOnly: true
                }).show();
                return;
            }
            if (!tag) {
                tag = this.currentTag;
            }
            if (typeof (app) === 'string') {
                let info = this.methodSpecs[app.toLowerCase()];
                if (!info) {
                    info = {
                        'info': {
                            'id': app
                        }
                    };
                }
                app = info;
            }
            if (!app['spec']) {
                Promise.resolve(this.methClient.get_method_spec({ ids: [app.info.id], tag: tag }))
                    .then((spec) => {
                        spec = spec[0];
                        if (this.moduleVersions[spec.info.module_name]) {
                            spec.info.ver = this.moduleVersions[spec.info.module_name];
                        }
                        this.trigger('appClicked.Narrative', [spec, tag, parameters]);
                    })
                    .catch((err) => {
                        const errorId = new Uuid(4).format();
                        console.error('Error getting method spec #' + errorId, err, app, tag);
                        alert('Error getting app spec, see console for error info #' + errorId);
                    });
            } else {
                this.trigger('appClicked.Narrative', [app, tag, parameters]);
            }
        },

        categorizeApps: function (style, appSet) {

            // previously, categories had the first letter of each word uppercased as part of display.
            // now they're uppercased while the cats are built, to map similar cats to the same keyed
            // display name (e.g. "metabolic_modeling" and "metabolic modeling" both go to "Metabolic Modeling")
            // but 'uncategorized' is a hardwired special case. I opted to break it out into a constant defined
            // here instead of use an upper case string as the key throughout later on.
            const UNCATEGORIZED = 'Uncategorized';

            const allCategories = {
                favorites: []
            };
            allCategories[UNCATEGORIZED] = [];  //my kingdom for es6 syntax

            Object.keys(appSet).forEach((appId) => {
                let categoryList = [];
                switch (style) {
                    case 'input':
                        categoryList = appSet[appId].info.input_types.map((input) => {
                            if (input.indexOf('.') !== -1) {
                                return input.split('.')[1];
                            }
                            else {
                                return input;
                            }
                        });
                        break;
                    case 'output':
                        categoryList = appSet[appId].info.output_types.map((output) => {
                            if (output.indexOf('.') !== -1) {
                                return output.split('.')[1];
                            }
                            else {
                                return output;
                            }
                        });
                        break;
                    default:
                    case 'category':
                        (() => {
                            categoryList = appSet[appId].info.categories;
                            const activeIndex = categoryList.indexOf('active');
                            if (activeIndex !== -1) {
                                categoryList.splice(activeIndex, 1);
                            }
                        })();
                        break;
                }
                if (categoryList.length === 0) {
                    allCategories[UNCATEGORIZED].push(appId);
                }
                categoryList.forEach((cat) => {
                    cat = Categories.categories[cat] || cat;
                    cat = cat.replace('_', ' ')
                        .replace(/\w\S*/g, (txt) => {
                            return txt.charAt(0).toUpperCase() + txt.substr(1);
                        });
                    if (!allCategories[cat]) {
                        allCategories[cat] = [];
                    }
                    allCategories[cat].push(appId);
                });
                if (appSet[appId].favorite) {
                    allCategories.favorites.push(appId);
                }
            });
            Object.keys(allCategories).forEach((cat) => {
                allCategories[cat] = allCategories[cat].filter((el, index, arr) => {
                    return index === arr.indexOf(el);
                });
                allCategories[cat].sort((a, b) => {
                    a = appSet[a],
                        b = appSet[b];
                    return a.info.name.localeCompare(b.info.name);
                });
            });
            if (allCategories.favorites.length === 0) {
                delete allCategories['favorites'];
            }
            if (allCategories[UNCATEGORIZED].length === 0) {
                delete allCategories[UNCATEGORIZED];
            }
            return allCategories;
        },

        refreshPanel: function () {
            const panelStyle = this.currentPanelStyle;
            const filterString = this.bsSearch.val();
            let appSet = this.methodSpecs;
            const $appPanel = $('<div>');

            const buildFlatPanel = (ascending) => {
                const appList = Object.keys(appSet);
                appList.sort((a, b) => {
                    a = appSet[a];
                    b = appSet[b];
                    if (a.favorite && b.favorite) {
                        if (ascending) {
                            return a.info.name.localeCompare(b.info.name);
                        } else {
                            return b.info.name.localeCompare(a.info.name);
                        }
                    }
                    if (a.favorite) return -1;
                    if (b.favorite) return 1;

                    if (ascending) {
                        return a.info.name.localeCompare(b.info.name);
                    } else {
                        return b.info.name.localeCompare(a.info.name);
                    }
                });
                for (let i = 0; i < appList.length; i++) {
                    $appPanel.append(this.buildAppItem(appSet[appList[i]]));
                }
            };

            const buildSingleAccordion = (category, appList) => {
                const $accordionBody = $('<div>');
                appList.forEach((appId) => {
                    $accordionBody.append(this.buildAppItem(appSet[appId]));
                });

                return {
                    title: category + ' <span class="label label-info pull-right" style="padding-top:0.4em">' + appList.length + '</span>',
                    body: $accordionBody
                };
            };

            const assembleAccordion = function (accordion) {
                const $body = accordion.body;
                const $toggle = $('<span class="fa fa-chevron-right">')
                    .css({
                        'padding-right': '3px'
                    });
                const $header = $('<div class="row">')
                    .css({
                        cursor: 'pointer',
                        'font-size': '1.1em',
                        'font-weight': 'bold',
                        padding: '3px 0',
                        'border-bottom': '1px solid #eee'
                    })
                    .append($toggle)
                    .append(accordion.title)
                    .click(() => {
                        if ($toggle.hasClass('fa-chevron-right')) {
                            $body.slideDown('fast', () => {
                                $toggle.removeClass('fa-chevron-right')
                                    .addClass('fa-chevron-down');
                            });
                        } else {
                            $body.slideUp('fast', () => {
                                $toggle.removeClass('fa-chevron-down')
                                    .addClass('fa-chevron-right');
                            });
                        }
                    });
                return $('<div>').append($header).append($body.hide());
            };

            const withCategories = function (a, b) {
                const catA = (Categories.categories[a] || a).toLowerCase();
                const catB = (Categories.categories[b] || b).toLowerCase();
                if (catA < catB) { return -1; }
                else if (catA > catB) { return 1; }
                else { return 0; }
            };

            const buildAccordionPanel = (style) => {
                /* first, get elements in order like this:
                 * { category1: [ appId1, appId2, appId3, ...]}
                 */
                const categorySet = this.categorizeApps(style, appSet);
                const accordionList = [];
                Object.keys(categorySet).sort(withCategories).forEach((cat) => {
                    if (cat === 'favorites') {
                        return;
                    }
                    accordionList.push(buildSingleAccordion(cat, categorySet[cat]));
                });
                if (categorySet.favorites) {
                    accordionList.unshift(buildSingleAccordion('My Favorites', categorySet.favorites));
                }
                accordionList.forEach((accordion) => {
                    $appPanel.append(assembleAccordion(accordion));
                });
            };

            // 1. Go through filterString and keep those that pass the filter.
            appSet = this.filterApps(filterString, appSet);

            // 2. Switch over panelStyle and build the view based on that.
            switch (panelStyle) {
                case 'a-z':
                    buildFlatPanel(true);
                    break;
                case 'z-a':
                    buildFlatPanel(false);
                    break;
                case 'category':
                case 'input':
                case 'output':
                    buildAccordionPanel(panelStyle);
                    break;
                default:
                    break;
            }
            this.$methodList.empty().append($appPanel);
        },

        /**
         * Using the filterString, this returns only those apps that pass the filter.
         * filterString - just a string. includes prefixes in_type:, out_type:
         * appSet - keys=appIds, values=appSpecs
         */
        filterApps: function (filterString, appSet) {
            if (!filterString) {
                return appSet;
            }
            let filterType = 'name';
            filterString = filterString.toLowerCase();
            const filter = filterString.split(':');
            if (filter.length === 2) {
                if (['in_type', 'out_type', 'input', 'output'].indexOf(filter[0]) !== -1) {
                    filterType = filter[0];
                    filterString = filter[1];
                }
            }
            let filteredIds = Object.keys(appSet);
            filteredIds = Object.keys(appSet).filter((id) => {
                let searchSet;
                const app = appSet[id];
                switch (filterType) {
                    case 'in_type':
                    case 'input':
                        if (filterString.indexOf('.') !== -1) {
                            searchSet = app.info.input_types;
                        }
                        else {
                            searchSet = app.info.short_input_types;
                        }
                        break;
                    case 'out_type':
                    case 'output':
                        if (filterString.indexOf('.') !== -1) {
                            searchSet = app.info.output_types;
                        }
                        else {
                            searchSet = app.info.short_output_types;
                        }
                        break;
                    default:
                        return [
                            app.info.name,
                            app.info.input_types.join(';'),
                            app.info.output_types.join(';'),
                            app.info.module_name
                        ].join(';').toLowerCase().indexOf(filterString) !== -1;
                }
                const lowerSearchSet = searchSet.map((val) => { return val.toLowerCase(); });
                return lowerSearchSet.indexOf(filterString) !== -1;
            });
            const filteredSet = {};
            filteredIds.forEach((id) => {
                filteredSet[id] = appSet[id];
            });
            return filteredSet;
        },

        /**
         * Creates and returns a JQuery node containing a single representation of an App.
         * Clicking the name or icon will trigger the insertion of a new App cell with that
         * App's info and spec. Clicking the star icon will toggle whether that App is one of the
         * current user's favorite Apps. Clicking the ellipsis (or anywhere else in the App item)
         * will make it slide down some additional information.
         *
         * @param {object} app - the app object that contains app info and spec.
         * @private
         */
        buildAppItem: function (app) {
            /**
             app.info:
                authors:["rsutormin"], categories:["annotation"], icon:{url:}, id: str,
                input_types: ['KbaseGenomeAnnotations.Assembly'], module_name: str,
                name: str, namespace: str, output_types:["KBaseGenomes.Genome"],
                subtitle: str, tooltip: str, ver: str
             *
            */
            let moreLink = '';
            if (app.info.module_name) {
                moreLink = this.options.methodHelpLink + app.info.id + '/' + this.currentTag;
            } else {
                moreLink = this.options.methodHelpLink + 'l.m/' + app.info.id;
            }
            const $more = $('<div>')
                .addClass('kb-method-list-more-div');

            if (this.currentTag && this.currentTag !== 'release') {
                $more.append($('<div style="font-size:8pt">')
                    .append(app.info.git_commit_hash));
            }
            $more.append($('<div>')
                .append(app.info.subtitle))
                .append($('<div>')
                    .append($('<a>')
                        .append('more...')
                        .attr('target', '_blank')
                        .attr('href', moreLink)));

            const $card = kbaseAppCard.apply(this, [
                {
                    createdBy: false,
                    moreContent: $more,
                    max_name_length: 50,
                    self: this,
                    app: app,
                }]);

            //custom click functions;
            $card.find('.narrative-card-logo .kb-data-list-name').click((e) => {
                e.stopPropagation();
                this.triggerApp(app);
            });

            return $card;
        },

        /* 'request' should be expected to be an object like this:
         * {
         *      apps: [list, of, app, ids],
         *      methods: [list, of, method, ids]
         * }
         *
         * Either the apps or methods key can exist, or not and will be searched
         * appropriately.
         *
         * This will pass to the callback a similar structure:
         * {
         *      apps: {
         *         id: { spec },
         *         id: { spec }
         *      },
         *      methods: {
         *         id: { spec },
         *         id: { spec }
         *      }
         * }
         *
         * If a spec isn't found, then it won't appear in the return values.
         */
        getFunctionSpecs: function (specSet, callback) {
            const results = {};
            if (specSet.methods && specSet.methods instanceof Array) {
                results.methods = {};
                // we need to fetch some methods, so don't
                Promise.resolve(this.methClient.get_method_spec({ ids: specSet.methods, tag: this.currentTag }))
                    .then((specs) => {
                        for (let k = 0; k < specs.length; k++) {
                            results.methods[specs[k].info.id] = specs[k];
                        }
                        callback(results);
                    })
                    .catch((err) => {

                        console.error('Error in method panel on "getFunctionSpecs" when contacting NMS');
                        console.error(err);
                        callback(results); // still return even if we couldn't get the methods
                    });

            } else {
                // there were no methods to fetch, so return
                callback(results);
            }
        },

        /**
         * Shows a loading spinner or message on top of the panel.
         * @private
         */
        showLoadingMessage: function (message) {
            this.$loadingPanel.find('#message').empty();
            if (message)
                this.$loadingPanel.find('#message').html(message);
            this.$functionPanel.hide();
            this.$errorPanel.hide();
            this.$loadingPanel.show();
        },

        /**
         * Shows the main function panel, hiding all others.
         * @private
         */
        showAppPanel: function () {
            this.$errorPanel.hide();
            this.$loadingPanel.hide();
            this.$functionPanel.show();
        },

        /**
         * Shows an error text message on top of the panel. All other pieces are hidden.
         * @param {string} error - the text of the error message
         * @private
         */
        showError: function (title, error) {
            this.$errorPanel.empty().append(DisplayUtil.createError(title, error));
            this.$functionPanel.hide();
            this.$loadingPanel.hide();
            this.$errorPanel.show();
        },
    });
});
