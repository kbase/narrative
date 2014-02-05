/*


*/

define('kbasePlantsNetworkNarrative',
    [
        'jquery',
        'kbasePlantsNetworkTable',
        'kbaseForcedNetwork',
        'kbaseTable',
        'KbaseNetworkServiceClient',
        'CDMI_API',
    ],
    function ($) {
        $.KBWidget(
        {

            name: "kbasePlantsNetworkNarrative",
            parent: 'kbaseIrisWidget',

            version: "1.0.0",

            _accessors : [
                'networkTable',
                'networkGraph',
                'networkClient',
                //'idMapClient',
                'cdmiClient',
            ],

            options: {
                networkClientURL : 'http://140.221.85.171:7064/KBaseNetworksRPC/networks',
                //idmapClientURL : "http://140.221.85.96:7111",
                cdmiClientURL    : 'http://140.221.84.182:7032',
            },

            init : function(options) {
                this._super(options);

                this.networkClient(
                    new window.KBaseNetworks(
                        this.options.networkClientURL,
                        undefined//this.auth()
                    )
                );

                /*this.idMapClient(
                    new window.IdMapClient(
                        this.options.idmapClientURL,
                        this.auth()
                    )
                );
                this.idMapClient().longest_cds_from_locus('kb|g.3899.locus.2079')
                .always(function(res) {
                    this.dbg("ID MAP RESULTS");
                    this.dbg(res);
                });*/

                this.cdmiClient(
                    new window.CDMI_API(
                        this.options.cdmiClientURL,
                        this.auth()
                    )
                );

                if (this.input()) {
                    this.setInput(this.input());
                }
                else if (this.options.input) {
                    this.setInput(this.options.input);
                }

                return this;
            },

            setInput : function(input) {
                return this.setGwasInput(input);
            },

            setGwasInput : function (gwasInput) {

                var $self = this;

                if (this.cdmiClient() == undefined) {
                    return;
                }

                var locus_ids = [];
                $.each(
                    gwasInput.genes,
                    function (idx, gene) {
                        locus_ids.push(gene[2]);
                    }
                );

                this.cdmiClient().fids_to_locations(
                    locus_ids
                )
                .done(
                    function(res) {
                        var locations = [];
                        $.each(
                            res,
                            function(key, l) {
                                $.each(
                                    l,
                                    function (idx, location) {
                                        locations.push(
                                            [location[0], "_", location[1], location[2], location[3]].join('')
                                        )
                                    }
                                )
                             }
                        );

                        //okay. We've got our locations. Go back the other way now.

                        $self.cdmiClient().locations_to_fids(
                            locations
                        )
                        .done(
                            function(res) {
                                var cdses = [];
                                $.each(
                                    res,
                                    function (key, ids) {
                                        $.each(
                                            ids,
                                            function (idx, val) {
                                                if (val.match(/CDS/i)) {
                                                    cdses.push(val);
                                                }
                                            }
                                        )
                                    }
                                );

                                $self.setCDSInput(cdses.join("\n"));

                            }
                        );
                    }
                );

            },

            setCDSInput : function(cds_list) {

                this.setValueForKey('input', cds_list);

                if (this.networkClient() == undefined) {
                    return;
                }

                var colorCats = d3.scale.category20();

                var $self = this;

                var cdses = cds_list.split(/\n/);
                var keyedSpecies = {};
                $.each(
                    cdses,
                    function(idx, cds) {

                        var m;
                        if (m = cds.match(/^(kb\|g\.\d+)/)) {
                            if (m[1]) {
                                keyedSpecies[m[1]] = 1;
                            }
                        }
                    }
                );

                var species = Object.keys(keyedSpecies);

                if (species.length) {
                    species = species[0];

                    this.networkClient().taxon2datasets(
                        species
                    )
                    .done(
                        function(res) {

                            var records = {};
                            var datasets = [];

                            $.each(
                                res,
                                function(idx, rec) {

                                    datasets.push(rec.id);

                                    var datasetRec = records[rec.id];
                                    if (datasetRec == undefined) {
                                        datasetRec = records[rec.id] = {
                                            nodes   : [],
                                            edges   : [],
                                            nodesByName : {},
                                            edgesByName : {},
                                            dataset : rec.id,
                                        };

                                        datasetRec.description = rec.name + ' (' + rec.description + ')';
                                        datasetRec.type = rec.networkType;
                                        datasetRec.source = rec.sourceReference;
                                    };

                                }
                            );
//datasets = ['kb|netdataset.plant.cn.191', 'kb|netdataset.plant.cn.192'];

                            $self.networkClient().buildInternalNetwork(
                                datasets,
                                cdses,
                                ['GENE_GENE']
                            )
                            .done(
                                function(results) {

                                    var linkScale = d3.scale.pow()
                                        .domain([0, datasets.length])
                                        .range([-100,100]);
                                    var nodes = {};
                                    var edges = {};

                                    $.each(
                                        results.nodes,
                                        function (idx, node) {
                                            var nodeObj = nodes[node.name];
                                            if (nodeObj == undefined) {
                                                nodeObj = nodes[node.id] = {
                                                    name : node.name,
                                                    activeDatasets : {},
                                                    id : node.id,
                                                    radius : 10,
                                                    tag : node.name,
                                                    tagStyle : 'font : 12px sans-serif',
                                                    color : 'black',
                                                };
                                            }
                                        }
                                    );

                                    $.each(
                                        results.edges,
                                        function (idx, edge) {

                                            var node1 = nodes[edge.nodeId1];
                                            var node2 = nodes[edge.nodeId2];
                                            var datasetRec = records[edge.datasetId];

                                            if (! datasetRec.nodesByName[node1.name]) {
                                                datasetRec.nodesByName[node1.name] = 1;
                                                datasetRec.nodes.push(node1);
                                            }

                                            if (! datasetRec.nodesByName[node2.name]) {
                                                datasetRec.nodesByName[node2.name] = 1;
                                                datasetRec.nodes.push(node2);
                                            }

                                            var edgeName = [edge.datasetId, node1.name, node2.name].sort().join('-');//node1.name + '-' + node2.name;
                                            var edgeObj = edges[edgeName];

                                            var datasetIdx = datasets.indexOf(edge.datasetId);

                                            if (edgeObj == undefined) {
                                                edgeObj = edges[edgeName] = {
                                                        source : node1,
                                                        target : node2,
                                                        activeDatasets : {},
                                                        name : edgeName,
                                                        description : edge.name + '<br>' + node1.name + ' to ' + node2.name + ' (' + edge.strength.toFixed(3) + ')',
                                                        //weight : 1,
                                                        colors : {},
                                                        curveStrength : linkScale(datasetIdx) * (datasetIdx % 2 ? -1 : 1),
                                                    };
                                            }

                                            var color = colorCats(datasets.indexOf(edge.datasetId) % 20);
                                            edgeObj.colors[edge.datasetId] = color;

                                            if (! datasetRec.edgesByName[edgeName]) {
                                                datasetRec.edgesByName[edgeName] = 1;
                                                datasetRec.edges.push(
                                                    edgeObj
                                                );
                                            }

                                        }
                                    );

                                    var tabularData = [];
                                    $.each(
                                        records,
                                        function(idx, val) {
                                            if (val.nodes.length) {

                                                tabularData.push(
                                                    {
                                                        datasetID       : val.dataset,
                                                        dataset         : {value : val.dataset, style : 'color : ' + colorCats(datasets.indexOf(val.dataset) % 20)},
                                                        nodes           : val.nodes,
                                                        edges           : val.edges,
                                                        description     : val.description,
                                                        type            : val.type,
                                                        source          : val.source,
                                                    }
                                                );
                                            }
                                        }
                                    );

                                    $self.data('loader').remove();
                                    $self.data('msgBox').show();
                                    $self.networkTable().setInput(tabularData);

                                }
                            )
                            .fail(function(res) {
                                $self.dbg("Could not run buildInternalNetwork");
                                $self.dbg(res);
                            });

                        }
                    )
                    .fail(function(res) {
                        $self.dbg("Could not run taxon2datasets");
                        $self.dbg(res);
                    });

//                            net_build_internal_network_promise.done();


                    this.networkTable().setInput('');
                }
                else {
                    this.$elem.empty();
                    this.$elem.append('File format error');
                }
            },

            appendUI : function($elem) {

                $elem.css('border', '1px solid gray');

                $elem.empty();
                var $loader = $.jqElem('div')
                            .append('<br>&nbsp;Loading data...<br>&nbsp;please wait...')
                            .append($.jqElem('br'))
                            .append(
                                $.jqElem('div')
                                    .attr('align', 'center')
                                    .append($.jqElem('i').addClass('fa fa-spinner').addClass('fa fa-spin fa fa-4x'))
                            )
                ;
                $elem.append($loader);

                this.data('loader', $loader);

                var $networkGraph = $.jqElem('div')
                    .css({width : 700, height : 600})
                    .attr('align', 'center')
                    .kbaseForcedNetwork({linkDistance : 200, filter : true});

                this.networkGraph($networkGraph);

                var $msgBox = $.jqElem('div')
                    .attr('align', 'center')
                    .css('font-style', 'italic')
                    .html("No datasets with nodes selected");
                this.data('msgBox', $msgBox);



                var $networkTable = $.jqElem('div').kbasePlantsNetworkTable(
                    {
                        $terminal       : this.options.$terminal,
                        networkGraph    : $networkGraph,
                        msgBox          : $msgBox,
                    }
                );
                this.networkTable($networkTable);

                $msgBox.hide();
                $networkGraph.$elem.hide();

                $elem
                    .append($networkTable.$elem)
                    .append($msgBox)
                    .append(
                        $.jqElem('div')
                            .attr('align', 'center')
                            .append($networkGraph.$elem)
                    )
                ;

            }
        }

    );
} ) ;
