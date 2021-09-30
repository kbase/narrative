/**
 * KBase widget to display table of BIOM data
 */
define(['kbwidget', 'bootstrap', 'jquery', 'RGBColor', 'kbStandaloneGraph'], (
    KBWidget,
    bootstrap,
    $,
    RGBColor,
    kbStandaloneGraph
) => {
    return KBWidget({
        name: 'AbundanceDataBoxplot',
        version: '1.0.0',
        options: {
            id: null,
            ws: null,
            auth: null,
            name: 0,
        },
        ws_url: window.kbconfig.urls.workspace,
        loading_image: window.kbconfig.loading_gif,

        init: function (options) {
            this._super(options);
            return this.render();
        },

        render: function () {
            const self = this;
            const pref = this.uuidv4();
            const container = this.$elem;
            const kbws = new Workspace(self.ws_url, { token: self.options.auth });

            container.empty();
            container.append(
                '<div><img src="' + self.loading_image + '">&nbsp;&nbsp;loading data...</div>'
            );

            kbws.get_objects(
                [{ ref: self.options.ws + '/' + self.options.id }],
                (data) => {
                    container.empty();
                    // parse data
                    if (data.length == 0) {
                        const msg =
                            '[Error] Object ' +
                            self.options.id +
                            ' does not exist in workspace ' +
                            self.options.ws;
                        container.append('<div><p>' + msg + '>/p></div>');
                    } else {
                        const biom = data[0]['data'];
                        let matrix = [];
                        const colnum = biom['columns'].length;
                        const rownum = biom['rows'].length;
                        // get matrix
                        if (biom['matrix_type'] == 'sparse') {
                            matrix = self.sparse2dense(
                                biom['data'],
                                biom['shape'][0],
                                biom['shape'][1]
                            );
                        } else {
                            matrix = biom['data'];
                        }
                        // build data
                        const divdata = new Array(colnum);
                        const colors = GooglePalette(colnum);
                        // names
                        for (var c = 0; c < colnum; c++) {
                            if (self.options.name == 0) {
                                divdata[c] = {
                                    name: biom['columns'][c]['id'],
                                    data: [],
                                    fill: colors[c],
                                };
                            } else {
                                divdata[c] = {
                                    name: biom['columns'][c]['name'],
                                    data: [],
                                    fill: colors[c],
                                };
                            }
                        }
                        // values
                        let maxval = 0;
                        for (let r = 0; r < rownum; r++) {
                            for (var c = 0; c < colnum; c++) {
                                maxval = Math.max(maxval, matrix[r][c]);
                                divdata[c]['data'].push(matrix[r][c]);
                            }
                        }
                        // DEVIATION PLOT
                        let glen = 0;
                        if (window.hasOwnProperty('rendererGraph') && rendererGraph.length) {
                            glen = rendererGraph.length;
                        }
                        container.append(
                            "<div id='outputGraph" + glen + "' style='width: 95%;'></div>"
                        );
                        let ab_type = 'normalized';
                        if (maxval > 1) {
                            ab_type = 'raw';
                        }
                        const devTest = standaloneGraph.create({ index: glen });
                        devTest.settings.target = document.getElementById('outputGraph' + glen);
                        devTest.settings.data = divdata;
                        devTest.settings.y_title = ab_type + ' abundance';
                        devTest.settings.show_legend = false;
                        devTest.settings.height = 400;
                        devTest.settings.type = 'deviation';
                        devTest.settings.chartArea = [0.1, 0.1, 0.95, 0.8];
                        devTest.render(glen);
                    }
                },
                (data) => {
                    container.empty();
                    const main = $('<div>');
                    main.append(
                        $('<p>')
                            .css({ padding: '10px 20px' })
                            .text('[Error] ' + data.error.message)
                    );
                    container.append(main);
                }
            );
            return self;
        },

        sparse2dense: function (sparse, rmax, cmax) {
            const dense = new Array(rmax);
            for (var i = 0; i < rmax; i++) {
                dense[i] = Array.apply(null, new Array(cmax)).map(Number.prototype.valueOf, 0);
            }
            // 0 values are undefined
            for (var i = 0; i < sparse.length; i++) {
                dense[sparse[i][0]][sparse[i][1]] = sparse[i][2];
            }
            return dense;
        },

        uuidv4: function (a, b) {
            for (
                b = a = '';
                a++ < 36;
                b +=
                    (a * 51) & 52
                        ? (a ^ 15 ? 8 ^ (Math.random() * (a ^ 20 ? 16 : 4)) : 4).toString(16)
                        : '-'
            );
            return b;
        },
    });
});
