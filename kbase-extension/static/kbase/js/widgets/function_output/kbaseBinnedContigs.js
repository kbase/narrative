define([
    'jquery',
    'kbwidget',
    'kbaseAuthenticatedWidget',
    'widgets/dynamicTable',
    'kbaseTable',
    'kbaseTabs',
    'bluebird',
    'bootstrap',
    'plotly',
    'narrativeConfig',
    'util/display',
    'kbase-generic-client-api',
    'kbase-client-api'
], function(
    $,
    KBWidget,
    KBaseAuthenticatedWidget,
    DynamicTable,
    KBaseTable,
    KBaseTabs,
    Promise,
    Bootstrap,
    Plotly,
    Config,
    Display,
    GenericClient
) {
    'use strict';
    return KBWidget ({
        name: 'kbaseBinnedContigs',
        parent: KBaseAuthenticatedWidget,
        options: {
            objRef: null,
            binLimit: 10
        },
        token: null,

        init: function(options) {
            this._super(options);

            if (!this.checkObject()) {
                this.$elem.append(Display.createError('Bad object.', 'Binned Contigs Object Unavailable.'));
                this.isError = true;
            }
            return this;
        },

        render: function() {
            if (this.isError) {
                return;
            }
            var $tabContainer = $('<div>');
            this.$elem.append($tabContainer);
            this.tabs = new KBaseTabs($tabContainer, {
                tabPosition: top,
                canDelete: true,
                tabs: [{
                    tab: 'Contig Bin Summary',
                    canDelete: false,
                    show: true,
                    showContentCallback: this.showBinSummary.bind(this)
                }, {
                    tab: 'Bins',
                    canDelete: false,
                    showContentCallback: this.showBinList.bind(this)
                }]
            });
            return this;
        },

        /**
         * Checks that a given object reference is valid.
         * I.e., ensures that the string has the right format, so we can fail very early
         * if not.
         */
        checkObject: function() {
            // return true if this.options.objRef = a reference or reference path
            // return false otherwise
            var ref = this.options.objRef;
            if (!ref) {
                return false;
            }
            var refRegex = /^\d+\/\d+(\/\d+)?$/;
            var refList = ref.split(';');
            var validRef = true;
            refList.forEach(function(r) {
                if (!refRegex.exec(r)) {
                    validRef = false;
                }
            });
            return validRef;
        },

        showBinSummary: function () {
            var $content = $('<div>').css({'margin-top': '15px'}).append(this.loadingElement());
            Promise.resolve(this.wsClient.get_object_info3({objects: [{ref: this.options.objRef}], includeMetadata: 1}))
            .then(function(data) {
                var info = data.infos[0];
                var $infoTable = $('<table class="table table-striped table-bordered table-hover">')
                    .append($('<colgroup>').append($('<col span=1>').css('width','25%')))
                    .append(this.tableRow(['<b>KBase Object Name</b>', info[1]]))
                    .append(this.tableRow(['<b>Number of Bins</b>', info[10].n_bins]))
                    .append(this.tableRow(['<b>Total Contig Nucleotides</b>', info[10].total_contig_len]));
                $content.empty().append($infoTable);
            }.bind(this))
            .catch(function(error) {
                this.$elem.empty().append(Display.createError('Error while getting Summary', error));
                console.error(error);
            }.bind(this));
            return $content;
        },

        /**
         * Shows the list of bins.
         */
        showBinList: function () {
            var $header = $('<div>').hide();
            var $binTable = $('<table class="table table-striped table-bordered table-hover">').hide();
            var $binHeader = this.tableRow(['Bin Name', 'Read Coverage', 'GC Content', 'Number of Contigs', 'Total Contig Length'], true);
            var $content = $('<div style="margin-top=15px">')
                            .append(this.loadingElement())
                            .append($header)
                            .append($binTable);

            // init binDiv controls, etc.
            var searchAndUpdateBins = function(query, start, limit) {
                var self = this;
                return Promise.resolve(this.serviceClient.sync_call('MetagenomeAPI.search_binned_contigs', [{
                    ref: this.options.objRef,
                    query: query,
                    start: start,
                    limit: limit,
                }]))
                .then(function(results) {
                    results = results[0];
                    console.log(results);
                    $binTable.empty().append($binHeader);
                    results.bins.forEach(function(bin) {
                        var $row = self.tableRow(['<a style="cursor:pointer">'+bin.bin_id+'</a>', bin.cov, bin.gc, bin.n_contigs, bin.sum_contig_len])
                        $row.find('td:first-child a').click(function(e) {
                            self.showBinTab($(this).text());
                        });
                        $binTable.append($row);
                    });
                })
                .catch(function(error) {
                    console.error(error);
                });
            }.bind(this);

            searchAndUpdateBins(null, 0, this.options.binLimit)
            .then(function() {
                $content.find('#loading').hide();
                $header.show();
                $binTable.show();
            });
            return $content;
        },

        showBinTab: function(binId) {
            if (!this.tabs.hasTab(binId)) {
                this.tabs.addTab({
                    tab: binId,
                    showContentCallback: function() {
                        return this.createBinTab(binId);
                    }.bind(this),
                    deleteCallback: function(name) {
                        this.tabs.removeTab(name);
                        this.tabs.showTab(this.tabs.activeTab());
                    }.bind(this)
                });
            }
            this.tabs.showTab(binId);
        },

        getSortedBinData: function(binId, start, limit, query, sortBy) {
            return Promise.resolve(this.serviceClient.sync_call('MetagenomeAPI.search_contigs_in_bin', [{
                ref: this.options.objRef,
                bin_id: binId,
                start: start,
                query: query,
                limit: limit,
                sort_by: sortBy
            }]))
            .then(function(results) {
                results = results[0];
                var dataRows = [];
                results.contigs.forEach(function(c) {
                    dataRows.push([
                        c.contig_id,
                        c.cov,
                        c.gc,
                        c.len
                    ]);
                });
                return {
                    rows: dataRows,
                    total: results.num_found,
                    query: results.query,
                    start: results.start
                }
            });
        },

        createBinTab: function(binId) {
            var self = this;
            var $content = $('<div style="margin-top:15px">');
            self.getSortedBinData(binId, 0, null, null, null)
            .then(function(results) {
                console.log(results);

            // })
            // Promise.resolve(this.serviceClient.sync_call('MetagenomeAPI.search_contigs_in_bin', [{
            //     ref: this.options.objRef,
            //     bin_id: binId,
            //     start: 0,
            //     query: null,
            //
            // }]))
            // .then(function(contigs) {
            //     contigs = contigs[0];
            //     console.log(contigs);
            //     var dataRows = [];
            //     contigs.contigs.forEach(function(c) {
            //         dataRows.push([
            //             c.contig_id,
            //             c.cov,
            //             c.gc,
            //             c.len
            //         ]);
            //     });
                $content.empty();
                new DynamicTable($content, {
                    headers: [{
                        text: 'Contig Id',
                        sortable: true,
                        sortFunction: function(dir) {
                            return self.getSortedBinData(binId, 0, null, null, [['id', dir === 1]]);
                        }
                    }, {
                        text: 'Coverage',
                        sortable: true,
                        sortFunction: function(dir) {
                            return self.getSortedBinData(binId, 0, null, null, [['cov', dir === 1]]);
                        }
                    }, {
                        text: 'GC Content',
                        sortable: true,
                        sortFunction: function(dir) {
                            return self.getSortedBinData(binId, 0, null, null, [['gc', dir === 1]]);
                        }
                    }, {
                        text: 'Contig Length',
                        sortable: true,
                        sortFunction: function(dir) {
                            return self.getSortedBinData(binId, 0, null, null, [['len', dir === 1]]);
                        }
                    }],
                    decoration: [{
                        col: 0,
                        type: 'link',
                        clickFunction: function(contig_id) {
                            alert('Clicked on ' + contig_id);
                        }
                    }],
                    data: results
                });
            })
            .catch(function(error) {
                console.error(error);
                $content.empty().append(Display.createError('Error while fetching bin info', error.error.error));
            });

            return $content.append(self.loadingElement());
        },

        /**
         * Converts an array to a table row.
         * e.g., if the array is ['abc', '123', 'xyz']
         * this returns:
         * <tr>
         *     <td>abc</td>
         *     <td>123</td>
         *     <td>xyz</td>
         * </tr>
         * as a jQuery node
         */
        tableRow: function(data, isHeader) {
            var elem = 'td';
            if (isHeader) {
                elem = 'th';
            }
            return $('<tr>').append(data.map(function(d) { return '<' + elem + '>' + d + '</' + elem + '>'; }).join());
        },

        /**
         * Just a handy way to make the usual spinner element.
         */
        loadingElement: function () {
            return $('<div id="loading">')
                   .attr('align', 'center')
                   .append($('<i class="fa fa-spinner fa-spin fa-2x">'));
        },

        /**
         * Gets the auth token and sets up clients once we're sure it's loaded.
         */
        loggedInCallback: function(event, auth) {
            this.serviceClient = new GenericClient(Config.url('service_wizard'), auth, null, null);
            this.wsClient = new Workspace(Config.url('workspace'), auth);
            this.render();
        }
    });
});
