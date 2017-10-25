/*


*/

define (
	[
		'kbwidget',
		'bootstrap',
		'jquery',
		'kbaseIrisWidget',
		'kbaseTable'
	], function(
		KBWidget,
		bootstrap,
		$,
		kbaseIrisWidget,
		kbaseTable
	) {
        return KBWidget(
        {

            name: "kbasePlantsNTO",
            parent : kbaseIrisWidget,

            version: "1.0.0",

            _accessors : [
                'terminal',
                'networkGraph',
            ],

            options: {
                maxVisibleRowIndex : 5,
                navControls : true,
                extractHeaders : false,
            },

            setInput : function(newInput) {
                if (typeof(newInput) === 'string') {
                    newInput = JSON.parse(newInput);
                }

                if (newInput.data) {
                    newInput = newInput.data;
                }

                this.setValueForKey('input',  newInput);
                this.appendUI(this.$elem);
            },

            appendUI : function($elem) {

                $elem.empty();

                var $self = this;

                if (this.input() == undefined) {
                    this.setError("Cannot use network table widget w/o input file");
                }
                else {
//$elem.append(JSON.stringify(this.input(), undefined, 2));

var datasets = [];
var colorCats = d3.scale.category20();

$.each(
    this.input().nodes,
    function (idx, cluster) {
        if (cluster.type == 'CLUSTER') {

            var enrichment = cluster.user_annotations.go_enrichnment_annotation;

            var go_id = [];
            var go_term = [];
            var p_value = [];

            if (enrichment != undefined) {
                var enrichments = enrichment.split(/\n/);
                for (var j = 0; j < enrichments.length; j++) {
                    var m;
                    if ( m = enrichments[j].match( /(GO:\d+)\(([\d.]+)\)(.+)/ ) ) {
                        go_id.push(m[1]);
                        p_value.push(m[2]);
                        go_term.push(m[3]);
                    }
                }
            }

            datasets.push(
                {
                    id              : cluster.id,
                    cluster_id      : cluster.entity_id,
                    styled_cluster_id : {value : cluster.entity_id, style : 'color : ' + colorCats(datasets.length % 20)},
                    color           : colorCats(datasets.length % 20),
                    num_genes       : 0,
                    num_edges       : 0,
                    go_enrichment : cluster.user_annotations.go_enrichnment_annotation || 'No enrichment',
                    go_id       : go_id,
                    p_value     : p_value,
                    go_term     : go_term,

                    nodes       : [],
                    edges       : [],
                    nodesByName : {},
                    edgesByName : {},
                    dataset     : cluster.id,
                    type        : cluster.network_type,
                    source      : cluster.source_ref,
                    description : cluster.name + ' (' + cluster.description + ')',

                }
            );
        }
    }
)

var throttle = 0;
var edge_ids = [];
var node_to_cluster = {};



$.each(
    this.input().edges,
    function (eidx, edge) {
        $.each(
            datasets,
            function (idx, dataset) {
//if (throttle++ > 10) {
//    return false;
//}

                if (dataset.gene_ids == undefined) {
                    dataset.gene_ids = [];
                }

                if (edge.node_id1 == dataset.id) {
                    dataset.gene_ids.push(edge.node_id2);
                    edge_ids.push(edge.node_id2);
                    dataset.num_genes++;
                    node_to_cluster[edge.node_id2] = dataset;
                }
                else if (edge.node_id2 == dataset.id) {
                    dataset.gene_ids.push(edge.node_id1);
                    edge_ids.push(edge.node_id1);
                    dataset.num_genes++;
                    node_to_cluster[edge.node_id1] = dataset;
                }

            }
        )
    }
);

//okay, now we go back through the damn nodes and pull out the actual data we need.

var nodes = {};
var edges = {};

$.each(
    this.input().nodes,
    function (idx, node) {
        $.each(
            edge_ids,
            function (eidx, edge_id) {
                if (node.id == edge_id) {

                    var cluster_gene_data = node_to_cluster[node.id];
                    if (cluster_gene_data.gene_data == undefined) {
                        cluster_gene_data.gene_data = [];
                    }

                    cluster_gene_data.gene_data.push(
                        {
                            external_id : node.user_annotations.external_id || node.entity_id,
                            kbase_id : node.entity_id,
                            func : node.user_annotations.functions || '',
                            cluster : cluster_gene_data.cluster_id,
                        }
                    );

                    node.func = node.user_annotations.functions;

                    if (node.func == undefined || node.func.match(/unknown/i)) {
                        node.func = '';
                    }

                    node.associations = "(not sure yet)";

                    nodes[node.id] = {
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
                        type : node.type,
                    };

                    return;

                }
            }
        )
    }
);


var linkScale = d3.scale.pow()
    .domain([0, datasets.length])
    .range([-100,100]);

//okay, now we go back through the edges AGAIN and count up the edges. An edge
//counts if it's between two genes in the same cluster.
$.each(
    this.input().edges,
    function (eidx, edge) {
        $.each(
            datasets,
            function (idx, dataset) {

                var validEdge = false;
                var datasetRec;

                if (node_to_cluster[edge.node_id1].id == dataset.id && (node_to_cluster[edge.node_id2] || {}).id == dataset.id) {
                    dataset.num_edges++;
                    validEdge = true;
                    datasetRec = node_to_cluster[edge.node_id1];
                }
                else if (node_to_cluster[edge.node_id2] == dataset.id && (node_to_cluster[edge.node_id1] || {}).id == dataset.id) {
                    dataset.num_edges++;
                    validEdge = true;
                    datasetRec = node_to_cluster[edge.node_id2];
                }

                if (validEdge) {
                    var node1 = nodes[edge.node_id1];
                    var node2 = nodes[edge.node_id2];

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

                    var dataset_idx = datasets.indexOf(datasetRec);

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

                    var color = datasetRec.color;//colorCats(datasets.indexOf(edge.dataset_id) % 20);
                    edgeObj.colors[edge.dataset_id] = color;

                    if (! datasetRec.edgesByName[edgeName]) {
                        datasetRec.edgesByName[edgeName] = 1;
                        datasetRec.edges.push(
                            edgeObj
                        );
                    }
                }
            }
        )
    }
);

var $nto = this;

var $checkbox = $.jqElem('input')
    .attr('type', 'checkbox')
;

$.each(
    datasets,
    function (ridx, row) {

        var checkbox = {
            externalSortValue : true,
            value : $checkbox.clone(),
            sortValue : false,
        };
        checkbox.setup = function($checkbox, cell) {

                    $checkbox.on('click',
                        function(e) {

                            var $check = this;
                            //not that we should be able to be here w/o a graph, but just in case.
                            if ($self.networkGraph == undefined) {
                                return;
                            }

                            cell.sortValue = $check.checked;

                            var dataset = $self.networkGraph().dataset();

                            if (dataset == undefined) {
                                dataset = {
                                    nodes : [],
                                    edges : []
                                };
                            }

                            var newDataset = {
                                nodes : [],
                                edges : []
                            };

                            var activeNodes = {};
                            var activeEdges = {};

                            //first thing we do is pull over all the existing nodes/edges
                            //only copy from our network if we're checked (not really possible)
                            //otherwise, copy all the other networks.
                            $.each(
                                dataset.nodes,
                                function(idx, node) {
                                    if (node.activeDatasets[row.cluster_id] && ! $check.checked) {
                                        delete node.activeDatasets[row.cluster_id];
                                    }

                                    if (d3.keys(node.activeDatasets).length) {
                                        newDataset.nodes.push(node);
                                        activeNodes[node.name] = 1;
                                    }
                                }
                            );

                            $.each(
                                dataset.edges,
                                function(idx, edge) {
                                    if (edge.activeDatasets[row.cluster_id] && ! $check.checked) {
                                        delete edge.activeDatasets[row.cluster_id];
                                    }

                                    if (d3.keys(edge.activeDatasets).length) {
                                        newDataset.edges.push(edge);
                                        activeEdges[edge.name] = 1;
                                    }
                                }
                            );

                            if ($check.checked) {
                                //okay, now the fun. Finally. Fucking finally. Iterate through the row's
                                //nodes and edges and add 'em all to the network.

                                $.each(
                                    row.nodes,
                                    function (idx, node) {
                                        node.activeDatasets[row.cluster_id] = 1;
                                        if (! activeNodes[node.name]) {
                                            newDataset.nodes.push(node);
                                            activeNodes[node.name] = 1;
                                        }

                                        node.label = '<b>' + node.name + '</b>'
                                            + '<hr>'
                                            + d3.keys(node.activeDatasets).sort().join('<br>');
                                    }
                                );

                                var color = row.color;

                                $.each(
                                    row.edges,
                                    function (idx, edge) {
                                        edge.activeDatasets[row.cluster_id] = 1;
                                        edge.color = color;
                                        if (! activeEdges[edge.name]) {
                                            newDataset.edges.push(edge);
                                            activeEdges[edge.name] = 1;
                                        }

                                    }
                                );
                            }

                            $.each(
                                newDataset.nodes,
                                function (idx, node) {
                                    node.label = '<b>' + node.name + '</b>'
                                        + '<hr>' + node.func
                                        + '<hr>'
                                        + d3.keys(node.activeDatasets).sort().join('<br>');

                                    node.radius = 8 + 3 * d3.keys(node.activeDatasets).length;
                                    node.tagOffsetY = node.radius + 7;
                                }
                            );

                            $.each(
                                newDataset.edges,
                                function (idx, edge) {
                                    edge.label = '<b>' + edge.description + '</b>'
                                        + '<hr>'
                                        + d3.keys(edge.activeDatasets).sort().join('<br>');
                                        //edge.weight = d3.keys(edge.activeDatasets).length;
                                        edge.weight = 1.5;

                                    if (d3.keys(edge.activeDatasets).length > 1) {
                                        edge.color = 'black';
                                    }
                                    else {
                                        //edge.color = edge.colors[d3.keys(edge.activeDatasets)[0]];
                                    }
                                }
                            );

                            if (newDataset.nodes.length) {
                                $self.networkGraph().$elem.show();
                            }
                            else {
                                $self.networkGraph().$elem.hide();
                            }

                            $self.networkGraph().setDataset(newDataset);
                            $self.networkGraph().renderChart();


                        }
                    )
                }
        ;

        row.checkbox = checkbox;

        //row.num_nodes = row.nodes.length;
        //row.num_edges = row.edges.length;

        //data.structure.rows.push(row);
    }
);

var cluster_data = {
    structure : {
        header      : [
            {
                value : 'styled_cluster_id',
                label : 'Cluster ID',
                style: "width : 80px; background-color : black; color : white",
            },
            {
                value : 'num_genes',
                label : 'No. of genes',
                style: "min-width : 130px; width : 130px; background-color : black; color : white",
            },
            {
                value : 'num_edges',
                label : 'No. of edges',
                style: "min-width : 130px; width : 130px; background-color : black; color : white",
            },
            {
                value : 'go_id',
                label : 'GO ID',
                style: "width : 70px; background-color : black; color : white",
            },
            {
                value : 'go_term',
                label : 'GO term',
                style: "width : 110px; background-color : black; color : white",
            },
            {
                value : 'p_value',
                label : 'p-value',
                style: "min-width : 90px; width : 90px; background-color : black; color : white",
            },
            /*{
                value : 'go_enrichment',
                label : 'GO Enrichment',
                style: "width : 250px; background-color : black; color : white",
            },*/
            {
                value : 'gene_list',
                label : 'Gene List',
                style: "width : 250px; background-color : black; color : white",
            },
           /* {
                value : 'checkbox',
                label : 'Network comparision',
                style: "max-width : 125px; background-color : black; color : white",
                sortable : false,
            },*/
        ],
        rows        : datasets,
    },
    row_callback : function (cell, header, row, $kb) {

        if (header == 'gene_list') {

            row.gene_data = row.gene_data.sort($kb.sortByKey('external_id', true));

            var $return = $.jqElem('ul').css('list-style', 'none').css('padding-left', '0px');

            for (var i = 0; i < 3 && i < row.gene_data.length; i++) {
                var label = row.gene_data[i].external_id;
                label = label.replace(/\.CDS$/, '');
                $return.append(
                    $.jqElem('li').append(label)
                );
            }

            if (row.gene_data.length > 3) {

                $return.append(
                    $.jqElem('li')
                        .append(
                            $.jqElem('a')
                                .attr('href', '#')
                                .append('more...')
                                .on('click', function(e) {
                                    e.stopPropagation(); e.preventDefault();
                                    $nto.display_gene_list(row.gene_data);
                            })
                        )
                );
            }

            return $return;

        }
        if ( header.match( /^(go_id|go_term|p_value)$/) ) {

            var $return = $.jqElem('ul').css('list-style', 'none').css('padding-left', '0px');

            for (var i = 0; i < row[header].length; i++) {
                $return.append(
                    $.jqElem('li').append(row[header][i])
                );
            }

            return $return;

        }
        if (header == 'network_comparison') {
            return $.jqElem('a')
                .attr('href', '#')
                .append('Compare with KBase networks' + row.id)
                .on('click', function(e) {
                    $nto.display_gene_list(row.gene_data);
                })
        }
        else {
            return $kb.default_row_callback(cell, header, row, $kb);
        }
    },
    sortable    : true,
    hover       : true,
    //resizable   : true,
    headerOptions : {
        style : 'background-color : black; color : white;',
        sortable : true,
    },
    maxVisibleRowIndex : this.options.maxVisibleRowIndex,
    navControls : this.options.navControls,
};


var $tables =
    $.jqElem('div')
        .attr('id', 'tables')
        .append(
            $.jqElem('div').attr('id', 'cluster_table')
        )
        .append(
            $.jqElem('div').attr('id', 'gene_table')
        )
        .append(
            $.jqElem('div').attr('id', 'network')
        );
;

this._rewireIds($tables, this);

var $networkGraph = this.data('network')
    .css({width : 700, height : 600})
    .attr('align', 'center');
new kbaseForcedNetwork($networkGraph, {
    linkDistance : 200,
    filter : true,
    nodeHighlightColor : '#002200',
    relatedNodeHighlightColor : 'black',
});
$networkGraph.$elem.hide();
this.networkGraph($networkGraph);

var clusterTable = $.jqElem('div').kbaseTable(cluster_data);

// all of this stuff here? This is to hack in a grouped header over the top.
    var headerRow = clusterTable.data('headerRow');
    headerRow.find('th:nth-child(3)').after(
        $.jqElem('th')
            .attr('style', "background-color : black; color : white")
            //.attr('colspan', 2)
            .append('GO enrichment')
    );


    var hrow2 = $.jqElem('tr');
    hrow2.append(headerRow.find('th:nth-child(5)'));
    hrow2.append(headerRow.find('th:nth-child(5)'));
    hrow2.append(headerRow.find('th:nth-child(5)'));

    clusterTable.data('headerRow').find('th').attr('rowspan', 2);
    clusterTable.data('headerRow').find('th:nth-child(4)').attr('rowspan', 1).attr('colspan', 3);

    clusterTable.data('thead').append(hrow2);
//end header hack


this.data('cluster_table').append(clusterTable.$elem);//kbaseTable(cluster_data);

$elem.append($tables);

                }

            },

            display_gene_list : function(gene_data) {

                if (gene_data == this.data('last_gene_data')) {
                    this.data('gene_table').empty();
                    this.data('last_gene_data', undefined);

                    return;
                }

                var table_data = {
                    structure : {
                        header      : [
                            {
                                value : 'external_id',
                                label : 'External gene ID',
                                style: "max-width : 190px; background-color : black; color : white",
                            },
                            {
                                value : 'kbase_id',
                                label : 'KBase gene ID',
                                style: "min-width : 250px; background-color : black; color : white",
                            },
                            {
                                value : 'func',
                                label : 'Gene Function',
                                style: "min-width : 75px; background-color : black; color : white",
                            },
                            {
                                value : 'cluster',
                                label : 'Cluster name',
                                style: "min-width : 75px; background-color : black; color : white",
                            },
                        ],
                        rows        : gene_data,
                    },

                row_callback : function (cell, header, row, $kb) {

                    if (header == 'external_id') {
                        return cell.replace(/\.CDS$/, '');
                    }
                    else {
                        return $kb.default_row_callback(cell, header, row, $kb);
                    }
                },

                    sortable    : true,
                    hover       : true,
                    //resizable   : true,
                    headerOptions : {
                        style : 'background-color : black; color : white;',
                        sortable : true,
                    },
                    //maxVisibleRowIndex : this.options.maxVisibleRowIndex,
                    navControls : this.options.navControls,
                };

                //damn tables don't update, they're just static. I need to write a new table widget.
                var $tbl = $.jqElem('div').kbaseTable(table_data);
                this.data('gene_table').empty();
                this.data('gene_table').append($tbl.$elem);

                this.data('last_gene_data', gene_data);

                var $self = this;

                setTimeout(function() {

                    /*var $parent = $tbl.$elem.parent();
                    var throttle = 0;
                    while ($parent.get(0) != undefined && throttle++ < 1000) {
                        if ($parent.css('overflow') != undefined && $parent.css('overflow').match(/auto|scroll/)) {
                            break;
                        }
                        else {
                            $parent = $parent.parent();
                        }
                    }

                    if ($parent.get(0) == undefined) {
                        $parent = $('html,body');
                    }*/

                    $parent = $('html,body');

                    offset = $self.data('gene_table').prop('offsetTop');


                    $parent.animate(
                        {
                            scrollTop: offset
                        },
                        500
                    );

                },0);

            },
        }

    );
} ) ;
