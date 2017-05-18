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
            withExport: false,
            pFamsPerPage: 10
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
                },
                // {
                //     tab: 'Venn diagram',
                //     canDelete: false,
                //     showContentCallback: this.showVennDiagram.bind(this)
                // }
                ]
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
                var genomeList = Object.keys(data.genomes).sort();
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
            var $pfDiv = $('<div>');
            new DynamicTable($pfDiv, {
                headers: [{
                    id: 'function',
                    text: 'Function',
                    isSortable: true
                }, {
                    id: 'id',
                    text: 'ID',
                    isSortable: true
                }, {
                    id: 'pcgCount',
                    text: 'Protein Coding Gene Count',
                    isSortable: false
                }, {
                    id: 'gCount',
                    text: 'Genome Count',
                    isSortable: false
                }],
                rowsPerPage: this.options.pFamsPerPage,
                searchPlaceholder: 'Search Families',
                style: {'margin-top': '5px'},
                enableDownload: false,
                downloadFileName: this.options.name + '.csv',
                updateFunction: function(pageNum, query, sortColId, sortColDir) {
                    var sortBy = [];
                    if (sortColId && sortColDir !== 0) {
                        sortBy.push([ sortColId, sortColDir === 1 ? 1 : 0 ]);
                    }
                    return this.searchAndCacheOrthologs(query, sortBy, pageNum * this.options.pFamsPerPage, this.options.pFamsPerPage);
                }.bind(this),
                decoration: [{
                    col: 1,
                    type: 'link',
                    clickFunction: function(id) {
                        this.addFamilyTab(this.dataCache[id]);
                    }.bind(this)
                }]
            });
            return $pfDiv;
        },

        addFamilyTab: function(fam) {
            var self = this;
            if (self.tabs.hasTab(fam.id)) {
                self.tabs.showTab(fam.id);
            } else {
                self.tabs.addTab({
                    tab: fam.id,
                    deleteCallback: function(name) {
                        self.tabs.removeTab(name);
                        self.tabs.showTab(self.tabs.activeTab());
                    },
                    showContentCallback: function() {
                        return self.createProteinFamilyTab(fam);
                    }
                });
                self.tabs.showTab(fam.id);
            }
        },

        createProteinFamilyTab: function(fam) {
            var self = this;
            var $div = $('<div>').append(Display.loadingDiv().div);

            var colMap = {
                genome: 0,
                feature: 1,
                function: 2,
                len: 3
            };

            var getFamilyFunctionNames = function(orthologs) {
                // prep calls
                var genomeToGenes = {};
                orthologs.forEach(function(ortho) {
                    var genome = ortho[2];
                    var feature = ortho[0];
                    if (!genomeToGenes[genome]) {
                        genomeToGenes[genome] = [];
                    }
                    genomeToGenes[genome].push(feature);
                });
                var promises = [];
                Object.keys(genomeToGenes).forEach(function(genome) {
                    promises.push(Promise.resolve(self.serviceClient.sync_call(
                        'GenomeAnnotationAPI.get_feature_functions',
                        [{
                            ref: genome,
                            feature_id_list: genomeToGenes[genome]
                        }]
                    ))
                    .then(function(names) {
                        return Promise.try(function() {
                            return {
                                genome: genome,
                                features: names[0]
                            };
                        });
                    }));
                });
                return Promise.all(promises).then(function(nameSets) {
                    var res = {};
                    nameSets.forEach(function(nameSet) {
                        res[nameSet.genome] = nameSet.features;
                    });
                    return res;
                });
            };

            var getFamData = function(start, query, sortColId, sortDir, genomeRefMap, geneFunctionMap) {
                var rows = [];
                query = query.toLocaleLowerCase();
                return Promise.try(function() {
                    fam.orthologs.forEach(function(ortho) {
                        // first filter so we only get the rows we want.
                        var row = [
                            genomeRefMap[ortho[2]],
                            ortho[0],
                            geneFunctionMap[ortho[2]][ortho[0]],
                            // ortho[1]
                        ];
                        var pass = false;
                        row.forEach(function(elem) {
                            if (String(elem).toLocaleLowerCase().indexOf(query) !== -1) {
                                pass = true;
                            }
                        });
                        if (pass) {
                            rows.push(row);
                        }
                    });
                    // now we sort and return.
                    if (sortColId && sortDir) {
                        rows = rows.sort(function(a, b) {
                            var aVal = a[colMap[sortColId]];
                            var bVal = b[colMap[sortColId]];
                            if ($.isNumeric(aVal) && $.isNumeric(bVal)) {
                                if (sortDir > 0) {
                                    return aVal > bVal ? 1 : -1;
                                }
                                return bVal > aVal ? 1 : -1;
                            }
                            else {
                                if (sortDir > 0) {
                                    return String(aVal).localeCompare(bVal);
                                }
                                return String(bVal).localeCompare(aVal);
                            }
                        });
                    }
                    return {
                        rows: rows.slice(start, start + self.options.pFamsPerPage + 1),
                        query: query,
                        start: start,
                        total: fam.orthologs.length
                    };
                });
            };

            self.dataPromise.then(function(results) {
                results = results[0];
                getFamilyFunctionNames(fam.orthologs)
                .then(function(names) {
                    console.log(names);
                    $div.empty();
                    new DynamicTable($div, {
                        headers: [{
                            id: 'genome',
                            text: 'Genome Name',
                            isSortable: true
                        }, {
                            id: 'feature',
                            text: 'Feature Id',
                            isSortable: true
                        }, {
                            id: 'function',
                            text: 'Function',
                            isSortable: true
                        },
                        // {
                        //     id: 'len',
                        //     text: 'Longest Protein Sortable Length',
                        //     isSortable: true
                        // }
                        ],
                        updateFunction: function(pageNum, query, sortColId, sortColDir) {
                            if (query === null || query === undefined) {
                                query = '';
                            }
                            return getFamData(pageNum * self.options.pFamsPerPage, query, sortColId, sortColDir, results.genome_ref_name_map, names);
                        },
                        rowsPerPage: self.options.pFamsPerPage,
                        style: {'margin-top': '5px'}
                    });
                });
            });
            return $div;
        },

        searchAndCacheOrthologs: function(query, sortBy, start, limit) {
            var self = this;
            return Promise.resolve(this.serviceClient.sync_call('PanGenomeAPI.search_orthologs_from_pangenome', [{
                pangenome_ref: this.objRef,
                query: query,
                sort_by: sortBy,
                start: start,
                limit: limit
            }]))
            .then(function(results) {
                results = results[0];
                var rows = [];
                self.dataCache = {};
                results.orthologs.forEach(function(info) {
                    self.dataCache[info.id] = info;
                    var orthoGenomes = {};
                    info.orthologs.forEach(function(ortholog) {
                        orthoGenomes[ortholog[2]] = 1;
                    });
                    rows.push([
                        info.function || '',
                        info.id,
                        info.orthologs.length,
                        Object.keys(orthoGenomes).length
                    ]);
                });
                return {
                    rows: rows,
                    query: results.query,
                    start: results.start,
                    total: results.num_found
                };
            })
            .catch(function(error) {
                alert(error);
            });
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
