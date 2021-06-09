/**
 * Input widget for import genomes into workspace.
 * @author Roman Sutormin <rsutormin@lbl.gov>
 * @author Bill Riehl <wjriehl@lbl.gov>
 * @public
 */

define(['kbwidget', 'bootstrap', 'jquery', 'kbaseTabs', 'kbaseNarrativeMethodInput'], (
    KBWidget,
    bootstrap,
    $,
    kbaseTabs,
    kbaseNarrativeMethodInput
) => {
    return KBWidget({
        name: 'kbaseTabbedInput',
        parent: kbaseNarrativeMethodInput,
        version: '1.0.0',
        options: {
            isInSidePanel: false,
        },

        tabParamId: null, // string
        tabParamPos: null, // int
        tabPane: null, // div jquery element
        tabPaneWasAdded: false,
        tabs: null, // mapping {tabId -> div}
        tabNames: null, // mapping {tabId -> tabName}
        tabParamToSpec: null, // mapping {tabId -> {paramId -> paramSpec}}
        paramIdToTab: null, // mapping {paramId -> tabId}

        init: function (options) {
            this._super(options);
            // render and refresh are done in super-class.
            return this;
        },

        render: function () {
            // figure out all types from the method
            const self = this;
            const method = this.options.method;
            const params = method.parameters;
            let tabParamSpec = null;
            for (let i = 0; i < params.length; i++) {
                const paramSpec = params[i];
                // check what kind of parameter here.
                if (paramSpec.field_type === 'tab') {
                    tabParamSpec = paramSpec;
                    self.tabParamPos = i;
                    break;
                }
            }
            if (tabParamSpec) {
                //console.log(tabParamSpec);
                self.paramIdToTab = {};
                const tabIdToParamCount = {};
                for (var tabId in tabParamSpec.tab_options.tab_id_to_param_ids) {
                    const paramIds = tabParamSpec.tab_options.tab_id_to_param_ids[tabId];
                    tabIdToParamCount[tabId] = paramIds.length;
                    for (const paramPosInTab in paramIds) {
                        paramId = paramIds[paramPosInTab];
                        self.paramIdToTab[paramId] = tabId;
                    }
                }
                const tabNamesRaw = tabParamSpec.tab_options.tab_id_to_tab_name;
                if (this.options.isInSidePanel) {
                    self.tabNames = {};
                    for (var tabId in tabNamesRaw) {
                        if (tabIdToParamCount[tabId] && tabIdToParamCount[tabId] > 0)
                            self.tabNames[tabId] = tabNamesRaw[tabId];
                    }
                } else {
                    self.tabNames = tabNamesRaw;
                }
                self.tabParamId = tabParamSpec.id;
                self.tabPane = $('<div/>');
                self.tabPaneWidget;
                if (self.options.isInSidePanel) {
                    self.buildTabs(self.tabPane);
                } else {
                    self.tabPaneWidget = new kbaseTabs(self.tabPane, {
                        canDelete: true,
                        tabs: [],
                    });
                }
                self.tabs = {};
                self.tabParamToSpec = {};
                let tabCount = 0;
                for (const tabPos in tabParamSpec.tab_options.tab_id_order) {
                    var tabId = tabParamSpec.tab_options.tab_id_order[tabPos];
                    const tabName = self.tabNames[tabId];
                    if (!tabName) continue;
                    tab = $('<div/>');
                    const isShown = tabCount == 0;
                    self.tabPaneWidget.addTab({
                        tab: tabName,
                        content: tab,
                        canDelete: false,
                        show: isShown,
                    });
                    tabCount++;
                    self.tabs[tabId] = tab;
                    self.tabParamToSpec[tabId] = {};
                }
            }
            self._superMethod('render');
        },

        buildTabs: function (tabPane) {
            const $header = $('<div>');
            const $body = $('<div>');
            const tabNameToIndex = {};
            let tabCount = 0;
            tabPane['kbaseTabs'] = function (funcName, params) {
                if (funcName === 'addTab') {
                    tabNameToIndex[params.tab] = tabCount;
                    tabCount++;
                    const tabHeader = $('<div>')
                        .addClass('kb-side-header')
                        //.css('width', (100/tabs.length)+'%')
                        .append(params.tab);
                    $header.append(tabHeader);
                    const tabContent = $('<div>')
                        .addClass('kb-side-tab2')
                        .css('display', 'none')
                        .append(params.content);
                    $body.append(tabContent);
                    if (params.show) {
                        tabHeader.addClass('active');
                        tabContent.css('display', '');
                    }
                    tabHeader.click(
                        $.proxy((event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            const $headerDiv = $(event.currentTarget);
                            if (!$headerDiv.hasClass('active')) {
                                const idx = $headerDiv.index();
                                $header.find('div').removeClass('active');
                                $headerDiv.addClass('active');
                                $body.find('div.kb-side-tab2').css('display', 'none');
                                $body
                                    .find('div:nth-child(' + (idx + 1) + ').kb-side-tab2')
                                    .css('display', '');
                            }
                        }, this)
                    );
                }
            };
            tabPane.append($header).append($body);
        },

        addParameterDiv: function (
            paramPos,
            paramSpec,
            $stepDiv,
            $optionsDiv,
            $advancedOptionsDiv,
            isAdvanced
        ) {
            const tabId = this.paramIdToTab[paramSpec.id];
            if (tabId) {
                this.putInTab(paramSpec, $stepDiv, $optionsDiv, tabId);
            } else {
                this._superMethod(
                    'addParameterDiv',
                    paramPos,
                    paramSpec,
                    $stepDiv,
                    $optionsDiv,
                    $advancedOptionsDiv,
                    isAdvanced
                );
            }
        },

        putInTab: function (paramSpec, $stepDiv, $optionsDiv, tabId) {
            if ($optionsDiv.children().length == 0) $stepDiv.css({ 'margin-top': '5px' });
            if (!this.tabPaneWasAdded) {
                $optionsDiv.append(this.tabPane);
                this.tabPaneWasAdded = true;
            }
            const tab = this.tabs[tabId];
            if (tab.children().length == 0) tab.css({ 'margin-top': '5px' });
            tab.append($stepDiv);
            this.tabParamToSpec[tabId][paramSpec.id] = paramSpec;
        },

        getParameters: function () {
            const ret = [];
            const selectedParameterTab = this.getSelectedTabId();
            for (let i = 0; i < this.parameters.length; i++) {
                const paramId = this.parameters[i].id;
                const tabId = this.paramIdToTab[paramId];
                const value =
                    !tabId || tabId === selectedParameterTab
                        ? this.parameters[i].widget.getParameterValue()
                        : '';
                ret.push(value);
            }
            ret.splice(this.tabParamPos, 0, this.getSelectedTabId());
            return ret;
        },

        getState: function () {
            const state = this._superMethod('getState');
            const selectedParameterTab = this.getSelectedTabId();
            state['selectedParameterTab'] = selectedParameterTab;
            return state;
        },

        getSelectedTabId: function () {
            let ret = null;
            for (const tabId in this.tabs) {
                const tab = this.tabs[tabId];
                if (tab.is(':visible')) ret = tabId;
            }
            return ret;
        },

        loadState: function (state) {
            if (!state) return;
            this._superMethod('loadState', state);
            const selectedParameterTab = state['selectedParameterTab'];
            if (selectedParameterTab) {
                this.tabPane.kbaseTabs('showTab', this.tabNames[selectedParameterTab]);
            }
        },

        isValid: function () {
            const isValidRet = { isValid: true, errormssgs: [] };
            const selectedParameterTab = this.getSelectedTabId();
            if (this.parameters) {
                for (let i = 0; i < this.parameters.length; i++) {
                    const paramId = this.parameters[i].id;
                    const tabId = this.paramIdToTab[paramId];
                    if (!tabId || tabId === selectedParameterTab) {
                        const parameterStatus = this.parameters[i].widget.isValid();
                        if (!parameterStatus.isValid) {
                            isValidRet.isValid = false;
                            for (let e = 0; e < parameterStatus.errormssgs.length; e++) {
                                isValidRet.errormssgs.push(parameterStatus.errormssgs[e]);
                            }
                        }
                    }
                }
            }
            return isValidRet;
        },

        getAllParameterValues: function () {
            const ret = this._superMethod('getAllParameterValues');
            ret.splice(this.tabParamPos, 0, {
                id: this.tabParamId,
                value: this.getSelectedTabId(),
            });
            return ret;
        },

        prepareDataBeforeRun: function () {
            const selectedParameterTab = this.getSelectedTabId();
            if (this.parameters) {
                for (let i = 0; i < this.parameters.length; i++) {
                    const paramId = this.parameters[i].id;
                    const tabId = this.paramIdToTab[paramId];
                    if (!tabId || tabId === selectedParameterTab) {
                        this.parameters[i].widget.prepareValueBeforeRun(this.options.method);
                    }
                }
            }
        },
    });
})(jQuery);
