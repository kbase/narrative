(function ($, undefined) {
    return KBWidget({
        name: 'kbaseSimulationSet',

        version: '1.0.0',
        options: {
            color: 'black',
        },

        init: function (options) {
            this._super(options);
            const self = this;

            var container = this.$elem;
            const ws = options.ws;
            const name = options.name;

            console.log('ws/name', ws, name);

            container.loading();
            const p = kb.ws.get_objects([{ workspace: ws, name: name }]);
            $.when(p)
                .done((data) => {
                    const ref = data[0].data.phenotypeset_ref.split('/');
                    const np = kb.ws.get_objects([{ wsid: ref[0], objid: ref[1] }]);
                    $.when(np)
                        .done((pdata) => {
                            container.rmLoading();
                            data[0].data.phenoset = pdata[0].data;
                            buildTable(data);
                        })
                        .fail((e) => {
                            container.rmLoading();
                            container.append(
                                '<div class="alert alert-danger">' + e.error.message + '</div>'
                            );
                        });
                })
                .fail((e) => {
                    container.rmLoading();
                    container.append(
                        '<div class="alert alert-danger">' + e.error.message + '</div>'
                    );
                });

            var container = this.$elem;

            function buildTable(data) {
                const simu = data[0].data;
                const simuTable = $(
                    '<table class="table table-bordered table-striped" style="width: 100%;">'
                );
                const tabs = container.kbaseTabTableTabs({
                    tabs: [
                        { name: 'Overview', active: true },
                        { name: 'Simulation Results', content: simuTable },
                    ],
                });

                const keys = [
                    { key: 'wsid' },
                    { key: 'ws' },
                    { key: 'cp' },
                    { key: 'cn' },
                    { key: 'fp' },
                    { key: 'fn' },
                    { key: 'ac' },
                    { key: 'sn' },
                    { key: 'sp' },
                    { key: 'owner' },
                    { key: 'date' },
                ];

                let cp = 0;
                let cn = 0;
                let fp = 0;
                let fn = 0;
                for (const count in simu.phenotypeSimulations) {
                    const sim = simu.phenotypeSimulations[count];
                    if (sim.phenoclass == 'CP') {
                        cp = cp + 1;
                    }
                    if (sim.phenoclass == 'CN') {
                        cn = cn + 1;
                    }
                    if (sim.phenoclass == 'FP') {
                        fp = fp + 1;
                    }
                    if (sim.phenoclass == 'FN') {
                        fn = fn + 1;
                    }
                    sim.media = simu.phenoset.phenotypes[count].media_ref;
                    sim.geneko = '';
                    for (var y in simu.phenoset.phenotypes[count].geneko_refs) {
                        sim.geneko.concat(
                            simu.phenoset.phenotypes[count].geneko_refs[y].split('/').pop(),
                            ';'
                        );
                    }
                    sim.compounds = '';
                    for (var y in simu.phenoset.phenotypes[count].additionalcompound_refs) {
                        sim.compounds.concat(
                            simu.phenoset.phenotypes[count].additionalcompound_refs[y]
                                .split('/')
                                .pop(),
                            ';'
                        );
                    }
                }
                const ac = (cp + cn) / (cp + cn + fp + fn);
                const sn = cp / (cp + fn);
                const sp = cn / (cn + fp);

                const simudata = {
                    wsid: data[0].info[1],
                    ws: data[0].info[7],
                    cp: cp,
                    cn: cn,
                    fp: fp,
                    fn: fn,
                    ac: ac,
                    sn: sn,
                    sp: sp,
                    owner: data[0].info[5],
                    date: data[0].info[3],
                };

                const labels = [
                    'Name',
                    'Workspace',
                    'Correct positives',
                    'Correct negatives',
                    'False positives',
                    'False negatives',
                    'Accuracy',
                    'Sensitivty',
                    'Specificity',
                    'Owner',
                    'Creation date',
                ];
                const table = kb.ui.objTable('overview-table', simudata, keys, labels);
                tabs.tabContent('Overview').append(table);

                const tableSettings = {
                    sPaginationType: 'bootstrap',
                    iDisplayLength: 10,
                    aaData: simu.phenotypeSimulations,
                    aaSorting: [[3, 'desc']],
                    aoColumns: [
                        {
                            sTitle: 'Base media',
                            mData: function (d) {
                                return d.media;
                            },
                        },
                        {
                            sTitle: 'Additional Compounds',
                            mData: function (d) {
                                return d.compounds;
                            },
                        },
                        {
                            sTitle: 'Gene KO',
                            mData: function (d) {
                                return d.geneko;
                            },
                        },
                        {
                            sTitle: 'Class',
                            mData: function (d) {
                                return d.phenoclass;
                            },
                        },
                        {
                            sTitle: 'Simulated Growth',
                            mData: function (d) {
                                return d.simulatedGrowth;
                            },
                        },
                        {
                            sTitle: 'Simulated Growth Fraction',
                            mData: function (d) {
                                return d.simulatedGrowthFraction;
                            },
                        },
                    ],
                };

                simuTable.dataTable(tableSettings);
            }

            return this;
        },
    });
})(jQuery);
