/**
 * Output widget for visualization of Sequence Comparison output
 * @public
 */

define([
    'kbwidget',
    'jquery',
    'util/string',
    'narrativeConfig',
    'd3',
    'kbaseAuthenticatedWidget',
    'kbaseTabs',
], (KBWidget, $, StringUtil, Config, d3, kbaseAuthenticatedWidget, kbaseTabs) => {
    return KBWidget({
        name: 'kbaseSeqCompView',
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

        init: function (options) {
            this._super(options);

            this.ws_name = options.ws_name;
            this.ws_id = options.ws_id;
            if (options.report_name && options.workspace_name) {
                this.ws_id = options.report_name;
                this.ws_name = options.workspace_name;
            }
            // this.ws_id = 'ecoli.dnadiff.output';
            // this.ws_name = 'fangfang:1454986986211';

            // console.log('WS parameters:');
            // console.log(this.ws_id);
            // console.log(this.ws_name);
            return this;
        },

        render: function () {
            const self = this;
            const pref = StringUtil.uuid();

            const container = this.$elem;
            if (self.token == null) {
                container.empty();
                container.append("<div>[Error] You're not logged in</div>");
                return;
            }

            const kbws = new Workspace(self.wsUrl, { token: self.token });

            const ready = function () {
                container.empty();
                container.append(
                    '<div><img src="' +
                        self.loadingImage +
                        '">&nbsp;&nbsp;loading genome data...</div>'
                );

                kbws.get_object_subset(
                    [{ ref: self.ws_name + '/' + self.ws_id }],
                    (data) => {
                        // kbws.get_object_subset([{ref: self.ws_name +"/"+ self.ws_id, included: ['contigs/[*]/id', 'contigs/[*]/length', 'id', 'name', 'source', 'source_id', 'type']}], function(data) {
                        // kbws.get_object_subset([{ref: 'fangfang:1452395167784' +"/"+ 'Rhodobacter_CACIA_14H1_contigs', included: ['contigs/[*]/id', 'contigs/[*]/length', 'id', 'name', 'source', 'source_id', 'type']}], function(data) {

                        container.empty();
                        const dataData = data[0].data;
                        console.log(dataData);
                        const tabPane = $('<div id="' + pref + 'tab-content">');
                        container.append(tabPane);
                        const tabWidget = new kbaseTabs(tabPane, { canDelete: true, tabs: [] });
                        const tabNames = ['Legend', 'DNAdiff Comparisons'];
                        const tabIds = ['legend', 'comparisons'];
                        for (let i = 0; i < tabIds.length; i++) {
                            const tabDiv = $('<div id="' + pref + tabIds[i] + '"> ');
                            tabWidget.addTab({
                                tab: tabNames[i],
                                content: tabDiv,
                                canDelete: false,
                                show: i == 0,
                            });
                        }

                        ////////////////////////////// Legend Tab //////////////////////////////
                        $('#' + pref + 'legend').append(
                            '<table class="table table-striped table-bordered" \
style="margin-left: auto; margin-right: auto;" id="' +
                                pref +
                                'legend-table"/>'
                        );
                        const legendLabels = [];
                        const legendData = [];
                        const n_genomes = dataData.genome_names.length;
                        for (let i = 0; i < n_genomes; i++) {
                            const name = dataData.genome_names[i];
                            const ii = i + 1;
                            legendLabels.push(ii.toString());
                            legendData.push(name);
                        }
                        const legendTable = $('#' + pref + 'legend-table');
                        for (let i = 0; i < legendData.length; i++) {
                            legendTable.append(
                                '<tr><td>' +
                                    legendLabels[i] +
                                    '</td> <td>' +
                                    legendData[i] +
                                    '</td></tr>'
                            );
                        }

                        ////////////////////////////// Comparisons Tab //////////////////////////////
                        $('#' + pref + 'comparisons').append(
                            '<table cellpadding="0" cellspacing="0" border="0" style="margin-left: auto; margin-right: auto;" id="' +
                                pref +
                                'comparisons-table"/>'
                        );
                        const compTable = $('#' + pref + 'comparisons-table');
                        let row = '<tr><td>Query \\ Reference</td>';
                        for (let i = 0; i < n_genomes; i++) {
                            const ii = i + 1;
                            row += '<td>' + ii.toString() + '</td>';
                        }
                        row += '</tr>';
                        compTable.append(row);
                        let minSim = 1;
                        for (let i = 0; i < dataData.genome_comparisons.length; i++) {
                            console.log(dataData.genome_comparisons[i].similarity);
                            if (dataData.genome_comparisons[i].similarity < minSim) {
                                minSim = dataData.genome_comparisons[i].similarity;
                            }
                        }
                        // console.log(minSim);
                        const color = d3.scale
                            .linear()
                            .domain([minSim, (minSim + 1.0) / 2, 1.0])
                            .range(['PaleVioletRed', 'pink', 'white']);
                        const reports = [];
                        for (let i = 0; i < n_genomes; i++) {
                            const ii = i + 1;
                            let iname = ii + '. ' + dataData.genome_names[i];
                            const lp = iname.indexOf('(');
                            if (lp > 0) {
                                iname = iname.substring(0, lp - 1);
                            }
                            let row = '<tr> <td>' + iname + '</td>';
                            for (let j = 0; j < n_genomes; j++) {
                                const jj = j + 1;
                                const comp = dataData.genome_comparisons.pop();
                                reports.push(comp.report);
                                const cellId = pref + '_td_' + ii + '_' + jj;
                                row +=
                                    '<td><div id="' +
                                    cellId +
                                    '" style="background-color:' +
                                    color(comp.similarity) +
                                    '">' +
                                    comp.similarity.toString() +
                                    '</div></td>';
                                $('#' + cellId).tooltip({
                                    container: 'body',
                                    title: 'tooltip text',
                                });
                            }
                            row += '</tr>';
                            compTable.append(row);
                        }

                        for (let i = 0; i < n_genomes; i++) {
                            const ii = i + 1;
                            for (let j = 0; j < n_genomes; j++) {
                                const jj = j + 1;
                                const cellId = pref + '_td_' + ii + '_' + jj;
                                const report = reports.pop();
                                $('#' + cellId).tooltip({
                                    container: 'body',
                                    html: true,
                                    title:
                                        '<div style="font-size: 10px; font-family: Consolas, Menlo, DejaVu Sans Mono, Courier New, monospace, serif; white-space: pre;">' +
                                        report +
                                        '</div>',
                                });
                            }
                        }

                        console.log(compTable);
                    },
                    (data) => {
                        container.empty();
                        container.append('<p>[Error] ' + data.error.message + '</p>');
                    }
                );
            };
            ready();
            return this;
        },

        loggedInCallback: function (_event, auth) {
            this.token = auth.token;
            this.render();
            return this;
        },

        loggedOutCallback: function () {
            this.token = null;
            this.render();
            return this;
        },
    });
});
