define([
    'kbwidget',
    'jquery',
    'bluebird',
    'widgets/dynamicTable',
    'narrativeConfig',
    'kbaseTabs',
    'kbaseAuthenticatedWidget',
    'kbase-generic-client-api',
    'util/display',
    'util/kbaseApiUtil'
], function(
    KBWidget,
    $,
    Promise,
    DynamicTable,
    Config,
    KBaseTabs,
    KBaseAuthenticatedWidget,
    GenericClient,
    Display,
    ApiUtil
) {
    'use strict';
    return KBWidget({
        name: 'kbasePanGenome',
        parent: KBaseAuthenticatedWidget,
        options: {
            ws: null,
            name: null,
            loadingImage: Config.get('loading_gif'),
            withExport: false
        },
        token: null,

        init: function(options) {
            this._super(options);
            this.objRef = this.options.ws + '/' + this.options.name;
            if (!ApiUtil.checkObjectRef(this.objRef)) {
                this.$elem.append(Display.createError('Bad object.', 'PanGenome Object Unavailable.'));
                this.isError = true;
            }
            return this;
        },

        render: function() {
            if (this.isError) {
                return;
            }
            this.dataPromise = Promise.resolve(this.serviceClient.sync_call('PanGenomeAPI.compute_summary_from_pangenome', [{ pangenome_ref: this.objRef }]));
            var $tabContainer = $('<div>');
            this.$elem.append($tabContainer);
            this.tabs = new KBaseTabs($tabContainer, {
                tabPosition: top,
                canDelete: true,
                tabs: [{
                    tab: 'Pan-genome Summary',
                    canDelete: false,
                    show: true,
                    showContentCallback: this.showSummary.bind(this)
                }, {
                    tab: 'Shared homolog families',
                    canDelete: false,
                    showContentCallback: this.showHomologFamilies.bind(this)
                }, {
                    tab: 'Protein families',
                    canDelete: false,
                    showContentCallback: this.showProteinFamilies.bind(this)
                }, {
                    tab: 'Venn diagram',
                    canDelete: false,
                    showContentCallback: this.showVennDiagram.bind(this)
                }]
            });
            return this;
        },

        tableRow: function(items) {
            var $row = $('<tr>');
            items.forEach(function(item) {
                $row.append($('<td>').append(item));
            });
            return $row;
        },

        showSummary: function() {
            var self = this;
            var $summaryDiv = $('<div>').append(Display.loadingDiv().div);
            this.dataPromise.then(function(data) {
                console.log(data);
                data = data[0];
                var $topTable = $('<table class="table table-hover table-striped table-bordered">');

                $topTable
                    .append(self.tableRow(['Pan-genome object Id', self.options.name]))
                    .append(self.tableRow(['Total # of genomes', data.genomes_count]))
                    .append(self.tableRow(['Total # of protein coding genes', [
                        '<b>',
                        data.genes.genes_count,
                        '</b> genes, <b>',
                        data.genes.homolog_family_genes_count,
                        '</b> are in homolog families, <b>',
                        data.genes.singleton_family_genes_count,
                        '</b> are in singleton families'
                    ].join(' ')]))
                    .append(self.tableRow(['Total # of families', [
                        '<b>',
                        data.families.families_count,
                        '</b> families <b>',
                        data.families.homolog_families_count,
                        '</b> homolog families <b>',
                        data.families.singleton_families_count,
                        '</b> singleton families'
                    ].join(' ')]));

                var $genomeTable = $('<table class="table table-hover table-striped table-bordered">')
                    .append($('<tr>')
                        .append($('<th>Genome</th>'))
                        .append($('<th># Genes</th>'))
                        .append($('<th>Homologs</th>'))
                        .append($('<th>Homolog Families</th>'))
                        .append($('<th>Singletons</th>')));

                Object.keys(data.genomes).forEach(function(genome) {
                    var genomeData = data.genomes[genome];
                    $genomeTable.append(self.tableRow([
                        genome,
                        genomeData.genome_genes,
                        genomeData.genome_homolog_family_genes,
                        genomeData.genome_homolog_family,
                        genomeData.genome_singleton_family_genes
                    ]));
                });

                $summaryDiv.empty().append($topTable).append($genomeTable);
            })
            .catch(function(error) {
                alert(error);
                console.error(error);
            });
            return $summaryDiv;
        },

        showHomologFamilies: function() {
            var self = this;
            var $homologDiv = $('<div>').append(Display.loadingDiv().div);
            self.dataPromise.then(function(data) {
                data = data[0];
                var genomeList = Object.keys(data.genomes);
                var numGenomes = genomeList.length;
                var numberTable = [];
                var header = [];
                for (var i=0; i<numGenomes; i++) {
                    header.push('<th style="text-align:center"><b>G' + (i+1) + '</b></th>');
                    var singleComp = [];
                    for (var j=0; j<numGenomes; j++) {
                        var cell = data.shared_family_map[genomeList[i]][genomeList[j]];
                        if (i === j) {
                            cell = '<font color="#d2691e">' + cell + '</font>';
                        }
                        singleComp.push(cell);
                    }
                    singleComp.push('<b>G' + (i+1) + '</b> - ' + genomeList[i]);
                    numberTable.push(singleComp);
                }

                var $prettyTable = $('<table class="table table-hover table-striped table-bordered">');
                $prettyTable.append($('<tr>').append(header.join()));
                for (var i=0; i<numberTable.length; i++) {
                    $prettyTable.append(self.tableRow(numberTable[i]));
                }
                $homologDiv.empty().append($prettyTable);
            })
            .catch(function(error) {
                alert(error);
            });
            return $homologDiv;
        },

        showProteinFamilies: function() {
            var $pfDiv = $('<div>').append(Display.loadingDiv().div);

            return $pfDiv;
        },

        showVennDiagram: function() {
            return $('<div>Venn Diagram</div>');
        },

        loggedInCallback: function(event, auth) {
            this.token = auth.token;
            this.serviceClient = new GenericClient(Config.url('service_wizard'), auth, null, null);
            this.render();
            return this;
        },
    });
});
