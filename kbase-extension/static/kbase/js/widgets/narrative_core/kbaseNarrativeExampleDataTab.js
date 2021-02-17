/**
 * @author Michael Sneddon <mwsneddon@lbl.gov>
 * @author Bill Riehl <wjriehl@lbl.gov>
 * @public
 */
define([
    'kbwidget',
    'jquery',
    'underscore',
    'bluebird',
    'narrativeConfig',
    'kbaseAuthenticatedWidget',
    'kbase-generic-client-api',
    'base/js/namespace',
    'util/display',
    'kbase/js/widgets/narrative_core/kbaseDataCard',
    'bootstrap',
], (
    KBWidget,
    $,
    _,
    Promise,
    Config,
    kbaseAuthenticatedWidget,
    GenericClient,
    Jupyter,
    DisplayUtil,
    kbaseDataCard
) => {
    'use strict';

    return KBWidget({
        name: 'kbaseNarrativeExampleDataTab',
        parent: kbaseAuthenticatedWidget,
        version: '1.0.0',
        options: {
            ws_name: null, // must be the WS name, not the WS Numeric ID
            loadingImage: Config.get('loading_gif'),
            $importStatus: $('<div>')
        },

        ws: null,
        narWs: null,
        serviceClient: null,

        $mainPanel: null,
        $loadingDiv: null,
        loadedData: {},
        infoList: null,

        /**
         * @method init
         * Builds the DOM structure for the widget.
         * Includes the tables and panel.
         * If any data was passed in (options.data), that gets shoved into the datatable.
         * @param {Object} - the options set.
         * @returns {Object} this shiny new widget.
         * @private
         */
        init: function (options) {

            this._super(options);

            this.$loadingDiv = $('<div>').addClass('kb-data-list-type')
                .append('<img src="' + this.options.loadingImage + '">');
            this.$elem.append(this.$loadingDiv);
            this.$mainPanel = $('<div>').attr('data-test-id', 'example-data-objects')
                .css({ 'overflow-y': 'auto', 'height': '604px' });
            this.$elem.append(this.$mainPanel);

            this.dataConfig = Config.get('exampleData');
            const icons = Config.get('icons');
            this.data_icons = icons.data;
            this.icon_colors = icons.colors;
            this.showLoading();

            this.narWs = Jupyter.narrative.getWorkspaceName();

            $(document).on('deleteDataList.Narrative', (_, data) => {
                this.loadedData[data] = false;
                const className = '.' + data.split('.').join('--');
                $(className).html('');
                $(className).append($('<span>').addClass('fa fa-chevron-circle-left'))
                    .append(' Add');
            });
            return this;
        },

        refresh: function () {
        },

        objectList: null,

        getExampleDataAndRender: function () {
            if (!this.dataConfig) {
                this.showError('Unable to load example data configuration! Please refresh your page to try again. If this continues to happen, please <a href=\'https://www.kbase.us/support/\'>click here</a> to contact KBase with the problem.');
                return;
            }

            if (this.narWs) {
                Promise.resolve(this.serviceClient.sync_call(
                    'NarrativeService.list_objects_with_sets',
                    [{
                        ws_name: this.dataConfig.workspaceName
                    }]
                ))
                    .then((infoList) => {
                        $(document).trigger('dataLoadedQuery.Narrative', [
                            false, 0,
                            (data) => {
                                Object.keys(data).forEach((type) => {
                                    data[type].forEach((obj) => {
                                        const name = obj[1];
                                        this.loadedData[name] = true;
                                    });
                                });
                            }
                        ]);
                        infoList = infoList[0]['data'];
                        this.infoList = infoList;
                        this.render();
                    })
                    .catch((error) => {
                        this.showError('Sorry, we\'re unable to load example data', error);
                        alert(error);
                    });
            }
        },
        render: function () {
            this.objectList = [];
            // object_info:
            // [0] : obj_id objid // [1] : obj_name name // [2] : type_string type
            // [3] : timestamp save_date // [4] : int version // [5] : username saved_by
            // [6] : ws_id wsid // [7] : ws_name workspace // [8] : string chsum
            // [9] : int size // [10] : usermeta meta
            for (let i = 0; i < this.infoList.length; i++) {
                const obj = this.infoList[i].object_info;

                // skip narrative objects
                if (obj[2].indexOf('KBaseNarrative') === 0) {
                    continue;
                }
                if (obj[1].indexOf('Transcriptome') === 0) {
                    obj[2] = 'TranscriptomeHack';
                }
                this.objectList.push({
                    $div: this.renderObjectRowDiv(obj), // we defer rendering the div until it is shown
                    info: obj
                });
            }
            this.renderData();
        },
        showError: function (title, error) {
            this.$mainPanel.show();
            this.$mainPanel.append(DisplayUtil.createError(title, error));
            this.hideLoading();
        },

        renderData: function () {
            if (!this.objectList) {
                return;
            }

            const typeDivs = {};
            const showTypeDiv = {};
            for (let t = 0; t < this.dataConfig.data_types.length; t++) {
                const typeInfo = this.dataConfig.data_types[t];
                const $typeContainer = $('<div>')
                    .attr('data-test-id', 'type-container')
                    .append($('<div>')
                        .css({ 'margin': '15px' })
                        .append($('<div>')
                            .css({
                                'margin': '4px',
                                'margin-top': '15px',
                                'color': '#555',
                                'font-size': 'large',
                                'font-weight': 'bold'
                            })
                            .append(typeInfo.displayName))
                        .append($('<div>')
                            .css({ 'margin': '4px', 'color': '#555' })
                            .append(typeInfo.header)));
                for (let k = 0; k < typeInfo.name.length; k++) {
                    typeDivs[typeInfo.name[k]] = $typeContainer;
                    showTypeDiv[typeInfo.name[k]] = false;
                }
            }
            const $otherTypesContainer = $('<div>')
                .attr('data-test-id', 'type-container')
                .append($('<div>')
                    .css({ 'margin': '15px' })
                    .append($('<div>')
                        .css({
                            'margin': '4px',
                            'margin-top': '15px',
                            'color': '#555',
                            'font-size': 'large',
                            'font-weight': 'bold'
                        })
                        .append('Other Examples'))
                    .append($('<div>')
                        .css({ 'margin': '4px', 'color': '#555' })
                        .append('Assorted data types used in other analyses')));
            typeDivs['other.types'] = $otherTypesContainer;

            let hasOthers = false;
            this.objectList.sort((a, b) => {
                if (a.info[2].toUpperCase() > b.info[2].toUpperCase()) return -1; // sort by type
                if (a.info[2].toUpperCase() < b.info[2].toUpperCase()) return 1;
                if (a.info[1].toUpperCase() > b.info[1].toUpperCase()) return -1; // then by name
                if (a.info[1].toUpperCase() < b.info[1].toUpperCase()) return 1;
                return 0;
            });
            for (let k = 0; k < this.objectList.length; k++) {
                const obj = this.objectList[k];
                let typeName = '';
                if (obj.info[2] === 'TranscriptomeHack') {
                    typeName = obj.info[2];
                } else {
                    typeName = obj.info[2].split('-')[0].split('.')[1];
                }

                if (typeDivs[typeName]) {
                    typeDivs[typeName].append(obj.$div);
                    showTypeDiv[typeName] = true;
                } else {
                    typeDivs['other.types'].append(obj.$div);
                    hasOthers = true;
                }
            }

            for (let t = 0; t < this.dataConfig.data_types.length; t++) {
                const typeNames = this.dataConfig.data_types[t].name;
                let showDiv = false;
                for (let k = 0; k < typeNames.length; k++) {
                    if (showTypeDiv[typeNames[k]]) {
                        showDiv = true;
                    }
                }
                if (showDiv) {
                    this.$mainPanel.append(typeDivs[typeNames[0]]);
                }
            }
            if (hasOthers) {
                this.$mainPanel.append(typeDivs['other.types']);
            }

            this.hideLoading();
        },

        renderObjectRowDiv: function (object_info) {
            const isCopy = this.loadedData[object_info[1]];

            let type = '';
            if (object_info[2] === 'TranscriptomeHack') {
                type = 'Genome';
            } else {
                const type_tokens = object_info[2].split('.');
                type = type_tokens[1].split('-')[0];
            }
            const actionButtonText = (isCopy) ? ' Copy' : ' Add';

            const $card = kbaseDataCard.apply(this, [{
                version: false,
                date: false,
                editedBy: false,
                actionButtonText: actionButtonText,
                name: object_info[1],
                type,
                max_name_length: this.options.max_name_length,
                object_info,
                self: this,
                ws_name: this.narWs,
                copyFunction: () => this.doObjectCopy(object_info[6] + '/' + object_info[0])
            }]);

            return $card;
        },

        /**
         * Makes a copy of the object in the current workspace by calling to NarrativeService.
         * Returns a Promise around that copy function.
         * @param {string} objRef
         */
        doObjectCopy: function (objRef) {
            return this.serviceClient.sync_call(
                'NarrativeService.copy_object',
                [{
                    ref: objRef,
                    target_ws_name: this.narWs,
                }]
            );
        },

        showLoading: function () {
            this.$loadingDiv.show();
            this.$mainPanel.hide();
        },

        hideLoading: function () {
            this.$loadingDiv.hide();
            this.$mainPanel.show();
        },

        loggedInCallback: function (event, auth) {
            this.serviceClient = new GenericClient(Config.url('service_wizard'), auth);
            return this;
        },

        loggedOutCallback: function () {
            this.isLoggedIn = false;
            return this;
        },
    });
});
