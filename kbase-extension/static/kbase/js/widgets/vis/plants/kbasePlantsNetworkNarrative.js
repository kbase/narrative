/*


*/

define (
	[
		'kbwidget',
		'bootstrap',
		'jquery',
		'kbasePlantsNetworkTable',
		'kbaseForcedNetwork',
		'kbaseTable'
	], function(
		KBWidget,
		bootstrap,
		$,
		kbasePlantsNetworkTable,
		kbaseForcedNetwork,
		kbaseTable
	) {
        return KBWidget(
        {

            name: "kbasePlantsNetworkNarrative",
            parent : kbaseIrisWidget,

            version: "1.0.0",

            _accessors : [
                'networkTable',
                'networkGraph',
                'networkClient',
                //'idMapClient',
                'cdmiClient',
                'ontologyClient',
                'idmapClient',
                'tabularData',
            ],

            options: {

            },

            setInput : function(newInput) {

                if (newInput.data) {
                    newInput = newInput.data;
                };


                var colorCats = d3.scale.category20();

                this.setValueForKey('input', newInput);

                var records = {};
                var datasets = [];
                $.each(
                    newInput.datasets,
                    function (idx, rec) {
                        datasets.push(rec.id);

                        var description = rec.description;
                        if (rec.name != rec.id) {
                            description = rec.name + ' (' + rec.description + ')';
                        }

                        records[rec.id] =
                            {
                                nodes       : [],
                                edges       : [],
                                nodesByName : {},
                                edgesByName : {},
                                dataset     : rec.id,
                                type        : rec.network_type,
                                source      : rec.source_ref,
                                //description : rec.name + ' (' + rec.description + ')',
                                description : description,
                            }
                        ;
                    }
                );

                var linkScale = d3.scale.pow()
                    .domain([0, datasets.length])
                    .range([-100,100]);
                var nodes = {};
                var edges = {};

                $.each(
                    newInput.nodes,
                    function (idx, node) {

                        var nodeObj = nodes[node.name];
                        if (nodeObj == undefined) {

                            node.func = node.user_annotations.functions || '';

                            if (node.func.match(/unknown/i)) {
                                node.func = '';
                            }

                            node.associations = "(not sure yet)";

                            node.name = node.name.replace(/\.CDS$/, '');

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
                    newInput.edges,
                    function (idx, edge) {

                        var node1 = nodes[edge.node_id1];
                        var node2 = nodes[edge.node_id2];
                        var datasetRec = records[edge.dataset_id];

                        node1.name = node1.name.replace(/\.CDS$/, '');
                        node2.name = node2.name.replace(/\.CDS$/, '');

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

                this.setValueForKey('tabularData', tabularData);

                if (this.networkTable()) {
                    this.data('loader').remove();
                    this.data('msgBox').show();

                    this.networkTable().setInput(tabularData);
                }


            },

            appendUI : function($elem) {

                $elem.empty();

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
                    .attr('align', 'center');
                new kbaseForcedNetwork($networkGraph, {
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

                var $networkTable =  new kbasePlantsNetworkTable($.jqElem('div'), {
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

                if (this.input()) {
                    this.data('loader').remove();
                    this.data('msgBox').show();

                    this.networkTable().setInput(this.tabularData());
                }


            }
        }

    );
} ) ;
