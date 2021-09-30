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
    'util/kbaseApiUtil',
], (
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
) => {
    'use strict';
    return KBWidget({
        name: 'kbasePanGenome',
        parent: KBaseAuthenticatedWidget,
        options: {
            ws: null,
            name: null,
            loadingImage: Config.get('loading_gif'),
            withExport: false,
            pFamsPerPage: 10,
        },
        token: null,

        init: function (options) {
            this._super(options);
            if (this.options.name.indexOf('/') > -1) {
                this.objRef = this.options.name;
            } else {
                this.objRef = this.options.ws + '/' + this.options.name;
            }
            if (!ApiUtil.checkObjectRef(this.objRef)) {
                this.$elem.append(
                    Display.createError('Bad object.', 'PanGenome Object Unavailable.')
                );
                this.isError = true;
            }
            return this;
        },

        render: function () {
            if (this.isError) {
                return;
            }
            this.dataPromise = Promise.resolve(
                this.serviceClient.sync_call('PanGenomeAPI.compute_summary_from_pangenome', [
                    { pangenome_ref: this.objRef },
                ])
            );
            const $tabContainer = $('<div>');
            this.$elem.append($tabContainer);
            this.tabs = new KBaseTabs($tabContainer, {
                tabPosition: top,
                canDelete: true,
                tabs: [
                    {
                        tab: 'Pangenome Overview',
                        canDelete: false,
                        show: true,
                        showContentCallback: this.showSummary.bind(this),
                    },
                    {
                        tab: 'Genome Comparison',
                        canDelete: false,
                        showContentCallback: this.showHomologFamilies.bind(this),
                    },
                    {
                        tab: 'Families',
                        canDelete: false,
                        showContentCallback: this.showProteinFamilies.bind(this),
                    },
                    // {
                    //     tab: 'Venn diagram',
                    //     canDelete: false,
                    //     showContentCallback: this.showVennDiagram.bind(this)
                    // }
                ],
            });
            return this;
        },

        tableRow: function (items) {
            const $row = $('<tr>');
            items.forEach((item) => {
                $row.append($('<td>').append(item));
            });
            return $row;
        },

        showSummary: function () {
            const self = this;
            const $summaryDiv = $('<div>').append(Display.loadingDiv().div);
            this.dataPromise
                .then((data) => {
                    data = data[0];
                    const $topTable = $(
                        '<table class="table table-hover table-striped table-bordered">'
                    );

                    $topTable
                        .append(self.tableRow(['Pan-genome object Id', self.options.name]))
                        .append(self.tableRow(['Total # of genomes', data.genomes_count]))
                        .append(
                            self.tableRow([
                                'Total # of protein coding genes',
                                [
                                    '<b>',
                                    data.genes.genes_count,
                                    '</b> genes with translation, <b>',
                                    data.genes.homolog_family_genes_count,
                                    '</b> are in homolog families, <b>',
                                    data.genes.singleton_family_genes_count,
                                    '</b> are in singleton families',
                                ].join(' '),
                            ])
                        )
                        .append(
                            self.tableRow([
                                'Total # of families',
                                [
                                    '<b>',
                                    data.families.families_count,
                                    '</b> families <b>',
                                    data.families.homolog_families_count,
                                    '</b> homolog families <b>',
                                    data.families.singleton_families_count,
                                    '</b> singleton families',
                                ].join(' '),
                            ])
                        );

                    const $genomeTable = $(
                        '<table class="table table-hover table-striped table-bordered">'
                    ).append(
                        $('<tr>')
                            .append($('<th>Genome</th>'))
                            .append($('<th># Genes</th>'))
                            .append($('<th># Genes in Homologs</th>'))
                            .append($('<th># Genes in Singletons</th>'))
                            .append($('<th># Homolog Families</th>'))
                    );

                    Object.keys(data.genomes).forEach((genome) => {
                        const genomeData = data.genomes[genome];
                        $genomeTable.append(
                            self.tableRow([
                                genome,
                                genomeData.genome_genes,
                                genomeData.genome_homolog_family_genes,
                                genomeData.genome_singleton_family_genes,
                                genomeData.genome_homolog_family,
                            ])
                        );
                    });

                    $summaryDiv.empty().append($topTable).append($genomeTable);
                })
                .catch((error) => {
                    $summaryDiv
                        .empty()
                        .append(Display.createError('Pangenome data summary error', error.error));
                });
            return $summaryDiv;
        },

        showHomologFamilies: function () {
            const self = this;
            const $homologDiv = $('<div>').append(Display.loadingDiv().div);
            self.dataPromise
                .then((data) => {
                    data = data[0];
                    const genomeList = Object.keys(data.genomes).sort();
                    const numGenomes = genomeList.length;
                    const numberTable = [];
                    const header = ['<th>Genome</th><th>Legend</th>'];
                    for (var i = 0; i < numGenomes; i++) {
                        header.push('<th style="text-align:center"><b>G' + (i + 1) + '</b></th>');
                        const singleComp = [];
                        singleComp.push('<b>G' + (i + 1) + '</b> - ' + genomeList[i]);
                        singleComp.push('# homolog families');
                        for (let j = 0; j < numGenomes; j++) {
                            let cell = data.shared_family_map[genomeList[i]][genomeList[j]];
                            if (i === j) {
                                cell = '<font color="#d2691e">' + cell + '</font>';
                            }
                            singleComp.push(cell);
                        }

                        numberTable.push(singleComp);
                    }

                    const $prettyTable = $(
                        '<table class="table table-hover table-striped table-bordered">'
                    );
                    $prettyTable.append($('<tr>').append(header.join()));
                    for (var i = 0; i < numberTable.length; i++) {
                        $prettyTable.append(self.tableRow(numberTable[i]));
                    }
                    $homologDiv.empty().append($prettyTable);
                })
                .catch((error) => {
                    $homologDiv
                        .empty()
                        .append(
                            Display.createError('Pangenome homolog family data error', error.error)
                        );
                });
            return $homologDiv;
        },

        showProteinFamilies: function () {
            const $pfDiv = $('<div>');
            new DynamicTable($pfDiv, {
                headers: [
                    {
                        id: 'id',
                        text: 'Family',
                        isSortable: true,
                    },
                    {
                        id: 'function',
                        text: 'Function',
                        isSortable: true,
                    },
                    {
                        id: 'pcgCount',
                        text: 'Protein Coding Gene Count',
                        isSortable: false,
                    },
                    {
                        id: 'gCount',
                        text: 'Genome Count',
                        isSortable: false,
                    },
                ],
                rowsPerPage: this.options.pFamsPerPage,
                searchPlaceholder: 'Search Families',
                style: { 'margin-top': '5px' },
                enableDownload: false,
                downloadFileName: this.options.name + '.csv',
                updateFunction: function (pageNum, query, sortColId, sortColDir) {
                    const sortBy = [];
                    if (sortColId && sortColDir !== 0) {
                        sortBy.push([sortColId, sortColDir === 1 ? 1 : 0]);
                    }
                    return this.searchAndCacheOrthologs(
                        query,
                        sortBy,
                        pageNum * this.options.pFamsPerPage,
                        this.options.pFamsPerPage
                    );
                }.bind(this),
                decoration: [
                    {
                        col: 0,
                        type: 'link',
                        clickFunction: function (id) {
                            this.addFamilyTab(this.dataCache[id]);
                        }.bind(this),
                    },
                ],
            });
            return $pfDiv;
        },

        addFamilyTab: function (fam) {
            const self = this;
            if (self.tabs.hasTab(fam.id)) {
                self.tabs.showTab(fam.id);
            } else {
                self.tabs.addTab({
                    tab: fam.id,
                    deleteCallback: function (name) {
                        self.tabs.removeTab(name);
                        self.tabs.showTab(self.tabs.activeTab());
                    },
                    showContentCallback: function () {
                        return self.createProteinFamilyTab(fam);
                    },
                });
                self.tabs.showTab(fam.id);
            }
        },

        createProteinFamilyTab: function (fam) {
            const self = this;
            const $div = $('<div>').append(Display.loadingDiv().div);

            const colMap = {
                genome: 0,
                feature: 1,
                function: 2,
                len: 3,
            };

            const getFamilyFunctionNames = function (orthologs) {
                // prep calls
                const genomeToGenes = {};
                orthologs.forEach((ortho) => {
                    const genome = ortho[2];
                    const feature = ortho[0];
                    if (!genomeToGenes[genome]) {
                        genomeToGenes[genome] = [];
                    }
                    genomeToGenes[genome].push(feature);
                });
                const promises = [];
                Object.keys(genomeToGenes).forEach((genome) => {
                    promises.push(
                        Promise.resolve(
                            self.serviceClient.sync_call(
                                'GenomeAnnotationAPI.get_feature_functions',
                                [
                                    {
                                        ref: genome,
                                        feature_id_list: genomeToGenes[genome],
                                    },
                                ]
                            )
                        ).then((names) => {
                            return Promise.try(() => {
                                return {
                                    genome: genome,
                                    features: names[0],
                                };
                            });
                        })
                    );
                });
                return Promise.all(promises).then((nameSets) => {
                    const res = {};
                    nameSets.forEach((nameSet) => {
                        res[nameSet.genome] = nameSet.features;
                    });
                    return res;
                });
            };

            const getFamData = function (
                start,
                query,
                sortColId,
                sortDir,
                genomeRefMap,
                geneFunctionMap
            ) {
                let rows = [];
                query = query.toLocaleLowerCase();
                return Promise.try(() => {
                    fam.orthologs.forEach((ortho) => {
                        // first filter so we only get the rows we want.
                        const row = [
                            '<span kb-gid="' + ortho[2] + '">' + genomeRefMap[ortho[2]] + '</span>',
                            ortho[0],
                            geneFunctionMap[ortho[2]][ortho[0]],
                            // ortho[1]
                        ];
                        let pass = false;
                        row.forEach((elem) => {
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
                        rows = rows.sort((a, b) => {
                            const aVal = a[colMap[sortColId]];
                            const bVal = b[colMap[sortColId]];
                            if ($.isNumeric(aVal) && $.isNumeric(bVal)) {
                                if (sortDir > 0) {
                                    return aVal > bVal ? 1 : -1;
                                }
                                return bVal > aVal ? 1 : -1;
                            } else {
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
                        total: fam.orthologs.length,
                    };
                });
            };

            self.dataPromise.then((results) => {
                results = results[0];
                getFamilyFunctionNames(fam.orthologs).then((names) => {
                    console.log(names);
                    $div.empty();
                    new DynamicTable($div, {
                        headers: [
                            {
                                id: 'genome',
                                text: 'Genome Name',
                                isSortable: true,
                            },
                            {
                                id: 'feature',
                                text: 'Feature Id',
                                isSortable: true,
                            },
                            {
                                id: 'function',
                                text: 'Function',
                                isSortable: true,
                            },
                            // {
                            //     id: 'len',
                            //     text: 'Longest Protein Sortable Length',
                            //     isSortable: true
                            // }
                        ],
                        updateFunction: function (pageNum, query, sortColId, sortColDir) {
                            if (query === null || query === undefined) {
                                query = '';
                            }
                            return getFamData(
                                pageNum * self.options.pFamsPerPage,
                                query,
                                sortColId,
                                sortColDir,
                                results.genome_ref_name_map,
                                names
                            );
                        },
                        rowsPerPage: self.options.pFamsPerPage,
                        style: { 'margin-top': '5px' },
                        rowFunction: function ($row) {
                            const genomeRef = $row.find('td:eq(0) span').attr('kb-gid');
                            $row.find('td:eq(0)').html(
                                $('<a>')
                                    .attr('href', '/#dataview/' + genomeRef)
                                    .attr('target', '_blank')
                                    .append($row.find('td:eq(0) span'))
                            );

                            const featureRef = $row.find('td:eq(1)').text();
                            $row.find('td:eq(1)').html(
                                $('<a>')
                                    .attr(
                                        'href',
                                        '/#dataview/' +
                                            genomeRef +
                                            '?sub=Feature&subid=' +
                                            featureRef
                                    )
                                    .attr('target', '_blank')
                                    .append(featureRef)
                            );

                            return $row;
                        },
                    });
                });
            });
            return $div;
        },

        searchAndCacheOrthologs: function (query, sortBy, start, limit) {
            const self = this;
            return Promise.resolve(
                this.serviceClient.sync_call('PanGenomeAPI.search_orthologs_from_pangenome', [
                    {
                        pangenome_ref: this.objRef,
                        query: query,
                        sort_by: sortBy,
                        start: start,
                        limit: limit,
                    },
                ])
            )
                .then((results) => {
                    results = results[0];
                    const rows = [];
                    self.dataCache = {};
                    results.orthologs.forEach((info) => {
                        self.dataCache[info.id] = info;
                        const orthoGenomes = {};
                        info.orthologs.forEach((ortholog) => {
                            orthoGenomes[ortholog[2]] = 1;
                        });
                        rows.push([
                            info.id,
                            info.function || '',
                            info.orthologs.length,
                            Object.keys(orthoGenomes).length,
                        ]);
                    });
                    return {
                        rows: rows,
                        query: results.query,
                        start: results.start,
                        total: results.num_found,
                    };
                })
                .catch((error) => {
                    console.error(error);
                    throw error;
                });
        },

        showVennDiagram: function () {
            return $('<div>Venn Diagram</div>');
        },

        loggedInCallback: function (event, auth) {
            this.token = auth.token;
            this.serviceClient = new GenericClient(Config.url('service_wizard'), auth, null, null);
            this.render();
            return this;
        },
    });
});
