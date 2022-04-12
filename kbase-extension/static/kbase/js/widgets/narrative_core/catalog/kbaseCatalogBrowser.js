define([
    'kbwidget',
    'bootstrap',
    'jquery',
    'bluebird',
    'narrativeConfig',
    'narrative_core/catalog/app_card',
    'util/display',
    'catalog-client-api',
    'kbase-client-api',
    'kbaseAuthenticatedWidget',
    'base/js/namespace',
], (
    KBWidget,
    bootstrap,
    $,
    Promise,
    Config,
    AppCard,
    DisplayUtil,
    catalog_client_api,
    kbase_client_api,
    kbaseAuthenticatedWidget,
    Jupyter
) => {
    'use strict';
    return KBWidget({
        name: 'KBaseCatalogBrowser',
        parent: kbaseAuthenticatedWidget, // todo: do we still need th
        options: {
            tag: null,
            ignoreCategories: {},
        },

        // clients to the catalog service and the NarrativeMethodStore
        catalog: null,
        nms: null,

        // list of NMS method and app info (todo: we need to move this to the catalog)
        // for now, most of the filtering/sorting etc is done on the front end; this
        // will eventually need to move to backend servers when there are enough methods
        appList: null,
        appLookup: null,

        // list of catalog module info
        moduleList: null,

        // dict of module info for fast lookup
        moduleLookup: null,

        favoritesList: null,

        // control panel and elements
        $controlToolbar: null,
        $searchBox: null,

        // main panel and elements
        $mainPanel: null,
        $appListPanel: null,
        $moduleListPanel: null,
        $loadingPanel: null,
        $errorPanel: null,

        // current state of organization
        organizeBy: null,

        categories: {},

        init: function (options) {
            this._super(options);

            const self = this;

            self.categories = {
                assembly: 'Assembly',
                annotation: 'Annotation',
                metabolic_modeling: 'Metabolic Modeling',
                comparative_genomics: 'Comparative Genomics',
                expression: 'Expression',
                communities: 'Communities',
                sequence: 'Sequence Alignment & Search',
                util: 'Utilities',
            };

            // new style we have a runtime object that gives us everything in the options
            self.runtime = options.runtime;
            //console.log(this.runtime.service('session').getUsername());
            self.setupClients();

            // initialize and add the control bar
            const $container = $('<div>').addClass('container').css('width', '100%');
            self.$elem.append($container);
            const ctrElements = this.renderControlToolbar();
            self.$controlToolbar = ctrElements[0];
            self.$searchBox = ctrElements[1];
            $container.append(this.$controlToolbar);

            // initialize and add the main panel
            self.$loadingPanel = DisplayUtil.loadingDiv().div;
            $container.append(self.$loadingPanel);
            const mainPanelElements = self.initMainPanel();
            self.$mainPanel = mainPanelElements[0];
            self.$appListPanel = mainPanelElements[1];
            self.$moduleListPanel = mainPanelElements[2];
            $container.append(self.$mainPanel);

            const $footer = $('<div>');
            const $closeBtn = $('<button class="kb-default-btn pull-right">Close</button>').css({
                margin: '10px',
            });
            $closeBtn.click(() => {
                self.trigger('hideSidePanelOverlay.Narrative');
            });
            $footer.append($closeBtn);
            $container.append($footer);

            self.showLoading();

            // when we have it all, then render the list
            self.refreshAndRender();

            return this;
        },

        refreshAndRender: function () {
            const self = this;

            self.showLoading();
            self.$appListPanel.empty();

            // get the list of apps and modules
            const loadingCalls = [];
            self.appList = [];
            self.moduleList = [];
            loadingCalls.push(self.populateAppListWithMethods());
            loadingCalls.push(self.populateAppListWithApps());
            loadingCalls.push(self.populateModuleList());

            // when we have it all, then render the list
            Promise.all(loadingCalls).then(() => {
                self.processData();

                self.updateFavoritesCounts()
                    .then(() => {
                        self.hideLoading();
                        if (!self.organizeBy) {
                            self.organizeBy = 'category';
                        }
                        self.renderAppList(self.organizeBy);
                        self.updateRunStats();
                        return self.updateMyFavorites();

                        // [NARRATIVE_EDIT] - catch to fail
                    })
                    .fail((err) => {
                        self.hideLoading();
                        if (self.organizeBy) {
                            self.renderAppList(self.organizeBy);
                        } else {
                            self.organizeBy = 'name_az';
                            self.renderAppList('name_az');
                        }
                        self.updateRunStats();
                        console.error('ERROR');
                        console.error(err);
                    });
            });
        },

        rerender: function () {
            const self = this;
            if (self.organizeBy) {
                self.renderAppList(self.organizeBy);
            }
        },

        setupClients: function () {
            // [NARRATIVE_EDIT] - use Narrative style config, not KBase UI config
            this.catalog = new Catalog(Config.url('catalog'), { token: this.auth().token });
            this.nms = new NarrativeMethodStore(Config.url('narrative_method_store'), {
                token: this.auth().token,
            });
            this.nms_base_url = Config.url('narrative_method_store');
            this.nms_base_url = this.nms_base_url.substring(0, this.nms_base_url.length - 3);
        },

        // [NARRATIVE-EDIT] : allow an outside widget to update the tag
        setTag: function (newTag) {
            const self = this;
            // only update and refresh if the tag changed
            if (self.options.tag === newTag) {
                return;
            }
            self.options.tag = newTag;
            if (newTag !== 'dev' && newTag !== 'beta' && newTag !== 'release') {
                console.warn(
                    'tag ' + tag + ' is not valid! Use: dev/beta/release.  defaulting to release.'
                );
                self.options.tag = 'release';
            }
            self.refreshAndRender();
        },

        // Used to trigger
        clickCallback: function (appCard) {
            this.trigger('hideSidePanelOverlay.Narrative');
            Jupyter.narrative.addAndPopulateApp(appCard.info.id, this.options.tag);
        },

        renderControlToolbar: function () {
            const self = this;

            // CONTROL BAR CONTAINER
            const $nav = $('<nav>')
                .addClass('navbar navbar-default')
                .css({ margin: '0.8em', border: '0', 'background-color': '#fff' });
            const $container = $('<div>').addClass('container-fluid');

            const $content = $('<div>').addClass('');

            $nav.append($container.append($content));

            // SEARCH
            const $searchBox = $('<input type="text" placeholder="Search" size="50">').addClass(
                'form-control'
            );
            $searchBox
                .on('input', () => {
                    self.filterApps($searchBox.val());
                })
                .on('focus', () => {
                    if (Jupyter && Jupyter.narrative) {
                        Jupyter.narrative.disableKeyboardManager();
                    }
                })
                .on('blur', () => {
                    if (Jupyter && Jupyter.narrative) {
                        Jupyter.narrative.enableKeyboardManager();
                    }
                })
                .bind('keypress', (e) => {
                    if (e.keyCode === 13) {
                        return false;
                    }
                });
            $content.append(
                $('<form>')
                    .addClass('navbar-form navbar-left')
                    .append($('<div>').addClass('form-group').append($searchBox))
            );

            // other controls list
            const $ctrList = $('<ul>')
                .addClass('nav navbar-nav')
                .css('font-family', "'OxygenRegular', Arial, sans-serif");
            $content.append($ctrList);

            // ORGANIZE BY
            const dropdownStyle = { cursor: 'pointer' }; // [NARRATIVE_EDIT] - have to do this because <a> does not have pointers in the narrative
            const $obMyFavs = $('<a>');
            // [NARRATIVE_EDIT] - always logged in, so we don't / can't check session
            //if(self.runtime.service('session').isLoggedIn()) {
            $obMyFavs
                .append('My Favorites')
                .css(dropdownStyle)
                .on('click', () => {
                    self.renderAppList('my_favorites');
                });
            //}

            const $obFavs = $('<a>')
                .append('Favorites Count')
                .css(dropdownStyle)
                .on('click', () => {
                    self.organizeBy = 'favorites';
                    self.renderAppList(self.organizeBy);
                });
            const $obRuns = $('<a>')
                .append('Run Count')
                .css(dropdownStyle)
                .on('click', () => {
                    self.organizeBy = 'runs';
                    self.renderAppList(self.organizeBy);
                });
            const $obNameAz = $('<a>')
                .append('Name (a-z)')
                .css(dropdownStyle)
                .on('click', () => {
                    self.organizeBy = 'name_az';
                    self.renderAppList(self.organizeBy);
                });
            const $obNameZa = $('<a>')
                .append('Name (z-a)')
                .css(dropdownStyle)
                .on('click', () => {
                    self.organizeBy = 'name_za';
                    self.renderAppList(self.organizeBy);
                });
            const $obCat = $('<a>')
                .append('Category')
                .css(dropdownStyle)
                .on('click', () => {
                    self.organizeBy = 'category';
                    self.renderAppList(self.organizeBy);
                });
            const $obModule = $('<a>')
                .append('Module')
                .css(dropdownStyle)
                .on('click', () => {
                    self.organizeBy = 'module';
                    self.renderAppList(self.organizeBy);
                });
            const $obOwner = $('<a>')
                .append('Developer')
                .css(dropdownStyle)
                .on('click', () => {
                    self.organizeBy = 'developer';
                    self.renderAppList(self.organizeBy);
                });
            const $obInput = $('<a>')
                .append('Input Types')
                .css(dropdownStyle)
                .on('click', () => {
                    self.organizeBy = 'input_types';
                    self.renderAppList(self.organizeBy);
                });
            const $obOutput = $('<a>')
                .append('Output Types')
                .css(dropdownStyle)
                .on('click', () => {
                    self.organizeBy = 'output_types';
                    self.renderAppList(self.organizeBy);
                });

            const $organizeBy = $('<li>')
                .addClass('dropdown')
                .append(
                    '<a class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">Organize by <span class="caret"></span></a>'
                );

            $organizeBy.append(
                $('<ul>')
                    .addClass('dropdown-menu')
                    .append($('<li>').append($obMyFavs))
                    .append($('<li>').append($obFavs))
                    .append($('<li>').append($obRuns))
                    .append('<li role="separator" class="divider"></li>')
                    .append($('<li>').append($obNameAz))
                    .append($('<li>').append($obNameZa))
                    .append('<li role="separator" class="divider"></li>')
                    .append($('<li>').append($obCat))
                    .append($('<li>').append($obModule))
                    .append($('<li>').append($obOwner))
                    .append('<li role="separator" class="divider"></li>')
                    .append($('<li>').append($obInput))
                    .append($('<li>').append($obOutput))
            );

            // VERSION
            /*var $verR = $('<a href="/#catalog/apps/release">').append('Released Modules');
            var $verB = $('<a href="/#catalog/apps/beta">').append('Beta Modules');
            var $verD = $('<a href="/#catalog/apps/dev">').append('Modules in Development');

            var $version = $('<li>').addClass('dropdown')
                                .append('<a class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">Version<span class="caret"></span></a>')

            $version
                .append($('<ul>').addClass('dropdown-menu')
                    .append($('<li>')
                        .append($verR))
                    .append($('<li>')
                        .append($verB))
                    .append($('<li>')
                        .append($verD)));*/

            // NAV LINKS
            //[NARRATIVE-EDIT] : remove version and status and register links
            //var $statusLink = $('<li>').append($('<a href="/#appcatalog/status">').append('Status'));
            //var $registerLink = $('<li>').append($('<a href="/#appcatalog/register">').append('<i class="fa fa-plus-circle"></i> Add Module'));

            const $viewAppCatalog = $('<li>').append(
                $('<a href="/#catalog/apps" target="_blank">').append('View App Catalog')
            );

            // PLACE CONTENT ON CONTROL BAR
            $content.append($ctrList.append($organizeBy).append($viewAppCatalog));
            //.append($version)
            //.append($statusLink)
            //.append($registerLink));

            $nav.append($container);

            return [$nav, $searchBox];
        },

        filterApps: function (query) {
            const self = this;
            query = query.trim();
            if (query) {
                const terms = query.toLowerCase().match(/\w+|"(?:\\"|[^"])+"/g);
                if (terms) {
                    // for everything in the list
                    for (let k = 0; k < self.appList.length; k++) {
                        // for every term (every term must match to get a match)
                        let match = false; // every term must match
                        for (let t = 0; t < terms.length; t++) {
                            if (
                                terms[t].charAt(0) == '"' &&
                                terms[t].charAt(terms.length - 1) == '"' &&
                                terms[t].length > 2
                            ) {
                                terms[t] = terms[t].substring(1, terms[t].length - 1);
                                // the regex keeps quotes in quoted strings, so toss those
                            }
                            // filter on names
                            if (self.appList[k].info.name.toLowerCase().indexOf(terms[t]) >= 0) {
                                match = true;
                                continue;
                            }
                            // filter on module names, if they exist
                            if (self.appList[k].info.module_name) {
                                if (
                                    self.appList[k].info.module_name
                                        .toLowerCase()
                                        .indexOf(terms[t]) >= 0
                                ) {
                                    match = true;
                                    continue;
                                }
                            }
                            // filter on other description
                            if (self.appList[k].info.subtitle) {
                                if (
                                    self.appList[k].info.subtitle.toLowerCase().indexOf(terms[t]) >=
                                    0
                                ) {
                                    match = true;
                                    continue;
                                }
                            }

                            // filter on authors
                            if (self.appList[k].info.authors) {
                                let authorMatch = false;
                                for (let a = 0; a < self.appList[k].info.authors.length; a++) {
                                    if (
                                        self.appList[k].info.authors[a]
                                            .toLowerCase()
                                            .indexOf(terms[t]) >= 0
                                    ) {
                                        authorMatch = true;
                                        break;
                                    }
                                }
                                if (authorMatch) {
                                    match = true;
                                    continue;
                                }
                            }

                            // filter on other stuff (input/output types?)

                            // if we get here, this term didnt' match anything, so we can break
                            match = false;
                            break;
                        }

                        // show or hide if we matched
                        if (match) {
                            self.appList[k].show();
                        } else {
                            self.appList[k].hide();
                        }
                    }
                } else {
                    self.clearFilter();
                }
            } else {
                self.clearFilter();
            }

            // hide/show sections
            const sections = self.$appListPanel.find('.catalog-section');
            for (let i = 0; i < sections.length; i++) {
                $(sections[i]).show();
                const cards = $(sections[i]).find(
                    '.kbcb-app-card-container,.kbcb-app-card-list-element'
                );
                let hasVisible = false;
                for (let j = 0; j < cards.length; j++) {
                    if ($(cards[j]).is(':visible')) {
                        hasVisible = true;
                        break;
                    }
                }
                if (!hasVisible) {
                    $(sections[i]).hide();
                }
            }
        },

        clearFilter: function () {
            const self = this;
            for (let k = 0; k < self.appList.length; k++) {
                self.appList[k].show();
            }
        },

        initMainPanel: function ($appListPanel, $moduleListPanel) {
            const $mainPanel = $('<div>').addClass('container').css({
                width: '100%',
                'overflow-x': 'hidden',
                height: '550px',
                'overflow-y': 'auto',
            });
            var $appListPanel = $('<div>').css('padding', '0 1em 0 2em');
            var $moduleListPanel = $('<div>');
            $mainPanel.append($appListPanel);
            $mainPanel.append($moduleListPanel);
            return [$mainPanel, $appListPanel, $moduleListPanel];
        },

        showLoading: function () {
            const self = this;
            self.$loadingPanel.show();
            self.$mainPanel.hide();
        },
        hideLoading: function () {
            const self = this;
            self.$loadingPanel.hide();
            self.$mainPanel.show();
        },

        // we assume context is:
        //    catalog: catalog_client
        //    browserWidget: this widget, so we can toggle any update
        toggleFavorite: function (info, context) {
            const appCard = this;
            const params = {};
            if (info.module_name) {
                params['module_name'] = info.module_name;
                params['id'] = info.id.split('/')[1];
            } else {
                params['id'] = info.id;
            }

            // check if is a favorite
            if (appCard.isStarOn()) {
                context.catalog
                    .remove_favorite(params)
                    .then(() => {
                        appCard.turnOffStar();
                        appCard.setStarCount(appCard.getStarCount() - 1);
                        context.browserWidget.updateMyFavorites();
                        return context.browserWidget.updateFavoritesCounts();
                    })
                    // [NARRATIVE_EDIT] - catch to fail
                    .fail((err) => {
                        console.error('ERROR');
                        console.error(err);
                    });
            } else {
                context.catalog
                    .add_favorite(params)
                    .then(() => {
                        appCard.turnOnStar();
                        appCard.setStarCount(appCard.getStarCount() + 1);
                        context.browserWidget.updateMyFavorites();
                        return context.browserWidget.updateFavoritesCounts();
                    })
                    // [NARRATIVE_EDIT] - catch to fail
                    .fail((err) => {
                        console.error('ERROR');
                        console.error(err);
                    });
            }
        },

        populateAppListWithMethods: function () {
            const self = this;

            // determine which set of methods to fetch
            let tag = 'release'; // default is to show only 'release' tagged modules
            if (self.options.tag) {
                tag = self.options.tag;
                if (tag !== 'dev' && tag !== 'beta' && tag !== 'release') {
                    console.warn(
                        'tag ' +
                            tag +
                            ' is not valid! Use: dev/beta/release.  defaulting to release.'
                    );
                    tag = 'release';
                }
            }

            return (
                self.nms
                    .list_methods({
                        tag: tag,
                    })
                    .then((methods) => {
                        for (let k = 0; k < methods.length; k++) {
                            // logic to hide/show certain categories
                            let skip = false;
                            for (let i = 0; i < methods[k].categories.length; i++) {
                                if (self.options.ignoreCategories[methods[k].categories[i]]) {
                                    skip = true;
                                }
                            }
                            if (skip) continue;

                            // [NARRATIVE_EDIT] - always logged in, so we don't / can't check session
                            const m = new AppCard(
                                'method',
                                methods[k],
                                tag,
                                self.nms_base_url,
                                self.toggleFavorite,
                                { catalog: self.catalog, browserWidget: self },
                                true,
                                (card) => {
                                    self.clickCallback(card);
                                }
                            ); //self.runtime.service('session').isLoggedIn());
                            self.appList.push(m);
                        }
                    })
                    // [NARRATIVE_EDIT] - catch renamed to fail
                    .fail((err) => {
                        console.error('ERROR');
                        console.error(err);
                    })
            );
        },

        populateAppListWithApps: function () {
            const self = this;

            // apps cannot be registered via the SDK, so don't have tag info
            return self.nms
                .list_apps({})
                .then((apps) => {
                    //console.log(apps);
                    for (let k = 0; k < apps.length; k++) {
                        // logic to hide/show certain categories
                        let skip = false;
                        for (let i = 0; i < apps[k].categories.length; i++) {
                            if (self.options.ignoreCategories[apps[k].categories[i]]) {
                                skip = true;
                            }
                        }
                        if (skip) continue;

                        const a = new AppCard(
                            'app',
                            apps[k],
                            null,
                            self.nms_base_url,
                            null,
                            {},
                            true,
                            (card) => {
                                self.clickCallback(card);
                            }
                        );
                        self.appList.push(a);
                    }
                })
                .fail((err) => {
                    console.error('ERROR');
                    console.error(err);
                });
        },

        populateModuleList: function () {
            const self = this;

            const moduleSelection = {
                include_released: 1,
                include_unreleased: 1,
                include_disabled: 0,
            };

            return (
                self.catalog
                    .list_basic_module_info(moduleSelection)
                    .then((modules) => {
                        for (let k = 0; k < modules.length; k++) {
                            const m = {
                                info: modules[k],
                                $div: $('<div>').addClass('kbcb-module'),
                            };
                            self.renderModuleBox(m);
                            self.moduleList.push(m);
                        }
                    })
                    // [NARRATIVE_EDIT] - catch to fail
                    .fail((err) => {
                        console.error('ERROR');
                        console.error(err);
                    })
            );
        },

        updateRunStats: function () {
            const self = this;

            const options = {};

            return (
                self.catalog
                    .get_exec_aggr_stats(options)
                    .then((stats) => {
                        self.runStats = stats;
                        for (let k = 0; k < stats.length; k++) {
                            let lookup = stats[k].full_app_id;
                            const idTokens = stats[k].full_app_id.split('/');
                            if (idTokens.length === 2) {
                                lookup = idTokens[0].toLowerCase() + '/' + idTokens[1];
                            }
                            if (self.appLookup[lookup]) {
                                self.appLookup[lookup].setRunCount(stats[k].number_of_calls);
                            }
                        }
                    })
                    // [NARRATIVE_EDIT] - catch to fail
                    .fail((err) => {
                        console.error('ERROR');
                        console.error(err);
                    })
            );
        },

        updateFavoritesCounts: function () {
            const self = this;
            const listFavoritesParams = {};
            return (
                self.catalog
                    .list_favorite_counts(listFavoritesParams)
                    .then((counts) => {
                        for (let k = 0; k < counts.length; k++) {
                            const c = counts[k];
                            let lookup = c.id;
                            if (c.module_name_lc != 'nms.legacy') {
                                lookup = c.module_name_lc + '/' + lookup;
                            }
                            if (self.appLookup[lookup]) {
                                self.appLookup[lookup].setStarCount(c.count);
                            }
                        }
                    })
                    // [NARRATIVE_EDIT] - catch to fail
                    .fail((err) => {
                        console.error('ERROR');
                        console.error(err);
                    })
            );
        },

        // warning!  will not return a promise if the user is not logged in!
        updateMyFavorites: function () {
            const self = this;

            // [NARRATIVE_EDIT] - always logged in, so removed logged in check; get user name in narrative way
            return (
                self.catalog
                    .list_favorites(this.auth().user_id)
                    .then((favorites) => {
                        self.favoritesList = favorites;
                        for (let k = 0; k < self.favoritesList.length; k++) {
                            const fav = self.favoritesList[k];
                            let lookup = fav.id;
                            if (fav.module_name_lc != 'nms.legacy') {
                                lookup = fav.module_name_lc + '/' + lookup;
                            }
                            if (self.appLookup[lookup]) {
                                self.appLookup[lookup].turnOnStar(fav.timestamp);
                            }
                        }
                    })
                    // [NARRATIVE_EDIT] - catch to fail
                    .fail((err) => {
                        console.error('ERROR');
                        console.error(err);
                    })
            );
        },

        processData: function () {
            const self = this;

            // setup module map
            self.moduleLookup = {};
            self.appLookup = {};
            for (let m = 0; m < self.moduleList.length; m++) {
                self.moduleLookup[self.moduleList[m].info.module_name] = self.moduleList[m];
            }
            for (let a = 0; a < self.appList.length; a++) {
                // only lookup for methods; apps are deprecated
                if (self.appList[a].type === 'method') {
                    if (self.appList[a].info.module_name) {
                        const idTokens = self.appList[a].info.id.split('/');
                        self.appLookup[idTokens[0].toLowerCase() + '/' + idTokens[1]] =
                            self.appList[a];
                    } else {
                        self.appLookup[self.appList[a].info.id] = self.appList[a];
                    }
                }
            }

            self.developers = {};
            self.inputTypes = {};
            self.outputTypes = {};

            for (let k = 0; k < self.appList.length; k++) {
                if (self.appList[k].type === 'method') {
                    if (self.appList[k].info.authors.length > 0) {
                        const authors = self.appList[k].info.authors;
                        for (var i = 0; i < authors.length; i++) {
                            self.developers[authors[i]] = 1;
                        }
                    }
                    if (self.appList[k].info.input_types.length > 0) {
                        const input_types = self.appList[k].info.input_types;
                        for (var i = 0; i < input_types.length; i++) {
                            self.inputTypes[input_types[i]] = 1;
                        }
                    }
                    if (self.appList[k].info.output_types.length > 0) {
                        const output_types = self.appList[k].info.output_types;
                        for (var i = 0; i < output_types.length; i++) {
                            self.outputTypes[output_types[i]] = 1;
                        }
                    }
                }
            }
        },

        renderModuleBox: function (module) {
            const $modDiv = $('<div>').addClass('kbcb-app');
            $modDiv.append(module.info.module_name);
            module.$div = $modDiv;
        },

        renderAppList: function (organizeBy) {
            const self = this;

            self.$appListPanel.children().detach();

            // no organization, so show all
            if (!organizeBy) {
                return;
            }

            const listContainerStyle = { padding: '0 0 0em 0em' };

            if (organizeBy == 'name_az') {
                // sort by method name, A to Z
                self.appList.sort((a, b) => {
                    if (a.info.name.toLowerCase() < b.info.name.toLowerCase()) return -1;
                    if (a.info.name.toLowerCase() > b.info.name.toLowerCase()) return 1;
                    return 0;
                });
                var $listContainer = $('<div>').css(listContainerStyle);
                for (var k = 0; k < self.appList.length; k++) {
                    self.appList[k].clearCardsAddedCount();
                    $listContainer.append(self.appList[k].getNewCardDiv());
                }
                self.$appListPanel.append($listContainer);
            } else if (organizeBy == 'name_za') {
                // sort by method name, Z to A
                self.appList.sort((a, b) => {
                    if (a.info.name.toLowerCase() < b.info.name.toLowerCase()) return 1;
                    if (a.info.name.toLowerCase() > b.info.name.toLowerCase()) return -1;
                    return 0;
                });
                var $listContainer = $('<div>').css(listContainerStyle);
                for (var k = 0; k < self.appList.length; k++) {
                    self.appList[k].clearCardsAddedCount();
                    $listContainer.append(self.appList[k].getNewCardDiv());
                }
                self.$appListPanel.append($listContainer);
            } else if (organizeBy == 'module') {
                // Organization by module is simple because things can only be in one module, we sort and group them by module

                self.appList.sort((a, b) => {
                    if (a.info.module_name && b.info.module_name) {
                        if (a.info.module_name.toLowerCase() < b.info.module_name.toLowerCase())
                            return -1;
                        if (a.info.module_name.toLowerCase() > b.info.module_name.toLowerCase())
                            return 1;
                        if (a.info.name.toLowerCase() < b.info.name.toLowerCase()) return -1;
                        if (a.info.name.toLowerCase() > b.info.name.toLowerCase()) return 1;
                        return 0;
                    }
                    if (a.info.module_name) return -1;
                    if (b.info.module_name) return 1;
                    return 0;
                });
                let currentModuleName = '';
                let $currentModuleDiv = null;
                for (var k = 0; k < self.appList.length; k++) {
                    self.appList[k].clearCardsAddedCount();

                    const info = self.appList[k].info;

                    let m = info.module_name;
                    if (!m) {
                        m = 'Not in an SDK Module';
                    }

                    if (currentModuleName != m) {
                        currentModuleName = m;
                        var $section = $('<div>').addClass('catalog-section');
                        $currentModuleDiv = $('<div>').addClass('kbcb-app-card-list-container');
                        $section.append(
                            $('<div>')
                                .css({ color: '#777' })
                                .append(
                                    $('<h4>').append(
                                        '<a href="/#catalog/modules/' +
                                            m +
                                            '" target="_blank">' +
                                            m +
                                            '</a>'
                                    )
                                )
                        );
                        $section.append($currentModuleDiv);
                        self.$appListPanel.append($section);
                    }
                    $currentModuleDiv.append(self.appList[k].getNewCardDiv());
                }
            } else if (organizeBy == 'developer') {
                // get and sort the dev list
                const devs = [];
                for (var k in self.developers) {
                    devs.push(k);
                }
                devs.sort();

                // create the sections per author
                const $authorDivLookup = {};
                for (var k = 0; k < devs.length; k++) {
                    var $section = $('<div>').addClass('catalog-section');
                    const $authorDiv = $('<div>').addClass('kbcb-app-card-list-container');
                    $authorDivLookup[devs[k]] = $authorDiv;
                    $section.append(
                        $('<div>')
                            .css({ color: '#777' })
                            .append(
                                $('<h4>').append(
                                    '<a href="/#people/' +
                                        devs[k] +
                                        '" target="_blank">' +
                                        devs[k] +
                                        '</a>'
                                )
                            )
                    );
                    $section.append($authorDiv);
                    self.$appListPanel.append($section);
                }
                var $section = $('<div>').addClass('catalog-section');
                const $noAuthorDiv = $('<div>').addClass('kbcb-app-card-list-container');
                $section.append(
                    $('<div>')
                        .css({ color: '#777' })
                        .append($('<h4>').append('No Developer Specified'))
                );
                $section.append($noAuthorDiv);
                self.$appListPanel.append($section);

                // render the app list
                for (var k = 0; k < self.appList.length; k++) {
                    self.appList[k].clearCardsAddedCount();

                    if (self.appList[k].type === 'method') {
                        if (self.appList[k].info.authors.length > 0) {
                            const authors = self.appList[k].info.authors;
                            for (var i = 0; i < authors.length; i++) {
                                $authorDivLookup[authors[i]].append(
                                    self.appList[k].getNewCardDiv()
                                );
                            }
                        } else {
                            $noAuthorDiv.append(self.appList[k].getNewCardDiv());
                        }
                    } else {
                        $noAuthorDiv.append(self.appList[k].getNewCardDiv());
                    }
                }
            } else if (organizeBy == 'category') {
                const cats = [];
                for (var k in self.categories) {
                    cats.push(k);
                }
                cats.sort();

                const $catDivLookup = {};
                for (var k = 0; k < cats.length; k++) {
                    var $section = $('<div>').addClass('catalog-section');
                    const $catDiv = $('<div>').addClass('kbcb-app-card-list-container');
                    $catDivLookup[cats[k]] = $catDiv;
                    $section.append(
                        $('<div>')
                            .css({ color: '#777' })
                            .append($('<h4>').append(self.categories[cats[k]]))
                    );
                    $section.append($catDiv);
                    self.$appListPanel.append($section);
                }
                var $section = $('<div>').addClass('catalog-section');
                const $noCatDiv = $('<div>').addClass('kbcb-app-card-list-container');
                $section.append(
                    $('<div>').css({ color: '#777' }).append($('<h4>').append('Uncategorized'))
                );
                $section.append($noCatDiv);
                self.$appListPanel.append($section);

                for (var k = 0; k < self.appList.length; k++) {
                    self.appList[k].clearCardsAddedCount();

                    if (self.appList[k].info.categories.length > 0) {
                        const appCats = self.appList[k].info.categories;
                        let gotCat = false;
                        for (var i = 0; i < appCats.length; i++) {
                            if ($catDivLookup.hasOwnProperty(appCats[i])) {
                                gotCat = true;
                                $catDivLookup[appCats[i]].append(self.appList[k].getNewCardDiv());
                            }
                        }
                        if (!gotCat) {
                            $noCatDiv.append(self.appList[k].getNewCardDiv());
                        }
                    } else {
                        $noCatDiv.append(self.appList[k].getNewCardDiv());
                    }
                }
            } else if (organizeBy == 'my_favorites') {
                // sort by number of stars, then by app name
                self.appList.sort((a, b) => {
                    // sort by time favorited
                    if (a.isStarOn() && b.isStarOn()) {
                        if (a.getStarTime() > b.getStarTime()) return -1;
                        if (a.getStarTime() < b.getStarTime()) return 1;
                    }

                    // otherwise sort by stars
                    const aStars = a.getStarCount();
                    const bStars = b.getStarCount();
                    if (aStars > bStars) return -1;
                    if (bStars > aStars) return 1;
                    const aName = a.info.name.toLowerCase();
                    const bName = b.info.name.toLowerCase();
                    if (aName < bName) return -1;
                    if (aName > bName) return 1;
                    return 0;
                });
                const $mySection = $('<div>').addClass('catalog-section');
                const $myDiv = $('<div>').addClass('kbcb-app-card-list-container');
                $mySection.append(
                    $('<div>').css({ color: '#777' }).append($('<h4>').append('My Favorites'))
                );
                $mySection.append($myDiv);
                self.$appListPanel.append($mySection);

                const $otherSection = $('<div>').addClass('catalog-section');
                const $otherDiv = $('<div>').addClass('kbcb-app-card-list-container');
                $otherSection.append(
                    $('<div>').css({ color: '#777' }).append($('<h4>').append('Everything Else'))
                );
                $otherSection.append($otherDiv);
                self.$appListPanel.append($otherSection);
                let hasFavorites = false;
                for (var k = 0; k < self.appList.length; k++) {
                    self.appList[k].clearCardsAddedCount();
                    if (self.appList[k].isStarOn()) {
                        $myDiv.append(self.appList[k].getNewCardDiv());
                        hasFavorites = true;
                    } else {
                        $otherDiv.append(self.appList[k].getNewCardDiv());
                    }
                }
                if (!hasFavorites) {
                    $myDiv.append(
                        $('<div>')
                            .css({ color: '#777' })
                            .addClass('kbcb-app-card-list-element')
                            .append(
                                'You do not have any favorites yet.  Click on the stars to add to your favorites.'
                            )
                    );
                }
            } else if (organizeBy == 'favorites') {
                // sort by number of stars, then by app name
                self.appList.sort((a, b) => {
                    const aStars = a.getStarCount();
                    const bStars = b.getStarCount();
                    if (aStars > bStars) return -1;
                    if (bStars > aStars) return 1;
                    const aName = a.info.name.toLowerCase();
                    const bName = b.info.name.toLowerCase();
                    if (aName < bName) return -1;
                    if (aName > bName) return 1;
                    return 0;
                });
                var $listContainer = $('<div>').css(listContainerStyle);
                for (var k = 0; k < self.appList.length; k++) {
                    self.appList[k].clearCardsAddedCount();
                    $listContainer.append(self.appList[k].getNewCardDiv());
                }
                self.$appListPanel.append($listContainer);
            } else if (organizeBy == 'runs') {
                self.$appListPanel.append(
                    '<div><i>Note: Run counts for legacy methods released before 2016 are not reported.</i><br><br></div>'
                );

                // sort by runs, then by app name
                self.appList.sort((a, b) => {
                    const aRuns = a.getRunCount();
                    const bRuns = b.getRunCount();
                    if (aRuns > bRuns) return -1;
                    if (bRuns > aRuns) return 1;
                    const aName = a.info.name.toLowerCase();
                    const bName = b.info.name.toLowerCase();
                    if (aName < bName) return -1;
                    if (aName > bName) return 1;
                    return 0;
                });
                var $listContainer = $('<div>').css(listContainerStyle);
                for (var k = 0; k < self.appList.length; k++) {
                    self.appList[k].clearCardsAddedCount();
                    $listContainer.append(self.appList[k].getNewCardDiv());
                }
                self.$appListPanel.append($listContainer);
            } else if (organizeBy == 'input_types') {
                // get and sort the type list
                var types = [];
                for (var k in self.inputTypes) {
                    types.push(k);
                }
                types.sort();

                // create the sections per author
                var $typeDivLookup = {};
                for (var k = 0; k < types.length; k++) {
                    var $section = $('<div>').addClass('catalog-section');
                    var $typeDiv = $('<div>').addClass('kbcb-app-card-list-container');
                    $typeDivLookup[types[k]] = $typeDiv;
                    $section.append(
                        $('<div>')
                            .css({ color: '#777' })
                            .append(
                                $('<h4>').append(
                                    $(
                                        '<a href="/#spec/type/' + types[k] + '" target="_blank">'
                                    ).append(types[k])
                                )
                            )
                    );
                    $section.append($typeDiv);
                    self.$appListPanel.append($section);
                }

                // render the app list
                for (var k = 0; k < self.appList.length; k++) {
                    self.appList[k].clearCardsAddedCount();

                    if (self.appList[k].type === 'method') {
                        if (self.appList[k].info.input_types.length > 0) {
                            const input_types = self.appList[k].info.input_types;
                            for (var i = 0; i < input_types.length; i++) {
                                $typeDivLookup[input_types[i]].append(
                                    self.appList[k].getNewCardDiv()
                                );
                            }
                        }
                    }
                }
            } else if (organizeBy == 'output_types') {
                // get and sort the type list
                var types = [];
                for (var k in self.outputTypes) {
                    types.push(k);
                }
                types.sort();

                // create the sections per author
                var $typeDivLookup = {};
                for (var k = 0; k < types.length; k++) {
                    var $section = $('<div>').addClass('catalog-section');
                    var $typeDiv = $('<div>').addClass('kbcb-app-card-list-container');
                    $typeDivLookup[types[k]] = $typeDiv;
                    $section.append(
                        $('<div>')
                            .css({ color: '#777' })
                            .append(
                                $('<h4>').append(
                                    $(
                                        '<a href="/#spec/type/' + types[k] + '"> target="_blank"'
                                    ).append(types[k])
                                )
                            )
                    );
                    $section.append($typeDiv);
                    self.$appListPanel.append($section);
                }

                // render the app list
                for (var k = 0; k < self.appList.length; k++) {
                    self.appList[k].clearCardsAddedCount();

                    if (self.appList[k].type === 'method') {
                        if (self.appList[k].info.output_types.length > 0) {
                            const output_types = self.appList[k].info.output_types;
                            for (var i = 0; i < output_types.length; i++) {
                                $typeDivLookup[output_types[i]].append(
                                    self.appList[k].getNewCardDiv()
                                );
                            }
                        }
                    }
                }
            } else {
                self.$appListPanel.append('<span>invalid organization parameter</span>');
            }

            // gives some buffer at the end of the page
            self.$appListPanel.append($('<div>').css('padding', '4em'));

            self.filterApps(self.$searchBox.val());
        },

        showError: function (error) {
            this.$errorPanel.empty();
            this.$errorPanel.append(
                '<strong>Error when fetching App/Method information.</strong><br><br>'
            );
            this.$errorPanel.append(error.error.message);
            this.$errorPanel.append('<br>');
            this.$errorPanel.show();
        },
    });
});
