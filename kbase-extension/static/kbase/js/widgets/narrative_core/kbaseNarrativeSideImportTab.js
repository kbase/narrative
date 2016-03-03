/*global define*/
/*jslint white: true*/
/**
 * "Import" tab on data side panel.
 * @author Roman Sutormin <rsutormin@lbl.gov>
 * @public
 */
define(['jquery', 
        'narrativeConfig',
        'kbwidget', 
        'kbaseAuthenticatedWidget', 
        'select2',
        'json!kbase/config/upload_config.json',
        'util/string'], 
function($,
         Config,
         kbwidget,
         kbaseAuthenticatedWidget,
         select2,
         transformConfig,
         StringUtil) {
    'use strict';
    $.KBWidget({
        name: "kbaseNarrativeSideImportTab",
        parent: "kbaseAuthenticatedWidget",
        version: "1.0.0",
        options: {
            ws_name: null
        },
        token: null,
        wsName: null,
        loadingImage: Config.get('loading_gif'),
        wsUrl: Config.url('workspace'),
        methodStoreURL: Config.url('narrative_method_store'),
        methClient: null,
        uploaderURL: Config.url('transform'),
        ujsURL: Config.url('user_and_job_state'),
        shockURL: Config.url('shock'),
        methods: null,          // {method_id -> method_spec}
        methodFullInfo: null,   // {method_id -> method_full_info}
        types: null,            // {type_name -> type_spec}
        selectedType: null,     // selected type name
        widgetPanel: null,      // div for selected type
        widgetPanelCard1: null, // first page with importer type combobox (this page will be put on widgetPanel) 
        widgetPanelCard2: null, // second page with import widget (this page will be put on widgetPanel) 
        infoPanel: null,
        inputWidget: null,      // {methodId -> widget for selected type}
        tabs: null,             // mapping {methodId -> div}
	fileUploadInProgress: false,
        
        init: function(options) {
            this._super(options);
            this.wsName = Jupyter.narrative.getWorkspaceName();

            return this;
        },
        
        render: function() {
            var self = this;
            this.inputWidget = {};
            this.tabs = {};
            var errorModalId = "app-error-modal-" + StringUtil.uuid();
            var modalLabel = "app-error-modal-lablel-" + StringUtil.uuid();

            // Build error modal
            self.$errorModalContent = $('<div>');
            self.$errorModal = $('<div id="'+errorModalId+'" tabindex="-1" role="dialog" aria-labelledby="'+modalLabel+'" aria-hidden="true" style="position:auto">')
                               .addClass("modal fade");
            self.$errorModal.append(
                $('<div>').addClass('modal-dialog').append(
                    $('<div>').addClass('modal-content').append(
                        $('<div>').addClass('modal-header kb-app-step-error-main-heading').append('<h4 class="modal-title" id="'+modalLabel+'">Problems exist in your parameter settings.</h4>')
                    ).append(
                       $('<div>').addClass('modal-body').append(self.$errorModalContent)
                    ).append(
                        $('<div>').addClass('modal-footer').append(
                            $('<button type="button" data-dismiss="modal">').addClass("kb-default-btn").append("Dismiss"))
                    )
                ));
            $('body').append(self.$errorModal);

            // Build warning modal
            self.$warningModalContent = $('<div>');
            self.$warningModal =  $('<div tabindex="-1" role="dialog" aria-labelledby="'+modalLabel+'" aria-hidden="true" style="position:auto">').addClass("modal fade");
            var confirmButton = $('<button type="button" data-dismiss="modal">')
                                .addClass("btn")
                                .append("Confirm")
                                .click(
                                    $.proxy(function(event) {
                                       self.stopTimer();
                                       self.back();
                                    }, this)
                                );
            
            self.$warningModal.append(
                $('<div>').addClass('modal-dialog').append(
                    $('<div>').addClass('modal-content').append(
                        $('<div>').addClass('modal-header kb-app-step-error-main-heading').append('<h4 class="modal-title" id="'+modalLabel+'">User confirmation required.</h4>')
                    ).append(
                       $('<div>').addClass('modal-body').append(self.$warningModalContent)
                    ).append(
                        $('<div>').addClass('modal-footer').append(confirmButton).append(
                            $('<button type="button" data-dismiss="modal">').addClass("kb-default-btn").append("Cancel"))
                    )
                ));
            $('body').append(self.$warningModal);

            // Build widget container panel that holds importer inputs
            this.widgetPanel = $('<div>');
            this.widgetPanelCard1 = $('<div style="margin: 30px 30px 0px 30px;">');
            this.widgetPanel.append(this.widgetPanelCard1);
            this.widgetPanelCard1.append("<div class='kb-cell-run'><h2 class='collapse in'>" +
                    "Import data from your local computer or another data source. First, select the type of data you wish to import." +
                    "</h2></div><hr>");
            
            var $nameDiv = $('<div>')
                           .addClass("kb-method-parameter-name")
                           .css("text-align", "left")
                           .append("DATA TYPE");

            var $dropdown = $('<select>').css({width:"400px"});
            var $nextButton = $('<button>')
                              .attr('id', this.cellId + '-next')
                              .attr('type', 'button')
                              .attr('value', 'Next')
                              .addClass('kb-primary-btn')
                              .css({'border' : '4px'})
                              .append('Next');
            var $hintDiv = $('<div>')
                           .addClass("kb-method-parameter-hint")
                           .append("Use the pulldown menu of data types above " +
                                   "to select the type of data you wish to " +
                                   "import; then click the Next button.");

            $nextButton.click(
                $.proxy(function(event) {
                    event.preventDefault();
                    var selectedType = $dropdown.val();
                    self.showWidget(selectedType);
                }, this)
            );
            this.widgetPanelCard1
                .append('<div style="height: 30px">')
                .append($nameDiv)
                .append($('<div>').append($dropdown))
                .append($hintDiv)
                .append('<div style="height: 30px">')
                .append($('<div>').append($nextButton));
            
            this.widgetPanelCard2 = $('<div style="display: none; margin: 0px;">');
            this.widgetPanel.append(this.widgetPanelCard2);

            this.infoPanel = $('<div style="margin: 20px 30px 0px 30px;">');

            this.$mainPanel = $('<div>').css({'overflow-y':'auto','height':'604px'});
            this.$elem.append(this.$mainPanel);
            this.$mainPanel.append(this.widgetPanel);
            this.$mainPanel.append(this.infoPanel);

            this.methClient = new NarrativeMethodStore(this.methodStoreURL);
            this.methClient.list_categories({'load_methods': 0, 'load_apps' : 0, 'load_types' : 1}, 
                $.proxy(function(data) {
                    var aTypes = data[3];
                    var methodIds = [];
                    self.types = {};
                    for (var key in aTypes) {
                        if (aTypes[key]["loading_error"]) {
                            console.log("Error loading type [" + key + "]: " + aTypes[key]["loading_error"]);
                            continue;
                        }
                        if (aTypes[key]["import_method_ids"].length > 0) {
                            self.types[key] = aTypes[key];
                            for (var methodPos in aTypes[key]["import_method_ids"]) {
                                var methodId = aTypes[key]["import_method_ids"][methodPos];
                                methodIds.push(methodId);
                            }
                        }
                    }
                    self.methClient.get_method_full_info({ 'ids' : methodIds }, 
                        $.proxy(function(fullInfoList) {
                            self.methodFullInfo = {};
                            for (var i in fullInfoList) {
                                self.methodFullInfo[fullInfoList[i].id] = fullInfoList[i];
                            }
                            self.methClient.get_method_spec({ 'ids' : methodIds },
                                $.proxy(function(specs) {
                                    self.methods = {};
                                    for (var i in specs) {
                                        self.methods[specs[i].info.id] = specs[i];
                                    }
                                    var keys = [];
                                    for (var key in self.types) {
                                        keys.push(key);
                                    }
                                    keys.sort(function(a,b) {return self.types[a]["name"].localeCompare(self.types[b]["name"])});
                                    for (var keyPos in keys) {
                                        addItem(keys[keyPos]);                                      
                                    }
                                    $dropdown.select2({
                                        minimumResultsForSearch: -1,
                                        formatSelection: function(object, container) {
                                            var display = '<span class="kb-parameter-data-selection">'+object.text+'</span>';
                                            return display;
                                        }
                                    });

                                    function addItem(key) {
                                        var name = self.types[key]["name"];
                                        $dropdown.append($('<option value="'+key+'">').append(name));
                                    }
                                }, this),
                                $.proxy(function(error) {
                                    self.showError(error);
                                }, this)
                            );
                        }, this),
                        $.proxy(function(error) {
                            self.showError(error);
                        }, this)
                    );
                }, this),
                $.proxy(function(error) {
                    self.showError(error);
                }, this)
            );
            return this;
        },

        showWidget: function(type) {
            var self = this;
            this.selectedType = type;
            this.widgetPanelCard1.css('display', 'none');
            this.widgetPanelCard2.css('display', '');
            this.widgetPanelCard2.empty();
            var $header = null;
            var $body = null;
            var numberOfTabs = this.types[type]["import_method_ids"].length;
            if (numberOfTabs > 1) {
                var $header = $('<div>');
                var $body = $('<div>');
                this.widgetPanelCard2.append($header).append($body);
            }
            for (var methodPos in this.types[type]["import_method_ids"]) {
                self.showTab(type, methodPos, $header, $body, numberOfTabs);
            }
            var $importButton = $('<button>')
                             .attr('id', this.cellId + '-run')
                             .attr('type', 'button')
                             .attr('value', 'Import')
                             .addClass('kb-primary-btn')
                             .append('Import');

            var $cancelButton = $('<button>')
                             .attr('id', this.cellId + '-run')
                             .attr('type', 'button')
                             .attr('value', 'Cancel')
                             .addClass('kb-primary-btn')
                             .append('Cancel');

	    /*
	     * Invoke btnImport(true) to show the import buttoon and hide cancel,
	     * or btnImport(false) to show the cancel button and hide import.
	     */
            var btnImport = function(show) {
                if (show) {
                    $importButton.show();
                    $cancelButton.hide();
                } else {
                    $importButton.hide();
                    $cancelButton.show();
                }
            };
            
            $importButton.click(
                $.proxy(function(event) {
                    event.preventDefault();
                    var v = self.getInputWidget().isValid();
                    if (v.isValid) {
                        btnImport(false);
                        self.runImport(function() {
                            btnImport(true);
                        });
                    } else {
                        var errorCount = 1;
                        self.$errorModalContent.empty();
                        var $errorStep = $('<div>');
                        for (var e=0; e<v.errormssgs.length; e++) {
                            $errorStep.append($('<div>')
                                    .addClass("kb-app-step-error-mssg")
                                    .append('['+errorCount+']: ' + v.errormssgs[e]));
                            errorCount = errorCount+1;
                        }
                        self.$errorModalContent.append($errorStep);
                        self.$errorModal.modal('show');
                        }
                }, this)
            );
            
            $cancelButton.click(function() {
                self.stopTimer();
		if (self.fileUploadInProgress)
		{
		    self.getInputWidget().cancelImport();
		}
		    
                btnImport(true);
                self.showInfo("Import job was cancelled");
            });
            
            var $backButton = $('<button>')
                             .attr('id', this.cellId + '-back')
                             .attr('type', 'button')
                             .attr('value', 'Back')
                             .addClass('kb-primary-btn')
                             .append('Back');
            $backButton.click(
                $.proxy(function(event) {
                    event.preventDefault();
                    self.back();
                }, this)
            );

            var $buttons = $('<div style="margin: 0px 30px 0px 33px;">')
                           .addClass('buttons')
                           .append($importButton)
                           .append('&nbsp;')
                           .append($cancelButton)
                           .append('&nbsp;')
                           .append($backButton);

            $cancelButton.hide();
            self.widgetPanelCard2.append($buttons);
        },
        
        showTab: function(type, methodPos, $header, $body, numberOfTabs) {
            var self = this;
            var methodId = this.types[type]["import_method_ids"][methodPos];
            var methodSpec = this.methods[methodId];
            var inputWidgetName = methodSpec.widgets.input;
            if (!inputWidgetName || inputWidgetName === 'null')
                inputWidgetName = "kbaseNarrativeMethodInput";
            var methodJson = JSON.stringify(methodSpec);
            
            var $inputDiv = $('<div>');

            // These are the 'delete' and 'run' buttons for the cell

            var methodUuid = 'import-method-details-'+StringUtil.uuid();
            var buttonLabel = 'details';
            var methodTitle = methodSpec.info.tooltip.trim();
            var methodDescr = this.methodFullInfo[methodId].description.trim();
            var $overviewSwitch = $("<a/>").html('more...');
            var $methodInfo = $('<div>')
                    .addClass('kb-func-desc')
                    .css({'margin' : '25px 0px 0px 15px'})
                    .append($('<h2>')
                    .attr('id', methodUuid)
                    .addClass('collapse in')
                    .append(methodTitle).append("&nbsp;&nbsp&nbsp").append($overviewSwitch));

            var $methodDescrPanel = $('<div/>')
                    .addClass('kb-func-desc')
                    .css({'margin' : '20px 0px 0px 20px', 'display' : 'none'})
                    .append(methodDescr);
            if (methodDescr && methodDescr != '' && methodDescr != 'none' && 
                    methodDescr != methodTitle && (methodDescr + ".") != methodTitle) {
                $overviewSwitch.click(function(){
                    $methodDescrPanel.toggle();
                });
            } else {
                $overviewSwitch.css({'display' : 'none'});
            }

            var tab = $('<div style="margin: 0px 30px 0px 15px;">')
                    .append($('<div>')
                    .addClass('kb-func-panel kb-cell-run')
                    .append($methodInfo).append($methodDescrPanel))
                    .append($('<div>').css({'margin' : '25px 0px 0px 15px'}).append("<hr>"))
                    .append($('<div>')
                    .append($inputDiv))
                    .append($('<div>')
                    .css({'overflow' : 'hidden', 'margin' : '0px 0px 0px 18px'}));
                        
            var isShown = methodPos == 0;
            var tabName = methodSpec.info.name;
            var params = {tab: tabName, 
                          content: tab, 
                          canDelete : false, 
                          show: isShown};
            if (numberOfTabs == 1) {
                this.widgetPanelCard2.append(tab);
            } else {
                var tabHeader = $('<div>')
                                .addClass('kb-side-header');
                tabHeader.css('width', (100/numberOfTabs)+'%');
                tabHeader.append($('<small>').append(params.tab));
                $header.append(tabHeader);
                var tabContent = $('<div>')
                    .addClass('kb-side-tab3')
                    .css("display", "none")
                    .append(params.content);
                $body.append(tabContent);
                if (params.show) {
                    tabHeader.addClass('active');
                    tabContent.css('display', '');
                }
                tabHeader.click($.proxy(function(event) {
                    event.preventDefault();
                    event.stopPropagation();
                    var $headerDiv = $(event.currentTarget);
                    if (!$headerDiv.hasClass('active')) {
                        var idx = $headerDiv.index();
                        $header.find('div').removeClass('active');
                        $headerDiv.addClass('active');
                        $body.find('div.kb-side-tab3').css('display', 'none');
                        $body.find('div:nth-child(' + (idx+1) + ').kb-side-tab3').css('display', '');
                    }
                }, this));
            }
            // var w1 = $inputDiv[inputWidgetName];
            // var wig = w1({ method: methodJson, isInSidePanel: true });
            var wig = $inputDiv[inputWidgetName]({ method: methodJson, isInSidePanel: true });
	    this.inputWidget[methodId] = wig;
            
            var onChange = function() {
                var w = self.getInputWidget();
                if (self.timer)
                    return;
                var v = w.isValid();
                if (v.isValid) {
                    self.showInfo('All parameters are valid and you can start "Import" now');
                } else {
                    self.showInfo('You can start "Import" when all parameters are ready (marked by green check)');
                }
            };
            var paramValues = wig.getAllParameterValues();
            for (var paramPos in paramValues) {
                var paramId = paramValues[paramPos].id;
                wig.addInputListener(paramId, onChange);
            }
            
            this.tabs[methodId] = tab;
        },
        
        getSelectedTabId: function() {
            var ret = null;
            for (var tabId in this.tabs) {
                var tab = this.tabs[tabId];
                if (tab.is(':visible'))
                    ret = tabId;
            }
            return ret;
        },

        getInputWidget: function() {
            return this.inputWidget[this.getSelectedTabId()];
        },
        
        back: function() {
            var self = this;
            if (self.timer != null) {
                self.$warningModalContent.empty();
                self.$warningModalContent.append(
                    $('<div>').addClass("kb-app-step-error-mssg")
                              .append('Import process is not finished yet. Are you sure you want to stop watching it?'));
                self.$warningModal.modal('show');
                return;
            }
            this.infoPanel.empty();
            this.widgetPanelCard2.css('display', 'none');
            this.widgetPanelCard1.css('display', '');
        },
        

        buildTransformParameters: function(objectType, methodId, params) {
            var self = this;

            console.log('building transform params');
            console.log(transformConfig);
            // if no objectType known in the config, that's a paddlin'.
            if (!transformConfig[objectType]) {
                throw "Import for [" + objectType + "] type is not supported yet.";
            }
            // if the type's there, but not the method, that's a paddlin'.
            if (!transformConfig[objectType][methodId]) {
                throw methodId + " import mode for this object type is not supported yet.";
            }
            var mapping = transformConfig[objectType][methodId];

            // start with the easy part.
            var args = {
                external_type: mapping.external_type,
                kbase_type: mapping.kbase_type,
                object_name: params[mapping.object_name],
                workspace_name: this.wsName
            };

            // do the optional args.
            var optional_args = {
                validate: {},
                transform: {}
            };

            var url_mapping = {};

            /**
             * mapping has five (ish?) possible keys:
             * type = string, int, boolean
             * param = which method parameter name to map to
             * value = an explicit value to use (takes precedence over 'param' key)
             * optional = true or false
             * default - this is its own block with some similar keys:
             *     param - as above, maps to a method parameter
             *     value - as above, takes precedence as above, too
             *     prefix - a prefix string to put in front of the string
             *     suffix - a suffix string to append to the string
             * the 'default' parameter takes effect only if no value can be resolved
             * from the other options.
             */
            var resolveParameter = function(mapping, params) {
                var val = undefined;
                if (mapping.hasOwnProperty('value')) {
                    val = mapping.value;
                }
                else if (mapping.hasOwnProperty('param') && params.hasOwnProperty(mapping.param)) {
                    val = params[mapping.param];
                }
                if ((!val || val.length === 0) && mapping.hasOwnProperty('default')) {
                    // go deeper!
                    val = resolveParameter(mapping.default, params);
                }

                if (val != undefined) {
                    if (mapping.hasOwnProperty('prefix'))
                        val = mapping.prefix + String(val);
                    if (mapping.hasOwnProperty('suffix'))
                        val = String(val) + mapping.suffix;

                    if (mapping.type === 'int')
                        val = self.asInt(val);
                    else if (mapping.type === 'boolean')
                        val = self.asBool(val);
                }
                return val;
            };

            // do optional_arguments (some aren't really optional but w/e)
            for (var argType in mapping.optional_arguments) {
                for (var paramName in mapping.optional_arguments[argType]) {
                    // paramName = name of optional arguments parameter
                    // paramInfo = hash of information about that parameter
                    // params = big set of params
                    var paramInfo = mapping.optional_arguments[argType][paramName];
                    var val = resolveParameter(paramInfo, params);
                    if (val != undefined) {
                        optional_args[argType][paramName] = val;
                    }
                    else if (val === undefined && !paramInfo.optional) {
                        // fail!
                    }
                }
            }

            /* do url mapping.
             * A couple options:
             * 1. type = shock
             * 1.a. has 'param' attribute -- resolve the shock url with params[mapping.param] on the end
             * 1.b. has 'value' attribute -- resolve the shock url with mapping.value on the end
             *
             * 2. type = string
             * 2.a. has 'param' attribute -- url = params[mapping.param]
             * 2.b. has 'value' attribute -- url = mapping.value
             */
            for (var objType in mapping.url_mapping) {
                var paramInfo = mapping.url_mapping[objType];
                var paramValue = undefined;

                // value overrides all! fetch it first
                if (paramInfo.value) 
                    paramValue = paramInfo.value;
                // if no value, look for param attribute and resolve it
                else if (paramInfo.param)
                    paramValue = params[paramInfo.param];

                // if there's still no param value, it might be optional. if not = error!
                if (!paramValue) {
                    if (paramInfo.optional === true)
                        continue;
                    else
                        // error!
                        continue;
                }

                var url = undefined;
                if (paramValue && paramValue.length > 0) {
                    if (paramInfo.type.toLowerCase() === 'shock') {
                        url = self.shockURL + '/node/' + paramValue;
                    }
                    else if (paramInfo.type.toLowerCase() === 'string') {
                        url = paramValue;
                    }
                }
                if (url)
                    url_mapping[objType] = url;
            }
            args.optional_arguments = optional_args;
            args.url_mapping = url_mapping;

            return args;
        },

        runImport: function(callback) {
            var self = this;
            var methodId = self.getSelectedTabId();
            var methodSpec = self.methods[methodId];

	    /*
	     * Invoke the runImport method on all parameters that have it.
	     * Each returns a promise; when all are resolved, proceed to
	     * process the import transform.
	     */

	    self.fileUploadInProgress = true;
	    var promise = this.getInputWidget().runImport();
	    self.showInfo("Transferring files...", true);
	    promise.then(function(value) {

		self.fileUploadInProgress = false;
		self.showInfo("Files transferred. Creating transform job.", true);

		var paramValueArray = self.getInputWidget().getParameters();
		var params = {};
		
		for (var i in methodSpec.parameters) {
                    var paramId = methodSpec.parameters[i].id;
                    var paramValue = paramValueArray[i];
                    params[paramId] = paramValue;
		}

		var args = null;

		try {
                    var args = self.buildTransformParameters(self.selectedType, methodId, params);
                    var uploaderClient = new Transform(self.uploaderURL, {'token': self.token});

                    if (args) {
			console.log("Data to be sent to transform service:");
			console.log(args);

			self.showInfo("Submitting transform request...", true);
			uploaderClient.upload(args,
					      $.proxy(function(data) {
						  console.log(data);
						  self.waitForJob(data[1], callback);
					      }, self),
					      $.proxy(function(error) {
						  self.showError(error);
						  callback(false);
					      }, self)
					     );
                    } else {
			callback(false);
                    }
		}
		catch (error) {
                    self.showError(error);
		}
	    }, function (reason) {
		self.showError("File transfer failed: " + reason);
		self.fileUploadInProgress = false;
	    });
        },
        
        asBool: function(val) {
            if (!val)
                return false;
            return (val == 1 || val === "1");
        },

        asInt: function(val) {
            if (!val)
                return 0;
            if (val == 1 || val === "1")
                return 1;
            return 0;
        },

        waitForJob: function(jobId, callback) {
            var self = this;
            var jobSrv = new UserAndJobState(self.ujsURL, {'token': self.token});
            var timeLst = function(event) {
                jobSrv.get_job_status(jobId, function(data) {
                    console.log(data);
                    var status = data[2];
                    var complete = data[5];
                    var wasError = data[6];
                    if (complete === 1) {
                        self.stopTimer();
                        callback(wasError === 0);
                        if (wasError === 0) {
                            self.trigger('updateDataList.Narrative');
                            self.showInfo("Import job is done");
                        } else {
                            self.showError('loading detailed error...');
                            jobSrv.get_detailed_error(jobId, function(data) {
                                self.showError(data);
                            }, function(data) {
                                self.showError(data.error.message);
                            });
                        }
                    } else {
                        self.showInfo("Import job has status: " + status, true);
                    }
                }, function(data) {
                    self.stopTimer();
                    self.showError(data.error.message);
                    callback(false);
                });
            };
            self.timer = setInterval(timeLst, 5000);
            timeLst();
        },
        
        stopTimer: function() {
            var self = this;
            if (self.timer != null) {
                clearInterval(self.timer);
                self.timer = null;
            }
        },
        
        showError: function(error) {
            console.log(error);
            if (typeof error === 'object' && error.error) {
                error = error.error;
                if (typeof error === 'object' && error.message)
                    error = error.message;
            }
            this.infoPanel.empty();
            this.infoPanel.append('<pre style="text-align: left; background-color: #ffe0e0;">Error:\n'+error+'</pre>');
        },

        showInfo: function(message, spinner) {
            if (spinner)
                message = '<img src="'+this.loadingImage+'"/> ' + message;
            this.infoPanel.empty();
            this.infoPanel.append(message);
        },

        loggedInCallback: function(event, auth) {
            this.token = auth.token;
            this.render();
            return this;
        },

        loggedOutCallback: function(event, auth) {
            this.token = null;
            this.render();
            return this;
        }
    });
});
