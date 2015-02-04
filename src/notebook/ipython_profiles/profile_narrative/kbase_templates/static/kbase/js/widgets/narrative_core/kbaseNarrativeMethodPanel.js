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
kb_require(['kbaseMethodGallery'], 
(function( $, undefined ) {
    $.KBWidget({
        name: 'kbaseNarrativeMethodPanel',
        parent: 'kbaseNarrativeControlPanel',
        version: '0.0.1',
        options: {
            loadingImage: 'static/kbase/images/ajax-loader.gif',
            autopopulate: true,
            title: 'Apps & Methods',
            methodStoreURL: 'http://dev19.berkeley.kbase.us/narrative_method_store',
            methodHelpLink: '/functional-site/#/narrativestore/method/',
        },
        ignoreCategories: { 'inactive' : 1, 'importers' : 1 },
        id2Elem: {},
        methodSpecs: {},  // id -> spec
        appSpecs: {},     // id -> spec
        categories: {},   // id -> category info

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

            // DOM structure setup here.
            // After this, just need to update the function list

            if (window.kbconfig && window.kbconfig.urls) {
                this.options.methodStoreURL = window.kbconfig.urls.narrative_method_store;
                this.meth_icons = window.kbconfig.icons.methods;
                this.icon_colors = window.kbconfig.icons.colors;
            }

            this.$searchDiv = $('<div>')
                             .addClass('input-group')
                             .css({'margin-bottom' : '3px'})
                             .hide();

            this.$searchInput = $('<input type="text">')
                                .addClass('form-control')
                                .attr('Placeholder', 'Search methods')
                                .on('input',
                                    $.proxy(function(e) {
                                        var txt = this.$searchInput.val().trim().toLowerCase();
                                        if (txt.indexOf("type:") === 0) {
                                            this.visualFilter(this.inputTypeFilter, txt.substring(5));
                                        }
                                        else
                                            this.visualFilter(this.textFilter, txt);
                                    }, this)
                                );
            this.$numHiddenSpan = $('<span>0</span>');
            this.$showHideSpan = $('<span>show</span>');
            this.$toggleHiddenDiv = $('<div>')
                                    .append(this.$showHideSpan)
                                    .append(' ')
                                    .append(this.$numHiddenSpan)
                                    .append(' filtered')
                                    .addClass('kb-function-toggle')
                                    .hide()
                                    .click($.proxy(function(e) {
                                        var curText = this.$showHideSpan.text();
                                        this.toggleHiddenMethods(curText === 'show');
                                        this.$showHideSpan.text(curText === 'show' ? 'hide' : 'show');
                                    }, this));

            var $clearSearchBtn = $('<span>')
                                  .addClass('input-group-btn')
                                  .append($('<button>')
                                          .addClass('btn btn-default')
                                          .css({'border-left' : 'none'})
                                          .attr('type', 'button')
                                          .append($('<span>')
                                                  .append('X'))
                                          .click(
                                            $.proxy(function(event) {
                                                this.$searchInput.val('');
                                                this.$searchInput.trigger('input');
                                            }, this)
                                          ));

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

            // $(document).on('hasFunction.Narrative',
            //     $.proxy(function(e, service, method, callback) {
            //         if (callback) {
            //             callback(this.hasFunction(service, method));
            //         }
            //     }, this)
            // );

            $(document).on('filterMethods.Narrative',
                $.proxy(function(e, filterString) {
                    if (filterString) {
                        this.$searchDiv.show();
                        this.$searchInput.val(filterString);
                        this.$searchInput.trigger('input');
                    }
                }, this)
            );

            $(document).on('removeFilterMethods.Narrative',
                $.proxy(function(e) {
                    this.$searchDiv.hide();
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
                  console.debug("Trigger proxy: specSet=", specSet, "callback=", callback);
                    if (callback) {
                      console.debug("Trigger: specSet=",specSet);
                        callback(this.getFunctionSpecs(specSet));
                    }
                }, this)
            );

            this.$methodGalleryBody = $('<div>');
            this.$methodGalleryBody.kbaseMethodGallery({sidePanel : this});
            this.$methodGallery = $('<div>')
                                  .append($('<div>')
                                          .addClass('kb-side-header active')
                                          .css({'width':'100%'})
                                          .append('Methods'))
                                  .append(this.$methodGalleryBody);

            this.addButton($('<button>')
                           .addClass('btn btn-xs btn-default')
                           .append('<span class="fa fa-search"></span>')
                           .click($.proxy(function(event) {
                               this.$searchDiv.slideToggle(400);
                           }, this)));
            this.addButton($('<button>')
                           .addClass('btn btn-xs btn-default')
                           .append('<span class="fa fa-arrow-right"></span>')
                           .click($.proxy(function(event) {
                               this.trigger('toggleSidePanelOverlay.Narrative', this.$methodGallery);
                           }, this)));

            if (!NarrativeMethodStore) {
                this.showError('Unable to connect to KBase Method Store!');
                return this;
            }

            this.methClient = new NarrativeMethodStore(this.options.methodStoreURL);

            if (this.options.autopopulate === true) {
                this.refresh();
            }

            return this;
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
        showTooltip: function(method, event) {
            this.help.$helpTitle.text(method.name);
            this.help.$helpVersion.text('v' + method.ver);
            this.help.$helpBody.html(method.tooltip);
            this.help.$helpLinkout.attr('href', this.options.methodHelpLink + method.id);
            this.help.$helpPanel.css({
                                       'left':event.pageX,
                                       'top':event.pageY
                                     })
                                .show();
        },

        showErrorTooltip: function(method, event) {
            this.showTooltip({
                'name' : method.name,
                'ver' : method.ver,
                'id' : method.id,
                'tooltip' : "This method has an internal error and cannot currently be used.<br><br>The detailed error message is:<br>"+method.loading_error
            }, event);
        },

        refreshFromService: function() {
            this.showLoadingMessage("Loading KBase Methods from service...");

            var methodProm = this.methClient.list_methods_spec({},
                $.proxy(function(methods) {
                    this.methodSpecs = {};
                    for (var i=0; i<methods.length; i++) {
                        this.methodSpecs[methods[i].info.id] = methods[i];
                    }
                }, this)
            );
            var appProm = this.methClient.list_apps_spec({},
                $.proxy(function(apps) {
                    this.appSpecs = {};
                    for (var i=0; i<apps.length; i++) {
                        this.appSpecs[apps[i].info.id] = apps[i];
                    }
                }, this)
            );
            var catProm = this.methClient.list_categories({},
                $.proxy(function(categories) {
                    this.categories = categories[0];
                }, this)
            );

            $.when(methodProm, appProm, catProm).done($.proxy(function(a, b, c) {
                // console.log([this.appSpecs, this.methodSpecs, this.categories]);
                this.parseMethodsAndApps(this.categories, this.methodSpecs, this.appSpecs);
                this.showFunctionPanel();
            }, this));

            $.when(methodProm, appProm).fail($.proxy(function(error) {
                console.log("error'd!")
                console.log(error);
                this.showError(error);
            }, this));
        },

        parseMethodsAndApps: function(catSet, methSet, appSet) {
            var self = this;
            var triggerMethod = function(method) {
                self.trigger('methodClicked.Narrative', method);
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
                    return a.info.name.localeCompare(b.info.name);
                });
                for (var i=0; i<fnList.length; i++) {
                    var $fnElem = self.buildMethod(icon, fnList[i], callback);
                    $fnPanel.append($fnElem);
                    id2Elem[fnList[i].info.id] = $fnElem;
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

            this.$methodList.empty().append($appPanel).append($methodPanel);
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
            /* Logos */
            var icon_name = (icon == "A") ? "app" : "method";
            var icon_color = (icon == "A") ? this.icon_colors[9] : this.icon_colors[5];
            //var icon_url = "static/kbase/images/" + icon_name + "-icon.png";
            var icons = this.meth_icons;
            var icon = icons[icon_name];
            var $logo = $('<div>')
              // background
              .addClass("fa-stack fa-2x").css({'cursor':'pointer'})
              .append($('<i>')
                .addClass("fa fa-square fa-stack-2x")
                .css({'color': icon_color}));
            // add stack of font-awesome icons
            _.each(icon, function(cls) {
              $logo.append($('<i>')
              .addClass("fa fa-inverse fa-stack-1x " + cls));
            });
            // add behavior
            $logo.click($.proxy(function(e) {
              e.stopPropagation();
              triggerFn(method);
            }, this));

            var $name = $('<div>')
                        .addClass('kb-data-list-name')
                        .css({'white-space':'normal', 'cursor':'pointer'})
                        .append(method.info.name)
                        .click($.proxy(function(e) {
                            e.stopPropagation();
                            triggerFn(method);
                        }, this));
            var $version = $('<span>').addClass("kb-data-list-type").append('v'+method.info.ver); // use type because it is a new line

            var $more = $('<div>')
                        .addClass('kb-method-list-more-div')
                        .append($('<div>')
                                .append(method.info.subtitle))
                        .append($('<div>')
                                .append($('<a>')
                                        .append('more...')
                                        .attr('target', '_blank')
                                        .attr('href', this.options.methodHelpLink + method.info.id)));

            var $moreBtn = $('<span>')
                           .addClass('kb-data-list-more fa fa-ellipsis-h')
                           .attr('aria-hidden', 'true')
                           .css({'color' : '#999'});

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
                                             // .css({'width':'80%'})
                                             .append($mainDiv)));

            return $('<div>')
                   .append($('<hr>').addClass('kb-data-list-row-hr').css({'margin-left':'65px'}))
                   .append($('<div>')
                           .addClass('kb-data-list-obj-row')
                           .append($newMethod)
                           .append($more.hide())
                           .mouseenter(function() {
                                if (!$more.is(':visible')) { $moreBtn.show(); }
                           })
                           .mouseleave(function() { $moreBtn.hide(); })
                           .click(function() {
                                $more.slideToggle('fast', $.proxy(function() {
                                    if (!$more.is(':visible')) { $moreBtn.show(); }
                                    else { $moreBtn.hide(); }
                                }, this));
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
        getFunctionSpecs: function(specSet) {
            console.debug("getFunctionSpecs(specSet=",specSet,")");
            var results = {};
            if (specSet.apps && specSet.apps instanceof Array) {
                results.apps = {};
                for (var i=0; i<specSet.apps.length; i++) {
                    if (this.appSpecs[specSet.apps[i]])
                        results.apps[specSet.apps[i]] = this.appSpecs[specSet.apps[i]];
                }
            }
            if (specSet.methods && specSet.methods instanceof Array) {
              results.methods = _.pick(this.methodSpecs, specSet.methods);
              /*
                results.methods = {};
                for (var i=0; i < specSet.methods.length; i++) {
                    if (this.methodSpecs[specSet.methods[i]])
                        results.methods[specSet.methods[i]] = this.methodSpecs[specSet.methods[i]];
                }
              */
            }
            console.debug("getFunctionSpecs returning:",results);
            return results;
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
         * @method
         * A simple tester to see if a service.method call exists in the currently loaded set
         * @param {string} service - the name of the service to test
         * @param {string} method - the name of the method to test
         * @return {boolean} true if the call exists, false otherwise
         */
        // hasFunction: function(service, method) {
        //     if (!this.services)
        //         return true;

        //     console.debug("looking up '" + service + "'.'" + method + "'");
        //     if (this.services.hasOwnProperty(service))
        //         return this.services[service].hasOwnProperty(method);
        //     return false;
        // },


        /**
         * Creates a new function field in the functions list.
         * This 'function' is represented as a DOM element. It has a name (styled as
         * a button, or something buttonish) and a help button.
         *
         * Clicking the function button triggers a function_clicked.Narrative event,
         * and clicking the help button triggers a function_help.Narrative event.
         *
         * Both of these events have the relevant data passed along with them for
         * population by the responding element.
         *
         * @param {object} method - the method object returned from the kernel.
         * @private
         */
        // addFunction: function(method) {
        //     var self = this;
        //     var $funcButton = $('<button>')
        //                       .attr('type', 'button')
        //                       .addClass('btn btn-default')
        //                       .append(method.title)
        //                       .click(function(event) { self.trigger('function_clicked.Narrative', method); });

        //     var $helpButton = $('<span>')
        //                       .addClass('glyphicon glyphicon-question-sign')
        //                       .css({'float': 'right',
        //                             'cursor': 'pointer',
        //                             'font-size': '14pt',
        //                             'color': '#0064b6'})
        //                       .click(function(event) { self.showHelpPopup(method); });

        //     this.$functionList.append($('<li>')
        //                                 .append($funcButton)
        //                                 .append($helpButton)
        //                              );
        // },

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
         * A *REALLY* simple filter based on whether the given pattern string is present in the
         * method's name.
         * Returns true if so, false if not.
         * Doesn't care if its a method or an app, since they both have name fields at their root.
         */
        textFilter: function(pattern, method) {
            var lcName = method.info.name.toLowerCase();
            return lcName.indexOf(pattern.toLowerCase()) > -1;
        },

        /**
         * Returns true if the type is available as in input to the method, false otherwise
         */
        inputTypeFilter: function(type, spec) {
            var methodFilter = function(type, spec) {
                for (var i=0; i<spec.parameters.length; i++) {
                    var p = spec.parameters[i];
                    if (p.text_options && p.text_options.valid_ws_types && p.text_options.valid_ws_types.length > 0) {
                        var validTypes = p.text_options.valid_ws_types;
                        for (var j=0; j<validTypes.length; j++) {
                            if (validTypes[j].toLowerCase().indexOf(type) !== -1)
                                return true;
                        }
                    }
                }
                return false;
            };
            if (spec.steps) {
                // ignoring apps right now
                for (var i=0; i<spec.steps.length; i++) {
                    var methodSpec = this.methodSpecs[spec.steps[i].method_id];
                    if (!methodSpec || methodSpec === undefined || methodSpec === null) {
//                        console.error('missing spec for ' + spec.steps[i].method_id);
                    }
                    else if (methodFilter(type, methodSpec))
                        return true;
                }
                return false;
            } else {
                return methodFilter(type, spec);
            }
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
                    if (!filterFn(fnInput, set[id])) {
                        self.id2Elem[type][id].hide();
                        self.id2Elem[type][id].addClass('kb-function-dim');
                        // self.methodSet[methId].$elem.hide();
                        // self.methodSet[methId].$elem.addClass('kb-function-dim');
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
})( jQuery )
);
