/*global
 define
 */
/*jslint
 browser: true,
 white: true
 */
define([
    'jquery',
    'kb/service/client/narrativeMethodStore',
    'kb/service/client/catalog',
    './catalog_util',
    './app_card',
    'kb/widget/legacy/authenticatedWidget',
    'bootstrap',
],
    function ($, NarrativeMethodStore, Catalog, CatalogUtil, AppCard) {
        $.KBWidget({
            name: "KBaseCatalogBrowser",
            parent: "kbaseAuthenticatedWidget",  // todo: do we still need th
            options: {
                tag: null,
            },
            $mainPanel: null,
            $errorPanel: null,

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

            favoritesList:null,

            // control panel and elements
            $controlToolbar: null,
            $searchBox: null,


            // main panel and elements
            $mainPanel: null,
            $appListPanel: null,
            $moduleListPanel: null,
            $loadingPanel: null,


            categories: {},


            init: function (options) {
                this._super(options);
                
                var self = this;

                self.categories = {
                    assembly : 'Assembly',
                    annotation : 'Annotation',
                    metabolic_modeling : 'Metabolic Modeling',
                    comparative_genomics : 'Comparative Genomics',
                    expression : 'Expression',
                    util : 'Utilities'
                };


                // new style we have a runtime object that gives us everything in the options
                self.runtime = options.runtime;
                //console.log(this.runtime.service('session').getUsername());
                self.util = new CatalogUtil();
                self.setupClients();

                // initialize and add the control bar
                var $container = $('<div>').addClass('container');
                self.$elem.append($container);
                var ctrElements = this.renderControlToolbar();
                self.$controlToolbar = ctrElements[0];
                self.$searchBox = ctrElements[1];
                $container.append(this.$controlToolbar);

                // initialize and add the main panel
                self.$loadingPanel = self.util.initLoadingPanel();
                self.$elem.append(self.$loadingPanel);
                var mainPanelElements = self.initMainPanel();
                self.$mainPanel = mainPanelElements[0];
                self.$appListPanel = mainPanelElements[1];
                self.$moduleListPanel = mainPanelElements[2];
                $container.append(self.$mainPanel);
                self.showLoading();

                // get the list of apps and modules
                var loadingCalls = [];
                self.appList = []; self.moduleList = [];
                loadingCalls.push(self.populateAppListWithMethods());
                loadingCalls.push(self.populateAppListWithApps());
                loadingCalls.push(self.populateModuleList());

                // when we have it all, then render the list
                Promise.all(loadingCalls).then(function() {

                    self.processData();


                    self.updateFavoritesCounts()
                        .then(function() {
                            self.hideLoading();
                            self.renderAppList('favorites');
                            self.updateRunStats();
                            return self.updateMyFavorites();
                        }).catch(function (err) {
                            self.hideLoading();
                            self.renderAppList('name_az');
                            self.updateRunStats();
                            console.error('ERROR');
                            console.error(err);
                        });

                });

                return this;
            },


            setupClients: function() {
                this.catalog = new Catalog(
                    this.runtime.getConfig('services.catalog.url'),
                    { token: this.runtime.service('session').getAuthToken() }
                );
                this.nms = new NarrativeMethodStore(
                    this.runtime.getConfig('services.narrative_method_store.url'),
                    { token: this.runtime.service('session').getAuthToken() }
                );
                this.nms_base_url = this.runtime.getConfig('services.narrative_method_store.url');
                this.nms_base_url = this.nms_base_url.substring(0,this.nms_base_url.length-3)
            },



            renderControlToolbar: function () {
                var self = this;

                // CONTROL BAR CONTAINER
                var $nav = $('<nav>').addClass('navbar navbar-default')
                                .css({'border':'0', 'background-color':'#fff'});
                var $container = $('<div>').addClass('container-fluid');

                var $content = $('<div>').addClass('');

                $nav.append($container.append($content));


                // SEARCH
                var $searchBox = $('<input type="text" placeholder="Search" size="50">').addClass('form-control');
                $searchBox.on('input',
                    function() {
                        self.filterApps($searchBox.val());
                    });
                $content.append($('<form>').addClass('navbar-form navbar-left')
                                    .append($('<div>').addClass('form-group')
                                        .append($searchBox)));

                // other controls list
                var $ctrList = $('<ul>').addClass('nav navbar-nav').css('font-family',"'OxygenRegular', Arial, sans-serif");
                $content.append($ctrList);

                // ORGANIZE BY
                var $obMyFavs = $('<a>');
                if(self.runtime.service('session').isLoggedIn()) {
                    $obMyFavs.append('My Favorites')
                                    .on('click', function() {self.renderAppList('my_favorites')});
                }
                var $obFavs = $('<a>').append('Favorites Count')
                                    .on('click', function() {self.renderAppList('favorites')});
                var $obRuns = $('<a>').append('Run Count')
                                    .on('click', function() {self.renderAppList('runs')});
                var $obNameAz = $('<a>').append('Name (a-z)')
                                    .on('click', function() {self.renderAppList('name_az')});
                var $obNameZa = $('<a>').append('Name (z-a)')
                                    .on('click', function() {self.renderAppList('name_za')});
                var $obCat = $('<a>').append('Category')
                                    .on('click', function() {self.renderAppList('category')});
                var $obModule = $('<a>').append('Module')
                                    .on('click', function() {self.renderAppList('module')});
                var $obOwner = $('<a>').append('Developer')
                                    .on('click', function() {self.renderAppList('developer')});
                var $obInput = $('<a>').append('Input Types')
                                    .on('click', function() {self.renderAppList('input_types')});
                var $obOutput = $('<a>').append('Output Types')
                                    .on('click', function() {self.renderAppList('output_types')});

                var $organizeBy = $('<li>').addClass('dropdown')
                                    .append('<a class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">Organize by <span class="caret"></span></a>')

                $organizeBy
                    .append($('<ul>').addClass('dropdown-menu')
                        .append($('<li>')
                            .append($obMyFavs))
                        .append($('<li>')
                            .append($obFavs))
                        .append($('<li>')
                            .append($obRuns))
                        .append('<li role="separator" class="divider"></li>')
                        .append($('<li>')
                            .append($obNameAz))
                        .append($('<li>')
                            .append($obNameZa))
                        .append('<li role="separator" class="divider"></li>')
                        .append($('<li>')
                            .append($obCat))
                        .append($('<li>')
                            .append($obModule))
                        .append($('<li>')
                            .append($obOwner))
                        .append('<li role="separator" class="divider"></li>')
                        .append($('<li>')
                            .append($obInput))
                        .append($('<li>')
                            .append($obOutput))
                        );


                // ORGANIZE BY
                var $verR = $('<a href="#appcatalog/browse/release">').append('Released Modules');
                var $verB = $('<a href="#appcatalog/browse/beta">').append('Beta Modules');
                var $verD = $('<a href="#appcatalog/browse/dev">').append('Modules in Development');

                var $version = $('<li>').addClass('dropdown')
                                    .append('<a class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">Version<span class="caret"></span></a>')

                $version
                    .append($('<ul>').addClass('dropdown-menu')
                        .append($('<li>')
                            .append($verR))
                        .append($('<li>')
                            .append($verB))
                        .append($('<li>')
                            .append($verD)));


                // NAV LINKS
                var $statusLink = $('<li>').append($('<a href="#appcatalog/status">').append('Status'));

                var $registerLink = $('<li>').append($('<a href="#appcatalog/register">').append('<i class="fa fa-plus-circle"></i> Add Module'));



                // PLACE CONTENT ON CONTROL BAR
                $content
                    .append($ctrList
                        .append($organizeBy)
                        .append($version)
                        .append($statusLink)
                        .append($registerLink));

                $nav.append($container)


                return [$nav, $searchBox];
            },


            filterApps: function(query) {
                var self = this;
                query = query.trim();
                if(query) {
                    var terms = query.toLowerCase().match(/\w+|"(?:\\"|[^"])+"/g);
                    if (terms) {

                        // for everything in the list
                        for(var k=0; k<self.appList.length; k++) {

                            // for every term (every term must match to get a match)
                            var match = false; // every term must match
                            for(var t=0; t<terms.length; t++) {
                                if(terms[t].charAt(0)=='"' && terms[t].charAt(terms.length-1)=='"' && terms[t].length>2) {
                                    terms[t] = terms[t].substring(1,terms[t].length-1);
                                    // the regex keeps quotes in quoted strings, so toss those
                                }
                                // filter on names
                                if(self.appList[k].info.name.toLowerCase().indexOf(terms[t]) >= 0) {
                                    match = true; continue;
                                }
                                // filter on module names, if they exist
                                if(self.appList[k].info.module_name) {
                                    if(self.appList[k].info.module_name.toLowerCase().indexOf(terms[t]) >= 0) {
                                        match = true; continue;
                                    }
                                }
                                // filter on other description
                                if(self.appList[k].info.subtitle) {
                                    if(self.appList[k].info.subtitle.toLowerCase().indexOf(terms[t]) >= 0) {
                                        match = true; continue;
                                    }
                                }

                                // filter on authors
                                if(self.appList[k].info.authors) {
                                    var authorMatch = false;
                                    for(var a=0; a<self.appList[k].info.authors.length; a++) {
                                        if(self.appList[k].info.authors[a].toLowerCase().indexOf(terms[t]) >= 0) {
                                            authorMatch = true; break;
                                        }
                                    }
                                    if(authorMatch) { match=true; continue; }
                                }

                                // filter on other stuff (input/output types?)


                                // if we get here, this term didnt' match anything, so we can break
                                match = false; break;
                            }


                            // show or hide if we matched
                            if(match) {
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
                var sections = self.$appListPanel.find('.catalog-section');
                for(var i=0; i<sections.length; i++) {
                    $(sections[i]).show();
                    var cards = $(sections[i]).find('.kbcb-app-card-container,.kbcb-app-card-list-element');
                    var hasVisible = false;
                    for(var j=0; j<cards.length; j++) {
                        if($(cards[j]).is(':visible')) {
                            hasVisible = true;
                            break;
                        }
                    }
                    if(!hasVisible) {
                        $(sections[i]).hide();
                    }
                }



            },

            clearFilter: function() {
                var self = this;
                for(var k=0; k<self.appList.length; k++) {
                    self.appList[k].show();
                }
            },



            initMainPanel: function($appListPanel, $moduleListPanel) {
                var $mainPanel = $('<div>').addClass('container');
                var $appListPanel = $('<div>');
                var $moduleListPanel = $('<div>');
                $mainPanel.append($appListPanel);
                $mainPanel.append($moduleListPanel);
                return [$mainPanel, $appListPanel, $moduleListPanel];
            },

            showLoading: function() {
                var self = this;
                self.$loadingPanel.show();
                self.$mainPanel.hide();
            },
            hideLoading: function() {
                var self = this;
                self.$loadingPanel.hide();
                self.$mainPanel.show();
            },


            // we assume context is:
            //    catalog: catalog_client
            //    browserWidget: this widget, so we can toggle any update
            toggleFavorite: function(info, context) {
                var appCard = this;
                var params = {};
                if(info.module_name) {
                    params['module_name'] = info.module_name;
                    params['id'] = info.id.split('/')[1]
                } else {
                    params['id'] = info.id;
                }

                // check if is a favorite
                if(appCard.isStarOn()) {
                    context.catalog.remove_favorite(params)
                        .then(function () {
                            appCard.turnOffStar();
                            appCard.setStarCount(appCard.getStarCount()-1);
                            context.browserWidget.updateMyFavorites();
                            return context.browserWidget.updateFavoritesCounts();
                        })
                        .catch(function (err) {
                            console.error('ERROR');
                            console.error(err);
                        });
                } else {
                    context.catalog.add_favorite(params)
                        .then(function () {
                            appCard.turnOnStar();
                            appCard.setStarCount(appCard.getStarCount()+1);
                            context.browserWidget.updateMyFavorites();
                            return context.browserWidget.updateFavoritesCounts();
                        })
                        .catch(function (err) {
                            console.error('ERROR');
                            console.error(err);
                        });
                }
            },



            populateAppListWithMethods: function() {
                var self = this;

                // determine which set of methods to fetch
                var tag='release'; // default is to show only 'release' tagged modules
                if(self.options.tag) {
                    tag = self.options.tag;
                    if(tag!=='dev' && tag!=='beta' && tag!=='release') {
                        console.warn('tag '+tag+ ' is not valid! Use: dev/beta/release.  defaulting to release.');
                        tag='release';
                    }
                }

                return self.nms.list_methods({
                        tag:tag
                    })
                    .then(function (methods) {
                        for(var k=0; k<methods.length; k++) {

                            // logic to hide/show certain categories
                            if(self.util.skipApp(methods[k].categories)) continue;

                            var m = new AppCard('method',methods[k],tag,self.nms_base_url, 
                                self.toggleFavorite, {catalog:self.catalog, browserWidget:self},
                                self.runtime.service('session').isLoggedIn());
                            self.appList.push(m);
                        }
                    })
                    .catch(function (err) {
                        console.error('ERROR');
                        console.error(err);
                    });
            },

            populateAppListWithApps: function() {
                var self = this;

                // apps cannot be registered via the SDK, so don't have tag info
                return self.nms.list_apps({})
                    .then(function (apps) {
                        //console.log(apps);
                        for(var k=0; k<apps.length; k++) {
                            var a = new AppCard('app',apps[k],null,self.nms_base_url);
                            self.appList.push(a);
                        }
                    })
                    .catch(function (err) {
                        console.error('ERROR');
                        console.error(err);
                    });
            },



            populateModuleList: function() {
                var self = this

                var moduleSelection = {
                    include_released:1,
                    include_unreleased:1,
                    include_disabled:0
                };

                return self.catalog.list_basic_module_info(moduleSelection)
                    .then(function (modules) {
                        for(var k=0; k<modules.length; k++) {
                            var m = {
                                info: modules[k],
                                $div: $('<div>').addClass('kbcb-module')
                            };
                            self.renderModuleBox(m);
                            self.moduleList.push(m);
                        }
                    })
                    .catch(function (err) {
                        console.error('ERROR');
                        console.error(err);
                    });
            },

            updateRunStats: function() {
                var self = this

                var options = {};

                return self.catalog.get_exec_aggr_stats(options)
                    .then(function (stats) {
                        self.runStats = stats;
                        for(var k=0; k<stats.length; k++) {

                            var lookup = stats[k].full_app_id;
                            var idTokens = stats[k].full_app_id.split('/');
                            if( idTokens.length === 2) {
                                lookup = idTokens[0].toLowerCase() + '/' + idTokens[1];
                            }
                            if(self.appLookup[lookup]) {
                                self.appLookup[lookup].setRunCount(stats[k].number_of_calls);
                            }
                        }
                    })
                    .catch(function (err) {
                        console.error('ERROR');
                        console.error(err);
                    });
            },


            updateFavoritesCounts: function() {
                var self = this
                var listFavoritesParams = { };
                return self.catalog.list_favorite_counts(listFavoritesParams)
                    .then(function (counts) {
                        for(var k=0; k<counts.length; k++) {
                            var c = counts[k];
                            var lookup = c.id;
                            if(c.module_name_lc != 'nms.legacy') {
                                lookup = c.module_name_lc + '/' + lookup
                            }
                            if(self.appLookup[lookup]) {
                                self.appLookup[lookup].setStarCount(c.count);
                            }
                        }
                    })
                    .catch(function (err) {
                        console.error('ERROR');
                        console.error(err);
                    });
            },

            // warning!  will not return a promise if the user is not logged in!
            updateMyFavorites: function() {
                var self = this
                if(self.runtime.service('session').isLoggedIn()) {
                    return self.catalog.list_favorites(self.runtime.service('session').getUsername())
                        .then(function (favorites) {
                            self.favoritesList = favorites;
                            for(var k=0; k<self.favoritesList.length; k++) {
                                var fav = self.favoritesList[k];
                                var lookup = fav.id;
                                if(fav.module_name_lc != 'nms.legacy') {
                                    lookup = fav.module_name_lc + '/' + lookup
                                }
                                if(self.appLookup[lookup]) {
                                    self.appLookup[lookup].turnOnStar(fav.timestamp);
                                }
                            }
                        })
                        .catch(function (err) {
                            console.error('ERROR');
                            console.error(err);
                        });
                }
            },


            processData: function() {
                var self = this;

                // setup module map
                self.moduleLookup = {};
                self.appLookup = {};
                for(var m=0; m<self.moduleList.length; m++) {
                    self.moduleLookup[self.moduleList[m].info.module_name] = self.moduleList[m];
                }
                for(var a=0; a<self.appList.length; a++) {
                    // only lookup for methods; apps are deprecated
                    if(self.appList[a].type==='method') {
                        if(self.appList[a].info.module_name) {
                            var idTokens = self.appList[a].info.id.split('/');
                            self.appLookup[idTokens[0].toLowerCase() + '/' + idTokens[1]] = self.appList[a];
                        } else {
                            self.appLookup[self.appList[a].info.id] = self.appList[a];
                        }
                    }
                }

                self.developers = {};
                self.inputTypes = {};
                self.outputTypes = {};

                for(var k=0; k<self.appList.length; k++) {
                    if(self.appList[k].type==='method') {
                        if(self.appList[k].info.authors.length>0) {
                            var authors = self.appList[k].info.authors;
                            for(var i=0; i<authors.length; i++) {
                                self.developers[authors[i]] = 1;
                            }
                        }
                        if(self.appList[k].info.input_types.length>0) {
                            var input_types = self.appList[k].info.input_types;
                            for(var i=0; i<input_types.length; i++) {
                                self.inputTypes[input_types[i]] = 1;
                            }
                        }
                        if(self.appList[k].info.output_types.length>0) {
                            var output_types = self.appList[k].info.output_types;
                            for(var i=0; i<output_types.length; i++) {
                                self.outputTypes[output_types[i]] = 1;
                            }
                        }
                    }
                }



            },




            renderModuleBox: function(module) {
                var $modDiv = $('<div>').addClass('kbcb-app');
                $modDiv.append(module.info.module_name);
                module.$div = $modDiv;
            },



            renderAppList: function(organizeBy) {
                var self = this;

                self.$appListPanel.children().detach();

                // no organization, so show all
                if(!organizeBy) { return; }

                if(organizeBy=='name_az') {
                    // sort by method name, A to Z
                    self.appList.sort(function(a,b) {
                        if(a.info.name.toLowerCase()<b.info.name.toLowerCase()) return -1;
                        if(a.info.name.toLowerCase()>b.info.name.toLowerCase()) return 1;
                        return 0;
                    });
                    var $listContainer = $('<div>').css({'overflow':'auto', 'padding':'0 0 2em 0'});
                    for(var k=0; k<self.appList.length; k++) {
                        self.appList[k].clearCardsAddedCount();
                         $listContainer.append(self.appList[k].getNewCardDiv());
                    }
                    self.$appListPanel.append($listContainer);
                }
                else if(organizeBy=='name_za') {
                    // sort by method name, Z to A
                    self.appList.sort(function(a,b) {
                        if(a.info.name.toLowerCase()<b.info.name.toLowerCase()) return 1;
                        if(a.info.name.toLowerCase()>b.info.name.toLowerCase()) return -1;
                        return 0;
                    });
                    var $listContainer = $('<div>').css({'overflow':'auto', 'padding':'0 0 2em 0'});
                    for(var k=0; k<self.appList.length; k++) {
                        self.appList[k].clearCardsAddedCount();
                        $listContainer.append(self.appList[k].getNewCardDiv());
                    }
                    self.$appListPanel.append($listContainer);
                }
                else if(organizeBy=='module') {
                    // Organization by module is simple because things can only be in one module, we sort and group them by module

                    self.appList.sort(function(a,b) {
                        if(a.info.module_name && b.info.module_name) {
                            if(a.info.module_name.toLowerCase()<b.info.module_name.toLowerCase()) return -1;
                            if(a.info.module_name.toLowerCase()>b.info.module_name.toLowerCase()) return 1;
                            if(a.info.name.toLowerCase()<b.info.name.toLowerCase()) return -1;
                            if(a.info.name.toLowerCase()>b.info.name.toLowerCase()) return 1;
                            return 0;
                        }
                        if(a.info.module_name) return -1;
                        if(b.info.module_name) return 1;
                        return 0;
                    });
                    var currentModuleName = '';
                    var $currentModuleDiv = null;
                    for(var k=0; k<self.appList.length; k++) {
                        self.appList[k].clearCardsAddedCount();

                        var info = self.appList[k].info;

                        var m = info.module_name;
                        if(!m) { m = 'Not in an SDK Module'}

                        if(currentModuleName != m) {
                            currentModuleName = m;
                            var $section = $('<div>').addClass('catalog-section');
                            $currentModuleDiv = $('<div>').addClass('kbcb-app-card-list-container');
                            $section.append($('<div>').css({'color':'#777'})
                                    .append($('<h4>').append('<a href="#appcatalog/module/'+m+'">'+m+'</a>')));
                            $section.append($currentModuleDiv);
                            self.$appListPanel.append($section);
                        }
                        $currentModuleDiv.append(self.appList[k].getNewCardDiv());
                    }
                }

                else if(organizeBy=='developer') {

                    // get and sort the dev list
                    var devs = [];
                    for(var k in self.developers) { devs.push(k); }
                    devs.sort();

                    // create the sections per author
                    var $authorDivLookup = {};
                    for(var k=0; k<devs.length; k++) {
                        var $section = $('<div>').addClass('catalog-section');
                        var $authorDiv = $('<div>').addClass('kbcb-app-card-list-container');
                        $authorDivLookup[devs[k]] = $authorDiv;
                        $section.append(
                            $('<div>').css({'color':'#777'})
                                .append($('<h4>').append('<a href="#people/'+devs[k]+'">'+devs[k]+'</a>')));
                        $section.append($authorDiv)
                        self.$appListPanel.append($section);
                    }
                    var $section = $('<div>').addClass('catalog-section');
                    var $noAuthorDiv = $('<div>').addClass('kbcb-app-card-list-container');
                    $section.append(
                        $('<div>').css({'color':'#777'})
                            .append($('<h4>').append('No Developer Specified')));
                    $section.append($noAuthorDiv);
                    self.$appListPanel.append($section);

                    // render the app list
                    for(var k=0; k<self.appList.length; k++) {
                        self.appList[k].clearCardsAddedCount();

                        if(self.appList[k].type==='method') {
                            if(self.appList[k].info.authors.length>0) {
                                var authors = self.appList[k].info.authors;
                                for(var i=0; i<authors.length; i++) {
                                   $authorDivLookup[authors[i]].append(self.appList[k].getNewCardDiv());
                                }
                            } else {
                                $noAuthorDiv.append(self.appList[k].getNewCardDiv())
                            }
                        } else {
                            $noAuthorDiv.append(self.appList[k].getNewCardDiv())
                        }
                    }

                }

                

                else if (organizeBy=='category') {

                    var cats = [];
                    for(var k in self.categories) { cats.push(k); }
                    cats.sort();

                    var $catDivLookup = {}
                    for(var k=0; k<cats.length; k++) {
                        var $section = $('<div>').addClass('catalog-section');
                        var $catDiv = $('<div>').addClass('kbcb-app-card-list-container');
                        $catDivLookup[cats[k]] = $catDiv;
                        $section.append(
                            $('<div>').css({'color':'#777'})
                                .append($('<h4>').append(self.categories[cats[k]])));
                        $section.append($catDiv)
                        self.$appListPanel.append($section);
                    }
                    var $section = $('<div>').addClass('catalog-section');
                    var $noCatDiv = $('<div>').addClass('kbcb-app-card-list-container');
                    $section.append(
                        $('<div>').css({'color':'#777'})
                            .append($('<h4>').append('Uncategorized')));
                    $section.append($noCatDiv);
                    self.$appListPanel.append($section);

                    for(var k=0; k<self.appList.length; k++) {
                        self.appList[k].clearCardsAddedCount();

                        if(self.appList[k].info.categories.length>0) {
                            var appCats = self.appList[k].info.categories;
                            var gotCat = false;
                            for(var i=0; i<appCats.length; i++) {
                                if($catDivLookup.hasOwnProperty(appCats[i])) {
                                    gotCat = true;
                                    $catDivLookup[appCats[i]].append(self.appList[k].getNewCardDiv());
                                }
                            }
                            if(!gotCat) {
                                $noCatDiv.append(self.appList[k].getNewCardDiv());
                            }
                        } else {
                            $noCatDiv.append(self.appList[k].getNewCardDiv());
                        }
                    }

                }

                else if (organizeBy=='my_favorites') {
                    // sort by number of stars, then by app name
                    self.appList.sort(function(a,b) {
                        // sort by time favorited
                        if(a.isStarOn() && b.isStarOn()) {
                            if(a.getStarTime() > b.getStarTime()) return -1;
                            if(a.getStarTime() < b.getStarTime()) return 1;
                        }

                        // otherwise sort by stars
                        var aStars = a.getStarCount();
                        var bStars = b.getStarCount();
                        if(aStars>bStars) return -1;
                        if(bStars>aStars) return 1;
                        var aName = a.info.name.toLowerCase();
                        var bName = b.info.name.toLowerCase();
                        if(aName<bName) return -1;
                        if(aName>bName) return 1;
                        return 0;
                    });
                    var $mySection = $('<div>').addClass('catalog-section');
                    var $myDiv = $('<div>').addClass('kbcb-app-card-list-container');
                    $mySection.append(
                        $('<div>').css({'color':'#777'})
                            .append($('<h4>').append('My Favorites')));
                    $mySection.append($myDiv);
                    self.$appListPanel.append($mySection);

                    var $otherSection = $('<div>').addClass('catalog-section');
                    var $otherDiv = $('<div>').addClass('kbcb-app-card-list-container');
                    $otherSection.append(
                        $('<div>').css({'color':'#777'})
                            .append($('<h4>').append('Everything Else')));
                    $otherSection.append($otherDiv);
                    self.$appListPanel.append($otherSection);
                    var hasFavorites = false;
                    for(var k=0; k<self.appList.length; k++) {
                        self.appList[k].clearCardsAddedCount();
                        if(self.appList[k].isStarOn()) {
                            $myDiv.append(self.appList[k].getNewCardDiv());
                            hasFavorites = true;
                        } else {
                            $otherDiv.append(self.appList[k].getNewCardDiv());
                        }
                    }
                    if(!hasFavorites) {
                        console.log('here');
                        $myDiv.append($('<div>').css({'color':'#777'}).addClass('kbcb-app-card-list-element').append('You do not have any favorites yet.  Click on the stars to add to your favorites.'))
                    }

                }


                else if (organizeBy=='favorites') {
                    // sort by number of stars, then by app name
                    self.appList.sort(function(a,b) {
                        var aStars = a.getStarCount();
                        var bStars = b.getStarCount();
                        if(aStars>bStars) return -1;
                        if(bStars>aStars) return 1;
                        var aName = a.info.name.toLowerCase();
                        var bName = b.info.name.toLowerCase();
                        if(aName<bName) return -1;
                        if(aName>bName) return 1;
                        return 0;
                    });
                    var $listContainer = $('<div>').css({'overflow':'auto', 'padding':'0 0 2em 0'});
                    for(var k=0; k<self.appList.length; k++) {
                        self.appList[k].clearCardsAddedCount();
                        $listContainer.append(self.appList[k].getNewCardDiv());
                    }
                    self.$appListPanel.append($listContainer);
                }

                else if (organizeBy=='runs') {

                    self.$appListPanel.append('<div><i>Note: Run counts for legacy methods released before 2016 are not reported.</i><br><br></div>');

                    // sort by runs, then by app name
                    self.appList.sort(function(a,b) {
                        var aRuns = a.getRunCount();
                        var bRuns = b.getRunCount();
                        if(aRuns>bRuns) return -1;
                        if(bRuns>aRuns) return 1;
                        var aName = a.info.name.toLowerCase();
                        var bName = b.info.name.toLowerCase();
                        if(aName<bName) return -1;
                        if(aName>bName) return 1;
                        return 0;
                    });
                    var $listContainer = $('<div>').css({'overflow':'auto', 'padding':'0 0 2em 0'});
                    for(var k=0; k<self.appList.length; k++) {
                        self.appList[k].clearCardsAddedCount();
                        $listContainer.append(self.appList[k].getNewCardDiv());
                    }
                    self.$appListPanel.append($listContainer);

                }


                else if(organizeBy=='input_types') {
                    // get and sort the type list
                    var types = [];
                    for(var k in self.inputTypes) { types.push(k); }
                    types.sort();

                    // create the sections per author
                    var $typeDivLookup = {};
                    for(var k=0; k<types.length; k++) {
                        var $section = $('<div>').addClass('catalog-section');
                        var $typeDiv = $('<div>').addClass('kbcb-app-card-list-container');
                        $typeDivLookup[types[k]] = $typeDiv;
                        $section.append(
                            $('<div>').css({'color':'#777'})
                                .append($('<h4>').append($('<a href="#spec/type/'+types[k]+'">').append(types[k]))));
                        $section.append($typeDiv)
                        self.$appListPanel.append($section);
                    }

                    // render the app list
                    for(var k=0; k<self.appList.length; k++) {
                        self.appList[k].clearCardsAddedCount();

                        if(self.appList[k].type==='method') {
                            if(self.appList[k].info.input_types.length>0) {
                                var input_types = self.appList[k].info.input_types;
                                for(var i=0; i<input_types.length; i++) {
                                   $typeDivLookup[input_types[i]].append(self.appList[k].getNewCardDiv());
                                }
                            }
                        }
                    }
                }

                else if(organizeBy=='output_types') {
                    // get and sort the type list
                    var types = [];
                    for(var k in self.outputTypes) { types.push(k); }
                    types.sort();

                    // create the sections per author
                    var $typeDivLookup = {};
                    for(var k=0; k<types.length; k++) {
                        var $section = $('<div>').addClass('catalog-section');
                        var $typeDiv = $('<div>').addClass('kbcb-app-card-list-container');
                        $typeDivLookup[types[k]] = $typeDiv;
                        $section.append(
                            $('<div>').css({'color':'#777'})
                                .append($('<h4>').append($('<a href="#spec/type/'+types[k]+'">').append(types[k]))));
                        $section.append($typeDiv)
                        self.$appListPanel.append($section);
                    }

                    // render the app list
                    for(var k=0; k<self.appList.length; k++) {
                        self.appList[k].clearCardsAddedCount();

                        if(self.appList[k].type==='method') {
                            if(self.appList[k].info.output_types.length>0) {
                                var output_types = self.appList[k].info.output_types;
                                for(var i=0; i<output_types.length; i++) {
                                   $typeDivLookup[output_types[i]].append(self.appList[k].getNewCardDiv());
                                }
                            }
                        }
                    }
                }

                else {
                    self.$appListPanel.append('<span>invalid organization parameter</span>');
                }

                // gives some buffer at the end of the page
                self.$appListPanel.append($('<div>').css('padding','4em'));

                self.filterApps(self.$searchBox.val());
            },





            showError: function (error) {
                this.$errorPanel.empty();
                this.$errorPanel.append('<strong>Error when fetching App/Method information.</strong><br><br>');
                this.$errorPanel.append(error.error.message);
                this.$errorPanel.append('<br>');
                this.$errorPanel.show();
            }
        });
    });



