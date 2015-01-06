/**
 * A widget that contains functions and function information for the Narrative.
 * When initialized, it uses a loading gif while waiting for functions to load
 * (unless functions were passed in on construction).
 *
 * Each function is presented in a list (for now - accordion may be coming soon)
 * and when clicked will fire a "function_clicked.narrative" event.
 *
 * @author Bill Riehl <wjriehl@lbl.gov>
 * @public
 */
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
        services: null,
        ignoreCategories: { 'inactive' : 1 },
        appList: null,
        methodList: null,
        id2Elem: {},

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
                                        this.visualFilter(this.textFilter, this.$searchInput.val());
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

            var $ipyButtonDiv = $('<div style="margin-bottom:5px">')
                                .append($('<button>')
                                        .addClass('btn btn-warning')
                                        .append($('<span style="color:#fff; font-weight:bold">')
                                                .addClass('fa fa-terminal')
                                                .append(' Code Cell'))
                                        .click(function(event) {
                                            IPython.notebook.insert_cell_below('code');
                                        }))
                                .append($('<button>')
                                        .addClass('btn btn-warning pull-right')
                                        .append($('<span style="color:#fff; font-weight:bold">')
                                                .addClass('fa fa-paragraph')
                                                .append(' Text Cell'))
                                        .click(function(event) {
                                            IPython.notebook.insert_cell_below('markdown');
                                        }));

            // placeholder for apps and methods once they're loaded.
            this.$methodList = $('<div>')
                               .css({'height' : '300px', 'overflow-y': 'auto', 'overflow-x' : 'hidden'});
            // Make a function panel for everything to sit inside.
            this.$functionPanel = $('<div>')
                                  .addClass('kb-function-body')
                                  .append($ipyButtonDiv)
                                  .append(this.$searchDiv)
                                  .append(this.$toggleHiddenDiv)
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

            $(document).on('hasFunction.Narrative', 
                $.proxy(function(e, service, method, callback) {
                    if (callback) {
                        callback(this.hasFunction(service, method));
                    }
                }, this)
            );

            this.addButton($('<button>')
                           .addClass('btn btn-xs btn-default')
                           .append('<span class="fa fa-search"></span>')
                           .click($.proxy(function(event) {
                               this.$searchDiv.slideToggle(400);
                           }, this)));
            this.addButton($('<button>')
                           .addClass('btn btn-xs btn-default')
                           .append('<span class="glyphicon glyphicon-play"></span>')
                           .click($.proxy(function(event) {
                               this.trigger('hideSidePanelOverlay.Narrative');
                               this.toggleOverlay();
                           }, this)));

            $(document).on('hideGalleryPanelOverlay.Narrative', $.proxy(function(event) {
                this.hideOverlay();
            }, this));

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
                console.log([this.appSpecs, this.methodSpecs, this.categories]);
                this.parseMethodsAndApps(this.categories, this.methodSpecs, this.appSpecs);
                this.showFunctionPanel();
            }, this));

            $.when(methodProm, appProm).fail(function(err) {
                console.log("error'd!")
                console.log(err);
            });
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
                for (var fn in fnSet) {
                    var ignoreFlag = false;
                    for (var i=0; i<fnSet[fn].info.categories.length; i++) {
                        if (self.ignoreCategories[fnSet[fn].info.categories[i]])
                            ignoreFlag = true;
                    }
                    if (!ignoreFlag)
                        fnList.push(fnSet[fn]);
                }
                fnList.sort(function(a, b) {
                    return a.info.name.localeCompare(b.info.name);
                });
                for (var i=0; i<fnList.length; i++) {
                    var $fnElem = self.buildMethod(icon, fnList[i], callback);
                    $fnPanel.append($fnElem);
                    self.methodSet[fnList[i].info.id] = fnList[i];
                    self.id2Elem[fnList[i].info.id] = $fnElem;
//                    self.methodSet[fnList[i].info.id]['$elem'] = $fnElem;
                }
                return $fnPanel;
            };

            this.methodSet = {};

            var $methodPanel = generatePanel(catSet, methSet, 'M', triggerMethod);
            var $appPanel = generatePanel(catSet, appSet, 'A', triggerApp);

            this.$methodList.empty().append($appPanel).append($methodPanel);
        },

        /**
         * To do: handle category subsetting.
         * E.g.:
         * microbes
         * --> microbes annotation
         *     --> Annotate Genome
         */
        // parseMethodsFromService: function(catSet, methSet) {
        //     var self = this;
        //     var triggerMethod = function(method) {
        //         self.methClient.get_method_spec({ 'ids' : [method.id] },
        //             function(spec) {
        //                 self.trigger('methodClicked.Narrative', spec[0]);
        //             },
        //             function(error) {
        //                 self.showError(error);
        //             }
        //         );
        //     };

        //     var triggerApp = function(app) {
        //         this.trigger('appClicked.Narrative', app);
        //     };

        //     // add the methods to their categories.
        //     for (var method in methSet) {
        //         parentList = methSet[method].categories;
        //         for (var i=0; i<parentList.length; i++) {
        //             if (catSet[parentList[i]]) {
        //                 if (!catSet[parentList[i]].methods) {
        //                     catSet[parentList[i]].methods = [];
        //                 }
        //                 catSet[parentList[i]].methods.push(methSet[method]);
        //             }
        //         }
        //     }
        //     // Make a method button for each method.
        //     var accordionList = [];
        //     for (var cat in catSet) {
        //         if (!catSet[cat].methods || catSet[cat].methods.length == 0)
        //             continue;
        //         catSet[cat].methods.sort(function(a, b) { return a.name.localeCompare(b.name); });
        //         var accordion = {
        //             title : catSet[cat].name,
        //         };
        //         var $methodList = $('<div>');
        //         for (var i=0; i<catSet[cat].methods.length; i++) {

        //             catSet[cat].methods[i].$elem = this.buildMethod(catSet[cat].methods[i], triggerMethod);
        //             $methodList.append(catSet[cat].methods[i].$elem);
        //         }
        //         accordion['body'] = $methodList;
        //         accordionList.push(accordion);
        //     }
        //     this.services = catSet;
        //     this.trigger('servicesUpdated.Narrative', [this.services]);

        //     // sort by category name
        //     accordionList.sort(function(a, b) {
        //         return a.title.localeCompare(b.title);
        //     });

        //     var accElements = this.buildAccordion(accordionList);
        //     this.$functionPanel.append(accElements[0]);
        //     this.accordionElements = accElements[1];
        // },

        /**
         * Creates and returns a list item containing info about the given narrative function.
         * Clicking the function anywhere outside the help (?) button will trigger a 
         * function_clicked.Narrative event. Clicking the help (?) button will trigger a 
         * function_help.Narrative event.
         * 
         * Both events have the relevant data passed along with them for use by the responding
         * element.
         * @param {object} method - the method object returned from the kernel.
         * @private
         */
        buildMethod: function(icon, method, triggerFn) {
            var $logo = $('<div>')
                        .addClass('kb-method-list-logo')
                        .css({ 'background-color' : this.logoColorLookup(icon) })
                        .append(icon)
                        .click($.proxy(function(e) {
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
                           //.addClass('btn btn-default btn-xs kb-data-list-more-btn pull-right fa fa-ellipsis-h')
                           .addClass('kb-data-list-more fa fa-ellipsis-h')
                           .attr('aria-hidden', 'true')
                           .css({'color' : '#999'});
                           /* click behavior is now attached to entire row...
                            .click(function(e) {
                               $more.slideToggle('fast', $.proxy(function() {
                                }, this));
                           });*/

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
                                             .css({'width':'20%'})
                                             .append($logo))
                                     .append($('<td>')
                                             // .css({'width':'80%'})
                                             .append($mainDiv)));

            return $('<div>')
                        .append($('<hr>').addClass('kb-data-list-row-hr'))
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
        hasFunction: function(service, method) {
            if (!this.services)
                return true;

            console.debug("looking up '" + service + "'.'" + method + "'");
            if (this.services.hasOwnProperty(service))
                return this.services[service].hasOwnProperty(method);
            return false;
        },


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
        addFunction: function(method) {
            var self = this;
            var $funcButton = $('<button>')
                              .attr('type', 'button')
                              .addClass('btn btn-default')
                              .append(method.title)
                              .click(function(event) { console.log(method); self.trigger('function_clicked.Narrative', method); });

            var $helpButton = $('<span>')
                              .addClass('glyphicon glyphicon-question-sign')
                              .css({'float': 'right', 
                                    'cursor': 'pointer',
                                    'font-size': '14pt',
                                    'color': '#0064b6'})
                              .click(function(event) { self.showHelpPopup(method); });

            this.$functionList.append($('<li>')
                                        .append($funcButton)
                                        .append($helpButton)
                                     );
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
         * A *REALLY* simple filter based on whether the given pattern string is present in the 
         * method's name.
         * Returns true if so, false if not.
         * Doesn't care if its a method or an app, since they both have name fields at their root.
         */
        textFilter: function(pattern, method) {
            var lcName = method.name.toLowerCase();
            return lcName.indexOf(pattern.toLowerCase()) > -1;
        },

        /**
         * Returns true if the type is available as in input to the method, false otherwise
         */
        inputFilter: function(type, spec) {
            return true;
        },

        /**
         * For each method, run it through filterFn. If it returns something truthy,
         * it passes, if it returns something faily, it fails.
         *
         * If it passes, do nothing. If it fails, dim it out.
         *
         * So we need a handle on the functions. No big.
         * !!! THIS IS OLD - We aren't using the accordion style before February, so 
         * this needs to be slightly twiddled.
         * !!!
         */
        visualFilterAccordion: function(filterFn, fnInput) {
            var numHidden = 0;
            for (var catId in this.services) {
                var cat = this.services[catId];
                if (!cat.methods || cat.methods.length === 0)
                    continue;
                
                var numPass = 0;
                for (var i=0; i<cat.methods.length; i++) {
                    if (!filterFn(fnInput, cat.methods[i])) {
                        cat.methods[i].$elem.hide();
                        cat.methods[i].$elem.addClass('kb-function-dim');
                        numHidden++;
                    }
                    else {
                        cat.methods[i].$elem.removeClass('kb-function-dim');
                        cat.methods[i].$elem.show();
                        numPass++;
                    }
                }
                if (numPass === 0) {
                    this.accordionElements[cat.name].addClass('kb-function-dim');
                    this.accordionElements[cat.name].removeAttr('kb-has-hidden');
                    this.accordionElements[cat.name].removeClass('kb-function-cat-dim');
                }
                else if (numPass < cat.methods.length) {
                    this.accordionElements[cat.name].attr('kb-has-hidden', '1');
                    this.accordionElements[cat.name].removeClass('kb-function-dim');
                }
                else {
                    this.accordionElements[cat.name].removeClass('kb-function-dim kb-function-cat-dim');
                    this.accordionElements[cat.name].removeAttr('kb-has-hidden');
                }
            }
            if (numHidden > 0) {
                this.$numHiddenSpan.text(numHidden);
                this.$toggleHiddenDiv.show();
                this.toggleHiddenMethods(this.$showHideSpan.text() !== 'show');
            }
            else {
                this.$toggleHiddenDiv.hide();
                this.toggleHiddenMethods(1);
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
            console.log(this.methodSet);
            var numHidden = 0;
            for (var methId in this.methodSet) {
                if (!filterFn(fnInput, this.methodSet[methId])) {
                    this.methodSet[methId].$elem.hide();
                    this.methodSet[methId].$elem.addClass('kb-function-dim');
                    numHidden++;
                }
                else {
                    this.methodSet[methId].$elem.removeClass('kb-function-dim');
                    this.methodSet[methId].$elem.show();
                }
            }
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


        //cobbled together crap. Hacked out of kbaseNarrativeSidePanel and pulled into here
        //to create the method gallery panel.
        buildTabs: function(tabs) {
            var $header = $('<div>');
            var $body = $('<div>');

            for (var i=0; i<tabs.length; i++) {
                var tab = tabs[i];
                $header.append($('<div>')
                               .addClass('kb-side-header')
                               .css('width', (100/tabs.length)+'%')
                               .append(tab.tabName));
                $body.append($('<div>')
                             .addClass('kb-side-tab')
                             .append(tab.content));
            }
            $header.find('div').click(function(event) {
                event.preventDefault();
                event.stopPropagation();
                var $headerDiv = $(event.currentTarget);

                if (!$headerDiv.hasClass('active')) {
                    var idx = $headerDiv.index();
                    $header.find('div').removeClass('active');
                    $headerDiv.addClass('active');
                    $body.find('div.kb-side-tab').removeClass('active');
                    $body.find('div:nth-child(' + (idx+1) + ').kb-side-tab').addClass('active');
                }
            });

            $header.find('div:first-child').addClass('active');
            $body.find('div:first-child.kb-side-tab').addClass('active');

            return {
                header: $header,
                body: $body
            };
        },

        initOverlay: function() {
            var $overlayHeader = $('<div>')
                                 .addClass('kb-side-overlay-header')
                                 .append('Header!')
                                 .append($('<div>')
                                        .addClass('pull-right')
                                        .append($('<span>')
                                                .addClass('kb-side-overlay-close glyphicon glyphicon-remove')
                                        .click($.proxy(function(event) {
                                           this.toggleOverlay();
                                        }, this))));

            // styling is easier if there is a class for containers
            this.$overlayBody = $('<div class="kb-overlay-body">');

            this.$overlayFooter  = $('<div class="kb-overlay-footer">');

            this.$overlay = $('<div>')
                            .addClass('kb-side-overlay-container')
                            //.append($overlayHeader)
                            .append(this.$overlayBody)
                            .append(this.$overlayFooter);

            $('body').append(this.$overlay);
            this.$overlay.hide();

            this.$narrativeDimmer = $('<div>')
                                    .addClass('kb-overlay-dimmer');
            $('body').append(this.$narrativeDimmer);
            this.$narrativeDimmer.hide();
            this.updateOverlayPosition();

            this.buildOverlay();
        },

        updateOverlayPosition: function() {
        console.log("ME IS ", this.$elem);
        console.log("HE IS", this.$elem.closest('.kb-side-panel'));
            this.$overlay.position({my: 'left top', at: 'right top', of: this.$elem.closest('.kb-side-panel')});
            this.$narrativeDimmer.position({my: 'left top', at: 'right top', of: this.$elem.closest('.kb-side-panel')});
        },

        toggleOverlay: function() {

            if (this.$overlay == undefined) {
                this.initOverlay();
            }

            if (this.$overlay.is(':visible'))
                this.hideOverlay();
            else
                this.showOverlay();
        },

        showOverlay: function() {
            if (this.$overlay) {
                this.$narrativeDimmer.show();
                this.$elem.find('.kb-side-header').addClass('overlay-active');
                this.$overlay.show('slide', 'fast', $.proxy(function() {
                }, this));
            }
        },

        hideOverlay: function() {
            if (this.$overlay) {
                this.$narrativeDimmer.hide();
                this.$elem.find('.kb-side-header').removeClass('overlay-active');
                this.$overlay.hide('slide', 'fast', $.proxy(function() {
                }, this));
            }
        },

        /**
         * Builds the general structure for a panel set.
         * These are intended to start with 2 panels, but we can move from there if needed.
         *
         * (I'll jsdoc this up in a bit)
         * widgets = [
         *     {
         *         name: kbaseNarrativeDataPanel (for instance)
         *         params: {}
         *     }
         * ]
         * @param {object} widgets
         *
         */


        /**
         * Renders the method gallery panel
        */
        buildOverlay: function() {
            var narWSName;
            $(document).on('setWorkspaceName.Narrative', function(e, info){
                narWSName = info.wsId;
            })

            var self = this;
            var user = $("#signin-button").kbaseLogin('session', 'user_id');

            var body = this.$overlayBody;
            var footer = this.$overlayFooter;

            // models
            var myData = [],
                sharedData = [],
                publicData = [];

            // models for filter selections
            var query;

            // models for options in type and workspace dropdowns
            var types = [];
                workspaces =[];

            // tab panels
            var minePanel = $('<div class="kb-import-panel">'),
                sharedPanel = $('<div class="kb-import-panel">'),
                publicPanel = $('<div class="kb-import-panel">'),
                importPanel = $('<div class="kb-import-panel">');
                galleryPanel = $('<div class="kb-import-panel">');

            // content wrapper
            var content = $('<div class="kb-import-content">');

            // add tabs
            var $tabs = this.buildTabs([
                    {tabName: 'Gallery', content: galleryPanel},
                ]);

            galleryPanel.kbaseMethodGallery({sidePanel : this});

            body.addClass('kb-side-panel');
            body.append($tabs.header).append($tabs.body);

            // It is silly to invoke a new object for each widget
            var auth = {token: $("#signin-button").kbaseLogin('session', 'token')}
            var ws = new Workspace(this.options.workspaceURL, auth);


            // get possible types (not used)
            /*
            ws.list_all_types({}).done(function(res) {
                console.log('types', res)

                var types = [];
                for (var mod in res) {
                    var typeNames = res[mod]
                    for (var type in typeNames) {
                        types.push(type);
                    }
                }
                console.log('type_names', types)
            })*/


            // add footer status container and button
            var importStatus = $('<div class="pull-left kb-import-status">');
            footer.append(importStatus)

            body.append(footer);


            }

        //end cobbled together crap
    });
})( jQuery );