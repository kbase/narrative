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
            title: 'Methods',
            methodStoreURL: 'http://dev19.berkeley.kbase.us/narrative_method_store',
        },
        services: null,

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

            /* There's a few bits here.
             * 1. It's all in a Bootstrap Panel scaffold.
             * 2. The panel-body section contains the core of the widget:
             *    a. loading panel (just a blank thing with a spinning gif)
             *    b. error panel
             *    c. actual function widget setup.
             *
             * So, initialize the scaffold, bind the three core pieces in the
             * panel-body, make sure the right one is being shown at the start,
             * and off we go.
             */
            if (window.kbconfig && window.kbconfig.urls) {
                this.options.methodStoreURL = window.kbconfig.urls.narrative_method_store;
            }

            var $searchDiv = $('<div>')
                             .addClass('input-group')
                             .css({'margin-bottom' : '3px'})

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
            $searchDiv.append(this.$searchInput)
                      .append($clearSearchBtn);

            // Make a function panel for everything to sit inside.
            this.$functionPanel = $('<div>')
                                  .addClass('kb-function-body')
                                  .append($searchDiv)
                                  .append(this.$toggleHiddenDiv);

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

            $('body').append(this.help.$helpPanel);

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
                              .click($.proxy(function(event) { self.$helpPanel.hide(); }, this));
            this.help.$helpTitle = $('<div>');
            this.help.$helpVersion = $('<div>');
            this.help.$helpBody = $('<div>');
            this.help.$helpLinkout = $('<a>')
                                .attr('href', this.methodHelpLink)
                                .append('Link out');

            this.help.$helpPanel.append(this.help.$helpTitle)
                                .append(this.help.$helpVersion)
                                .append(this.help.$helpBody)
                                .append(this.help.$helpLinkout)
                                .append($('<h2>').append('Click to hide'));
        },

        refreshFromService: function() {
            this.showLoadingMessage("Loading KBase Methods from service...");

            this.methClient.list_categories({'load_methods': 1}, 
                $.proxy(function(categories) {
                    this.parseMethodsFromService(categories[0], categories[1]);
                    this.showFunctionPanel();
                }, this),

                $.proxy(function(error) {
                    this.showError(error);
                }, this)
            );
        },

        /**
         * To do: handle category subsetting.
         * E.g.:
         * microbes
         * --> microbes annotation
         *     --> Annotate Genome
         */
        parseMethodsFromService: function(catSet, methSet) {
            // add the methods to their categories.
            for (var method in methSet) {
                parentList = methSet[method].categories;
                for (var i=0; i<parentList.length; i++) {
                    if (catSet[parentList[i]]) {
                        if (!catSet[parentList[i]].methods) {
                            catSet[parentList[i]].methods = [];
                        }
                        catSet[parentList[i]].methods.push(methSet[method]);
                    }
                }
            }
            // Make a method button for each method.
            var accordionList = [];
            for (var cat in catSet) {
                if (catSet[cat].methods.length == 0)
                    continue;
                catSet[cat].methods.sort(function(a, b) { return a.name.localeCompare(b.name); });
                var accordion = {
                    title : catSet[cat].name,
                };
                var $methodList = $('<ul>');
                for (var i=0; i<catSet[cat].methods.length; i++) {

                    catSet[cat].methods[i].$elem = this.buildMethod(catSet[cat].methods[i]);
                    $methodList.append(catSet[cat].methods[i].$elem);
                }
                accordion['body'] = $methodList;
                accordionList.push(accordion);
            }
            this.services = catSet;
            this.trigger('servicesUpdated.Narrative', [this.services]);

            // sort by category name
            accordionList.sort(function(a, b) {
                return a.title.localeCompare(b.title);
            });

            var accElements = this.buildAccordion(accordionList);
            this.$functionPanel.append(accElements[0]);
            this.accordionElements = accElements[1];
        },

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
        buildMethod: function(method) {
            var $helpButton = $('<span>')
                              .addClass('glyphicon glyphicon-question-sign kb-function-help')
                              .css({'margin-top': '-5px'})
                              .click($.proxy(function(event) {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  this.showTooltip(method, event);
                              }, this));

            var $errButton = $('<span>')
                             .addClass('glyphicon glyphicon-warning-sign kb-function-help')
                             .css({'margin-top' : '-5px'})
                             .click($.proxy(function(event) {
                                event.preventDefault();
                                event.stopPropagation();
                                this.showErrorTooltip(method, event);
                             }, this));

            /* this is for handling long function names.
               long names will be cropped and have a tooltip
               with the full name */
            var methodTitle = method.name;
            var $methodSpan = $('<span class="kb-data-obj-name" style="margin-bottom:-5px">');
            if (methodTitle.length > 31) {
                $methodSpan.append(methodTitle);
                $methodSpan.tooltip({
                    title: method.name,
                    placement: "bottom"
                }); 
            } else {
                 $methodSpan.append(methodTitle);
            }
            
            var $newMethod = $('<li>')
                             .append($methodSpan);

            if (method.loading_error) {
                $newMethod.addClass('kb-function-error')
                          .append($errButton)
                          .click($.proxy(function(event) {
                              this.showErrorTooltip(method, event);
                          }, this));
            }
            else {
                $newMethod.append($helpButton)
                          .click($.proxy(function(event) {
                              // needs to move to controller.
                              this.methClient.get_method_spec({ 'ids' : [method.id] },
                                  $.proxy(function(spec) {
                                      this.trigger('methodClicked.Narrative', spec[0]);
                                  }, this),
                                  $.proxy(function(error) {
                                      this.showError(error);
                                  }, this)
                              );
                          }, this));
            }
            return $newMethod;
        },

        /**
         * Shows a popup panel with a description of the clicked method.
         * @param {object} method - the method containing a title and 
         * description for populating the popup.
         * @private
         */
        showTooltip: function(method, event) {
            this.help.$helpPanel.css({
                               'left':event.pageX, 
                               'top':event.pageY
                           })
                           .empty()
                           .append($('<h1>').append(method.name))
                           .append('v' + method.ver + '<br>')
                           .append(method.tooltip)
                           .append($('<h2>').append('Click to hide'))
                           .show();
        },

        showErrorTooltip: function(method, event) {
            this.help.$helpPanel.css({
                                'left': event.pageX,
                                'top': event.pageY
                           })
                           .empty()
                           .append($('<h1>').append(method.name))
                           .append('v' + method.ver + '<br>')
                           .append('This function has an error and cannot currently be used.')
                           .append($('<h2>').append('Click to hide'))
                           .show();
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
                              .click(function(event) { self.trigger('function_clicked.Narrative', method); });

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

        textFilter: function(pattern, method) {
            var lcName = method.name.toLowerCase();
            return lcName.indexOf(pattern.toLowerCase()) > -1;
        },

        /**
         * For each method, run it through filterFn. If it returns something truthy,
         * it passes, if it returns something faily, it fails.
         *
         * If it passes, do nothing. If it fails, dim it out.
         *
         * So we need a handle on the functions. No big.
         */
        visualFilter: function(filterFn, fnInput) {
            var numHidden = 0;
            for (var catId in this.services) {
                var cat = this.services[catId];
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

        toggleHiddenMethods: function(show) {
            /* 2 cases
             * show is truthy -> show()
             * show is falsy -> hide()
             */

            // if show, show 'em all, and trigger the class for the kb-has-hidden attribute
            if (show) {
                this.$functionPanel.find('.panel-default').show();
                this.$functionPanel.find('.kb-data-obj-name').parent().show();
                this.$functionPanel.find('[kb-has-hidden]').addClass('kb-function-cat-dim');
            }
            // otherwise, remove the kb-function-cat-dim class from everything, and
            // show only those that do not have kb-function-dim, and hide the rest
            else {
                this.$functionPanel.find('.panel-default').removeClass('kb-function-cat-dim');
                this.$functionPanel.find('.kb-function-dim').hide();
                this.$functionPanel.find('.panel:not(.kb-function-dim)').show();
                this.$functionPanel.find('li:not(.kb-function-dim)').show();
            }
        },














        /***************************************************************/
        /* OLD DEPRECATED METHODS NOT IN USE WITH METHOD STORE SERVICE */
        /***************************************************************/
//         refreshAJAX: function() {
//             this.showLoadingMessage("Loading available KBase Methods...");

//             var prom = $.getJSON('static/kbase/services.json', $.proxy(
//                 function(serviceSet) {
//                     this.populateFunctionList(serviceSet);
//                     this.showFunctionPanel();
//                 }, this)
//             );

//             prom.fail($.proxy(function(error) {
//                     this.showLoadingMessage("Unable to load from cache, waiting on kernel...");

//                     $([IPython.events]).one('status_started.Kernel', $.proxy(function() {
//                         console.log("Pausing for 500 ms before requesting service info from kernel");
//                         setTimeout( $.proxy(function() { this.refresh(); }, this), 500 );
//                     }, this));
//                 }, this)
//             );
//         },

//         /**
//          * Refreshes the list of loaded functions.
//          * This makes a kernel call, fetches the list of functions as an object,
//          * pulls out necessary fields, and constructs the function list from them.
//          * @private
//          */
//         refresh: function(msg) {
//             if (!IPython || !IPython.notebook || !IPython.notebook.kernel)
//                 return;

//             if (!msg)
//                 msg = "Loading available KBase Services...";
//             this.showLoadingMessage(msg);

//             // Command to load and fetch all functions from the kernel
//             var fetchFunctionsCommand = 'import biokbase.narrative.common.service_root as root\n' + 
//                                         'print root.service.get_all_services(as_json_schema=True)\n';

//             var callbacks = {
//                 'output' : $.proxy(function(msgType, content) { 
//                     this.parseKernelResponse(msgType, content); 
//                     this.showFunctionPanel();
//                 }, this),
//                 'execute_reply' : $.proxy(function(content) { 
//                     this.handleCallback("execute_reply", content); 
//                 }, this),
//                 'clear_output' : $.proxy(function(content) { 
//                     this.handleCallback("clear_output", content); 
//                 }, this),
//                 'set_next_input' : $.proxy(function(content) { 
//                     this.handleCallback("set_next_input", content); 
//                 }, this),
//                 'input_request' : $.proxy(function(content) { 
//                     this.handleCallback("input_request", content); 
//                 }, this),
//             };

//             var msgid = IPython.notebook.kernel.execute(fetchFunctionsCommand, callbacks, {silent: true});
//         },

//         handleCallback: function(call, content) {
//             if (content.status === "error") {
//                 this.showError(content);
//             }
//             else {
//                 console.debug("kbaseNarrativeFunctionPanel." + call);
//                 console.debug(content);
//             }
//         },

//         /**
//          * Parses the text response from the kernel. If this response is not a "stream" type,
//          * then an error is raised and execution stops.
//          * @param {string} msgType - a string representing the type of message being propagated
//          * @param {object} content - the content of the message
//          * @private
//          */
//         parseKernelResponse: function(msgType, content) {
//             // if it's not a datastream, display some kind of error, and return.
//             // this.dbg("kbaseNarrativeFunctionPanel.parseKernelResponse");
//             // this.dbg(content);

//             if (msgType != 'stream') {
//                 this.showError('Sorry, an error occurred while loading the function list.');
//                 return;
//             }
//             var buffer = content.data;
//             if (buffer.length > 0) {
//                 var serviceSet = JSON.parse(buffer);
//                 this.populateFunctionList(serviceSet);
//             }
//             this.$loadingPanel.hide();
//         },

//         /**
//          * Populates the list of functions with clickable elements and hints/help popups.
//          * @param {object} serviceSet - the object representing the set of loaded services
//          * and their functions.
//          * @private
//          */
//         populateFunctionList: function(serviceSet) {
//             var totalFunctions = 0;
//             var totalServices = 0;

//             var serviceAccordion = [];

//             this.services = {};
//             for (var serviceName in serviceSet) {

//                 // make a little local hash to store in the element for quick lookup.
//                 var localService = {};
//                 var pre_functions = totalFunctions;
//                 var $methodList = $('<ul>');
//                 var service = serviceSet[serviceName];
//                 for (var i=0; i < service.methods.length; i++) {
//                     var method = service.methods[i];
//                     // Skip methods that are not visible
//                     if (!method.visible) {
//                         continue;
//                     }
//                     totalFunctions++;
//                     method['service'] = serviceName;
//                     $methodList.append(this.buildFunction(method));
//                     localService[service.methods[i].title] = 1;
//                 }
//                 // Only add service if >0 methods.
//                 if (totalFunctions > pre_functions) {
//                     serviceAccordion.push({
//                         'title': serviceName,
//                         'body': $methodList
//                     });
//                     totalServices++;
//                 }
//                 this.services[serviceName] = localService;
//             }

//             // sort by service title
//             serviceAccordion.sort(function(a, b) {
//                 return a.title.localeCompare(b.title);
//             });

//             this.trigger('servicesUpdated.Narrative', [this.services]);

//             // Left here in case we want to use it again!
//             // console.log("Total Services: " + totalServices);
//             // console.log("Total Functions: " + totalFunctions);

//             this.$elem.find('.kb-function-body').kbaseAccordion( { elements : serviceAccordion } );
//         },

//         /**
//          * Creates and returns a list item containing info about the given narrative function.
//          * Clicking the function anywhere outside the help (?) button will trigger a 
//          * function_clicked.Narrative event. Clicking the help (?) button will trigger a 
//          * function_help.Narrative event.
//          * 
//          * Both events have the relevant data passed along with them for use by the responding
//          * element.
//          * @param {object} method - the method object returned from the kernel.
//          * @private
//          */
//         buildFunction: function(method) {
//             var self = this;

//             var $helpButton = $('<span>')
//                               .addClass('glyphicon glyphicon-question-sign kb-function-help')
//                               .css({'margin-top': '-5px'})
//                               .click(function(event) { 
//                                   event.preventDefault(); 
//                                   event.stopPropagation(); 
//                                   self.showHelpPopup(method, event); 
//                               });

//             /* this is for handling long function names.
//                long names will be cropped and have a tooltip 
//                with the full name */
//             var methodTitle = method.title;
//             var methodSpan = $('<span class="kb-data-obj-name" style="margin-bottom:-5px">');
//             if (methodTitle.length > 31) {
// //                methodTitle = methodTitle.substring(0, 29) + "...";
//                 methodSpan.append(methodTitle);
//                 methodSpan.tooltip({
//                     title: method.title,
//                     placement: "bottom"
//                 }); 
//             } else {
//                  methodSpan.append(methodTitle);
//             }
            
//             var $newFunction = $('<li>')
//                                .append(methodSpan)
//                                .append($helpButton)
//                                .click(function(event) {
//                                    self.trigger('function_clicked.Narrative', method); 
//                                });

//             return $newFunction;
//         },

//         /**
//          * Shows a popup panel with a description of the clicked method.
//          * @param {object} method - the method containing a title and 
//          * description for populating the popup.
//          * @private
//          */
//         showHelpPopup: function(method, event) {
//             this.$helpPanel.css({'left':event.pageX, 'top':event.pageY})
//             this.$helpPanel.empty();
//             this.$helpPanel.append($('<h1>').append(method.name + ' Help'))
//                            .append(method.tooltip)
//                            .append($('<h2>').append('Click to hide'));
//             this.$helpPanel.show();
//         },
    });
})( jQuery );