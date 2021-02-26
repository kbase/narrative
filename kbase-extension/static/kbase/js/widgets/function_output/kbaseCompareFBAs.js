/**
 * Just a simple example widget to display FBA comparison
 *
 */
(function ($, undefined) {
    return KBWidget({
        name: 'kbaseCompareFBAs',

        version: '1.0.0',
        options: {
            color: 'black',
        },

        init: function (options) {
            this._super(options);
            const self = this;
            const ws = options.ws;
            const ids = options.ids;

            const container = this.$elem;

            container.loading();
            const p = kb.ws.get_objects([
                { workspace: ws, name: ids[0] },
                { workspace: ws, name: ids[1] },
            ]);
            $.when(p)
                .done((data) => {
                    container.rmLoading();
                    buildTable(data);
                })
                .fail((e) => {
                    container.rmLoading();
                    container.append(
                        '<div class="alert alert-danger">' + e.error.message + '</div>'
                    );
                });

            function buildTable(data) {
                // setup tabs
                const pcTable = $(
                    '<table class="table table-bordered table-striped" style="width: 100%;">'
                );
                container.append(pcTable);

                const rxnmap = {};

                const rxnlist1 = data[0].data.FBAReactionVariables;
                for (var i = 0; i < rxnlist1.length; i++) {
                    var rxnstuff = rxnlist1[i].modelreaction_ref.split('/');
                    rxnmap[rxnstuff[5]] = [rxnlist1[i].value, undefined];
                }

                const rxnlist2 = data[1].data.FBAReactionVariables;
                for (var i = 0; i < rxnlist2.length; i++) {
                    var rxnstuff = rxnlist2[i].modelreaction_ref.split('/');
                    if (rxnstuff[5] in rxnmap) {
                        rxnmap[rxnstuff[5]][1] = rxnlist2[i].value;
                    } else {
                        rxnmap[rxnstuff[5]] = [undefined, rxnlist2[i].value];
                    }
                }

                const pcdata = [];

                for (const rxn in rxnmap) {
                    pcdata.push([
                        rxn,
                        rxnmap[rxn][0],
                        rxnmap[rxn][1],
                        Math.abs(rxnmap[rxn][0] - rxnmap[rxn][1]),
                    ]);
                }

                const tableSettings = {
                    sPaginationType: 'bootstrap',
                    iDisplayLength: 10,
                    aaData: pcdata,
                    aaSorting: [[0, 'asc']],
                    aoColumns: [
                        {
                            sTitle: 'Reaction ID',
                            mData: function (d) {
                                return d[0];
                            },
                        },
                        {
                            sTitle: data[0].info[1],
                            mData: function (d) {
                                return d[1];
                            },
                        },
                        {
                            sTitle: data[1].info[1],
                            mData: function (d) {
                                return d[2];
                            },
                        },
                        {
                            sTitle: 'Diff',
                            mData: function (d) {
                                return d[3];
                            },
                        },
                    ],
                    oLanguage: {
                        sEmptyTable: 'No objects in workspace',
                        sSearch: 'Search: ',
                    },
                };
                const table = pcTable.dataTable(tableSettings);
            }

            return this;
        },
    });
})(jQuery);
