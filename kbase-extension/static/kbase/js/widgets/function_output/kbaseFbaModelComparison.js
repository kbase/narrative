define([
    'kbwidget',
    'bootstrap',
    'jquery',
    'kbaseAuthenticatedWidget',
    'kbaseTabs',
    'jquery-dataTables',
], (KBWidget, bootstrap, $, kbaseAuthenticatedWidget, kbaseTabs, jquery_dataTables) => {
    return KBWidget({
        name: 'FbaModelComparisonWidget',
        parent: kbaseAuthenticatedWidget,
        version: '1.0.0',
        token: null,
        ws_name: null,
        fba_model1_id: null,
        fba_model1: null,
        fba_model2_id: null,
        fba_model2: null,
        genome1_ref: null,
        genome2_ref: null,
        genome1_id: null,
        genome2_id: null,
        genome1_name: null,
        genome2_name: null,
        proteome_cmp: null,
        gene_translation: {},
        options: {
            ws_name: null,
            fba_model1_id: null,
            fba_model2_id: null,
            proteome_cmp_id: null,
        },

        wsUrl: window.kbconfig.urls.workspace,
        loadingImage: window.kbconfig.loading_gif,

        init: function (options) {
            this._super(options);
            this.ws_name = options.ws_name;
            this.fba_model1_id = options.fba_model1_id;
            this.fba_model2_id = options.fba_model2_id;
            this.gene_translation = {};
            if (options.proteome_cmp) {
                this.proteome_cmp = options.proteome_cmp;
            }
            return this;
        },

        render: function () {
            const self = this;
            const container = this.$elem;
            container.empty();
            if (!self.authToken()) {
                container.append("<div>[Error] You're not logged in</div>");
                return;
            }

            container.append(
                '<div><img src="' +
                    self.loadingImage +
                    '">&nbsp;&nbsp;Loading models and comparison data...</div>'
            );

            const pref = this.uuid();
            const kbws = new Workspace(this.wsUrl, { token: self.authToken() });
            const get_object_input = [
                { ref: self.ws_name + '/' + self.fba_model1_id },
                { ref: self.ws_name + '/' + self.fba_model2_id },
            ];
            if (self.proteome_cmp) {
                get_object_input.push({ ref: self.ws_name + '/' + self.proteome_cmp });
            }
            kbws.get_objects(
                get_object_input,
                (data) => {
                    self.fba_model1 = data[0].data;
                    self.fba_model2 = data[1].data;
                    prepare_model(self.fba_model1);
                    prepare_model(self.fba_model2);
                    self.genome1_ref = self.fba_model1.genome_ref;
                    self.genome2_ref = self.fba_model2.genome_ref;
                    if (data[2]) {
                        let ftrs = data[2].data.proteome1names;
                        for (var i = 0; i < ftrs.length; i++) {
                            var hits = data[2].data.data1[i];
                            for (var j = 0; j < hits.length; j++) {
                                //if (hits[j][2] == 100) {
                                if (self.gene_translation[ftrs[i]] === undefined) {
                                    self.gene_translation[ftrs[i]] = [];
                                }
                                self.gene_translation[ftrs[i]].push(
                                    data[2].data.proteome2names[hits[j][0]]
                                );
                                //}
                            }
                        }
                        ftrs = data[2].data.proteome2names;
                        for (var i = 0; i < ftrs.length; i++) {
                            var hits = data[2].data.data2[i];
                            for (var j = 0; j < hits.length; j++) {
                                //if (hits[j][2] == 100) {
                                if (self.gene_translation[ftrs[i]] === undefined) {
                                    self.gene_translation[ftrs[i]] = [];
                                }
                                self.gene_translation[ftrs[i]].push(
                                    data[2].data.proteome1names[hits[j][0]]
                                );
                                //}
                            }
                        }
                    }
                    kbws.get_object_subset(
                        [
                            { ref: self.genome1_ref, included: ['scientific_name'] },
                            { ref: self.genome2_ref, included: ['scientific_name'] },
                        ],
                        (data) => {
                            self.genome1_id = data[0].info[1];
                            self.genome2_id = data[1].info[1];
                            self.genome1_name = data[0].data.scientific_name;
                            self.genome2_name = data[1].data.scientific_name;
                            dataIsReady();
                        },
                        (data) => {
                            if (!error) container.empty();
                            error = true;
                            container.append('<p>[Error] ' + data.error.message + '</p>');
                        }
                    );
                },
                (data) => {
                    if (!error) container.empty();
                    error = true;
                    container.append('<p>[Error] ' + data.error.message + '</p>');
                }
            );

            var prepare_model = function (model) {
                model.cpdhash = {};
                model.rxnhash = {};
                model.cmphash = {};
                for (var i = 0; i < model.modelcompartments.length; i++) {
                    const cmp = model.modelcompartments[i];
                    model.cmphash[cmp.id] = cmp;
                }
                for (var i = 0; i < model.modelcompounds.length; i++) {
                    const cpd = model.modelcompounds[i];
                    cpd.cmpkbid = cpd.modelcompartment_ref.split('/').pop();
                    cpd.cpdkbid = cpd.compound_ref.split('/').pop();
                    if (cpd.name === undefined) {
                        cpd.name = cpd.id;
                    }
                    cpd.name = cpd.name.replace(/_[a-zA-z]\d+$/, '');
                    model.cpdhash[cpd.id] = cpd;
                    if (cpd.cpdkbid != 'cpd00000') {
                        model.cpdhash[cpd.cpdkbid + '_' + cpd.cmpkbid] = cpd;
                    }
                }
                for (var i = 0; i < model.modelreactions.length; i++) {
                    const rxn = model.modelreactions[i];
                    rxn.rxnkbid = rxn.reaction_ref.split('/').pop();
                    rxn.cmpkbid = rxn.modelcompartment_ref.split('/').pop();
                    rxn.dispid = rxn.id.replace(/_[a-zA-z]\d+$/, '') + '[' + rxn.cmpkbid + ']';
                    rxn.name = rxn.name.replace(/_[a-zA-z]\d+$/, '');
                    if (rxn.name == 'CustomReaction') {
                        rxn.name = rxn.id.replace(/_[a-zA-z]\d+$/, '');
                    }
                    model.rxnhash[rxn.id] = rxn;
                    if (rxn.rxnkbid != 'rxn00000') {
                        model.rxnhash[rxn.rxnkbid + '_' + rxn.cmpkbid] = rxn;
                        if (rxn.rxnkbid + '_' + rxn.cmpkbid != rxn.id) {
                            rxn.dispid += '<br>(' + rxn.rxnkbid + ')';
                        }
                    }
                    let reactants = '';
                    let products = '';
                    let sign = '<=>';
                    if (rxn.direction == '>') {
                        sign = '=>';
                    } else if (rxn.direction == '<') {
                        sign = '<=';
                    }
                    for (var j = 0; j < rxn.modelReactionReagents.length; j++) {
                        const rgt = rxn.modelReactionReagents[j];
                        rgt.cpdkbid = rgt.modelcompound_ref.split('/').pop();
                        if (rgt.coefficient < 0) {
                            if (reactants.length > 0) {
                                reactants += ' + ';
                            }
                            if (rgt.coefficient != -1) {
                                var abscoef = Math.round(-1 * 100 * rgt.coefficient) / 100;
                                reactants += '(' + abscoef + ') ';
                            }
                            reactants +=
                                model.cpdhash[rgt.cpdkbid].name +
                                '[' +
                                model.cpdhash[rgt.cpdkbid].cmpkbid +
                                ']';
                        } else {
                            if (products.length > 0) {
                                products += ' + ';
                            }
                            if (rgt.coefficient != 1) {
                                var abscoef = Math.round(100 * rgt.coefficient) / 100;
                                products += '(' + abscoef + ') ';
                            }
                            products +=
                                model.cpdhash[rgt.cpdkbid].name +
                                '[' +
                                model.cpdhash[rgt.cpdkbid].cmpkbid +
                                ']';
                        }
                    }
                    rxn.ftrhash = {};
                    for (var j = 0; j < rxn.modelReactionProteins.length; j++) {
                        const prot = rxn.modelReactionProteins[j];
                        for (let k = 0; k < prot.modelReactionProteinSubunits.length; k++) {
                            const subunit = prot.modelReactionProteinSubunits[k];
                            for (let m = 0; m < subunit.feature_refs.length; m++) {
                                rxn.ftrhash[subunit.feature_refs[m].split('/').pop()] = 1;
                            }
                        }
                    }
                    rxn.dispfeatures = '';
                    for (const gene in rxn.ftrhash) {
                        if (rxn.dispfeatures.length > 0) {
                            rxn.dispfeatures += '<br>';
                        }
                        rxn.dispfeatures += gene;
                    }
                    rxn.equation = reactants + ' ' + sign + ' ' + products;
                }
            };

            const compare_models = function () {
                model1 = self.fba_model1;
                model2 = self.fba_model2;
                self.overlap_rxns = [];
                self.exact_matches = 0;
                model1.unique_rxn = [];
                for (var i = 0; i < model1.modelreactions.length; i++) {
                    var rxn = model1.modelreactions[i];
                    if (rxn.rxnkbid == 'rxn00000') {
                        if (model2.rxnhash[rxn.id] === undefined) {
                            model1.unique_rxn.push(rxn);
                        } else {
                            var rxn2 = model2.rxnhash[rxn.id];
                            var model1ftrs = '';
                            var exact = 1;
                            for (var gene in rxn.ftrhash) {
                                if (model1ftrs.length > 0) {
                                    model1ftrs += '<br>';
                                }
                                if (self.gene_translation[gene]) {
                                    var transftrs = self.gene_translation[gene];
                                    var found = 0;
                                    for (var n = 0; n < transftrs.length; n++) {
                                        if (rxn2.ftrhash[transftrs[n]]) {
                                            model1ftrs += gene;
                                            found = 1;
                                            break;
                                        }
                                    }
                                    if (found == 0) {
                                        model1ftrs += '<font color="red">' + gene + '</font>';
                                        exact = 0;
                                    }
                                } else if (rxn2.ftrhash[gene] === undefined) {
                                    model1ftrs += '<font color="red">' + gene + '</font>';
                                    exact = 0;
                                } else {
                                    model1ftrs += gene;
                                }
                            }
                            var model2ftrs = '';
                            for (var gene in rxn2.ftrhash) {
                                if (model2ftrs.length > 0) {
                                    model2ftrs += '<br>';
                                }
                                if (self.gene_translation[gene]) {
                                    var transftrs = self.gene_translation[gene];
                                    var found = 0;
                                    for (var n = 0; n < transftrs.length; n++) {
                                        if (rxn.ftrhash[transftrs[n]]) {
                                            model2ftrs += gene;
                                            found = 1;
                                            break;
                                        }
                                    }
                                    if (found == 0) {
                                        model2ftrs += '<font color="red">' + gene + '</font>';
                                        exact = 0;
                                    }
                                } else if (rxn.ftrhash[gene] === undefined) {
                                    model2ftrs += '<font color="red">' + gene + '</font>';
                                    exact = 0;
                                } else {
                                    model2ftrs += gene;
                                }
                            }
                            if (exact == 1) {
                                self.exact_matches++;
                            }
                            self.overlap_rxns.push({
                                model1rxn: rxn,
                                model2rxn: rxn2,
                                canonical: 0,
                                exact: exact,
                                model1features: model1ftrs,
                                model2features: model2ftrs,
                            });
                        }
                    } else if (model2.rxnhash[rxn.rxnkbid + '_' + rxn.cmpkbid] === undefined) {
                        model1.unique_rxn.push(rxn);
                    } else {
                        var rxn2 = model2.rxnhash[rxn.rxnkbid + '_' + rxn.cmpkbid];
                        var model1ftrs = '';
                        var exact = 1;
                        for (var gene in rxn.ftrhash) {
                            if (model1ftrs.length > 0) {
                                model1ftrs += '<br>';
                            }
                            if (self.gene_translation[gene]) {
                                var transftrs = self.gene_translation[gene];
                                var found = 0;
                                for (var n = 0; n < transftrs.length; n++) {
                                    if (rxn2.ftrhash[transftrs[n]]) {
                                        model1ftrs += gene;
                                        found = 1;
                                        break;
                                    }
                                }
                                if (found == 0) {
                                    model1ftrs += '<font color="red">' + gene + '</font>';
                                    exact = 0;
                                }
                            } else if (rxn2.ftrhash[gene] === undefined) {
                                model1ftrs += '<font color="red">' + gene + '</font>';
                                exact = 0;
                            } else {
                                model1ftrs += gene;
                            }
                        }
                        var model2ftrs = '';
                        for (var gene in rxn2.ftrhash) {
                            if (model2ftrs.length > 0) {
                                model2ftrs += '<br>';
                            }
                            if (self.gene_translation[gene]) {
                                var transftrs = self.gene_translation[gene];
                                var found = 0;
                                for (var n = 0; n < transftrs.length; n++) {
                                    if (rxn.ftrhash[transftrs[n]]) {
                                        model2ftrs += gene;
                                        found = 1;
                                        break;
                                    }
                                }
                                if (found == 0) {
                                    model2ftrs += '<font color="red">' + gene + '</font>';
                                    exact = 0;
                                }
                            } else if (rxn.ftrhash[gene] === undefined) {
                                model2ftrs += '<font color="red">' + gene + '</font>';
                                exact = 0;
                            } else {
                                model2ftrs += gene;
                            }
                        }
                        if (exact == 1) {
                            self.exact_matches++;
                        }
                        self.overlap_rxns.push({
                            model1rxn: rxn,
                            model2rxn: rxn2,
                            canonical: 1,
                            exact: exact,
                            model1features: model1ftrs,
                            model2features: model2ftrs,
                        });
                    }
                }
                model2.unique_rxn = [];
                for (var i = 0; i < model2.modelreactions.length; i++) {
                    var rxn = model2.modelreactions[i];
                    if (rxn.rxnkbid == 'rxn00000') {
                        if (model1.rxnhash[rxn.id] === undefined) {
                            model2.unique_rxn.push(rxn);
                        }
                    } else if (model1.rxnhash[rxn.rxnkbid + '_' + rxn.cmpkbid] === undefined) {
                        model2.unique_rxn.push(rxn);
                    }
                }
            };

            var dataIsReady = function () {
                compare_models();
                ///////////////////////////////////// Instantiating Tabs ////////////////////////////////////////////
                container.empty();
                const tabPane = $('<div id="' + self.pref + 'tab-content">');
                container.append(tabPane);
                const tabWidget = new kbaseTabs(tabPane, { canDelete: true, tabs: [] });
                //////////////////////////////////////////// Statistics tab /////////////////////////////////////////////
                const tabStats = $('<div/>');
                tabWidget.addTab({
                    tab: 'Statistics',
                    content: tabStats,
                    canDelete: false,
                    show: true,
                });
                const tableStats = $(
                    '<table class="table table-striped table-bordered" ' +
                        'style="margin-left: auto; margin-right: auto;" id="' +
                        self.pref +
                        'modelcomp-stats"/>'
                );
                tabStats.append(tableStats);
                tableStats.append(
                    '<tr><td><b>' +
                        self.fba_model1_id +
                        '</b> genome</td><td>' +
                        self.genome1_id +
                        '<br>(' +
                        self.genome1_name +
                        ')</td></tr>'
                );
                tableStats.append(
                    '<tr><td><b>' +
                        self.fba_model2_id +
                        '</b> genome</td><td>' +
                        self.genome2_id +
                        '<br>(' +
                        self.genome2_name +
                        ')</td></tr>'
                );
                tableStats.append(
                    '<tr><td>Reactions in <b>' +
                        self.fba_model1_id +
                        '</b></td><td>' +
                        self.fba_model1.modelreactions.length +
                        '</td></tr>'
                );
                tableStats.append(
                    '<tr><td>Reactions in <b>' +
                        self.fba_model2_id +
                        '</b></td><td>' +
                        self.fba_model2.modelreactions.length +
                        '</td></tr>'
                );
                tableStats.append(
                    '<tr><td>Common reactions</td><td>' + self.overlap_rxns.length + '</td></tr>'
                );
                tableStats.append(
                    '<tr><td>Reactions with same features</td><td>' +
                        self.exact_matches +
                        '</td></tr>'
                );
                tableStats.append(
                    '<tr><td>Unique reactions in <b>' +
                        self.fba_model1_id +
                        '</b></td><td>' +
                        self.fba_model1.unique_rxn.length +
                        '</td></tr>'
                );
                tableStats.append(
                    '<tr><td>Unique reactions in <b>' +
                        self.fba_model2_id +
                        '</b></td><td>' +
                        self.fba_model2.unique_rxn.length +
                        '</td></tr>'
                );
                //////////////////////////////////////////// Common tab /////////////////////////////////////////////
                const tabCommon = $('<div/>');
                tabWidget.addTab({
                    tab: 'Common reactions',
                    content: tabCommon,
                    canDelete: false,
                    show: false,
                });
                const tableCommon = $(
                    '<table class="table table-striped table-bordered" ' +
                        'style="margin-left: auto; margin-right: auto;" id="' +
                        self.pref +
                        'modelcomp-common"/>'
                );
                tabCommon.append(tableCommon);
                tableCommon.dataTable({
                    sPaginationType: 'full_numbers',
                    iDisplayLength: 10,
                    aaData: self.overlap_rxns,
                    aaSorting: [
                        [2, 'desc'],
                        [0, 'asc'],
                    ],
                    aoColumns: [
                        { sTitle: 'Reaction', mData: 'model1rxn.dispid' },
                        {
                            sTitle:
                                'Equation&nbsp;&nbsp;&nbsp&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                            mData: 'model1rxn.equation',
                        },
                        {
                            sTitle: '<b>' + self.fba_model1_id + '</b> features',
                            mData: 'model1features',
                        },
                        {
                            sTitle: '<b>' + self.fba_model2_id + '</b> features',
                            mData: 'model2features',
                        },
                        { sTitle: 'Name', mData: 'model1rxn.name' },
                        { sTitle: 'Exact', mData: 'exact' },
                    ],
                    oLanguage: {
                        sEmptyTable: 'No functions found!',
                        sSearch: 'Search: ',
                    },
                    fnDrawCallback: events,
                });
                tabCommon.append(
                    $(
                        '<table><tr><td>(*) color legend: sub-best bidirectional hits are marked<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;by <font color="blue">blue</font>, ' +
                            'orphan features are marked by <font color="red">red</font>.</td></tr></table>'
                    )
                );
                //////////////////////////////////////////// Model1 only tab /////////////////////////////////////////////
                const tabModel1 = $('<div/>');
                tabWidget.addTab({
                    tab: self.fba_model1_id + ' only',
                    content: tabModel1,
                    canDelete: false,
                    show: false,
                });
                const tableModel1 = $(
                    '<table class="table table-striped table-bordered" ' +
                        'style="margin-left: auto; margin-right: auto;" id="' +
                        self.pref +
                        'modelcomp-model1"/>'
                );
                tabModel1.append(tableModel1);
                tableModel1.dataTable({
                    sPaginationType: 'full_numbers',
                    iDisplayLength: 10,
                    aaData: self.fba_model1.unique_rxn,
                    aaSorting: [
                        [2, 'desc'],
                        [0, 'asc'],
                    ],
                    aoColumns: [
                        { sTitle: 'Reaction', mData: 'dispid' },
                        {
                            sTitle:
                                'Equation&nbsp;&nbsp;&nbsp&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                            mData: 'equation',
                        },
                        {
                            sTitle: '<b>' + self.fba_model1_id + '</b> features',
                            mData: 'dispfeatures',
                        },
                        { sTitle: 'Name', mData: 'name' },
                    ],
                    oLanguage: {
                        sEmptyTable: 'No functions found!',
                        sSearch: 'Search: ',
                    },
                    fnDrawCallback: events,
                });
                //////////////////////////////////////////// Model2 only tab /////////////////////////////////////////////
                const tabModel2 = $('<div/>');
                tabWidget.addTab({
                    tab: self.fba_model2_id + ' only',
                    content: tabModel2,
                    canDelete: false,
                    show: false,
                });
                const tableModel2 = $(
                    '<table class="table table-striped table-bordered" ' +
                        'style="margin-left: auto; margin-right: auto;" id="' +
                        self.pref +
                        'modelcomp-model2"/>'
                );
                tabModel2.append(tableModel2);
                tableModel2.dataTable({
                    sPaginationType: 'full_numbers',
                    iDisplayLength: 10,
                    aaData: self.fba_model2.unique_rxn,
                    aaSorting: [
                        [2, 'desc'],
                        [0, 'asc'],
                    ],
                    aoColumns: [
                        { sTitle: 'Reaction', mData: 'dispid' },
                        {
                            sTitle:
                                'Equation&nbsp;&nbsp;&nbsp&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                            mData: 'equation',
                        },
                        {
                            sTitle: '<b>' + self.fba_model2_id + '</b> features',
                            mData: 'dispfeatures',
                        },
                        { sTitle: 'Name', mData: 'name' },
                    ],
                    oLanguage: {
                        sEmptyTable: 'No functions found!',
                        sSearch: 'Search: ',
                    },
                    fnDrawCallback: events,
                });
                ///////////////////////////////////// Event handling for links ///////////////////////////////////////////
                function events() {
                    // event for clicking on ortholog count
                    $('.show-reaction' + self.pref).unbind('click');
                    $('.show-reaction' + self.pref).click(function () {
                        const id = $(this).data('id');
                        if (tabWidget.hasTab(id)) {
                            tabWidget.showTab(id);
                            return;
                        }
                        tabWidget.addTab({
                            tab: id,
                            content: 'Coming soon!',
                            canDelete: true,
                            show: true,
                        });
                    });
                    $('.show-gene' + self.pref).unbind('click');
                    $('.show-gene' + self.pref).click(function () {
                        const id = $(this).data('id');
                        if (tabWidget.hasTab(id)) {
                            tabWidget.showTab(id);
                            return;
                        }
                        tabWidget.addTab({
                            tab: id,
                            content: 'Coming soon!',
                            canDelete: true,
                            show: true,
                        });
                    });
                }
            };
            return this;
        },

        loggedInCallback: function (event, auth) {
            this.token = auth.token;
            this.render();
            return this;
        },

        loggedOutCallback: function (event, auth) {
            this.token = null;
            this.render();
            return this;
        },

        uuid: function () {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                const r = (Math.random() * 16) | 0,
                    v = c == 'x' ? r : (r & 0x3) | 0x8;
                return v.toString(16);
            });
        },
    });
});
