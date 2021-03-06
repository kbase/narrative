/**
 * KBase widget to display table and boxplot of BIOM data
 */
define([
    'kbwidget',
    'bootstrap',
    'jquery',
    'narrativeConfig',
    'kbaseAuthenticatedWidget',
    'kbStandaloneTable',
], (KBWidget, bootstrap, $, Config, kbaseAuthenticatedWidget, kbStandaloneTable) => {
    return KBWidget({
        name: 'AnnotationSetTable',
        parent: kbaseAuthenticatedWidget,
        version: '1.0.0',
        token: null,
        options: {
            id: null,
            ws: null,
        },
        ws_url: Config.url('workspace'),
        loading_image: Config.get('loading_gif'),

        init: function (options) {
            this._super(options);
            return this;
        },

        render: function () {
            const self = this;
            const container = this.$elem;
            container.empty();
            if (self.token == null) {
                container.append("<div>[Error] You're not logged in</div>");
                return;
            }
            container.append(
                '<div><img src="' + self.loading_image + '">&nbsp;&nbsp;loading data...</div>'
            );

            const kbws = new Workspace(self.ws_url, { token: self.token });
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
                        const otus = data[0]['data']['otus'];
                        const cnames = [
                            'features',
                            'functional role',
                            'abundance',
                            'avg e-value',
                            'otu',
                        ];
                        const tdata = [];

                        for (let o = 0; o < otus.length; o++) {
                            funcs = otus[o]['functions'];
                            for (let f = 0; f < funcs.length; f++) {
                                tdata.push([
                                    funcs[f]['reference_genes'].join('<br>'),
                                    funcs[f]['functional_role'],
                                    funcs[f]['abundance'],
                                    funcs[f]['confidence'],
                                    otus[o]['name'],
                                ]);
                            }
                        }

                        let tlen = 0;
                        if (window.hasOwnProperty('rendererTable') && rendererTable.length) {
                            tlen = rendererTable.length;
                        }
                        container.append(
                            '<div id="annotationTable' + tlen + '" style="width: 95%;"></div>'
                        );

                        const tableAnn = standaloneTable.create({ index: tlen });
                        tableAnn.settings.target = document.getElementById(
                            'annotationTable' + tlen
                        );
                        tableAnn.settings.data = { header: cnames, data: tdata };
                        tableAnn.settings.filter = { 1: { type: 'text' } };
                        const mw = [120];
                        for (let i = 1; i < cnames.length; i++) {
                            mw.push(130);
                        }
                        tableAnn.settings.minwidths = mw;
                        tableAnn.render(tlen);
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

        loggedInCallback: function (event, auth) {
            this.token = auth.token;
            this.render();
            return this;
        },

        loggedOutCallback: function (event, auth) {
            this.token = null;
            this.render();
            return this;
        },
    });
});
