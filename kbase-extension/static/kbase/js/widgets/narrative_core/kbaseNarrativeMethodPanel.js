/*global define*/
/*jslint white: true*/
/**
 * A widget that contains functions and function information for the Narrative.
 * When initialized, it uses a loading gif while waiting for functions to load
 * (unless functions were passed in on construction).
 *
 * Each function is presented in a list (for now - accordion may be coming soon)
 * and when clicked will fire a "methodClicked.narrative" event.
 *
 * @author Bill Riehl <wjriehl@lbl.gov>
 * @public
 */
define([
        'jquery', 
        'underscore',
        'bluebird',
        'handlebars',
        'narrativeConfig',
        'util/display',
        'util/bootstrapDialog',
        'text!kbase/templates/beta_warning_body.html',
        'kbwidget',
        'kbaseAccordion',
        'kbaseNarrativeControlPanel',
        'narrative_core/catalog/kbaseCatalogBrowser',
        'kbaseNarrative',
        'catalog-client-api',
        'kbase-client-api',
        'bootstrap'], 
function ($, 
          _,
          Promise,
          Handlebars,
          Config,
          DisplayUtil,
          BootstrapDialog,
          BetaWarningTemplate) {
    'use strict';
    $.KBWidget({
        name: 'kbaseNarrativeMethodPanel',
        parent: 'kbaseNarrativeControlPanel',
        version: '0.0.1',
        options: {
            loadingImage: Config.get('loading_gif'),
            autopopulate: true,
            title: 'Apps & Methods',
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
        appSpecs: {},     // id -> spec
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
            this._super(options);
            var self = this;
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
                                .attr('Placeholder', 'Search methods')
                                .on('input',
                                    $.proxy(function(e) {
                                        this.filterList();
                                    }, this)
                                )
                                .on('focus',
                                    function() {
                                        if (Jupyter && Jupyter.narrative) {
                                            Jupyter.narrative.disableKeyboardManager();
                                        }
                                    }
                                )
                                .on('blur',
                                    function() {
                                        if (Jupyter && Jupyter.narrative) {
                                            Jupyter.narrative.enableKeyboardManager();
                                        }
                                    }
                                );

            this.$searchInput.on('keyup', function (e) {
                if (e.keyCode == 27) {
                    this.$searchDiv.toggle({effect: 'blind', duration: 'fast'});
                }
            }.bind(this));

            this.$numHiddenSpan = $('<span>0</span>');
            this.$showHideSpan = $('<span>show</span>');
            this.$toggleHiddenDiv = $('<div>')
                                    .append(this.$showHideSpan)
                                    .append(' ')
                                    .append(this.$numHiddenSpan)
                                    .append(' filtered out')
                                    .addClass('kb-function-toggle')
                                    .hide()
                                    .click($.proxy(function(e) {
                                        var curText = this.$showHideSpan.text();
                                        this.toggleHiddenMethods(curText === 'show');
                                        this.$showHideSpan.text(curText === 'show' ? 'hide' : 'show');
                                    }, this));

            var $clearSearchBtn = $('<span>')
                                  .addClass('input-group-addon btn btn-default kb-method-search-clear')
                                  .attr('type', 'button')
                                  .append($('<span class="glyphicon glyphicon-remove">'))
                                  .click(
                                    $.proxy(function(event) {
                                        this.$searchInput.val('');
                                        this.$searchInput.trigger('input');
                                    }, this)
                                  );

            this.$searchDiv.append(this.$searchInput)
                           .append($clearSearchBtn);

            // placeholder for apps and methods once they're loaded.
            this.$methodList = $('<div>')
                               .css({'height' : '300px', 'overflow-y': 'auto', 'overflow-x' : 'hidden'});
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
                               .addClass('kb-error')
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
                $.proxy(function(e) {
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



            // Search button
            this.addButton($('<button>')
                           .addClass('btn btn-xs btn-default')
                           .append('<span class="fa fa-search"></span>')
                           .tooltip({
                                title: 'Search for Apps & Methods',
                                container: 'body',
                                delay: { 
                                    show: Config.get('tooltip').showDelay, 
                                    hide: Config.get('tooltip').hideDelay
                                }
                            })
                           .click(function(event) {
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
                           .click(function(e) {
                                var versionTag = 'release';
                                if(this.versionState=='B') { versionTag='beta'; }
                                else if(this.versionState=='D') { versionTag='dev'; }
                                this.refreshFromService(versionTag);

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

            this.$toggleVersionBtn.click(function(e) {
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
                .click(function(event) {
                    // only load the appCatalog on click
                    if(!this.appCatalog) {
                        this.appCatalog = this.$appCatalogBody.KBaseCatalogBrowser({ignoreCategories:this.ignoreCategories});
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
                this.showError('Unable to connect to the Catalog or NMS!');
                return this;
            }

            this.methClient = new NarrativeMethodStore(this.options.methodStoreURL);
            this.catalog = new Catalog(this.options.catalogURL, { token: this.auth().token });

            if (this.options.autopopulate === true) {
                this.refresh();
            }

            return this;
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

        filterList: function() {
            var txt = this.$searchInput.val().trim().toLowerCase();
            if (txt.indexOf("type:") === 0) {
                this.visualFilter(this.objectTypeFilter, txt.substring(5));
            }
            else if (txt.indexOf("in_type:") === 0) {
                this.visualFilter(this.inputTypeFilter, txt.substring(8));
            }
            else if (txt.indexOf("out_type:") === 0) {
                this.visualFilter(this.outputTypeFilter, txt.substring(9));
            }
            else {
                this.visualFilter(this.textFilter, txt);
            }
        },



        initMethodTooltip: function() {
            this.help = {};

            this.help.$helpPanel = $('<div>')
                                   .addClass('kb-function-help-popup alert alert-info')
                                   .hide()
                                   .click($.proxy(function(event) { this.help.$helpPanel.hide(); }, this));
            this.help.$helpTitle = $('<span>');
            this.help.$helpVersion = $('<span>')
                                   .addClass('version');

            var $helpHeader = $('<div>')
                              //.addClass('header')
                              .append(
                                    $('<h1>')
                                      .css("display","inline")
                                      .css("padding-right","8px")
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
         * Shows a popup panel with a description of the clicked method.
         * @param {object} method - the method containing a title and
         * description for populating the popup.
         * @private
         */
        // showTooltip: function(method, event) {
        //     this.help.$helpTitle.text(method.name);
        //     this.help.$helpVersion.text('v' + method.ver);
        //     this.help.$helpBody.html(method.tooltip);
        //     this.help.$helpLinkout.attr('href', this.options.methodHelpLink + method.id);
        //     this.help.$helpPanel.css({
        //                                'left':event.pageX,
        //                                'top':event.pageY
        //                              })
        //                         .show();
        // },

        // showErrorTooltip: function(method, event) {
        //     this.showTooltip({
        //         'name' : method.name,
        //         'ver' : method.ver,
        //         'id' : method.id,
        //         'tooltip' : "This method has an internal error and cannot currently be used.<br><br>The detailed error message is:<br>"+method.loading_error
        //     }, event);
        // },

        refreshFromService: function(versionTag) {
            var self = this;
            this.showLoadingMessage("Loading KBase Methods from service...");

            var filterParams = {};
            if (versionTag) {
                filterParams['tag'] = versionTag;
                this.currentTag = versionTag;
            }

            var loadingCalls = [];
            loadingCalls.push(self.methClient.list_methods(filterParams)
                                .then(function(methods) {
                                    self.methodSpecs = {};
                                    self.methodInfo = {};
                                    for (var i=0; i<methods.length; i++) {
                                        // key should have LC module name if an SDK method
                                        if(methods[i].module_name) {
                                            var idTokens = methods[i].id.split('/');
                                            self.methodSpecs[idTokens[0].toLowerCase() + '/' + idTokens[1]] = {info:methods[i]};
                                        } else {
                                            self.methodSpecs[methods[i].id] = {info:methods[i]};
                                        }
                                    }
                                }));

            loadingCalls.push(self.methClient.list_apps_spec({})
                                .then(function(apps) {
                                    self.appSpecs = {};
                                    for (var i=0; i<apps.length; i++) {
                                        self.appSpecs[apps[i].info.id] = apps[i];
                                    }
                                }));
            loadingCalls.push(self.methClient.list_categories({})
                                .then(function(categories) {
                                    self.categories = categories[0];
                                }));

            Promise.all(loadingCalls)
                .then(function() {
                    return self.catalog.list_favorites(self.auth().user_id)
                                .then(function(favs) {
                                    for(var k=0; k<favs.length; k++) {
                                        var fav = favs[k];
                                        var lookup = fav.id;
                                        if(fav.module_name_lc != 'nms.legacy') {
                                            lookup = fav.module_name_lc + '/' + lookup
                                        }
                                        if(self.methodSpecs[lookup]) {
                                            self.methodSpecs[lookup]['favorite'] = fav.timestamp; // this is when this was added as a favorite
                                        }
                                    }
                                    self.parseMethodsAndApps(self.categories, self.methodSpecs, self.appSpecs);
                                    self.showFunctionPanel();
                                    self.filterList(); // keep the filters
                                })
                                /* For some reason this is throwing a Bluebird error to include this error handler, but I don't know why right now -mike
                                .catch(function(error) {
                                    console.log('error getting favorites, but probably we can still try and proceed')
                                    self.parseMethodsAndApps(self.categories, self.methodSpecs, self.appSpecs);
                                    self.showFunctionPanel();
                                    self.filterList(); // keep the filters
                                });*/
                })
                .catch(function(error) {
                    console.log("error'd!")
                    console.log(error);
                    self.showError(error);
                });
        },

        parseMethodsAndApps: function(catSet, methSet, appSet) {
            var self = this;
            var triggerMethod = function(method) {
                if(!method['spec']) {
                    self.methClient.get_method_spec({ids:[method.info.id],tag:self.currentTag})
                        .then(function(spec){
                            // todo: cache this sped into the methods list
                            self.trigger('methodClicked.Narrative', spec);
                        });
                } else {
                    self.trigger('methodClicked.Narrative', method);
                }
            };

            var triggerApp = function(app) {
                self.trigger('appClicked.Narrative', app);
            };

            var generatePanel = function(catSet, fnSet, icon, callback) {
                var $fnPanel = $('<div>');
                var fnList = [];
                var id2Elem = {};
                for (var fn in fnSet) {
                    var ignoreFlag = false;
                    for (var i=0; i<fnSet[fn].info.categories.length; i++) {
                        if (self.ignoreCategories[fnSet[fn].info.categories[i]]) {
                            ignoreFlag = true;
                        }
                    }

                    if (ignoreFlag)
                        delete fnSet[fn];
                    else
                        fnList.push(fnSet[fn]);
                }
                fnList.sort(function(a, b) {
                    if(a.favorite && b.favorite) {
                        if(a.favorite<b.favorite) return 1;
                        if(a.favorite>b.favorite) return -1;
                    }
                    if(a.favorite) return -1;
                    if(b.favorite) return 1;

                    return a.info.name.localeCompare(b.info.name);
                });
                for (var i=0; i<fnList.length; i++) {
                    var $fnElem = self.buildMethod(icon, fnList[i], callback);
                    $fnPanel.append($fnElem);
                    // need the module name IDs to be lower case in the lookup table
                    var id = fnList[i].info.id;
                    if(fnList[i].info.module_name) {
                        var idTokens = fnList[i].info.id.split('/');
                        id = idTokens[0].toLowerCase() + '/' + idTokens[1];
                    }
                    id2Elem[id] = $fnElem;
                }
                return [$fnPanel, id2Elem];
            };

            this.methodSet = {};
            var methodRender = generatePanel(catSet, methSet, 'M', triggerMethod);
            var $methodPanel = methodRender[0];
            this.id2Elem['method'] = methodRender[1];

            var appRender = generatePanel(catSet, appSet, 'A', triggerApp);
            var $appPanel = appRender[0];
            this.id2Elem['app'] = appRender[1];

            this.$methodList.empty().append($methodPanel).append($appPanel);
            //console.log([Object.keys(this.appSpecs).length, Object.keys(this.methodSpecs).length]);
        },

        /**
         * Creates and returns a list item containing info about the given narrative function.
         * Clicking the function anywhere outside the help (?) button will trigger a
         * methodClicked.Narrative event. Clicking the help (?) button will trigger a
         * function_help.Narrative event.
         *
         * Both events have the relevant data passed along with them for use by the responding
         * element.
         * @param {object} method - the method object returned from the kernel.
         * @private
         */
        buildMethod: function(icon, method, triggerFn) {
            var self = this;
            // add icon (logo)
            var $logo = $('<div>');

            if(icon=='A') {
                $logo.append( DisplayUtil.getAppIcon({ isApp: true , cursor: 'pointer', setColor:true }) );
            } else {
                if(method.info.icon && method.info.icon.url) {
                    var url = this.options.methodStoreURL.slice(0, -3) + method.info.icon.url;
                    $logo.append( DisplayUtil.getAppIcon({ url: url , cursor: 'pointer' , setColor:true, size:'50px'}) )
                        .css('padding', '3px');
                } else {
                    $logo.append( DisplayUtil.getAppIcon({ cursor: 'pointer' , setColor:true}) );
                }
            }
            // add behavior
            $logo.click($.proxy(
                function(e) {
                    e.stopPropagation();
                    triggerFn(method);
                }, this));

            var $star = $('<i>');
            if(icon=='M') {
                if(method.favorite) {
                    $star.addClass('fa fa-star kbcb-star-favorite').append('&nbsp;')
                } else {
                    $star.addClass('fa fa-star kbcb-star-nonfavorite').append('&nbsp;');
                }
                $star.on('click', function(event) {
                    event.stopPropagation();
                    var params = {};
                    if(method.info.module_name) {
                        params['module_name'] = method.info.module_name;
                        params['id'] = method.info.id.split('/')[1]
                    } else {
                        params['id'] = method.info.id;
                    }

                    if(method.favorite) {
                        // remove favorite
                        self.catalog.remove_favorite(params)
                            .then(function() {
                                $star.removeClass('kbcb-star-favorite').addClass('kbcb-star-nonfavorite');
                                method.favorite = null; // important to set this if we don't refresh the panel
                            });
                    } else {
                        // add favorite
                        self.catalog.add_favorite(params)
                            .then(function() {
                                $star.removeClass('kbcb-star-nonfavorite').addClass('kbcb-star-favorite');
                                method.favorite =  new Date().getTime(); // important to set this if we don't refresh the panel
                            });
                    }
                    //refresh?
                    //self.refreshFromService(self.currentTag);
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
            }

            var $name = $('<div>')
                        .addClass('kb-data-list-name')
                        .css({'white-space':'normal', 'cursor':'pointer'})
                        .append($('<a>').append(method.info.name)
                                    .click($.proxy(function(e) {
                                        e.stopPropagation();
                                        triggerFn(method);
                                    }, this)));
            var versionStr = 'v'+method.info.ver; // note that method versions are meaningless right now; need to update!
            if (method.info.module_name) {
                versionStr = '<a href="'+this.options.moduleLink+'/'+method.info.module_name+'" target="_blank">' + 
                                method.info.namespace + '</a> ' + versionStr;
            }
            var $version = $('<span>').addClass("kb-data-list-type").append($star).append(versionStr); // use type because it is a new line

            var moreLink = '';
            if(icon==='M') {
                if(method.info.module_name) {
                    moreLink = this.options.methodHelpLink + method.info.id + '/' + this.currentTag;
                } else {
                    moreLink = this.options.methodHelpLink + 'l.m/' + method.info.id;
                }
            } else if(icon==='A') {
                moreLink = this.options.appHelpLink + method.info.id;
            }
            var $more = $('<div>')
                        .addClass('kb-method-list-more-div')
                        .append($('<div>')
                                .append(method.info.subtitle))
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
                           } ));

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
            //console.debug("getFunctionSpecs(specSet=",specSet,")");
            var results = {};
            // handle legacy apps; we already have the specs
            if (specSet.apps && specSet.apps instanceof Array) {
                results.apps = {};
                for (var i=0; i<specSet.apps.length; i++) {
                    if (this.appSpecs[specSet.apps[i]])
                        results.apps[specSet.apps[i]] = this.appSpecs[specSet.apps[i]];
                }
            }
            // handle methods, we now have to fetch the specs since we don't keep them around
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

        logoColorLookup:function(type) {
            var colors = [
                            '#F44336', //red
                            '#E91E63', //pink
                            '#9C27B0', //purple
                            '#673AB7', //deep purple
                            '#3F51B5', //indigo
                            '#2196F3', //blue
                            '#03A9F4', //light blue
                            '#00BCD4', //cyan
                            '#009688', //teal
                            '#4CAF50', //green
                            '#8BC34A', //lime green
                            '#CDDC39', //lime
                            '#FFEB3B', //yellow
                            '#FFC107', //amber
                            '#FF9800', //orange
                            '#FF5722', //deep orange
                            '#795548', //brown
                            '#9E9E9E', //grey
                            '#607D8B'  //blue grey
                         ];

            // first, if there are some colors we want to catch...
            switch (type) {
                case "M":
                    return "#FF9800";
                    break;
                case "A":
                    return "#03A9F4";
                    break;
            }

            // pick one based on the characters
            var code = 0;
            for(var i=0; i<type.length; i++) {
                code += type.charCodeAt(i);
            }
            return colors[ code % colors.length ];
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
        showFunctionPanel: function() {
            this.$errorPanel.hide();
            this.$loadingPanel.hide();
            this.$functionPanel.show();
        },

        /**
         * Shows an error text message on top of the panel. All other pieces are hidden.
         * @param {string} error - the text of the error message
         * @private
         */
        showError: function(error) {
            var $errorHeader = $('<div>')
                               .addClass('alert alert-danger')
                               .append('<b>Sorry, an error occurred while loading KBase functions.</b><br>Please contact the KBase team at <a href="mailto:help@kbase.us?subject=Narrative%20function%20loading%20error">help@kbase.us</a> with the information below.');

            this.$errorPanel.empty();
            this.$errorPanel.append($errorHeader);

            // If it's a string, just dump the string.
            if (typeof error === 'string') {
                this.$errorPanel.append($('<div>').append(error));
            }

            // If it's an object, expect an error object as returned by the execute_reply callback from the IPython kernel.
            else if (typeof error === 'object') {
                var $details = $('<div>');
                $details.append($('<div>').append('<b>Type:</b> ' + error.ename))
                        .append($('<div>').append('<b>Value:</b> ' + error.evalue));

                var $tracebackDiv = $('<div>')
                                 .addClass('kb-function-error-traceback');
                for (var i=0; i<error.traceback.length; i++) {
                    $tracebackDiv.append(error.traceback[i] + "<br>");
                }

                var $tracebackPanel = $('<div>');
                var tracebackAccordion = [{'title' : 'Traceback', 'body' : $tracebackDiv}];

                this.$errorPanel.append($details)
                                .append($tracebackPanel);
                $tracebackPanel.kbaseAccordion({ elements : tracebackAccordion });
            }

            this.$functionPanel.hide();
            this.$loadingPanel.hide();
            this.$errorPanel.show();
        },

        /**
         * @method
         * Temp function borrowed from kbaseAccordion.js, so we can have access to the internal
         * accordion bits that get generated. Maybe it'll change more!
         */
        buildAccordion : function (elements) {
            var fontSize = '100%';

            var $block = $('<div></div>')
                         .addClass('accordion')
                         .css('font-size', fontSize)
                         .attr('id', 'accordion');

            var topElements = [];

            $.each(elements,
                $.proxy(
                    function (idx, val) {
                        var $topElem =
                            $('<div></div>')
                            .addClass('panel panel-default')
                            .css('margin-bottom', '2px')
                            .append($('<div></div>')
                                    .addClass('panel-heading')
                                    .css('padding', '0px')
                                    .append($('<i></i>')
                                            .css('margin-right', '5px')
                                            .css('margin-left', '3px')
                                            .addClass('fa fa-chevron-right')
                                            .addClass('pull-left')
                                            .css('height', '22px')
                                            .css('line-height', '22px')
                                            .css('color', 'gray'))
                                    .append($('<a></a>')
                                            .css('padding', '0px')
                                            .attr('href', '#')
                                            .attr('title', val.title)
                                            .css('height', '22px')
                                            .css('line-height', '22px')
                                            .append(val.title))
                                    .bind('click',
                                        function(e) {
                                            e.preventDefault();
                                            var $opened = $(this).closest('.panel').find('.in');
                                            var $target = $(this).next();

                                            if ($opened != undefined) {
                                                $opened.collapse('hide');
                                                var $i = $opened.parent().first().find('i');
                                                $i.removeClass('fa fa-chevron-down');
                                                $i.addClass('fa fa-chevron-right');
                                            }

                                            if ($target.get(0) != $opened.get(0)) {
                                                $target.collapse('show');
                                                var $i = $(this).parent().find('i');
                                                $i.removeClass('fa fa-chevron-right');
                                                $i.addClass('fa fa-chevron-down');
                                            }
                                        }
                                    )
                            )
                            .append($('<div></div>')
                                    .addClass('panel-body collapse')
                                    .css('padding-top', '9px')
                                    .css('padding-bottom', '9px')
                                    .append(val.body));
                        topElements[val.title] = $topElem;
                        $block.append($topElem);
                    },
                    this
                )
            );
            this._rewireIds($block, this);

            return [$block, topElements];
        },

        /**
         * A simple filter based on whether the given pattern string is present in the
         * method's name.
         * Returns true if so, false if not.
         * Doesn't care if its a method or an app, since they both have name fields at their root.
         */
        textFilter: function(pattern, method) {
            var lcName = method.info.name.toLowerCase();
            var module_name = '';
            if (method.info.module_name) {
                module_name = method.info.module_name.toLowerCase();
            }
            // match any token in the query, not the full string
            var tokens = pattern.toLowerCase().split(' ');
            for(var k=0; k<tokens.length; k++) {
                if(lcName.indexOf(tokens[k]) < 0 &&
                   module_name.indexOf(tokens[k]) < 0) {
                    // token not found, so we return false
                    return false;
                }
            }
            // returns true only if all tokens were found
            return true;
        },

        /**
         * Returns true if the type is available as in input to the method, false otherwise, assumes
         * only the first token in 'type' is the type name
         *
         * 'style' should be one of three values:
         * "object" = the type appears in either ins or outs of the method
         * "input" = the type only appears in input fields
         * "output" = the type only appears in output fields
         */
        typeFilter: function(type, spec, style) {
            style = style.toLowerCase();

            var tokens = type.split(' ');
            var type = tokens[0];
            tokens.shift();
            // first check that other tokens match the method/app name
            if (!this.textFilter(tokens.join(' '), spec)) {
                return false;
            }

            var methodFilter = function(type, spec) {
                if(!spec.parameters) return false;
                for (var i=0; i<spec.parameters.length; i++) {
                    var p = spec.parameters[i];

                    if (p.text_options && p.text_options.valid_ws_types && p.text_options.valid_ws_types.length > 0) {
                        // outputs have "is_output_name" in text_options
                        var isOutput = p.text_options.is_output_name; // 0 or 1
                        var checkThisParam = true;
                        switch (style) {
                            case 'input':
                                if (isOutput)
                                    checkThisParam = false;
                                break;
                            case 'output':
                                if (!isOutput)
                                    checkThisParam = false;
                                break;
                            case 'object': // always check
                                break;
                            default: break;
                        }

                        if (!checkThisParam)
                            continue;
                        var validTypes = p.text_options.valid_ws_types;
                        for (var j=0; j<validTypes.length; j++) {
                            if (validTypes[j].toLowerCase().indexOf(type) !== -1)
                                return true;
                        }
                    }
                }
            }
            if (spec.steps) {
                // ignoring apps right now
                for (var i=0; i<spec.steps.length; i++) {
                    var methodSpec = this.methodSpecs[spec.steps[i].method_id]; // don't need to make module LC, because this is for 
                                                                                // apps only so specs cannot be in an SDK module
                    if (!methodSpec || methodSpec === undefined || methodSpec === null) {
                    }
                    else if (methodFilter(type, methodSpec))
                        return true;
                }
                return false;
            } else {
                // this is a method-- things are easy now because this info is returned by the NMS!
                // if style==object => check both input and output
                if(style=='input' || style=='object') {
                    if(spec.info.input_types) {
                        for(var k=0; k<spec.info.input_types.length; k++) {
                            if(spec.info.input_types[k].toLowerCase().indexOf(type) >=0) {
                                return true;
                            }
                        }
                    }
                } else if (style=='output' || style=='object') {
                    if(spec.info.output_types) {
                        for(var k=0; k<spec.info.output_types.length; k++) {
                            if(spec.info.output_types[k].toLowerCase().indexOf(type) >=0) {
                                return true;
                            }
                        }
                    }
                }
                // not found
                return false;
            }
        },

        objectTypeFilter: function(type, spec) {
            return this.typeFilter(type, spec, 'object');
        },

        inputTypeFilter: function(type, spec) {
            return this.typeFilter(type, spec, 'input');
        },

        outputTypeFilter: function(type, spec) {
            return this.typeFilter(type, spec, 'output');
        },

        /**
         * @method
         * @public
         * Expects this.methodSet to be an associative array, like this:
         * {
         *     <methodId> : {
         *         $elem : rendered element as jQuery node,
         *         rest of method spec
         *     }
         * }
         */
        visualFilter: function(filterFn, fnInput) {
            var numHidden = 0;
            var self = this;
            filterFn = $.proxy(filterFn, this);
            var filterSet = function(set, type) {

                var numHidden = 0;
                for (var id in set) {
                    // have to make sure module names are in LC, annoying, I know!
                    var idTokens = id.split('/');
                    if(idTokens.length==2) { // has a module name
                        id = idTokens[0].toLowerCase() + '/' + idTokens[1];
                    }
                    if (!filterFn(fnInput, set[id])) {
                        self.id2Elem[type][id].hide();
                        self.id2Elem[type][id].addClass('kb-function-dim');
                        numHidden++;
                    }
                    else {
                        self.id2Elem[type][id].removeClass('kb-function-dim');
                        self.id2Elem[type][id].show();
                    }
                }
                return numHidden;
            };

            numHidden += filterSet(this.appSpecs, 'app');
            numHidden += filterSet(this.methodSpecs, 'method');

            if (numHidden > 0) {
                this.$numHiddenSpan.text(numHidden);
                this.$toggleHiddenDiv.show();
                this.toggleHiddenMethods(this.$showHideSpan.text() !== 'show');
            }
            else {
                this.$toggleHiddenDiv.hide();
                this.toggleHiddenMethods(true);
            }
        },

        toggleHiddenMethods: function(show) {
            /* 2 cases
             * show is truthy -> show()
             * show is falsy -> hide()
             */

            if (show) {
                this.$functionPanel.find('.kb-function-dim').show();
            }
            else {
                this.$functionPanel.find('.kb-function-dim').hide();

            }
        },

        // Temporary pass-through for Jim's gallery widget
        toggleOverlay: function() {
            this.trigger('toggleSidePanelOverlay.Narrative');
        },
    });
});