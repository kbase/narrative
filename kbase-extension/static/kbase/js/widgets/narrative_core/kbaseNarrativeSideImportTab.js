/*global define,console*/
/*jslint white: true;*/
/*eslint-env browser*/
/**
 * "Import" tab on data side panel.
 * @author Roman Sutormin <rsutormin@lbl.gov>
 * @public
 */
define (
    [
        'kbwidget',
        'bootstrap',
        'jquery',
        'narrativeConfig',
        'kbaseAuthenticatedWidget',
        'select2',
        'util/string',
        'base/js/namespace',
        'common/pythonInterop',
        'util/kbaseApiUtil',
        'kbase-client-api'
    ], function(
        KBWidget,
        bootstrap,
        $,
        Config,
        kbaseAuthenticatedWidget,
        select2,
        StringUtil,
        Jupyter,
        PythonInterop,
        APIUtil
	) {
    'use strict';
    return KBWidget({
        name: 'kbaseNarrativeSideImportTab',
        parent : kbaseAuthenticatedWidget,
        version: '1.0.0',
        options: {
            ws_name: null
        },
        token: null,
        wsName: null,
        loadingImage: Config.get('loading_gif'),
        wsUrl: Config.url('workspace'),
        methodStoreURL: Config.url('narrative_method_store'),
        methodStoreTypesURL: Config.url('narrative_method_store_types'),
        methClient: null,
        uploaderURL: Config.url('transform'),
        ujsURL: Config.url('user_and_job_state'),
        shockURL: Config.url('shock'),
        methodIds: null,        // [method_id] that are involved in type importers
        allMethodIds: {},       // {tag -> {method_id -> method_name}}
        methods: {},            // {tag -> {method_id -> method_spec}}
        methodFullInfo: {},     // {tag -> {method_id -> method_full_info}}
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
                                .click(function() {
                                    self.stopTimer();
                                    self.back();
								}.bind(this));

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
                    self.getMethodSpecs(function(methodFullInfo, methods, tag) {
                        self.showWidget(selectedType, methodFullInfo, methods, tag);
                    }, function(error) {
                        self.showError(error);
                    });
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
            if (!this.methodStoreTypesURL) {
                this.methodStoreTypesURL = this.methodStoreURL;
            }
            var typesClient = new NarrativeMethodStore(this.methodStoreTypesURL);
            typesClient.list_categories({'load_methods': 0, 'load_apps' : 0, 'load_types' : 1},
                $.proxy(function(data) {
                    var aTypes = data[3];
                    self.methodIds = [];
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
                                if (methodId.indexOf('/') > 0)
                                    self.methodIds.push(methodId);
                            }
                        }
                    }
                    var keys = [];
                    for (key in self.types) {
                        keys.push(key);
                    }
                    keys.sort(function(a,b) {return self.types[a]["name"].localeCompare(self.types[b]["name"])});
                    for (var keyPos in keys) {
                        addItem(keys[keyPos]);
                    }
                    $dropdown.select2({
                        minimumResultsForSearch: -1,
                        formatSelection: function(object) {
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
            return this;
        },

        // getVersionTag: function() {
        //     var tag = Jupyter.narrative.sidePanel.$methodsWidget.currentTag;
        //     if (!tag) {
        //         tag = "release";
        //     }
        //     return tag;
        // },

        getMethodSpecs: function(callback, errorCallback) {
            var self = this;
            var tag = APIUtil.getAppVersionTag();
            if (self.allMethodIds[tag] && self.methodFullInfo[tag] && self.methods[tag]) {
                callback(self.methodFullInfo[tag], self.methods[tag], tag);
                return;
            }
            self.methClient.list_method_ids_and_names({tag: tag}, function(methodIdToName) {
                self.allMethodIds[tag] = methodIdToName;
                var methodIds = [];
                for (var i in self.methodIds) {
                    var methodId = self.methodIds[i];
                    if (self.allMethodIds[tag][methodId]) {
                        methodIds.push(methodId);
                    } else {
                        console.log("Importer method id=" + methodId + " is skipped for " +
                                "tag \"" + tag + "\"");
                    }
                }
                var prom1 = self.methClient.get_method_full_info({'ids': methodIds,
                    'tag' : tag});
                var prom2 = self.methClient.get_method_spec({'ids': methodIds,
                    'tag' : tag});
                $.when(prom1, prom2).done(function(fullInfoList, specs) {
                    self.methodFullInfo[tag] = {};
                    for (var i in fullInfoList) {
                        self.methodFullInfo[tag][fullInfoList[i].id] = fullInfoList[i];
                    }
                    self.methods[tag] = {};
                    for (i in specs) {
                        self.methods[tag][specs[i].info.id] = specs[i];
                    }
                    callback(self.methodFullInfo[tag], self.methods[tag], tag);
                }).fail(function(error) {
                    alert(error);
                    errorCallback(error);
                });
            }, function(error) {
                alert(error);
                errorCallback(error);
            });
        },

        showWidget: function(type, methodFullInfo, methods, tag) {
            var self = this;
            this.selectedType = type;
            this.widgetPanelCard1.css('display', 'none');
            this.widgetPanelCard2.css('display', '');
            this.widgetPanelCard2.empty();
            var $header = null;
            var $body = null;
            var importMethodIds = [];
            for (var methodPos in self.types[type]["import_method_ids"]) {
                var methodId = this.types[type]["import_method_ids"][methodPos];
                if (methods[methodId]) {
                    importMethodIds.push(methodId);
                }
            }
            var numberOfTabs = importMethodIds.length;
            if (numberOfTabs > 1) {
                $header = $('<div>');
                $body = $('<div>');
                this.widgetPanelCard2.append($header).append($body);
            }

            for (var methodPos in importMethodIds) {
                self.showTab(importMethodIds, methodPos, $header, $body,
                        numberOfTabs, methodFullInfo, methods);
            }
            var $importButton = $('<button>')
                             .attr('id', this.cellId + '-run')
                             .attr('type', 'button')
                             .attr('value', 'Import')
                             .addClass('kb-primary-btn')
                             .append('Import');

            $importButton.click(
                $.proxy(function(event) {
                    event.preventDefault();
                    var v = self.getInputWidget().isValid();
                    if (v.isValid) {
                        $importButton.prop('disabled', true);
                        self.runImport(methods, tag);
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
            if (numberOfTabs == 0) {
                $importButton.hide();
                self.widgetPanelCard2.append(
                        "<div class='kb-cell-run' style='margin: 30px 30px 0px 33px;'>" +
                        "<h2 class='collapse in'>" +
                        "No import methods available for \"" + tag + "\" tag.</h2><hr></div>");
            }

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
                           .append($backButton)
                           .append('&nbsp;')
                           .append('&nbsp;')
                           .append($importButton);

            self.widgetPanelCard2.append($buttons);
        },

        showTab: function(importMethodIds, methodPos, $header, $body,
                numberOfTabs, methodFullInfo, methods) {
            var self = this;
            var methodId = importMethodIds[methodPos];
            var methodSpec = methods[methodId];
            if (!methodSpec)
                return;
            var inputWidgetName = methodSpec.widgets.input;
            if (!inputWidgetName || inputWidgetName === 'null')
                inputWidgetName = 'kbaseNarrativeMethodInput';
            var methodJson = JSON.stringify(methodSpec);

            var $inputDiv = $('<div>');

            var methodUuid = 'import-method-details-'+StringUtil.uuid();
            // var buttonLabel = 'details';
            var methodTitle = methodSpec.info.tooltip.trim();
            var methodDescr = methodFullInfo[methodId].description.trim();
            var $overviewSwitch = $('<a/>').html('more...');
            var $methodInfo = $('<div>')
                    .addClass('kb-func-desc')
                    .css({'margin' : '25px 0px 0px 15px'})
                    .append($('<h2>')
                    .attr('id', methodUuid)
                    .addClass('collapse in')
                    .append(methodTitle).append('&nbsp;&nbsp&nbsp').append($overviewSwitch));

            var $methodDescrPanel = $('<div/>')
                    .addClass('kb-func-desc')
                    .css({'margin' : '20px 0px 0px 20px', 'display' : 'none'})
                    .append(methodDescr);
            if (methodDescr && methodDescr != '' && methodDescr != 'none' &&
                    methodDescr != methodTitle && (methodDescr + '.') != methodTitle) {
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
                    .append($('<div>').css({'margin' : '25px 0px 0px 15px'}).append('<hr>'))
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
                    .css('display', 'none')
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
            require([inputWidgetName], function(InputWidget) {
                // var wig = $inputDiv[inputWidgetName]({ method: methodJson, isInSidePanel: true });
                var wig = new InputWidget($inputDiv, {method: methodJson, isInSidePanel: true});
                self.inputWidget[methodId] = wig;

                var onChange = function() {
                    var w = self.getInputWidget();
                    if (!w) { return };

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

                self.tabs[methodId] = tab;
            }, function(error) {
                alert(error);
            });
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

        createImportStatusCell: function(methodName, jobId) {
            var cellIndex = Jupyter.notebook.get_selected_index();
            var cell = Jupyter.notebook.insert_cell_below('code', cellIndex);
            $(cell.element).trigger('toggleCodeArea.cell');
            var title = 'Import job status for ' + methodName;
            var cellText = ['from biokbase.narrative.jobs.jobmanager import JobManager',
                            'JobManager().get_job(' + jobId + ')'].join('\n');
            cell.set_text(cellText);
            var meta = {
                    'kbase': {
                        'attributes': {
                            'status': 'new',
                            'title': title
                        },
                        'type': 'output'
                    }
            };
            cell.metadata = meta;
            cell.events.one('output_appended.OutputArea', function() {
                Jupyter.narrative.saveNarrative();
            });
            cell.execute();
            Jupyter.narrative.hideOverlay();
            this.showInfo(''); // clear the info message when we close the overlay
            Jupyter.narrative.scrollToCell(cell, true);
            this.back();
        },

        runImport: function(methods, tag) {
            var self = this;
            var methodId = self.getSelectedTabId();
            var methodSpec = methods[methodId];

            var paramValueArray = self.getInputWidget().getParameters();
            var params = {};
            for (var i in methodSpec.parameters) {
                var paramId = methodSpec.parameters[i].id;
                var paramValue = paramValueArray[i];
                params[paramId] = paramValue;
            }
            var pythonCode = PythonInterop.buildAppRunner(null, null,
                    {tag: tag, version: null, id: methodId}, params);
            pythonCode += ".job_id.encode('ascii','ignore')";
            var callbacks = {
                    shell: {
                        reply: function(content) {},
                        payload: { set_next_input: function(content) {} }
                    },
                    iopub: {
                        output: function(ret) {
                            var data = ret.content.data;
                            if (!data)
                                return;
                            // var session = ret.header.session;
                            var jobId = data['text/plain'];
                            var methodName = methodSpec.info.name;
                            self.createImportStatusCell(methodName, jobId);
                        },
                        clear_output: function(content) {}
                    },
                    input: function(content) {}
            };
            var executeOptions = {
                    silent: false,
                    user_expressions: {},
                    allow_stdin: false,
                    store_history: false
            };
            Jupyter.notebook.kernel.execute(pythonCode, callbacks, executeOptions);
            self.showInfo("Your import job is being submitted and you will be directed to it shortly.");
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

        loggedOutCallback: function(event) {
            this.token = null;
            this.render();
            return this;
        }
    });
});
