define([
    'kbwidget',
    'bootstrap',
    'jquery',
    'colorbrewer',
    'kbase-client-api',
    'jquery-dataTables',
    'kbaseAuthenticatedWidget',
    'kbaseTable',
    'kbaseTabs',
    'kbase-generic-client-api',
    'narrativeConfig',
    'common/runtime',
], (
    KBWidget,
    bootstrap,
    $,
    colorbrewer,
    kbase_client_api,
    jquery_dataTables,
    kbaseAuthenticatedWidget,
    kbaseTable,
    kbaseTabs,
    GenericClient,
    Config,
    Runtime
) => {
    'use strict';

    return KBWidget({
        name: 'kbaseTaxonomyBrowser',
        parent: kbaseAuthenticatedWidget,
        version: '1.0.0',
        options: {},

        init: function init(options) {
            this._super(options);
            const $self = this;
            //console.log("INIT WITH OPTIONS", options);
            this.genericClient = new GenericClient(Config.url('service_wizard'), {
                token: Runtime.make().authToken(),
            });

            this.genericClient
                .sync_call('taxonomy_service.get_genomes_for_taxonomy', [
                    { taxa_ref: '1779/590344/3' },
                ])
                .then((data) => {
                    const lineage = [];
                    $self.lineage = {};
                    $.each(data[0].lineage_genomes, (i, g) => {
                        lineage.unshift({
                            label: g.lineage_step,
                            num: g.lineage_count,
                        });

                        $self.lineage[g.lineage_step] = g.lineage_count;
                    });

                    $self.buildLineageElem(lineage);
                    $self.buildSelectorElem(lineage);

                    $self.data('loaderElem').hide();
                    $self.data('tabsDiv').show();

                    const promises = [];
                    $self.loadLineage(data[0].lineage_genomes[0].lineage_step);
                })
                .catch((e) => {
                    $self.$elem.empty();
                    $self.$elem.append('Could not load anything : ' + e);
                });

            this.appendUI(this.$elem);

            this.loadData();
        },

        loadLineage: function (lineage_step) {
            const $self = this;

            $self.data('tabsDiv').hide();
            $self.data('loaderElem').show();

            $self.genericClient
                .sync_call('taxonomy_service.get_genomes_for_taxa_group', [
                    { lineage_step: lineage_step, start: 0, limit: $self.lineage[lineage_step] },
                ])
                .then((data) => {
                    const taxaInfo = data[0].TaxaInfo;
                    const viewInfo = data[0].view_info;

                    const tableData = {
                        name: viewInfo.scientific_name,
                        parent: viewInfo.parent_name,
                        //peers   :
                        genomes: data[0].lineage_count,
                        aliases: viewInfo.aliases.join(', '),
                        domain: viewInfo.domain,
                    };

                    const genomeTableData = [];
                    $.each(taxaInfo, (i, v) => {
                        /*{title: 'Type'},
                  {title: 'Name'},
                  {title: 'Owner'},
                  {title: 'Genomes'},
                  {title: 'Created'},*/
                        genomeTableData.push(['Genome', v.scientific_name, 'public', '', '']);
                    });

                    $self.buildOverviewTable(tableData);

                    $self.buildGenomesElem(genomeTableData);

                    $self.data('loaderElem').hide();
                    $self.data('tabsDiv').show();
                })
                .catch((e) => {
                    $self.$elem.empty();
                    $self.$elem.append('Could not load anything : ' + e);
                });
        },

        loaderElem: function loaderElem() {
            return $.jqElem('div')
                .append(
                    '<br>&nbsp;Loading data...<br>&nbsp;please wait...<br>&nbsp;Data parsing may take upwards of 30 seconds, during which time this page may be unresponsive.'
                )
                .append($.jqElem('br'))
                .append(
                    $.jqElem('div')
                        .attr('align', 'center')
                        .append(
                            $.jqElem('i').addClass('fa fa-spinner').addClass('fa fa-spin fa fa-4x')
                        )
                );
        },

        loadData: function loadData() {
            const $overviewElem = this.data('overviewElem');

            $overviewElem.empty();

            const data = {
                lineage: [],
                genomes: [],
            };

            $overviewElem.append(this.buildOverviewTable({}));

            this.buildGenomesElem(data);
        },

        arrowElem: function arrowElem() {
            return $.jqElem('i').addClass('fa fa-arrow-right fa-1x');
        },

        buildLineageElem: function (data) {
            const $self = this;

            const ulCss = {
                'list-style': 'none',
                margin: '10px',
                padding: 0,
            };

            const $container = $self.data('lineageElem') || $.jqElem('ul').css(ulCss);

            let $ul = $container;

            $.each(data, (i, line) => {
                const $next = $.jqElem('ul').css(ulCss);

                $ul.append(
                    $.jqElem('li')
                        .append($self.arrowElem())
                        .append(line.label + ' : ' + line.num + ' genomes')
                        .append($next)
                );

                $ul = $next;
            });

            return $self.data('lineageElem', $container);
        },

        buildOverviewTable: function buildOverviewTable(data) {
            const $self = this;

            const $containerElem = $self.data('overviewElem');
            $containerElem.empty();

            const $overviewTable = new kbaseTable($.jqElem('div'), {
                allowNullRows: false,
                structure: {
                    keys: [
                        { value: 'name', label: 'Name' },
                        //{value: 'peers', label: 'Peers'},
                        { value: 'genomes', label: 'Genomes' },
                        { value: 'aliases', label: 'Aliases' },
                        { value: 'domain', label: 'Domain' },
                    ],
                    rows: data,
                },
            });

            $containerElem
                .append($overviewTable.$elem)
                .append($.jqElem('h1').css('text-align', 'center').append('Full lineage'))
                .append($self.buildLineageElem(data.lineage));

            return $containerElem;
        },

        buildGenomesElem: function bunildGenomesElem(data) {
            const $genomesElem = this.data('genomesElem');
            $genomesElem.empty();

            const $self = this;
            const $containerElem = $.jqElem('table')
                .addClass('display')
                .css({ width: '100%', border: '1px solid #ddd' });

            $genomesElem.append($containerElem);

            const $dt = $containerElem.DataTable({
                columns: [
                    { title: 'Type' },
                    { title: 'Name' },
                    { title: 'Owner' },
                    { title: 'Genomes' },
                    { title: 'Created' },
                ],
            });

            $dt.rows.add(data).draw();

            return $containerElem;
        },

        buildSelectorElem: function (data) {
            const $self = this;

            var $select =
                $self.data('selectorElem') ||
                $.jqElem('select').on('change', (e) => {
                    $self.loadLineage($select.val());
                });
            $.each(data, (i, line) => {
                const $option = $.jqElem('option').attr('value', line.label).append(line.label);

                if (i == data.length - 1) {
                    $option.attr('selected', 'selected');
                }

                $select.append($option);
            });

            return $self.data('selectorElem', $select);
        },

        appendUI: function appendUI($elem) {
            const $self = this;

            const $tabsDiv = $self.data('tabsDiv', $.jqElem('div').css('display', 'none'));
            const $overviewElem = $self.data('overviewElem', $.jqElem('div'));
            const $genomesElem = $self.data('genomesElem', $.jqElem('div'));

            const $loaderElem = $self.data(
                'loaderElem',
                $.jqElem('div')
                    .css({ width: '100%', 'text-align': 'center' })
                    .append($.jqElem('i').addClass('fa fa-spinner fa-spin fa-4x'))
            );

            $overviewElem.append($self.loaderElem());
            $genomesElem.append($self.loaderElem());

            const $tabs = new kbaseTabs($tabsDiv, {
                tabs: [
                    {
                        tab: 'Overview',
                        content: $overviewElem,
                    },
                    {
                        tab: 'Genomes/Taxa',
                        content: $genomesElem,
                    },
                ],
            });

            $elem
                .css('border', '1px solid black')
                .css('padding', '2px')
                .append(
                    $.jqElem('h4')
                        .css('display', 'inline-block')
                        .append('Currently viewing : &nbsp;&nbsp;')
                )
                .append($self.buildSelectorElem())
                .append($tabsDiv)
                .append($loaderElem);

            return $elem;
        },
    });
});
