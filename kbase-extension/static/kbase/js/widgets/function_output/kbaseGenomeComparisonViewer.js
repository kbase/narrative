define([
    'kbwidget',
    'bootstrap',
    'jquery',
    'kbaseAuthenticatedWidget',
    'kbaseTabs',
    'jquery-dataTables',
    'util/string',
    'narrativeConfig',
], function (
    KBWidget,
    bootstrap,
    $,
    kbaseAuthenticatedWidget,
    kbaseTabs,
    jquery_dataTables,
    StringUtil,
    Config
) {
    return KBWidget({
        name: 'kbaseGenomeComparisonViewer',
        parent: kbaseAuthenticatedWidget,
        version: '1.0.0',
        id: null,
        ws: null,
        pref: null,
        width: 1150,
        options: {
            id: null,
            ws: null,
        },
        wsUrl: Config.url('workspace'),
        loadingImage: Config.get('loading_gif'),

        init: function (options) {
            this._super(options);
            this.pref = StringUtil.uuid();
            this.ws = options.ws;
            this.id = options.id;
            return this;
        },

        render: function () {
            var self = this;

            var container = this.$elem;
            container.empty();
            if (!self.authToken()) {
                container.append("<div>[Error] You're not logged in</div>");
                return;
            }
            container.append(
                '<div><img src="' +
                    self.loadingImage +
                    '">&nbsp;&nbsp;loading genome comparison data...</div>'
            );

            var kbws = new Workspace(self.wsUrl, { token: self.authToken() });

            //var request = {auth: self.authToken(), workspace: self.ws_name, id: self.simulation_id, type: 'KBasePhenotypes.PhenotypeSimulationSet'};
            kbws.get_objects(
                [{ ref: self.ws + '/' + self.id }],
                function (data) {
                    ///////////////////////////////////// Data Preparation ////////////////////////////////////////////
                    var object = data[0].data;
                    var info = data[0].info;
                    var genomes = object.genomes;
                    var functions = object.functions;
                    var families = object.families;
                    ///////////////////////////////////// Instantiating Tabs ////////////////////////////////////////////
                    container.empty();
                    var tabPane = $('<div id="' + self.pref + 'tab-content">');
                    container.append(tabPane);
                    var tabObj = new kbaseTabs(tabPane, { canDelete: true, tabs: [] });
                    ///////////////////////////////////// Overview table ////////////////////////////////////////////
                    var tabOverview = $('<div/>');
                    tabObj.addTab({
                        tab: 'Pangenome Overview',
                        content: tabOverview,
                        canDelete: false,
                        show: true,
                    });
                    var tableOver = $(
                        '<table class="table table-striped table-bordered" ' +
                            'style="margin-left: auto; margin-right: auto;" id="' +
                            self.pref +
                            'overview-table"/>'
                    );
                    tabOverview.append(tableOver);
                    tableOver.append(
                        '<tr><td>Genome comparison object</td><td>' + info[1] + '</td></tr>'
                    );
                    if (object.protcomp_ref) {
                        tableOver.append(
                            '<tr><td>Genome Comparison</td><td>' +
                                object.protcomp_ref +
                                '</td></tr>'
                        );
                    } else {
                        tableOver.append(
                            '<tr><td>Pangenome</td><td>' + object.pangenome_ref + '</td></tr>'
                        );
                    }
                    //tableOver.append('<tr><td>Genome comparison workspace</td><td>'+info[7]+'</td></tr>');
                    tableOver.append(
                        '<tr><td>Core functions</td><td>' + object.core_functions + '</td></tr>'
                    );
                    tableOver.append(
                        '<tr><td>Total functions</td><td>' + object.functions.length + '</td></tr>'
                    );
                    tableOver.append(
                        '<tr><td>Core families</td><td>' + object.core_families + '</td></tr>'
                    );
                    tableOver.append(
                        '<tr><td>Total families</td><td>' + object.families.length + '</td></tr>'
                    );
                    tableOver.append(
                        '<tr><td>Number of Genomes</td><td>' +
                            info[10]['Number genomes'] +
                            '</td></tr>'
                    );

                    //tableOver.append('<tr><td>Owner</td><td>'+info[5]+'</td></tr>');
                    //tableOver.append('<tr><td>Creation</td><td>'+info[3]+'</td></tr>');
                    ///////////////////////////////////// Genomes table ////////////////////////////////////////////
                    var tabGenomes = $('<div/>');
                    tabObj.addTab({
                        tab: 'Genome Comparison',
                        content: tabGenomes,
                        canDelete: false,
                        show: false,
                    });
                    var tableGenomes = $(
                        '<table class="table table-striped table-bordered" ' +
                            'style="margin-left: auto; margin-right: auto;" id="' +
                            self.pref +
                            'genome-table"/>'
                    );
                    tabGenomes.append(tableGenomes);
                    var headings = ['Genome', 'Legend'];
                    var numGenomes = genomes.length;
                    for (var i = 0; i < numGenomes; i++) {
                        headings.push('G' + (i + 1));
                    }
                    tableGenomes.append(
                        '<tr><th><b>' + headings.join('</b></th><th><b>') + '</b></th></tr>'
                    );
                    for (var i = 0; i < numGenomes; i++) {
                        var genome = genomes[i];
                        var row = [
                            '<b>G' + (i + 1) + '</b>-' + genome.name,
                            '# of families:<br># of functions:',
                        ];
                        for (var j in genomes) {
                            var compgenome = genomes[j];
                            if (genome.genome_similarity[compgenome.genome_ref]) {
                                row.push(
                                    genome.genome_similarity[compgenome.genome_ref][0] +
                                        '<br>' +
                                        genome.genome_similarity[compgenome.genome_ref][1]
                                );
                            } else if (j == i) {
                                row.push(
                                    "<font color='#d2691e'>" +
                                        genome.families +
                                        '<br>' +
                                        genome.functions +
                                        '</font>'
                                );
                            } else {
                                row.push('0<br>0');
                            }
                        }
                        tableGenomes.append('<tr><td>' + row.join('</td><td>') + '</td></tr>');
                    }
                    ///////////////////////////////////// Families table ////////////////////////////////////////////
                    var tabFamilies = $('<div/>');
                    if (self.options.withExport) {
                        tabFamilies.append(
                            "<p><b>Please choose homolog family and push 'Export' " +
                                'button on opened ortholog tab.</b></p><br>'
                        );
                    }
                    tabObj.addTab({
                        tab: 'Families',
                        content: tabFamilies,
                        canDelete: false,
                        show: false,
                    });
                    var tableFamilies = $(
                        '<table class="table table-striped table-bordered" ' +
                            'style="margin-left: auto; margin-right: auto;" id="' +
                            self.pref +
                            'genome-table"/>'
                    );
                    tabFamilies.append(tableFamilies);
                    var fam_data = [];
                    tableSettings = {
                        sPaginationType: 'full_numbers',
                        iDisplayLength: 10,
                        aaData: fam_data,
                        aaSorting: [
                            [2, 'desc'],
                            [0, 'asc'],
                        ],
                        aoColumns: [
                            { sTitle: 'Family', mData: 'id' },
                            { sTitle: 'Totals', mData: 'totals' },
                            { sTitle: 'Functions', mData: 'functions' },
                            { sTitle: 'Subsystems', mData: 'subsystem' },
                            { sTitle: 'Primary classes', mData: 'primclass' },
                            { sTitle: 'Secondary classes', mData: 'subclass' },
                            { sTitle: 'Function genes', mData: 'funcgenes' },
                            { sTitle: 'Function genomes', mData: 'funcgenomes' },
                        ],
                        oLanguage: {
                            sEmptyTable: 'No families found!',
                            sSearch: 'Search: ',
                        },
                        fnDrawCallback: events,
                    };
                    for (var i in families) {
                        var fam = families[i];
                        var famdata = {
                            id:
                                '<a class="show-family' +
                                self.pref +
                                '" data-id="' +
                                fam.id +
                                '">' +
                                fam.id +
                                '</a>',
                        };
                        var famindecies = {};
                        var famgenomes = {};
                        var gcount = 0;
                        for (var j in genomes) {
                            var compgenome = genomes[j];
                            if (fam.genome_features[compgenome.genome_ref]) {
                                var genomefams = {};
                                var genes = fam.genome_features[compgenome.genome_ref];
                                for (var k in genes) {
                                    gcount++;
                                    gene = genes[k];
                                    var array = gene[1];
                                    for (var m in array) {
                                        if (famindecies[array[m]] === undefined) {
                                            famindecies[array[m]] = 0;
                                        }
                                        genomefams[array[m]] = 1;
                                        famindecies[array[m]]++;
                                    }
                                }
                                for (var genfam in genomefams) {
                                    if (famgenomes[genfam] === undefined) {
                                        famgenomes[genfam] = 0;
                                    }
                                    famgenomes[genfam]++;
                                }
                            }
                        }
                        var sortedfuncs = getSortedKeys(famindecies);
                        famdata.totals =
                            'Genes:&nbsp;' +
                            gcount +
                            '<br>Functions:&nbsp;' +
                            sortedfuncs.length +
                            '<br>Genomes:&nbsp;' +
                            fam.number_genomes;
                        famdata.functions = '';
                        famdata.subsystem = '';
                        famdata.primclass = '';
                        famdata.subclass = '';
                        famdata.funcgenes = '';
                        famdata.funcgenomes = '';
                        var count = 1;
                        for (var j in sortedfuncs) {
                            if (famdata.functions.length > 0) {
                                famdata.functions += '<br>';
                                famdata.subsystem += '<br>';
                                famdata.primclass += '<br>';
                                famdata.subclass += '<br>';
                                famdata.funcgenes += '<br>';
                                famdata.funcgenomes += '<br>';
                            }
                            if (sortedfuncs[j] === 'null') {
                                famdata.funcgenes += 0;
                                famdata.funcgenomes += 0;
                                famdata.functions += 'none';
                                famdata.subsystem += 'none';
                                famdata.primclass += 'none';
                                famdata.subclass += 'none';
                            } else {
                                famdata.funcgenes +=
                                    count +
                                    ': ' +
                                    famindecies[sortedfuncs[j]] +
                                    '(' +
                                    Math.round(
                                        (100 * famindecies[sortedfuncs[j]]) /
                                            functions[sortedfuncs[j]].numgenes
                                    ) +
                                    '%)';
                                famdata.funcgenomes +=
                                    count +
                                    ': ' +
                                    famgenomes[sortedfuncs[j]] +
                                    '(' +
                                    Math.round(
                                        (100 * famgenomes[sortedfuncs[j]]) /
                                            functions[sortedfuncs[j]].number_genomes
                                    ) +
                                    '%)';
                                famdata.functions +=
                                    count +
                                    ': ' +
                                    '<a class="show-function' +
                                    self.pref +
                                    '" data-pos="' +
                                    sortedfuncs[j] +
                                    '">' +
                                    functions[sortedfuncs[j]].id +
                                    '</a>';
                                famdata.subsystem +=
                                    count + ': ' + functions[sortedfuncs[j]].subsystem;
                                famdata.primclass +=
                                    count + ': ' + functions[sortedfuncs[j]].primclass;
                                famdata.subclass +=
                                    count + ': ' + functions[sortedfuncs[j]].subclass;
                            }
                            count++;
                        }
                        tableSettings.aaData.push(famdata);
                    }
                    tableFamilies.dataTable(tableSettings);
                    ///////////////////////////////////// Functions table ////////////////////////////////////////////
                    var tabFunctions = $('<div/>');
                    tabObj.addTab({
                        tab: 'Functions',
                        content: tabFunctions,
                        canDelete: false,
                        show: false,
                    });
                    var tableFunctions = $(
                        '<table class="table table-striped table-bordered" ' +
                            'style="margin-left: auto; margin-right: auto;" id="' +
                            self.pref +
                            'function-table"/>'
                    );
                    tabFunctions.append(tableFunctions);
                    var func_data = [];
                    var tableSettings = {
                        sPaginationType: 'full_numbers',
                        iDisplayLength: 10,
                        aaData: func_data,
                        aaSorting: [
                            [2, 'desc'],
                            [0, 'asc'],
                        ],
                        aoColumns: [
                            { sTitle: 'Function', mData: 'id' },
                            { sTitle: 'Subsystem', mData: 'subsystem' },
                            { sTitle: 'Primary class', mData: 'primclass' },
                            { sTitle: 'Secondary class', mData: 'subclass' },
                            { sTitle: 'Totals', mData: 'totals' },
                            { sTitle: 'Families', mData: 'families' },
                            { sTitle: 'Family genes', mData: 'famgenes' },
                            { sTitle: 'Family genomes', mData: 'famgenomes' },
                        ],
                        oLanguage: {
                            sEmptyTable: 'No functions found!',
                            sSearch: 'Search: ',
                        },
                        fnDrawCallback: events,
                    };
                    for (var i in families) {
                        var fam = families[i];
                        var gcount = 0;
                        for (var j in genomes) {
                            var compgenome = genomes[j];
                            if (fam.genome_features[compgenome.genome_ref]) {
                                var genes = fam.genome_features[compgenome.genome_ref];
                                for (var k in genes) {
                                    gcount++;
                                }
                            }
                        }
                        fam.numgenes = gcount;
                    }
                    for (var i in functions) {
                        var func = functions[i];
                        func.subsystem = func.subsystem.replace(/_/g, ' ');
                        var funcdata = {
                            id:
                                '<a class="show-function' +
                                self.pref +
                                '" data-pos="' +
                                i +
                                '">' +
                                func.id +
                                '</a>',
                            subsystem: func.subsystem,
                            primclass: func.primclass,
                            subclass: func.subclass,
                        };
                        var funcindecies = {};
                        var funcgenomes = {};
                        var gcount = 0;
                        for (var j in genomes) {
                            var compgenome = genomes[j];
                            if (func.genome_features[compgenome.genome_ref]) {
                                var genomefams = {};
                                var genes = func.genome_features[compgenome.genome_ref];
                                for (var k in genes) {
                                    gcount++;
                                    gene = genes[k];
                                    genomefams[gene[1]] = 1;
                                    if (funcindecies[gene[1]] === undefined) {
                                        funcindecies[gene[1]] = 0;
                                    }
                                    funcindecies[gene[1]]++;
                                }
                                for (var genfam in genomefams) {
                                    if (funcgenomes[genfam] === undefined) {
                                        funcgenomes[genfam] = 0;
                                    }
                                    funcgenomes[genfam]++;
                                }
                            }
                        }
                        func.numgenes = gcount;
                        var sortedfams = getSortedKeys(funcindecies);
                        funcdata.totals =
                            'Families:&nbsp;' +
                            sortedfams.length +
                            '<br>Genes:&nbsp;' +
                            gcount +
                            '<br>Genomes:&nbsp;' +
                            func.number_genomes;
                        funcdata.families = '';
                        funcdata.famgenes = '';
                        funcdata.famgenomes = '';
                        for (var j in sortedfams) {
                            if (funcdata.families.length > 0) {
                                funcdata.families += '<br>';
                                funcdata.famgenes += '<br>';
                                funcdata.famgenomes += '<br>';
                            }
                            if (sortedfams[j] === 'null') {
                                funcdata.famgenes = 0;
                                funcdata.famgenomes = 0;
                                funcdata.families = 'none';
                            } else {
                                funcdata.famgenes +=
                                    funcindecies[sortedfams[j]] +
                                    '(' +
                                    Math.round(
                                        (100 * funcindecies[sortedfams[j]]) /
                                            families[sortedfams[j]].numgenes
                                    ) +
                                    '%)';
                                funcdata.famgenomes +=
                                    funcgenomes[sortedfams[j]] +
                                    '(' +
                                    Math.round(
                                        (100 * funcgenomes[sortedfams[j]]) /
                                            families[sortedfams[j]].number_genomes
                                    ) +
                                    '%)';
                                funcdata.families +=
                                    '<a class="show-family' +
                                    self.pref +
                                    '" data-id="' +
                                    families[sortedfams[j]].id +
                                    '">' +
                                    families[sortedfams[j]].id +
                                    '</a>';
                            }
                        }
                        tableSettings.aaData.push(funcdata);
                    }
                    tableFunctions.dataTable(tableSettings);
                    ///////////////////////////////////// Event handling for links ///////////////////////////////////////////
                    function events() {
                        // event for clicking on ortholog count
                        $('.show-family' + self.pref).unbind('click');
                        $('.show-family' + self.pref).click(function () {
                            var id = $(this).data('id');
                            if (tabObj.hasTab(id)) {
                                tabObj.showTab(id);
                                return;
                            }
                            var fam;
                            for (var i in families) {
                                if (families[i].id == id) {
                                    fam = families[i];
                                }
                            }
                            var tabContent = $('<div/>');
                            var tableFamGen = $(
                                '<table class="table table-striped table-bordered" ' +
                                    'style="margin-left: auto; margin-right: auto;" id="' +
                                    self.pref +
                                    id +
                                    '-table"/>'
                            );
                            tabContent.append(tableFamGen);
                            var headings = [
                                'Genome',
                                'Genes',
                                'Score',
                                'Functions',
                                'Subsystems',
                                'Primary class',
                                'Secondary class',
                            ];
                            tableFamGen.append(
                                '<tr><th><b>' + headings.join('</b></th><th><b>') + '</b></th></tr>'
                            );
                            for (var i in genomes) {
                                var genome = genomes[i];
                                var genes = '';
                                var scores = '';
                                var funcs = '';
                                var sss = '';
                                var primclass = '';
                                var subclass = '';
                                if (fam.genome_features[genome.genome_ref] === undefined) {
                                    genes = 'none';
                                    scores = 'none';
                                    funcs = 'none';
                                    sss = 'none';
                                    primclass = 'none';
                                    subclass = 'none';
                                } else {
                                    var genearray = fam.genome_features[genome.genome_ref];
                                    var count = 1;
                                    for (var k in genearray) {
                                        if (k > 0) {
                                            genes += '<br>';
                                            scores += '<br>';
                                        }
                                        genes += count + ':' + genearray[0];
                                        scores += count + ':' + genearray[2];
                                        var array = genearray[1];
                                        for (var m in array) {
                                            if (m > 0 || k > 0) {
                                                funcs += '<br>';
                                                sss += '<br>';
                                                primclass += '<br>';
                                                subclass += '<br>';
                                            }
                                            funcs += count + ':' + functions[array[m]].id;
                                            sss += count + ':' + functions[array[m]].subsystem;
                                            primclass +=
                                                count + ':' + functions[array[m]].primclass;
                                            subclass += count + ':' + functions[array[m]].subclass;
                                        }
                                        count++;
                                    }
                                }
                                var row = [
                                    genome.name,
                                    genes,
                                    scores,
                                    funcs,
                                    sss,
                                    primclass,
                                    subclass,
                                ];
                                tableFamGen.append(
                                    '<tr><td>' + row.join('</td><td>') + '</td></tr>'
                                );
                            }
                            tabObj.addTab({
                                tab: id,
                                content: tabContent,
                                canDelete: true,
                                show: true,
                            });
                        });
                        $('.show-function' + self.pref).unbind('click');
                        $('.show-function' + self.pref).click(function () {
                            var pos = $(this).data('pos');
                            var func = functions[pos];
                            var id = func.id;
                            if (tabObj.hasTab(id)) {
                                tabObj.showTab(id);
                                return;
                            }
                            var tabContent = $('<div/>');
                            var tableFuncGen = $(
                                '<table class="table table-striped table-bordered" ' +
                                    'style="margin-left: auto; margin-right: auto;" id="' +
                                    self.pref +
                                    id +
                                    '-table"/>'
                            );
                            tabContent.append(tableFuncGen);
                            var headings = ['Genome', 'Genes', 'Scores', 'Families'];
                            tableFuncGen.append(
                                '<tr><th><b>' + headings.join('</b></th><th><b>') + '</b></th></tr>'
                            );
                            for (var i in genomes) {
                                var genome = genomes[i];
                                var genes = '';
                                var scores = '';
                                var fams = '';
                                if (func.genome_features[genome.genome_ref] === undefined) {
                                    genes = 'none';
                                    scores = 'none';
                                    fams = 'none';
                                } else {
                                    var genearray = func.genome_features[genome.genome_ref];
                                    for (var k in genearray) {
                                        if (k > 0) {
                                            genes += '<br>';
                                            scores += '<br>';
                                            fams += '<br>';
                                        }
                                        genes += genearray[k][0];
                                        scores += genearray[k][2];
                                        fams += families[genearray[k][1]].id;
                                    }
                                }
                                var row = [genome.name, genes, scores, fams];
                                tableFuncGen.append(
                                    '<tr><td>' + row.join('</td><td>') + '</td></tr>'
                                );
                            }
                            tabObj.addTab({
                                tab: id,
                                content: tabContent,
                                canDelete: true,
                                show: true,
                            });
                        });
                    }
                    function getSortedKeys(obj) {
                        var keys = [];
                        for (var key in obj) keys.push(key);
                        return keys.sort(function (a, b) {
                            return obj[b] - obj[a];
                        });
                    }
                },
                function (data) {
                    container.empty();
                    container.append('<p>[Error] ' + data.error.message + '</p>');
                    return;
                }
            );
            return this;
        },

        loggedInCallback: function (event, auth) {
            //this.token = auth.token;
            this.render();
            return this;
        },

        loggedOutCallback: function (event, auth) {
            //this.token = null;
            this.render();
            return this;
        },

        genUUID: function () {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = (Math.random() * 16) | 0,
                    v = c == 'x' ? r : (r & 0x3) | 0x8;
                return v.toString(16);
            });
        },
    });
});
