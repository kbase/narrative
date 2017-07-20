/*global define*/
/*jslint white: true*/
/**
 * A widget that contains functions and function information for the Narrative.
 * When initialized, it uses a loading gif while waiting for functions to load
 * (unless functions were passed in on construction).
 *
 * @author Bill Riehl <wjriehl@lbl.gov>
 * @public
 */
define ([
    'kbwidget',
    'jquery',
    'bluebird',
    'handlebars',
    'narrativeConfig',
    'util/display',
    'util/bootstrapDialog',
    'util/icon',
    'text!kbase/templates/beta_warning_body.html',
    'kbaseAccordion',
    'kbaseNarrativeControlPanel',
    'base/js/namespace',
    'kb_service/client/narrativeMethodStore',
    'uuid',
    'narrative_core/catalog/kbaseCatalogBrowser',
    'kbaseNarrative',
    'catalog-client-api',
    'kbase-client-api',
    'bootstrap'
], function (
    KBWidget,
    $,
    Promise,
    Handlebars,
    Config,
    DisplayUtil,
    BootstrapDialog,
    Icon,
    BetaWarningTemplate,
    kbaseAccordion,
    kbaseNarrativeControlPanel,
    Jupyter,
    NarrativeMethodStore,
    Uuid,
    KBaseCatalogBrowser
) {
    'use strict';
    return KBWidget({
        name: 'kbaseNarrativeAppPanel',
        parent : kbaseNarrativeControlPanel,
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
            inactive : 1,
            importers : 1,
            viewers : 1
        },
        id2Elem: {},
        methodSpecs: {},  // id -> spec
        categories: {},   // id -> category info

        currentTag: null, // release/dev/beta; which version of the method spec to fetch.  default is release

        /**
         * This private method is automatically called when the widget is initialized.
         *
         * Initialization steps:
         * 1. Put a loading spinner in its attached div
         * 2. Assume that the kernel is loaded before this is inited. //Check if the kernel is loaded - wait until it is.
         * 3. Make a kernel call to get the set of available services and functions.
         * 4. Shuffle the available functions into the right format.
         * 5. Display them on the screen, bind events.
         * @param {object} options
         * @private
         */
        init: function(options) {
            var self = this;
            this._super(options);
            // DOM structure setup here.
            // After this, just need to update the function list

            this.currentTag = 'release';

            this.icon_colors = Config.get('icons').colors;

            this.$searchDiv = $('<div>')
                             .addClass('input-group')
                             .css({'margin-bottom' : '3px'})
                             .hide();

            this.$searchInput = $('<input type="text">')
                                .addClass('form-control')
                                .attr('Placeholder', 'Search apps')
                                .on('input', function() {
                                    self.refreshPanel(this);
                                })
                                .on('keyup', function (e) {
                                    if (e.keyCode === 27) {
                                        self.$searchDiv.toggle({effect: 'blind', duration: 'fast'});
                                    }
                                });

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

            var $clearSearchBtn = $('<span>')
                                  .addClass('input-group-addon btn btn-default kb-method-search-clear')
                                  .attr('type', 'button')
                                  .append($('<span class="glyphicon glyphicon-remove">'))
                                  .click(
                                    $.proxy(function() {
                                        this.$searchInput.val('');
                                        this.$searchInput.trigger('input');
                                    }, this)
                                  );

            this.$searchDiv.append(this.$searchInput)
                           .append($clearSearchBtn);

            // placeholder for apps and methods once they're loaded.
            this.$methodList = $('<div>')
                               .css({
                                   'height' : '300px',
                                   'overflow-y' : 'auto',
                                   'overflow-x' : 'hidden'});
            // Make a function panel for everything to sit inside.
            this.$functionPanel = $('<div>')
                                  .addClass('kb-function-body')
                                  .append($('<div>')
                                          .append(this.$searchDiv)
                                          .append(this.$toggleHiddenDiv))
                                  .append(this.$methodList);

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

            $(document).on('filterMethods.Narrative',
                $.proxy(function(e, filterString) {
                    if (filterString) {
                        this.$searchDiv.show({effect: 'blind', duration: 'fast'});
                        this.$searchInput.val(filterString);
                        this.$searchInput.trigger('input');
                    }
                }, this)
            );

            $(document).on('removeFilterMethods.Narrative',
                $.proxy(function() {
                    this.$searchDiv.toggle({effect: 'blind', duration: 'fast'});
                    this.$searchInput.val('');
                    this.$searchInput.trigger('input');
                }, this)
            );

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
                               this.$searchDiv.toggle({effect: 'blind', duration: 'fast'});
                               this.$searchInput.focus();
                           }.bind(this)));

            // Refresh button
            this.addButton($('<button>')
                           .addClass('btn btn-xs btn-default')
                           .append('<span class="glyphicon glyphicon-refresh">')
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
                               if(this.versionState === 'B') { versionTag='beta'; }
                               else if(this.versionState === 'D') { versionTag='dev'; }
                               this.refreshFromService(versionTag);
                               this.refreshKernelSpecManager();

                               if(this.appCatalog) {
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
                buttons: [ $('<button class="btn btn-primary" data-dismiss="modal">OK</button>') ],
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
                }
                else if (this.versionState === 'B') {
                    if (devMode) {
                        this.versionState = 'D';
                        versionTag = 'dev';
                    }
                    else {
                        this.versionState = 'R';
                        versionTag = 'release';
                    }
                }
                else if (this.versionState === 'D') {
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
                                          .css({'width':'100%'})
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
                    if(!this.appCatalog) {
                        this.appCatalog = new KBaseCatalogBrowser(
                            this.$appCatalogBody,
                            {
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
            this.catalog = new Catalog(this.options.catalogURL, {token: Jupyter.narrative.authToken});
            this.refreshFromService();
            return this;
        },

        refreshKernelSpecManager: function() {
            try {
                Jupyter.notebook.kernel.execute(
                    'from biokbase.narrative.jobs.specmanager import SpecManager\n' +
                    'SpecManager().reload()'
                );
            }
            catch (e) {
                alert(e);
                console.error(e);
            }
        },

        setListHeight: function(height, animate) {
            if(this.$methodList) {
                if(animate) {
                    this.$methodList.animate({'height':height}, this.slideTime); // slideTime comes from kbaseNarrativeControlPanel
                }
                else {
                    this.$methodList.css({'height':height});
                }
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
                        for (var i=0; i<methods.length; i++) {
                            // key should have LC module name if an SDK method
                            if (methods[i].module_name) {
                                var idTokens = methods[i].id.split('/');
                                self.methodSpecs[idTokens[0].toLowerCase() + '/' + idTokens[1]] = {info:methods[i]};
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
                                    self.catalog.get_module_version({module_name: module.module_name})
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
                            for(var k=0; k<favs.length; k++) {
                                var fav = favs[k];
                                var lookup = fav.id;
                                if(fav.module_name_lc !== 'nms.legacy') {
                                    lookup = fav.module_name_lc + '/' + lookup;
                                }
                                if(self.methodSpecs[lookup]) {
                                    self.methodSpecs[lookup]['favorite'] = fav.timestamp; // this is when this was added as a favorite
                                }
                            }
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
                    self.showError('Sorry, an error occurred while loading Apps.', error);
                });
        },

        triggerMethod: function(method) {
            var self = this;
            if(!method['spec']) {
                self.methClient.get_method_spec({ids:[method.info.id], tag:self.currentTag})
                    .then(function(spec) {
                        // todo: cache this spec into the methods list
                        spec = spec[0];
                        if (self.moduleVersions[spec.info.module_name]) {
                            spec.info.ver = self.moduleVersions[spec.info.module_name];
                        }
                        self.trigger('appClicked.Narrative', [spec, self.currentTag]);
                    })
                    .catch(function (err) {
                        var errorId = new Uuid(4).format();
                        console.error('Error getting method spec #' + errorId, err, method, self.currentTag);
                        alert('Error getting method spec, see console for error info #' + errorId);
                    });
            } else {
                self.trigger('appClicked.Narrative', [method, self.currentTag]);
            }
        },

        parseApps: function(catSet, appSet) {
            var self = this;

            this.catSet = catSet;
            this.renderedApps = {};
            for (var app in appSet) {
                if (!appSet.hasOwnProperty(app)) {
                    continue;
                }
                var ignoreFlag = false;
                for (var i=0; i<appSet[app].info.categories.length; i++) {
                    if (self.ignoreCategories[appSet[app].info.categories[i]]) {
                        ignoreFlag = true;
                    }
                }
                if (!ignoreFlag) {
                    this.renderedApps[app] = appSet[app];
                }
            }
            this.refreshPanel();
        },

        categorizeApps: function(style, appSet) {
            var allCategories = {
                favorites: [],
                uncategorized: []
            };
            Object.keys(appSet).forEach(function(appId) {
                var categoryList = [];
                switch(style) {
                default:
                case 'category':
                    categoryList = appSet[appId].info.categories;
                    var activeIndex = categoryList.indexOf('active');
                    if (activeIndex !== -1) {
                        categoryList.splice(activeIndex, 1);
                    }
                    break;
                case 'input':
                    categoryList = appSet[appId].info.input_types.map(function(input) {
                        return input.split('.')[1];
                    });
                    break;
                case 'output':
                    categoryList = appSet[appId].info.output_types.map(function(output) {
                        return output.split('.')[1];
                    });
                    break;
                }
                if (categoryList.length === 0) {
                    allCategories.uncategorized.push(appId);
                }
                categoryList.forEach(function(cat) {
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
            if (allCategories.uncategorized.length === 0) {
                delete allCategories['uncategorized'];
            }
            return allCategories;
        },

        refreshPanel: function() {
            var panelStyle = this.currentPanelStyle,
                filterString = this.$searchInput.val(),
                appSet = this.renderedApps,
                self = this,
                $appPanel = $('<div>');

            var buildFlatPanel = function(ascending) {
                var appList = Object.keys(appSet);
                appList.sort(function(a, b) {
                    a = appSet[a];
                    b = appSet[b];
                    if(a.favorite && b.favorite) {
                        if (ascending) {
                            return a.info.name.localeCompare(b.info.name);
                        }
                        else {
                            return b.info.name.localeCompare(a.info.name);
                        }
                    }
                    if(a.favorite) return -1;
                    if(b.favorite) return 1;

                    if (ascending) {
                        return a.info.name.localeCompare(b.info.name);
                    }
                    else {
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
                var categoryTitle = category.replace('_', ' ')
                    .replace(/\w\S*/g, function(txt) {
                        return txt.charAt(0).toUpperCase() + txt.substr(1);
                    });
                return {
                    title: categoryTitle + ' <span class="label label-info pull-right" style="padding-top:0.4em">' + appList.length + '</span>',
                    body: $accordionBody
                };
            };

            var assembleAccordion = function(accordion) {
                var $body = accordion.body;
                var $toggle = $('<span class="glyphicon glyphicon-chevron-right">')
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
                        if ($toggle.hasClass('glyphicon-chevron-right')) {
                            $body.slideDown('fast', function() {
                                $toggle.removeClass('glyphicon-chevron-right')
                                       .addClass('glyphicon-chevron-down');
                            });
                        } else {
                            $body.slideUp('fast', function() {
                                $toggle.removeClass('glyphicon-chevron-down')
                                       .addClass('glyphicon-chevron-right');
                            });
                        }
                    });
                return $('<div>').append($header).append($body.hide());
            };

            var buildAccordionPanel = function(style) {
                /* first, get elements in order like this:
                 * { category1: [ appId1, appId2, appId3, ...]}
                 */
                var categorySet = self.categorizeApps(style, appSet);
                var accordionList = [];
                Object.keys(categorySet).sort().forEach(function(cat) {
                    if (cat === 'favorites') {
                        return;
                    }
                    accordionList.push(buildSingleAccordion(cat, categorySet[cat]));
                });
                if (categorySet.favorites) {
                    accordionList.unshift(buildSingleAccordion('my favorites', categorySet.favorites));
                }
                accordionList.forEach(function(accordion) {
                    $appPanel.append(assembleAccordion(accordion));
                });
            };

            // 1. Go through filterString and keep those that pass the filter (not yet).

            appSet = this.filterApps(filterString, appSet);

            // 2. Switch over panelStyle and build the view based on that.
            switch(panelStyle) {
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
         * The string is applied to app names (to start)
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
                if (filter[0] === 'in_type' || filter[1] === 'out_type') {
                    filterType = filter[0];
                    filterString = filter[1];
                }
            }
            var filteredIds = Object.keys(appSet);
            filteredIds = Object.keys(appSet).filter(function(id) {
                switch(filterType) {
                case 'in_type':
                    var inputTypes = appSet[id].info.input_types;
                    return inputTypes.join().toLowerCase().indexOf(filterString) !== -1;
                case 'out_type':
                    var outputTypes = appSet[id].info.output_types;
                    return outputTypes.join().toLowerCase().indexOf(filterString) !== -1;
                default:
                    return appSet[id].info.name.toLowerCase().indexOf(filterString) !== -1;
                }
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
            var self = this;
            // add icon (logo)
            var $logo = $('<div>');

            if (app.info.icon && app.info.icon.url) {
                var url = this.options.methodStoreURL.slice(0, -3) + app.info.icon.url;
                $logo.append( DisplayUtil.getAppIcon({ url: url , cursor: 'pointer' , setColor:true, size:'50px'}) )
                    .css('padding', '3px');
            } else {
                $logo.append( DisplayUtil.getAppIcon({ cursor: 'pointer' , setColor:true}) );
            }
            // add behavior
            $logo.click(function(e) {
                e.stopPropagation();
                self.triggerMethod(app);
            });

            var $star = $('<i>');
            if(app.favorite) {
                $star.addClass('fa fa-star kbcb-star-favorite').append('&nbsp;');
            } else {
                $star.addClass('fa fa-star kbcb-star-nonfavorite').append('&nbsp;');
            }
            $star.on('click', function(event) {
                event.stopPropagation();
                var params = {};
                if(app.info.module_name) {
                    params['module_name'] = app.info.module_name;
                    params['id'] = app.info.id.split('/')[1];
                } else {
                    params['id'] = app.info.id;
                }

                if(app.favorite) {
                    // remove favorite
                    Promise.resolve(self.catalog.remove_favorite(params))
                    .then(function() {
                        $star.removeClass('kbcb-star-favorite').addClass('kbcb-star-nonfavorite');
                        app.favorite = null; // important to set this if we don't refresh the panel
                    })
                    .catch(function(error) {
                        console.error(error);
                    });
                } else {
                    // add favorite
                    Promise.resolve(self.catalog.add_favorite(params))
                    .then(function() {
                        $star.removeClass('kbcb-star-nonfavorite').addClass('kbcb-star-favorite');
                        app.favorite = new Date().getTime(); // important to set this if we don't refresh the panel
                    })
                    .catch(function(error) {
                        console.error(error);
                    });
                }
            })
            .tooltip({
                title: 'Add or remove from your favorites',
                container: 'body',
                placement: 'bottom',
                delay: {
                    show: Config.get('tooltip').showDelay,
                    hide: Config.get('tooltip').hideDelay
                }
            });

            var $name = $('<div>')
                        .addClass('kb-data-list-name')
                        .css({'white-space':'normal', 'cursor':'pointer'})
                        .append($('<a>')
                                .append(app.info.name)
                                .click(function(e) {
                                    e.stopPropagation();
                                    self.triggerMethod(app);
                                }));
            var versionStr = 'v'+app.info.ver; // note that app versions are meaningless right now; need to update!
            if (app.info.module_name) {
                versionStr = '<a href="'+this.options.moduleLink+'/'+app.info.module_name+'" target="_blank">' +
                                app.info.namespace + '</a> ' + versionStr;
            }
            var $version = $('<span>').addClass('kb-data-list-type').append($star).append(versionStr); // use type because it is a new line

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

            var $moreBtn =
                    $('<button class="btn btn-xs btn-default pull-right" aria-hidden="true">')
                        .append($('<span>')
                                    .addClass('fa fa-ellipsis-h')
                                    .css({'color' : '#999'}));

            var $mainDiv = $('<div>')
                           .addClass('kb-data-list-info')
                           .css({ padding:'0', margin:'0'})
                           .append($name)
                           .append($('<div>')
                                   .append($version)
                                   .append($moreBtn.hide()));

            var $newMethod = $('<table>')
                             .css({'width':'100%'})
                             .append($('<tr>')
                                     .append($('<td>')
                                             .css({'width':'15%'})
                                             .append($logo))
                                     .append($('<td>')
                                             .css({'width':'70%'})
                                             .append($mainDiv))
                                     .append($('<td>')
                                             .css({'width':'15%'})
                                             .append($moreBtn.hide())));

            return $('<div>')
                   .append($('<hr>').addClass('kb-data-list-row-hr').css({'margin-left':'65px'}))
                   .append($('<div>')
                           .addClass('kb-data-list-obj-row')
                           .append($newMethod)
                           .append($more.hide())
                           .mouseenter(function() {
                               $moreBtn.show();
                           })
                           .mouseleave(function() { $moreBtn.hide(); })
                           .click(function() {
                               $more.slideToggle('fast');
                           }
                       ));

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
                Promise.resolve(this.methClient.get_method_spec({ids: specSet.methods, tag:this.currentTag}))
                    .then(function(specs){
                        for(var k=0; k<specs.length; k++) {
                            results.methods[specs[k].info.id] = specs[k];
                        }
                        callback(results);
                    })
                    .catch(function(err) {
                        console.error("Error in method panel on 'getFunctionSpecs' when contacting NMS");
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
