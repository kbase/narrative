/**
 * Output widget for visualization of genome annotation.
 * @author Roman Sutormin <rsutormin@lbl.gov>
 * @public
 */

define([
    'kbwidget',
    'jquery',
    'narrativeConfig',
    'ContigBrowserPanel',
    'kbaseAuthenticatedWidget',
    'kbaseTabs',
    'GenomeAnnotationAPI-client-api',
    'kbaseTable',
], (
    KBWidget,
    $,
    Config,
    ContigBrowserPanel,
    kbaseAuthenticatedWidget,
    kbaseTabs,
    gaa,
    kbaseTable
) => {
    return KBWidget({
        name: 'kbaseGenomeAnnotationViewer',
        parent: kbaseAuthenticatedWidget,
        version: '1.0.0',
        ws_id: null,
        ws_name: null,
        token: null,
        width: 1150,
        options: {
            ws_id: null,
            ws_name: null,
        },
        loadingImage: Config.get('loading_gif'),
        wsUrl: Config.url('workspace'),
        timer: null,
        lastElemTabNum: 0,

        init: function (options) {
            this._super(options);

            this.content = {};
            this.tableData = {};
            this.populated = {};
            this.contigMap = {};
            this.geneMap = {};

            if (this.options.wsNameOrId != undefined) {
                this.wsKey = this.options.wsNameOrId.match(/^\d+/) ? 'wsid' : 'workspace';
            }

            if (this.options.objNameOrId != undefined) {
                this.objKey = this.options.objNameOrId.match(/^\d+/) ? 'objid' : 'name';
            }

            const $self = this;

            const dictionary_params = {};
            dictionary_params[this.wsKey] = this.options.wsNameOrId;
            dictionary_params[this.objKey] = this.options.objNameOrId;

            this.dictionary_params = dictionary_params;

            this.ref = this.options.wsNameOrId + '/' + this.options.objNameOrId;
            this.genome_api = new GenomeAnnotationAPI(Config.url('service_wizard'), {
                token: this.authToken(),
            });

            $self.ws = new Workspace(window.kbconfig.urls.workspace, { token: this.authToken() });

            this.appendUI(this.$elem);

            return this;
        },

        loaderElem: function () {
            return $.jqElem('div')
                .append($.jqElem('br'))
                .append(
                    $.jqElem('div')
                        .attr('align', 'center')
                        .append($.jqElem('i').addClass('fa fa-spinner fa-spin fa-2x'))
                        .append(
                            '<br>Loading data... please wait...<br>Data processing may take upwards of 30 seconds, during which time this page may be unresponsive.<br><br>'
                        )
                );
        },

        numberWithCommas: function (x) {
            return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        },

        appendUI: function ($elem) {
            const $self = this;

            const $loaderElem = $self.loaderElem();

            $self.data('loaderElem', $loaderElem);
            $elem.append($loaderElem);

            const $tabElem = $.jqElem('div').css('display', 'none');
            $self.data('tabElem', $tabElem);
            $elem.append($tabElem);

            const $tabObj = new kbaseTabs($tabElem, { canDelete: true });
            $self.data('tabObj', $tabObj);

            $.when(
                $self.genome_api.get_summary({ ref: $self.ref }),
                $self.ws.get_object_info_new({ objects: [{ ref: $self.ref }], includeMetadata: 1 })
            )
                .then((d, info) => {
                    $self.summary = d;

                    const object_link =
                        '<a href="/#dataview/' +
                        info[0][6] +
                        '/' +
                        info[0][1] +
                        '/' +
                        info[0][4] +
                        '" target="_blank">' +
                        info[0][1] +
                        '</a>';
                    const object_name = object_link + ', version ' + info[0][4];

                    const $featureTableElem = $.jqElem('div');

                    const pretty_counts = {};

                    $.each($self.summary.annotation.feature_type_counts, (k, v) => {
                        pretty_counts[k] = $self.numberWithCommas(v);
                    });

                    const $featureTable = new kbaseTable($featureTableElem, {
                        allowNullRows: false,
                        structure: {
                            keys: Object.keys($self.summary.annotation.feature_type_counts).sort(
                                $self.sortCaseInsensitively
                            ),
                            rows: pretty_counts, //$self.summary.annotation.feature_type_counts
                        },
                    });

                    const $overviewTableElem = $.jqElem('div');
                    const $overviewTable = new kbaseTable($overviewTableElem, {
                        allowNullRows: false,
                        structure: {
                            keys: [
                                'KBase Object Name',
                                'Scientific name',
                                'Domain',
                                'Genetic Code',
                                'Source',
                                'Source Id',
                                'Source File name',
                                'Source Date',
                                'Source Release',
                                'GC',
                                'Taxonomy',
                                'Aliases',
                                'Size',
                                'Number of Contigs',
                                'Number of Features',
                            ],
                            rows: {
                                'KBase Object Name': object_name,
                                'Scientific name': d.taxonomy.scientific_name,
                                Domain: d.taxonomy.kingdom,
                                'Genetic Code': d.taxonomy.genetic_code,
                                Source: d.annotation.external_source,
                                'Source Id': d.assembly.assembly_source_id,
                                'Source File name': d.annotation.original_source_filename,
                                'Source Date': d.annotation.external_source_date,
                                'Source Release': d.annotation.release,
                                GC: Math.round(10000 * d.assembly.gc_content) / 100 + '%',
                                'Taxonomy lineage': d.taxonomy.scientific_lineage.join('; '),
                                Aliases: d.taxonomy.organism_aliases.join('<br>'),
                                Size: $self.numberWithCommas(d.assembly.dna_size),
                                'Number of Contigs': d.assembly.contig_ids.length,
                                'Number of Features': $featureTableElem,
                            },
                        },
                    });
                    // correct some styles!  too difficult to do since kbaseTable is in the old ui-common submodule
                    $overviewTable.$elem
                        .find('table')
                        .addClass('table table-striped table-bordered table-hover');
                    $overviewTable.$elem.find('tr').attr('style', '');

                    $tabObj.addTab({
                        tab: 'Genome Annotation Summary',
                        content: $overviewTableElem,
                        canDelete: false,
                        show: true,
                    });

                    $tabObj.addTab({
                        tab: 'Features',
                        canDelete: false,
                        show: false,
                        dynamicContent: true,
                        showContentCallback: function ($tab) {
                            return $self.showGeneContent($tab);
                        },
                    });

                    $tabObj.addTab({
                        tab: 'Contigs',
                        canDelete: false,
                        show: false,
                        dynamicContent: true,
                        showContentCallback: function ($tab) {
                            return $self.showContigContent($tab);
                        },
                    });

                    $loaderElem.hide();
                    $tabElem.show();
                })
                .fail((d) => {
                    $self.$elem.empty();
                    $self.$elem
                        .addClass('alert alert-danger')
                        .html('Summary object is empty : ' + d.error.message);
                });

            return $elem;
        },

        settingsForType: function (type) {
            if (type == 'contigs') {
                const columns = [
                    { title: 'Contig Id', data: 'name' },
                    { title: 'Length', data: 'length' },
                    { title: 'Genes', data: 'genecount' },
                ];

                return {
                    pagingType: 'full_numbers',
                    displayLength: 10,
                    sorting: [[1, 'desc']],
                    columns: columns,
                    data: [],
                    language: {
                        emptyTable: 'No contigs found.',
                        lengthMenu: '_MENU_ Contigs per page',
                        zeroRecords: 'No Matching Contigs Found',
                        info: 'Showing _START_ to _END_ of _TOTAL_ Contigs',
                        infoEmpty: 'No Contigs',
                        infoFiltered: '(filtered from _MAX_)',
                        search: 'Search Contigs',
                    },
                };
            } else {
                return {
                    pagingType: 'full_numbers',
                    displayLength: 10,
                    sorting: [
                        [1, 'asc'],
                        [2, 'asc'],
                    ],
                    columns: [
                        { title: 'Feature Id', data: 'id' },
                        { title: 'Aliases', data: 'aliases' },
                        { title: 'Contig', data: 'contig' },
                        { title: 'Start', data: 'start' },
                        { title: 'Strand', data: 'dir' },
                        { title: 'Length', data: 'len' },
                        //{title: "Type", data: "type"}, // do not need to show type
                        { title: 'Function', data: 'func' },
                    ],
                    data: [],
                    language: {
                        lengthMenu: '_MENU_ Features per page',
                        zeroRecords: 'No Matching Features Found',
                        info: 'Showing _START_ to _END_ of _TOTAL_ Features',
                        infoEmpty: 'No Features',
                        infoFiltered: '(filtered from _MAX_)',
                        search: 'Search Features',
                    },
                };
            }
        },

        showContigContent: function ($tab) {
            return this.showContent('contigs', $tab);
        },

        showGeneContent: function ($tab) {
            const $self = this;

            const $target = $.jqElem('div').append($self.loaderElem());

            const $selector = $.jqElem('select').on('change', () => {
                $self.showContent($selector.val(), $target);
            });
            for (const type in Object.keys(this.summary.annotation.feature_type_counts).sort(
                this.sortCaseInsensitively
            )) {
                $selector
                    .append(
                        $.jqElem('option')
                            .attr('value', type)
                            .attr('selected', type == 'gene' ? 'selected' : undefined)
                            .append(type)
                    )
                    .addClass('form-control input-sm')
                    .css({ width: 'auto', display: 'inline' });
            }

            const $container = $.jqElem('div')
                .append(
                    $.jqElem('div')
                        .css('padding-top', '10px')
                        .append('Showing Feature Type:  ')
                        .append($selector)
                )
                .append($target);

            $tab.append($container);

            $tab.hasContent = true;

            this.showContent('gene', $target);
            return;
        },

        setDataTableStyles: function ($table) {
            return $table.addClass('table table-striped table-bordered table-hover').css({
                width: '100%',
                border: '1px solid #ddd',
                'margin-left': 'auto',
                'margin-right': 'auto',
            });
        },

        showContent: function (type, $tab) {
            const $self = this;
            if (this.content[type] == undefined) {
                $self.genomeAnnotationData = { contigs: [] };

                $self.genome_api
                    .get_features({ ref: $self.ref, exclude_sequence: 1 })
                    .then((features) => {
                        const contigMap = $self.contigMap;

                        $self.content['contigs'] = $self.setDataTableStyles($.jqElem('table'));

                        $.each(features, (feature_id, feature) => {
                            $self.content[feature.feature_type] = $self.setDataTableStyles(
                                $.jqElem('table')
                            );

                            const aliases = [];

                            if (feature.feature_aliases != undefined) {
                                $.each(feature.feature_aliases, (alias, sources) => {
                                    aliases.push(
                                        '<span title="' +
                                            sources.join(',') +
                                            '">' +
                                            alias +
                                            '</span>'
                                    );
                                });
                            }

                            if (feature.feature_locations != undefined) {
                                $.each(feature.feature_locations, (i, contig) => {
                                    if (contigMap[contig.contig_id] == undefined) {
                                        contigMap[contig.contig_id] = {
                                            name: contig.contig_id,
                                            length: contig.length,
                                            features: {},
                                        };
                                        $.each(
                                            $self.summary.annotation.feature_type_counts,
                                            (type_) => {
                                                contigMap[contig.contig_id].features[type_] = [];
                                            }
                                        );
                                    }
                                });

                                const contigName = feature.feature_locations[0].contig_id;

                                let dataArray = $self.genomeAnnotationData[feature.feature_type];
                                if (dataArray == undefined) {
                                    dataArray = $self.genomeAnnotationData[feature.feature_type] =
                                        [];
                                }

                                dataArray.push({
                                    id: feature_id,
                                    contig: feature.feature_locations
                                        .map((v) => {
                                            return v.contig_id;
                                        })
                                        .join('<br>'),
                                    start: $self.numberWithCommas(
                                        feature.feature_locations
                                            .map((v) => {
                                                return $self.numberWithCommas(v.start);
                                            })
                                            .join('<br>')
                                    ),
                                    dir: $self.numberWithCommas(
                                        feature.feature_locations
                                            .map((v) => {
                                                return v.strand;
                                            })
                                            .join('<br>')
                                    ),
                                    len: $self.numberWithCommas(
                                        feature.feature_locations
                                            .map((v) => {
                                                return $self.numberWithCommas(v.length);
                                            })
                                            .join('<br>')
                                    ),
                                    type: feature.feature_type,
                                    func: feature.feature_function || '',
                                    aliases: aliases.join(', '),
                                });

                                $self.geneMap[feature_id] = feature;

                                const contig = contigMap[contigName];
                                if (contig != undefined) {
                                    let geneStop = feature.feature_locations[0].start;

                                    if (feature.feature_locations[0].strand == '+') {
                                        geneStop += feature.feature_locations[0].length;
                                    }
                                    if (contig.length < geneStop) {
                                        contig.length = geneStop;
                                    }

                                    if (contig.features[feature.feature_type] == undefined) {
                                        contig.features[feature.feature_type] = [];
                                    }
                                    contig.features[feature.feature_type].push(feature);
                                }
                            }
                        });

                        for (const key in contigMap) {
                            if (!contigMap.hasOwnProperty(key)) continue;
                            const contig = contigMap[key];

                            const contigRow = {
                                name: contig.name,
                                length: $self.numberWithCommas(contig.length),
                            };

                            for (const f in contig.features) {
                                contigRow[f + 'count'] = $self.numberWithCommas(
                                    contig.features[f].length
                                );
                            }

                            $self.genomeAnnotationData.contigs.push(contigRow);
                        }

                        $tab.empty();
                        $tab.append(
                            $('<div>').css('padding', '10px 0px').append($self.content[type])
                        ); //wrapped in a container so no scroll bars appear
                        $tab.hasContent = true;

                        const table = $self.content[type].DataTable($self.settingsForType(type));
                        table.rows.add($self.genomeAnnotationData[type]).draw();
                        //table.fnAddData($self.genomeAnnotationData[type]);
                        $self.populated[type] = true;
                    })
                    .fail((d) => {
                        $tab.empty();
                        $tab.addClass('alert alert-danger').html(
                            'Could not load features : ' + d.error.message
                        );
                    });
                return $self.loaderElem();
            }

            if (0 && $self.populated[type] == true) {
                return this.content[type];
            } else {
                setTimeout(() => {
                    $tab.empty();
                    $tab.removeClass('alert alert-danger');

                    const $tableElem = $self.setDataTableStyles($.jqElem('table'));

                    $tab.append($('<div>').css('padding', '10px 0px').append($tableElem)); //wrapped in a container so no scroll bars appear

                    const table = $tableElem.dataTable($self.settingsForType(type));
                    table.fnAddData($self.genomeAnnotationData[type]);
                    $self.populated[type] = true;
                }, 0);
                return '';
            }
        },

        showGene: function (geneId) {
            const $self = this;

            const $tabObj = $self.data('tabObj');

            if (!$tabObj.hasTab(geneId)) {
                const $content = $.jqElem('div');

                const gene = $self.geneMap[geneId];
                console.log('SHOWS GENE', geneId, gene);
                let contigName = null;
                let geneStart = null;
                let geneDir = null;
                let geneLen = null;
                if (gene.feature_locations && gene.feature_locations.length > 0) {
                    contigName = gene.feature_locations[0].contig_id;
                    geneStart = gene.feature_locations[0].start;
                    geneDir = gene.feature_locations[0].strand;
                    geneLen = gene.feature_locations[0].length;
                }
                const geneType = gene.feature_type;
                const geneFunc = gene['feature_function'];
                let geneAnn = '';
                if (gene['annotations']) geneAnn = gene['annotations'];

                const elemLabels = [
                    'Gene ID',
                    'Contig name',
                    'Gene start',
                    'Strand',
                    'Gene length',
                    'Gene type',
                    'Function',
                    'Annotations',
                ];
                const elemData = [
                    '<a href="/#dataview/' +
                        $self.ref +
                        '?sub=Feature&subid=' +
                        geneId +
                        '" target="_blank">' +
                        geneId +
                        '</a>',
                    $.jqElem('a')
                        .on('click', () => {
                            $self.showContig(contigName);
                        })
                        .append(contigName),
                    geneStart,
                    geneDir,
                    geneLen,
                    geneType,
                    geneFunc,
                    geneAnn,
                ];

                const elemTable = $(
                    '<table class="table table-striped table-bordered" \
                                  style="width: 100%; border: 1px solid #ddd; margin-left: auto; margin-right: auto;" >'
                );
                for (let i = 0; i < elemData.length; i++) {
                    if (elemLabels[i] === 'Function') {
                        elemTable.append(
                            '<tr><td>' +
                                elemLabels[i] +
                                '</td> \
                            <td><textarea style="width:100%;" cols="2" rows="3" readonly>' +
                                elemData[i] +
                                '</textarea></td></tr>'
                        );
                    } else if (elemLabels[i] === 'Annotations') {
                        elemTable.append(
                            '<tr><td>' +
                                elemLabels[i] +
                                '</td> \
                            <td><textarea style="width:100%;" cols="2" rows="3" readonly>' +
                                elemData[i] +
                                '</textarea></td></tr>'
                        );
                    } else {
                        const $tr = $.jqElem('tr');
                        $tr.append($.jqElem('td').append(elemLabels[i]));
                        $tr.append($.jqElem('td').append(elemData[i]));
                        elemTable.append($tr);
                    }
                }

                // what the f??
                if (f.protein_translation) {
                    elemTable.append(
                        '<tr><td>Protein Translation</td><td><div class="kb-ga-seq">' +
                            f.protein_translation +
                            '</div></td></tr>'
                    );
                }
                if (f.feature_dna_sequence) {
                    elemTable.append(
                        '<tr><td>Nucleotide Sequence</td><td><div class="kb-ga-seq">' +
                            f.feature_dna_sequence +
                            '</div></td></tr>'
                    );
                }

                $tabObj.addTab({ tab: geneId, content: $content, canDelete: true, show: true });
            } else {
                $tabObj.showTab(geneId);
            }
        },

        showContig: function (contigId) {
            const $self = this;

            const $tabObj = $self.data('tabObj');

            if (!$tabObj.hasTab(contigId)) {
                const $content = $.jqElem('div');
                const contig = $self.contigMap[contigName];
                const elemTable = $(
                    '<table class="table table-striped table-bordered" \
                                  style="width: 100%; border: 1px solid #ddd; margin-left: auto; margin-right: auto;" >'
                );
                const elemLabels = ['Contig Id', 'Length', 'Gene count'];
                const elemData = [contigName, contig.length, contig.features['gene'].length];

                for (let i = 0; i < elemData.length; i++) {
                    elemTable.append(
                        '<tr><td>' + elemLabels[i] + '</td><td>' + elemData[i] + '</td></tr>'
                    );
                }
                const cgb = new ContigBrowserPanel();
                cgb.data.options.contig = contig;
                cgb.data.options.svgWidth = $self.width - 28;
                cgb.data.options.onClickFunction = function (svgElement, feature) {
                    showGene(feature.feature_id);
                };
                cgb.data.options.token = $self.authToken();
                cgb.data.$elem = $('<div style="width:100%; height: 200px;"/>');
                cgb.data.$elem.show(() => {
                    cgb.data.update();
                });
                $content.append(cgb.data.$elem);
                cgb.data.init();

                $tabObj.addTab({ tab: contigId, content: $content, canDelete: true, show: true });
            } else {
                $tabObj.showTab(contigId);
            }
        },
    });
});
