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
            binLimit: 10,
            plotContigLimit: 500,
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
                this.objectName = info[1];
                var $infoTable = $('<table class="table table-striped table-bordered table-hover">')
                    .append($('<colgroup>').append($('<col span=1>').css('width','25%')))
                    .append(this.tableRow(['<b>KBase Object Name</b>', this.objectName]))
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
            var self = this;
            var $content = $('<div>');
            new DynamicTable($content, {
                headers: [{
                    id: 'bin_id',
                    text: 'Bin Name',
                    isSortable: true
                }, {
                    id: 'cov',
                    text: 'Read Coverage',
                    isSortable: true
                }, {
                    id: 'gc',
                    text: 'GC Content',
                    isSortable: true
                }, {
                    id: 'n_contigs',
                    text: 'Number of Contigs',
                    isSortable: true
                }, {
                    id: 'sum_contig_len',
                    text: 'Total Contig Length',
                    isSortable: true
                }],
                searchPlaceholder: 'Search contig bins',
                style: {'margin-top': '5px'},
                updateFunction: function(pageNum, query, sortColId, sortColDir) {
                    var sortBy = [];
                    if (sortColId && sortColDir !== 0) {
                        sortBy.push([sortColId, sortColDir === 1 ? 1 : 0]);
                    }
                    return Promise.resolve(self.serviceClient.sync_call('MetagenomeAPI.search_binned_contigs', [{
                        ref: self.options.objRef,
                        query: query,
                        start: (pageNum * self.options.binLimit),
                        limit: self.options.binLimit,
                        sort_by: sortBy
                    }]))
                    .then(function(results) {
                        results = results[0];
                        var rows = [];
                        results.bins.forEach(function(bin) {
                            rows.push([bin.bin_id, bin.cov, bin.gc, bin.n_contigs, bin.sum_contig_len]);
                        });
                        return {
                            rows: rows,
                            start: results.start,
                            query: results.query,
                            total: results.num_found,
                        };
                    });
                },
                rowFunction: function($row, rowValues) {
                    var $listBtn = Display.simpleButton('btn-xs', 'fa fa-list')
                        .click(function() {
                            self.showBinTab(rowValues[0]);
                        });
                    var $plotBtn = Display.simpleButton('btn-xs', 'fa fa-bar-chart')
                        .click(function() {
                            self.showPlotTab(rowValues[0]);
                        });

                    $row.find('td:eq(0)').append(
                        $('<span class="pull-right">')
                        .append($listBtn)
                        .append($plotBtn)
                    );
                    return $row;
                },
                enableDownload: true,
                downloadFileName: this.objectName + '-bins.csv',
                downloadAllDataFunction: function(sortColId, sortColDir) {
                    // 1. poke the object to get the number of bins.
                    return Promise.resolve(self.serviceClient.sync_call('MetagenomeAPI.search_binned_contigs', [{
                        ref: self.options.objRef,
                        limit: 1
                    }]))
                    .then(function(results) {
                        var total = results[0].num_found;
                        var sortBy = [];
                        if (sortColId && sortColDir !== 0) {
                            sortBy.push([sortColId, sortColDir === 1 ? 1 : 0]);
                        }
                        return Promise.resolve(self.serviceClient.sync_call('MetagenomeAPI.search_binned_contigs', [{
                            ref: self.options.objRef,
                            start: 0,
                            limit: total,
                            sort_by: sortBy
                        }]))
                    })
                    .then(function(results) {
                        var rows = [];
                        results[0].bins.forEach(function(bin) {
                            rows.push([bin.bin_id, bin.cov, bin.gc, bin.n_contigs, bin.sum_contig_len]);
                        });
                        return rows;
                    });
                }
            });

            return $content;
        },

        showPlotTab: function(binId) {
            var self = this;
            if (!self.tabs.hasTab(binId + '-plot')) {
                self.tabs.addTab({
                    tab: binId + '-plot',
                    showContentCallback: function() {
                        return self.plotBin(binId);
                    },
                    deleteCallback: function(name) {
                        self.tabs.removeTab(name);
                        self.tabs.showTab(self.tabs.activeTab());
                    }
                });
            }
            this.tabs.showTab(binId + '-plot');
        },

        showBinTab: function(binId) {
            var self = this;
            if (!self.tabs.hasTab(binId)) {
                self.tabs.addTab({
                    tab: binId,
                    showContentCallback: function() {
                        return self.createBinTab(binId);
                    },
                    deleteCallback: function(name) {
                        self.tabs.removeTab(name);
                        self.tabs.showTab(self.tabs.activeTab());
                    }
                });
            }
            this.tabs.showTab(binId);
        },

        plotBin: function(binId) {
            var $content = $('<div>').css({'margin-top': '15px', 'width': '100%'}).append(this.loadingElement());

            Promise.resolve(this.serviceClient.sync_call('MetagenomeAPI.search_contigs_in_bin', [{
                ref: this.options.objRef,
                bin_id: binId,
                start: 0,
                limit: this.options.plotContigLimit,
                sort_by: [['len', 0]]
            }]))
            .then(function(results) {
                results = results[0];
                var title = binId + ' Lengths and GC %';
                if (results.num_found > this.options.plotContigLimit) {
                    title += ' (longest ' + this.options.plotContigLimit + ')';
                }
                console.log(results);
                var labels = [];
                var gcs = [];
                var lengths = [];
                results.contigs.forEach(function(contig) {
                    labels.push(contig.contig_id);
                    gcs.push(contig.gc);
                    lengths.push(contig.len);
                });
                $content.empty();

                var d3 = Plotly.d3;
                var WIDTH_IN_PERCENT_OF_PARENT = 100;
                var HEIGHT_IN_PERCENT_OF_PARENT = 50;
                var gd3 = d3.select($content.get(0))
                    .style({
                        width: WIDTH_IN_PERCENT_OF_PARENT + '%',
                        height: HEIGHT_IN_PERCENT_OF_PARENT + 'vh',
                    });
                var gd = gd3.node();

                Plotly.newPlot(gd, [{
                    x: labels,
                    y: lengths,
                    type: 'bar',
                    name: 'Length',
                }, {
                    x: labels,
                    y: gcs,
                    type: 'bar',
                    name: 'GC',
                    yaxis: 'y2',
                    opacity: 0.5
                }], {
                    name: 'Bin Info',
                    title: title,
                    xaxis: {
                        tickangle: -45,
                    },
                    yaxis: {
                        title: 'Contig Length (bp)',
                    },
                    yaxis2: {
                        title: 'GC Content (%)',
                        range: [0, 1],
                        side: 'right',
                        overlaying: 'y',
                    },
                    barmode: 'group'
                });

                window.onresize = function() {
                    Plotly.Plots.resize(gd);
                };
                Plotly.Plots.resize(gd);
            }.bind(this))
            .catch(function(error) {
                console.error(error);
            });

            return $content;
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
            var $content = $('<div>');
            new DynamicTable($content, {
                headers: [{
                    id: 'id',
                    text: 'Contig Id',
                    isSortable: true,
                }, {
                    id: 'cov',
                    text: 'Coverage',
                    isSortable: true,
                }, {
                    id: 'gc',
                    text: 'GC Content',
                    isSortable: true,
                }, {
                    id: 'len',
                    text: 'Contig Length',
                    isSortable: true,
                }],
                updateFunction: function(pageNum, query, sortColId, sortColDir) {
                    var sortBy = [];
                    if (sortColId && sortColDir !== 0) {
                        sortBy.push([ sortColId, sortColDir === 1 ? 1 : 0 ]);
                    }
                    return self.getSortedBinData(binId, pageNum * self.options.binLimit, self.options.binLimit, query, sortBy);
                },
                rowsPerPage: self.options.binLimit,
                searchPlaceholder: 'Search contigs in bin',
                style: {'margin-top': '5px'},
                enableDownload: true,
                downloadFileName: this.objectName + '-bin-' + binId + '.csv',
                downloadAllDataFunction: function(sortColId, sortColDir) {
                    // 1. poke the object to get the number of bins.
                    return Promise.resolve(self.serviceClient.sync_call('MetagenomeAPI.search_contigs_in_bin', [{
                        ref: self.options.objRef,
                        bin_id: binId,
                        limit: 1
                    }]))
                    .then(function(results) {
                        var total = results[0].num_found;
                        var sortBy = [];
                        if (sortColId && sortColDir !== 0) {
                            sortBy.push([sortColId, sortColDir === 1 ? 1 : 0]);
                        }
                        return self.getSortedBinData(binId, 0, total, '', sortBy);
                    })
                    .then(function(results) {
                        return results.rows;
                    });
                }
            });
            return $content;
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
