(function( $, undefined ) {
    $.KBWidget({
        name: 'kbaseNarrativeAppsPanel', 
        parent: 'kbaseNarrativeControlPanel',
        version: '0.0.1',
        options: {
            loadingImage: 'static/kbase/images/ajax-loader.gif',
            autopopulate: true,
            title: 'Apps',
            methodStoreURL: 'http://dev19.berkeley.kbase.us/narrative_method_store/rpc',
            appHelpLink: '/functional-site/#/narrativestore/app/',
        },

        init: function(options) {
            this._super(options);
            if (window.kbconfig && window.kbconfig.urls) {
                this.options.methodStoreURL = window.kbconfig.urls.narrative_method_store;
            }

            this.methClient = new NarrativeMethodStore(this.options.methodStoreURL);

            this.$appListElem = $('<ul>');

            // Make a function panel for everything to sit inside.
            this.$appPanel = $('<div>')
                             .addClass('kb-function-body')
                             .append(this.$appListElem);

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
            this.$bodyDiv.append($('<div>')
                                 .addClass('kb-narr-panel-body')
                                 .append(this.$appPanel)
                                 .append(this.$loadingPanel)
                                 .append(this.$errorPanel));

            // Add the tooltip panel
            this.initMethodTooltip();
            
            if (this.options.autopopulate === true) {
                this.refresh();
            }
            return this;
        },

        refresh: function() {
            this.showLoadingMessage("Loading KBase Apps from service...");

            this.methClient.list_apps({}, 
                $.proxy(function (appList) {
                    appList.sort(function(a, b) {
                        return a.name.localeCompare(b.name);
                    });
                    this.appList = appList;
                    for (var i=0; i<appList.length; i++) {
                        this.$appListElem.append(this.buildAppElem(appList[i]));
                        this.showAppPanel();
                    }
                }, this),
                $.proxy(function (error) {
                    this.showError(error);
                }, this)
            );
        },

        buildAppElem: function(app) {
            var $helpButton = $('<span>')
                              .addClass('glyphicon glyphicon-question-sign kb-function-help')
                              .css({'margin-top': '-5px'})
                              .click($.proxy(function(event) {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  this.showTooltip(app, event);
                              }, this));

            var $errButton = $('<span>')
                             .addClass('glyphicon glyphicon-warning-sign kb-function-help')
                             .css({'margin-top' : '-5px'})
                             .click($.proxy(function(event) {
                                event.preventDefault();
                                event.stopPropagation();
                                self.showErrorTooltip(app, event);
                             }, this));

            /* this is for handling long function names.
               long names will be cropped and have a tooltip
               with the full name */
            var appName = app.name;
            var $appSpan = $('<span class="kb-data-obj-name" style="margin-bottom:-5px">');
            if (appName.length > 31) {
                $appSpan.append(appName);
                $appSpan.tooltip({
                    title: app.name,
                    placement: "bottom"
                }); 
            } else {
                 $appSpan.append(appName);
            }
            
            var $newApp = $('<li>')
                             .append($appSpan);

            if (app.loading_error) {
                $newApp.addClass('kb-function-error')
                          .append($errButton)
                          .click($.proxy(function(event) {
                              this.showErrorTooltip(app, event);
                          }, this));
            }
            else {
                $newApp.append($helpButton)
                       .click(
                           $.proxy(function(event) {
                               this.trigger('appClicked.Narrative', app);
                           }, this));
                // $newApp.append($helpButton)
                //           .click($.proxy(function(event) {
                //               // needs to move to controller.
                //               this.methClient.get_app_spec({ 'ids' : [app.id] },
                //                   $.proxy(function(spec) {
                //                       this.trigger('appClicked.Narrative', spec[0]);
                //                   }, this),
                //                   $.proxy(function(error) {
                //                       this.showError(error);
                //                   }, this)
                //               );
                //           }, this));
            }
            return $newApp;            
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
                                  
            /* No app page yet, so for now we don't add this element - also need to uncomment the link in the showTooltip function
            this.help.$helpLinkout = $('<a>')
                                     .attr('href', this.options.methodHelpLink)
                                     .attr('target', '_blank')
                                     .append('More...'); */

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
        showTooltip: function(app, event) {
            this.help.$helpTitle.text(app.name);
            this.help.$helpVersion.text('v' + app.ver);
            this.help.$helpBody.html(app.tooltip);
            //this.help.$helpLinkout.attr('href', this.options.appHelpLink + app.id);
            this.help.$helpPanel.css({
                                       'left':event.pageX, 
                                       'top':event.pageY
                                     })
                                .show();
        },

        showErrorTooltip: function(app, event) {
            this.showTooltip({
                'name' : app.name,
                'ver' : app.ver,
                'id' : app.id,
                'tooltip' : "This App has an internal error and cannot currently be used.<br><br>The detailed error message is:<br>"+app.loading_error
            }, event);
        },
        

        /**
         * Shows a loading spinner or message on top of the panel.
         * @private
         */
        showLoadingMessage: function(message) {
            this.$loadingPanel.find('#message').empty();
            if (message) 
                this.$loadingPanel.find('#message').html(message);
            this.$appPanel.hide();
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
            this.$appPanel.show();
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

            this.$appPanel.hide();
            this.$loadingPanel.hide();
            this.$errorPanel.show();
        },

    });
})(jQuery);