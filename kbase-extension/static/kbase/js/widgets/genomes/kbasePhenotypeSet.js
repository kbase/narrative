/**
 * Just a simple example widget to display phenotypedata
 *
 */
(function ($, undefined) {
    return KBWidget({
        name: 'kbasePhenotypeSet',

        version: '1.0.0',
        options: {
            color: 'black',
        },

        init: function (options) {
            this._super(options);
            const self = this;
            const ws = options.ws;
            const name = options.name;

            const container = this.$elem;

            const p = kb.ws.get_objects([{ workspace: ws, name: name }]);
            $.when(p).done((data) => {
                const reflist = data[0].refs;
                reflist.push(data[0].data.genome_ref);

                const prom = kb.ui.translateRefs(reflist);
                $.when(prom).done((refhash) => {
                    // setup tabs
                    const phenoTable = $(
                        '<table class="table table-bordered table-striped" style="width: 100%;">'
                    );

                    const tabs = container.kbaseTabTableTabs({
                        tabs: [
                            { name: 'Overview', active: true },
                            { name: 'Phenotypes', content: phenoTable },
                        ],
                    });

                    // Code to displaying phenotype overview data
                    const keys = [
                        { key: 'wsid' },
                        { key: 'ws' },
                        { key: 'kbid' },
                        { key: 'source' },
                        { key: 'genome' },
                        { key: 'type' },
                        { key: 'errors' },
                        { key: 'owner' },
                        { key: 'date' },
                    ];
                    const phenooverdata = {
                        wsid: data[0].info[1],
                        ws: data[0].info[7],
                        kbid: data[0].data.id,
                        source: data[0].data.source,
                        genome: refhash[data[0].data.genome_ref].link, //data[0].data.genome_ref,
                        type: data[0].data.type,
                        errors: data[0].data.importErrors,
                        owner: data[0].creator,
                        date: data[0].created,
                    };
                    const labels = [
                        'Name',
                        'Workspace',
                        'KBID',
                        'Source',
                        'Genome',
                        'Type',
                        'Errors',
                        'Owner',
                        'Creation date',
                    ];
                    var table = kb.ui.objTable('overview-table', phenooverdata, keys, labels);
                    tabs.tabContent('Overview').append(table);

                    //Code for loading the phenotype list table
                    pheno = data[0].data;
                    const tableSettings = {
                        sPaginationType: 'bootstrap',
                        iDisplayLength: 10,
                        aaData: pheno.phenotypes,
                        aaSorting: [[3, 'desc']],
                        aoColumns: [
                            { sTitle: 'Name', mData: 'name' },
                            {
                                sTitle: 'Media',
                                mData: function (d) {
                                    return (
                                        '<a data-ref="' +
                                        refhash[d.media_ref].label +
                                        '" class="btn-show-media-tab">' +
                                        refhash[d.media_ref].label +
                                        '</a>'
                                    ); //d.media_ref
                                },
                            },
                            {
                                sTitle: 'Gene KO',
                                mData: function (d) {
                                    return d.geneko_refs.join('<br>');
                                },
                            },
                            {
                                sTitle: 'Additional compounds',
                                mData: function (d) {
                                    return d.additionalcompound_refs.join('<br>');
                                },
                            },
                            { sTitle: 'Growth', mData: 'normalizedGrowth' },
                        ],
                        oLanguage: {
                            sEmptyTable: 'No objects in workspace',
                            sSearch: 'Search: ',
                        },
                        fnDrawCallback: events,
                    };
                    var table = phenoTable.dataTable(tableSettings);
                });
            });

            function events() {
                container.find('.btn-show-media-tab').unbind('click');
                container.find('.btn-show-media-tab').click(function () {
                    const ref = $(this).data('ref');
                    const ele = $('<div>').loading();
                    tabs.addTab({ name: ref, content: ele, removable: true });
                    mediaTab(ele, ref.split('/')[0], ref.split('/')[1]);
                });
            }

            // this will be replaced with an consolidated media widget once
            // ui-common is a submodule
            function mediaTab(ele, ws, id) {
                const prom = kb.fba.get_media({ medias: [id], workspaces: [ws] });
                $.when(prom)
                    .done((data) => {
                        ele.rmLoading();
                        new kbaseMediaEditor($(ele), { ids: [id], workspaces: [ws], data: data });
                    })
                    .fail((e) => {
                        $(ele).rmLoading();
                        $(ele).append(
                            '<div class="alert alert-danger">' + e.error.message + '</div>'
                        );
                    });
            }

            return this;
        },
    });
})(jQuery);
