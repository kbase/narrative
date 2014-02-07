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
        'IdMapClient',
        'OntologyServiceClient',
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
                'ontologyClient',
                'idmapClient',
            ],

            options: {
                networkClientURL : 'http://140.221.85.172:7064/KBaseNetworksRPC/networks',
                cdmiClientURL    : 'http://140.221.84.182:7032',
                idmapClientURL   : 'http://140.221.85.181:7111',
                ontologyClientURL: 'http://140.221.85.171:7062',
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

                this.idmapClient(
                    new window.IdMapClient(
                        this.options.idmapClientURL,
                        this.auth()
                    )
                );

                this.ontologyClient(
                    new window.Ontology(
                        this.options.ontologyClientURL,
                        this.auth()
                    )
                );

                if (this.input()) {
                    this.setInput(this.input());
                }
                else if (this.options.input) {
                    this.setInput(this.options.input);
                }
                else if (this.options.external_ids) {
                    this.setExternalInput(this.options.external_ids.split(/\s+/));
                }
                else if (this.options.gwas) {
                    this.setGwasInput(this.options.gwas);
                }
                else if (this.options.locus_ids) {
                    this.setLocusInput(this.options.locus_ids.split(/\s+/));
                }
                else if (this.options.cds_ids) {
                    this.setCDSInput(this.options.cds_ids.split(/\s+/));
                }

                return this;
            },

            setInput : function(input) {
                return this.setGwasInput(input);
            },

            setExternalInput : function(external_ids, species) {

                var $self = this;

                if (species == undefined) {
                    species = 'kb|g.3899';
                }

                this.idmapClient().lookup_features(
                    species,
                    external_ids,'',''
                )
                .done(
                    function(res) {

                        var locus_ids = [];
                        $.each(
                            res,
                            function (key, ids) {
                                $.each(
                                    ids,
                                    function (idx, val) {
                                        locus_ids.push(val.kbase_id);
                                    }
                                )
                            }
                        );

                        $self.setLocusInput(locus_ids);

                    }
                )
            },

            setGwasInput : function (gwasInput) {

                var $self = this;

                if (this.cdmiClient() == undefined) {
                    return;
                }

                var external_ids = [];
                var locus_ids = [];
                $.each(
                    gwasInput.genes,
                    function (idx, gene) {
                        locus_ids.push(gene[2]);
                    }
                );

                this.setLocusInput(locus_ids);
            },

            setLocusInput : function (locus_ids) {

                var $self = this;

                this.ontologyClient().get_go_annotation(locus_ids,['biological_process'],['IEA'])
                .done(
                    function (res) {

                        var locus_to_associations = {};
                        $.each(
                            res,
                            function (ass_type, loci) {
                                $.each(
                                    loci,
                                    function (locus, data) {
                                        var locus_data = locus_to_associations[locus];
                                        if (locus_data == undefined) {
                                            locus_data = locus_to_associations[locus] = {};
                                        };
                                        locus_data[ass_type] = data;
                                    }
                                )
                            }
                        );


                        $self.ontologyClient().get_goidlist(locus_ids,['biological_process'],['IEA'])
                        .done(
                            function (res) {
                                $.each(
                                    res,
                                    function (locus, obj) {
                                        var locus_data = locus_to_associations[locus];
                                        if (locus_data == undefined) {
                                            locus_data = locus_to_associations[locus] = {};
                                        };
                                        locus_data['go_annotation'] = obj;
                                    }
                                );

                                $self.idmapClient().longest_cds_from_locus(
                                    locus_ids
                                )
                                .done(
                                    function(res) {
                                        //contains a map locus_id => {cds_id => length_of_cds}
                                        var cdses = [];
                                        var cds_to_locus = {};
                                        $.each(
                                            res,
                                            function (locus, val) {
                                                var cds = Object.keys(val)[0];
                                                cdses.push(cds);
                                                cds_to_locus[cds] = locus;
                                            }
                                        );

                                        cdses.cds_to_locus = cds_to_locus;

                                        //get our mapping of locus_id -> function
                                        $self.cdmiClient().fids_to_functions(
                                            locus_ids
                                        )
                                        .done(
                                            function(locus_func_defs) {
                                                cdses.locus_func_defs = locus_func_defs;
                                                cdses.locus_to_associations = locus_to_associations;
                                                $self.setCDSInput(cdses);
                                            }
                                        )

                                    }
                                );

                            }
                        )


                    }
                )


            },

            setCDSInput : function(cdses) {

                this.setValueForKey('input', cdses);

                if (this.networkClient() == undefined) {
                    return;
                }

                var colorCats = d3.scale.category20();

                var $self = this;

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
                                        datasetRec.type = rec.network_type;
                                        datasetRec.source = rec.source_ref;
                                    };

                                }
                            );
//datasets = ['kb|netdataset.plant.cn.191', 'kb|netdataset.plant.cn.192'];

                            $self.networkClient().build_internal_network(
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

                                                node.func = cdses.locus_func_defs[cdses.cds_to_locus[node.entity_id]];
                                                node.associations = cdses.locus_to_associations[cdses.cds_to_locus[node.entity_id]];

                                                nodeObj = nodes[node.id] = {
                                                    name : node.name,
                                                    func : node.func,
                                                    associations : node.associations,
                                                    activeDatasets : {},
                                                    id : node.id,
                                                    radius : 10,
                                                    tag : node.name,
                                                    search : [
                                                        node.name,
                                                        node.func,
                                                        JSON.stringify(node.associations)
                                                    ].join(''),
                                                    tagStyle : 'font : 12px sans-serif',
                                                    color : 'black',
                                                };

                                            }
                                        }
                                    );

                                    $.each(
                                        results.edges,
                                        function (idx, edge) {

                                            var node1 = nodes[edge.node_id1];
                                            var node2 = nodes[edge.node_id2];
                                            var datasetRec = records[edge.dataset_id];

                                            if (! datasetRec.nodesByName[node1.name]) {
                                                datasetRec.nodesByName[node1.name] = 1;
                                                datasetRec.nodes.push(node1);
                                            }

                                            if (! datasetRec.nodesByName[node2.name]) {
                                                datasetRec.nodesByName[node2.name] = 1;
                                                datasetRec.nodes.push(node2);
                                            }

                                            var edgeName = [edge.dataset_id, node1.name, node2.name].sort().join('-');//node1.name + '-' + node2.name;
                                            var edgeObj = edges[edgeName];

                                            var dataset_idx = datasets.indexOf(edge.dataset_id);

                                            if (edge.name == 'is interact with') {
                                                edge.name = 'interacts with';
                                            }

                                            if (edgeObj == undefined) {
                                                edgeObj = edges[edgeName] = {
                                                        source : node1,
                                                        target : node2,
                                                        activeDatasets : {},
                                                        name : edgeName,
                                                        description : node1.name + ' ' + edge.name + ' ' + node2.name + ' (' + edge.strength.toFixed(3) + ')',
                                                        //weight : 1,
                                                        colors : {},
                                                        curveStrength : linkScale(dataset_idx) * (dataset_idx % 2 ? -1 : 1),
                                                    };
                                            }

                                            var color = colorCats(datasets.indexOf(edge.dataset_id) % 20);
                                            edgeObj.colors[edge.dataset_id] = color;

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
                    .kbaseForcedNetwork(
                        {
                            linkDistance : 200,
                            filter : true,
                            nodeHighlightColor : '#002200',
                            relatedNodeHighlightColor : 'black',
                        });

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
