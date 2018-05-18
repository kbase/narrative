/*global define*/
/*jslint white: true*/
/*global Catalog*/
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
    'util/icon',
    'text!kbase/templates/beta_warning_body.html',
    'yaml!ext_components/kbase-ui-plugin-catalog/src/plugin/modules/data/categories.yml',
    //'yaml!kbase/config/categories.yml',
    'kbaseAccordion',
    'kbaseNarrativeControlPanel',
    'base/js/namespace',
    'kb_service/client/narrativeMethodStore',
    'uuid',
    'narrative_core/catalog/kbaseCatalogBrowser',
    'kbase/js/widgets/narrative_core/kbaseAppCard',
    'common/runtime',
    'kbaseNarrative',
    'catalog-client-api',
    'kbase-client-api',
    'bootstrap'
], function(
    KBWidget,
    $,
    Promise,
    Handlebars,
    Config,
    DisplayUtil,
    BootstrapDialog,
    BootstrapSearch,
    Icon,
    BetaWarningTemplate,
    Categories,
    kbaseAccordion,
    kbaseNarrativeControlPanel,
    Jupyter,
    NarrativeMethodStore,
    Uuid,
    KBaseCatalogBrowser,
    kbaseAppCard,
    Runtime
) {
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
            catalogURL: Config.url('catalog'),
            moduleLink: '/#appcatalog/module/',
            methodHelpLink: '/#appcatalog/app/',
            appHelpLink: '/#appcatalog/app/l.a/'
        },
        ignoreCategories: {
            inactive: 1,
            importers: 1,
            viewers: 1
        },
        id2Elem: {},
        methodSpecs: {}, // id -> spec
        categories: {}, // id -> category info

        currentTag: null, // release/dev/beta; which version of the method spec to fetch.  default is release

        init: function(options) {
            var self = this;
            this.app_offset = true;
            this._super(options);
            // DOM structure setup here.
            // After this, just need to update the function list

            this.currentTag = 'release';

            this.icon_colors = Config.get('icons').colors;

            this.$searchDiv = $('<div>').hide();

            this.$numHiddenSpan = $('<span>0</span>');
            this.$showHideSpan = $('<span>show</span>');
            this.$toggleHiddenDiv = $('<div>')
                .append(this.$showHideSpan)
                .append(' ')
                .append(this.$numHiddenSpan)
                .append(' filtered out')
                .addClass('kb-function-toggle')
                .hide()
                .click($.proxy(function() {
                    var curText = this.$showHideSpan.text();
                    this.toggleHiddenMethods(curText === 'show');
                    this.$showHideSpan.text(curText === 'show' ? 'hide' : 'show');
                }, this));

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
                    .append(this.$searchDiv)
                    .append(this.$toggleHiddenDiv))
                .append(this.$methodList);

            this.bsSearch = new BootstrapSearch(this.$searchDiv, {
                inputFunction: function() {
                    self.refreshPanel(this);
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

            $(document).on('filterMethods.Narrative', function(e, filterString) {
                if (filterString) {
                    this.$searchDiv.show({ effect: 'blind', duration: 'fast' });
                    this.bsSearch.val(filterString);
                }
            }.bind(this));

            $(document).on('removeFilterMethods.Narrative', function() {
                this.$searchDiv.toggle({ effect: 'blind', duration: 'fast' });
                this.bsSearch.val('');
            }.bind(this));

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
                $.proxy(function(e, specSet, callback) {
                    //console.debug("Trigger proxy: specSet=", specSet, "callback=", callback);
                    if (callback) {
                        //console.debug("Trigger: specSet=",specSet);
                        this.getFunctionSpecs(specSet, callback);
                    }
                }, this)
            );

            this.currentPanelStyle = 'category';
            this.$filterLabel = $('<span>').append(this.currentPanelStyle);
            var $filterMenu = $('<ul>')
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
            $filterMenu.find('li a').click(function() {
                self.currentPanelStyle = $(this).data('filter');
                self.$filterLabel.text(self.currentPanelStyle);
                self.refreshPanel();
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
                .click(function() {
                    this.$searchDiv.toggle({ effect: 'blind', duration: 'fast' });
                    var new_height = this.$methodList.height();
                    if (this.app_offset) {
                        new_height = (new_height - 40) + 'px';
                    } else {
                        new_height = (new_height + 40) + 'px';
                    }
                    this.$methodList.css('height', new_height);
                    this.app_offset = !this.app_offset;
                    this.bsSearch.focus();
                }.bind(this)));

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
                .click(function() {
                    var versionTag = 'release';
                    if (this.versionState === 'B') { versionTag = 'beta'; } else if (this.versionState === 'D') { versionTag = 'dev'; }
                    this.refreshFromService(versionTag);
                    this.refreshKernelSpecManager();

                    if (this.appCatalog) {
                        this.appCatalog.refreshAndRender();
                    }
                }.bind(this)));

            // Toggle version btn
            var toggleTooltipText = 'Toggle between Release and Beta Versions';
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

            var devMode = Config.get('dev_mode');
            var showBetaWarning = true;

            var betaWarningCompiled = Handlebars.compile(BetaWarningTemplate);

            this.betaWarningDialog = new BootstrapDialog({
                title: 'Warning - entering beta mode!',
                body: betaWarningCompiled(),
                buttons: [$('<button class="btn btn-primary" data-dismiss="modal">OK</button>')],
                closeButton: true,
                enterToTrigger: true
            });
            this.betaWarningDialog.getBody().find('input').change(function() {
                showBetaWarning = $(this).is(':checked');
            }).prop('checked', showBetaWarning);

            this.$toggleVersionBtn.click(function() {
                this.$toggleVersionBtn.tooltip('hide');
                var versionTag = 'release';
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
            }.bind(this));
            this.addButton(this.$toggleVersionBtn);

            this.$appCatalogBody = $('<div>');
            this.appCatalog = null;
            this.$appCatalogContainer = $('<div>')
                .append($('<div>')
                    .addClass('kb-side-header active')
                    .css({ 'width': '100%' })
                    .append('App Catalog'))
                .append(this.$appCatalogBody);

            this.$slideoutBtn = $('<button>')
                .addClass('btn btn-xs btn-default')
                .tooltip({
                    title: 'Hide / Show App Catalog',
                    container: 'body',
                    delay: {
                        show: Config.get('tooltip').showDelay,
                        hide: Config.get('tooltip').hideDelay
                    }
                })
                .append('<span class="fa fa-arrow-right"></span>')
                .click(function() {
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
                    this.trigger('hideGalleryPanelOverlay.Narrative');
                    this.trigger('toggleSidePanelOverlay.Narrative', this.$appCatalogContainer);
                    // Need to rerender (not refresh data) because in some states, the catalog browser looks to see
                    // if things are hidden or not. When this panel is hidden, then refreshed, all sections will
                    // think they have no content and nothing will display.
                    this.appCatalog.rerender();
                }.bind(this));

            this.addButton(this.$slideoutBtn);

            if (!NarrativeMethodStore || !Catalog) {
                this.showError('Sorry, an error occurred while loading Apps.',
                    'Unable to connect to the Catalog or Narrative Method Store! ' +
                    'Apps are currently unavailable.');
                return this;
            }

            this.methClient = new NarrativeMethodStore(this.options.methodStoreURL);
            this.catalog = new Catalog(this.options.catalogURL, {token: Runtime.make().authToken()});
            this.refreshFromService();
            return this;
        },

        refreshKernelSpecManager: function() {
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

        setListHeight: function(height, animate) {
            if (this.$methodList) {
                if (animate) {
                    this.$methodList.animate({ 'height': height}, this.slideTime); // slideTime comes from kbaseNarrativeControlPanel
                } else {
                    this.$methodList.css({ 'height': height});
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

        initMethodTooltip: function() {
            this.help = {};

            this.help.$helpPanel = $('<div>')
                .addClass('kb-function-help-popup alert alert-info')
                .hide()
                .click(function() {
                    this.help.$helpPanel.hide();
                }.bind(this));
            this.help.$helpTitle = $('<span>');
            this.help.$helpVersion = $('<span>')
                .addClass('version');

            var $helpHeader = $('<div>')
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
         * Returns a promise that resolves when the app is done refreshing itself.
         */
        refreshFromService: function(versionTag) {
            var self = this;
            this.showLoadingMessage('Loading available Apps...');

            var filterParams = {};
            if (versionTag) {
                filterParams['tag'] = versionTag;
                this.currentTag = versionTag;
            }

            var loadingCalls = [];
            loadingCalls.push(
                Promise.resolve(self.methClient.list_methods(filterParams))
                    .then(function(methods) {
                        self.methodSpecs = {};
                        self.methodInfo = {};
                        for (var i = 0; i < methods.length; i++) {
                        // key should have LC module name if an SDK method
                            if (methods[i].module_name) {
                                var idTokens = methods[i].id.split('/');
                                self.methodSpecs[idTokens[0].toLowerCase() + '/' + idTokens[1]] = { info: methods[i] };
                            }
                        }
                    }));

            loadingCalls.push(
                Promise.resolve(self.methClient.list_categories({}))
                    .then(function(categories) {
                        self.categories = categories[0];
                    }));

            if (!versionTag || versionTag === 'release') {
                loadingCalls.push(self.catalog.list_basic_module_info({})
                    .then(function(moduleInfoList) {
                        self.moduleVersions = {};
                        return Promise.map(moduleInfoList, function(module) {
                            if (module.dynamic_service === 0) {
                                return Promise.resolve(
                                    self.catalog.get_module_version({ module_name: module.module_name })
                                )
                                    .then(function(version) {
                                        self.moduleVersions[version.module_name] = version.version;
                                    });
                            }
                        });
                    })
                );
            }

            return Promise.all(loadingCalls)
                .then(function() {
                    return Promise.resolve(self.catalog.list_favorites(Jupyter.narrative.userId))
                        .then(function(favs) {
                            for (var k = 0; k < favs.length; k++) {
                                var fav = favs[k];
                                var lookup = fav.id;
                                if (fav.module_name_lc !== 'nms.legacy') {
                                    lookup = fav.module_name_lc + '/' + lookup;
                                }
                                if (self.methodSpecs[lookup]) {
                                    self.methodSpecs[lookup]['favorite'] = fav.timestamp; // this is when this was added as a favorite
                                }
                            }
                            self.trigger('appListUpdated.Narrative');
                        })
                        // For some reason this is throwing a Bluebird error to include this error handler, but I don't know why right now -mike
                        .catch(function(error) {
                            console.error(error);
                        })
                        .finally(function() {
                            self.parseApps(self.categories, self.methodSpecs);
                            self.showAppPanel();
                        });
                })
                .catch(function(error) {
                    console.error(error);
                    self.showError('Sorry, an error occurred while loading Apps.', error);
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
        triggerApp: function(app, tag, parameters) {
            if (Jupyter.narrative.narrController.uiModeIs('view')) {
                new BootstrapDialog({
                    type: 'warning',
                    title: 'Warning',
                    body: 'Read-only Narrative -- you may not add apps to this Narrative',
                    alertOnly: true
                }).show();
                // alert('Read-only Narrative -- may not add apps to this Narrative');
                return;
            }
            var self = this;
            if(!tag) {
                tag = self.currentTag;
            }
            if (typeof(app) === 'string') {
                var info = self.methodSpecs[app.toLowerCase()];
                if (!info) {
                    info = {
                        'info': {
                            'id': app
                        }
                    };
                }
                app = info;
            }
            if(!app['spec']) {
                Promise.resolve(self.methClient.get_method_spec({ids: [app.info.id], tag: tag}))
                    .then(function(spec) {
                        spec = spec[0];
                        if (self.moduleVersions[spec.info.module_name]) {
                            spec.info.ver = self.moduleVersions[spec.info.module_name];
                        }
                        self.trigger('appClicked.Narrative', [spec, tag, parameters]);
                    })
                    .catch(function (err) {
                        var errorId = new Uuid(4).format();
                        console.error('Error getting method spec #' + errorId, err, app, tag);
                        alert('Error getting app spec, see console for error info #' + errorId);
                    });
            } else {
                self.trigger('appClicked.Narrative', [app, tag, parameters]);
            }
        },

        /**
         * "Parses" the apps to do some preliminary filtering of ignored categories and
         * do some internal string chopping (i.e. keep an abbreviated list of objects -
         * input_types = ['KBaseGenomes.Genome', 'KBaseGenomeAnnotations.Assembly'] ->).
         *
         * Sets the renderedApps property of the widget (the set of apps to render)
         * and runs refreshPanel() when it's done.
         */
        parseApps: function(catSet, appSet) {
            var self = this;

            var shortenTypes = function(typeList) {
                var shortTypes = [];
                if (typeList) {
                    typeList.forEach(function(t) {
                        if (t.indexOf('.') !== -1) {
                            shortTypes.push(t.split('.')[1]);
                        }
                    });
                }
                return shortTypes;
            };

            this.catSet = catSet;
            this.renderedApps = {};
            for (var app in appSet) {
                if (!appSet.hasOwnProperty(app)) {
                    continue;
                }
                // skip this if its to be ignored.
                var ignoreFlag = false;
                for (var i = 0; i < appSet[app].info.categories.length; i++) {
                    if (self.ignoreCategories[appSet[app].info.categories[i]]) {
                        ignoreFlag = true;
                        break;
                    }
                }
                if (ignoreFlag) {
                    continue;
                }
                // passed all the filters, now add the short version of inputs/outputs...?
                appSet[app].info.short_input_types = shortenTypes(appSet[app].info.input_types);
                appSet[app].info.short_output_types = shortenTypes(appSet[app].info.output_types);
                this.renderedApps[app] = appSet[app];
            }
            this.refreshPanel();
        },

        categorizeApps: function(style, appSet) {

            // previously, categories had the first letter of each word uppercased as part of display.
            // now they're uppercased while the cats are built, to map similar cats to the same keyed
            // display name (e.g. "metabolic_modeling" and "metabolic modeling" both go to "Metabolic Modeling")
            // but 'uncategorized' is a hardwired special case. I opted to break it out into a constant defined
            // here instead of use an upper case string as the key throughout later on.
            var UNCATEGORIZED = 'Uncategorized';

            var allCategories = {
                favorites: []
            };
            allCategories[UNCATEGORIZED] = [];  //my kingdom for es6 syntax

            Object.keys(appSet).forEach(function(appId) {
                var categoryList = [];
                switch (style) {
                case 'input':
                    categoryList = appSet[appId].info.input_types.map(function(input) {
                        if (input.indexOf('.') !== -1) {
                            return input.split('.')[1];
                        }
                        else {
                            return input;
                        }
                    });
                    break;
                case 'output':
                    categoryList = appSet[appId].info.output_types.map(function(output) {
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
                    categoryList = appSet[appId].info.categories;
                    var activeIndex = categoryList.indexOf('active');
                    if (activeIndex !== -1) {
                        categoryList.splice(activeIndex, 1);
                    }
                    break;
                }
                if (categoryList.length === 0) {
                    allCategories[UNCATEGORIZED].push(appId);
                }
                categoryList.forEach(function(cat) {
                    cat = Categories.categories[cat] || cat;
                    cat = cat.replace('_', ' ')
                        .replace(/\w\S*/g, function(txt) {
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
            Object.keys(allCategories).forEach(function(cat) {
                allCategories[cat] = allCategories[cat].filter(function(el, index, arr) {
                    return index === arr.indexOf(el);
                });
                allCategories[cat].sort(function(a, b) {
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

        refreshPanel: function() {
            var panelStyle = this.currentPanelStyle,
                filterString = this.bsSearch.val(),
                appSet = this.renderedApps,
                self = this,
                $appPanel = $('<div>');

            var buildFlatPanel = function(ascending) {
                var appList = Object.keys(appSet);
                appList.sort(function(a, b) {
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
                for (var i=0; i<appList.length; i++) {
                    $appPanel.append(self.buildAppItem(appSet[appList[i]]));
                }
            };

            var buildSingleAccordion = function(category, appList) {
                var $accordionBody = $('<div>');
                appList.forEach(function(appId) {
                    $accordionBody.append(self.buildAppItem(appSet[appId]));
                });

                return {
                    title: category + ' <span class="label label-info pull-right" style="padding-top:0.4em">' + appList.length + '</span>',
                    body: $accordionBody
                };
            };

            var assembleAccordion = function(accordion) {
                var $body = accordion.body;
                var $toggle = $('<span class="fa fa-chevron-right">')
                    .css({
                        'padding-right': '3px'
                    });
                var $header = $('<div class="row">')
                    .css({
                        cursor: 'pointer',
                        'font-size': '1.1em',
                        'font-weight': 'bold',
                        padding: '3px 0',
                        'border-bottom': '1px solid #eee'
                    })
                    .append($toggle)
                    .append(accordion.title)
                    .click(function() {
                        if ($toggle.hasClass('fa-chevron-right')) {
                            $body.slideDown('fast', function() {
                                $toggle.removeClass('fa-chevron-right')
                                    .addClass('fa-chevron-down');
                            });
                        } else {
                            $body.slideUp('fast', function() {
                                $toggle.removeClass('fa-chevron-down')
                                    .addClass('fa-chevron-right');
                            });
                        }
                    });
                return $('<div>').append($header).append($body.hide());
            };

            var withCategories = function(a,b) {
                var catA = (Categories.categories[a] || a).toLowerCase();
                var catB = (Categories.categories[b] || b).toLowerCase();
                if (catA < catB) { return -1; }
                else if (catA > catB) { return  1; }
                else                  { return  0; }
            };

            var buildAccordionPanel = function(style) {
                /* first, get elements in order like this:
                 * { category1: [ appId1, appId2, appId3, ...]}
                 */
                var categorySet = self.categorizeApps(style, appSet);
                var accordionList = [];
                Object.keys(categorySet).sort(withCategories).forEach(function(cat) {
                    if (cat === 'favorites') {
                        return;
                    }
                    accordionList.push(buildSingleAccordion(cat, categorySet[cat]));
                });
                if (categorySet.favorites) {
                    accordionList.unshift(buildSingleAccordion('My Favorites', categorySet.favorites));
                }
                accordionList.forEach(function(accordion) {
                    $appPanel.append(assembleAccordion(accordion));
                });
            };

            // 1. Go through filterString and keep those that pass the filter (not yet).
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
        filterApps: function(filterString, appSet) {
            if (!filterString) {
                return appSet;
            }
            var filterType = 'name';
            filterString = filterString.toLowerCase();
            var filter = filterString.split(':');
            if (filter.length === 2) {
                if (['in_type', 'out_type', 'input', 'output'].indexOf(filter[0]) !== -1) {
                    filterType = filter[0];
                    filterString = filter[1];
                }
            }
            var filteredIds = Object.keys(appSet);
            filteredIds = Object.keys(appSet).filter(function(id) {
                var searchSet;
                var app = appSet[id];
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
                        app.info.output_types.join(';')
                    ].join(';').toLowerCase().indexOf(filterString) !== -1;
                }
                var lowerSearchSet = searchSet.map(function(val) { return val.toLowerCase(); });
                return lowerSearchSet.indexOf(filterString) !== -1;
            });
            var filteredSet = {};
            filteredIds.forEach(function(id) {
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
        buildAppItem: function(app) {
            /**
             app.info:
                authors:["rsutormin"], categories:["annotation"], icon:{url:}, id: str,
                input_types: ['KbaseGenomeAnnotations.Assembly'], module_name: str,
                name: str, namespace: str, output_types:["KBaseGenomes.Genome"],
                subtitle: str, tooltip: str, ver: str
             *
            */
            var self = this;

            var moreLink = '';
            if(app.info.module_name) {
                moreLink = this.options.methodHelpLink + app.info.id + '/' + this.currentTag;
            } else {
                moreLink = this.options.methodHelpLink + 'l.m/' + app.info.id;
            }
            var $more = $('<div>')
                .addClass('kb-method-list-more-div');

            if (self.currentTag && self.currentTag !== 'release') {
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

            var $card = kbaseAppCard.apply(this, [
                {
                    createdBy:false,
                    moreContent: $more,
                    max_name_length: 50,
                    self: self,
                    app: app,
                }]);

            //custome click functions;
            $card.find('.narrative-card-logo , .kb-data-list-name').click(function (e) {
                e.stopPropagation();
                self.triggerApp(app);
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
        getFunctionSpecs: function(specSet, callback) {
            var results = {};
            if (specSet.methods && specSet.methods instanceof Array) {
                results.methods = {};
                // we need to fetch some methods, so don't
                Promise.resolve(this.methClient.get_method_spec({ ids: specSet.methods, tag: this.currentTag }))
                    .then(function(specs) {
                        for (var k = 0; k < specs.length; k++) {
                            results.methods[specs[k].info.id] = specs[k];
                        }
                        callback(results);
                    })
                    .catch(function(err) {

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
        showLoadingMessage: function(message) {
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
        showAppPanel: function() {
            this.$errorPanel.hide();
            this.$loadingPanel.hide();
            this.$functionPanel.show();
        },

        /**
         * Shows an error text message on top of the panel. All other pieces are hidden.
         * @param {string} error - the text of the error message
         * @private
         */
        showError: function(title, error) {
            this.$errorPanel.empty().append(DisplayUtil.createError(title, error));
            this.$functionPanel.hide();
            this.$loadingPanel.hide();
            this.$errorPanel.show();
            return;
        },

        toggleOverlay: function() {
            this.trigger('toggleSidePanelOverlay.Narrative');
        }
    });
});
