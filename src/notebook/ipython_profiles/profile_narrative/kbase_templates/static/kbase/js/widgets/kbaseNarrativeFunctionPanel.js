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
        name: 'kbaseNarrativeFunctionPanel', 
        parent: 'kbaseWidget',
        version: '0.0.1',
        options: {
            loadingImage: 'static/kbase/images/ajax-loader.gif',
        },

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

//            this.$functionList = $('<ul>');

            // Make and append the header.
            this.$elem.append($('<div>')
                              .addClass('kb-function-header')
                              .append('Functions'));

            // Make a function panel for everything to sit inside.
            this.$functionPanel = $('<div>')
                                  .addClass('kb-function-body');
//                                  .append(this.$functionList);
            this.$elem.append(this.$functionPanel);

            // The 'loading' panel should just have a spinning gif in it.
            this.$loadingPanel = $('<div>')
                                 .addClass('kb-loading')
                                 .append('<img src="' + this.options.loadingImage + '">')
                                 .hide();
            this.$elem.append(this.$loadingPanel);

            // The error panel should overlap everything.
            this.$errorPanel = $('<div>')
                               .addClass('kb-error')
                               .hide();

            this.$elem.append(this.$errorPanel);

            // The help element should be outside of the panel itself, so it can be manipulated separately.
            // It should hide itself when clicked.
            var self = this;
            this.$helpPanel = $('<div>')
                              .addClass('kb-function-help-popup alert alert-info')
                              .hide()
                              .click(function(event) { self.$helpPanel.hide(); });

            this.$elem.append(this.$helpPanel);
            this.refresh();

            return this;
        },
        
        /**
         * Refreshes the list of loaded functions.
         * This makes a kernel call, fetches the list of functions as an object,
         * pulls out necessary fields, and constructs the function list from them.
         * @private
         */
        refresh: function() {
            this.showLoadingMessage();

            // Command to load and fetch all functions from the kernel
            var fetchFunctionsCommand = 'import biokbase.narrative.common.service_root as root\n' + 
                                        'print root.service.get_all_services(as_json_schema=True)\n';

            var self = this;
            // We really only need the 'output' callback here.
            var callbacks = {
                'output' : function(msgType, content) { 
                    self.parseKernelResponse(msgType, content); 
                    self.showFunctionPanel();
                },
                'execute_reply' : function(content) { 
                    self.handleCallback("execute_reply", content); 
                },
                'clear_output' : function(content) { 
                    self.handleCallback("clear_output", content); 
                },
                'set_next_input' : function(content) { 
                    self.handleCallback("set_next_input", content); 
                },
                'input_request' : function(content) { 
                    self.handleCallback("input_request", content); 
                },
            };

            var msgid = IPython.notebook.kernel.execute(fetchFunctionsCommand, callbacks, {silent: true});
        },

        handleCallback: function(call, content) {
            this.dbg("kbaseNarrativeFunctionPanel.handleCallback - " + call);
            this.dbg(content);

            if (content.status === "error") {
                this.showError(content);
            }
        },

        /**
         * Parses the text response from the kernel. If this response is not a "stream" type,
         * then an error is raised and execution stops.
         * @param {string} msgType - a string representing the type of message being propagated
         * @param {object} content - the content of the message
         * @private
         */
        parseKernelResponse: function(msgType, content) {
            // if it's not a datastream, display some kind of error, and return.
            this.dbg("kbaseNarrativeFunctionPanel.parseKernelResponse");
            this.dbg(content);

            if (msgType != 'stream') {
                this.showError('Sorry, an error occurred while loading the function list.');
                return;
            }
            var buffer = content.data;
            if (buffer.length > 0) {
                var serviceSet = JSON.parse(buffer);
                this.populateFunctionList(serviceSet);
            }
            this.$loadingPanel.hide();
        },

        /**
         * Populates the list of functions with clickable elements and hints/help popups.
         * @param {object} serviceSet - the object representing the set of loaded services
         * and their functions.
         * @private
         */
        populateFunctionList: function(serviceSet) {
            var serviceAccordion = [];

            for (var serviceName in serviceSet) {
                var $methodList = $('<ul>');
                var service = serviceSet[serviceName];
                for (var i=0; i<service.methods.length; i++) {
                    var method = service.methods[i];
                    method['service'] = serviceName;
                    $methodList.append(this.buildFunction(method));
                }

                serviceAccordion.push({
                    'title' : serviceName,
                    'body' : $methodList
                });
            }

            this.$elem.find('.kb-function-body').kbaseAccordion( { elements : serviceAccordion } );

            /** pre-accordion code commented out below **/
            // for (var serviceName in serviceSet) {
            //     var service = serviceSet[serviceName];
            //     for (var i=0; i<service.methods.length; i++) {
            //         var method = service.methods[i];
            //         method['service'] = serviceName;
            //         this.addFunction(method);
            //     }
            // }
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
        buildFunction: function(method) {
            var self = this;

            var $helpButton = $('<span>')
                              .addClass('glyphicon glyphicon-question-sign kb-function-help')
                              .css({'margin-top': '-5px'})
                              .click(function(event) { event.preventDefault(); event.stopPropagation(); self.showHelpPopup(method); });

            var $newFunction = $('<li>')
                               .append(method.title)
                               .click(function(event) { self.trigger('function_clicked.Narrative', method); })
                               .append($helpButton);

            return $newFunction;
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
         * Shows a popup panel with a description of the clicked method.
         * @param {object} method - the method containing a title and 
         * description for populating the popup.
         * @private
         */
        showHelpPopup: function(method) {
            console.log(method);
            this.$helpPanel.empty();
            this.$helpPanel.append($('<h1>').append(method.title + ' Help'))
                           .append(method.description)
                           .append($('<h2>').append('Click to hide'));
            this.$helpPanel.show();
        },

        /**
         * Shows a loading spinner or message on top of the panel.
         * @private
         */
        showLoadingMessage: function() {
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
    });

})( jQuery );