/**
 * @class ForceDirectedNetwork
 *
 * Implements a force-directed network widget
 *
 * And here's an example:
 *
 *     @example
 *     $("#div-id").ForceDirectedNetwork({
 *         minHeight   : "300px",
 *         workspaceID : "workspace.1",
 *         token       : "user-token-53"
 *     });
 *
 * @extends KBWidget
 * @chainable
 *
 * @param {Object} options
 * The options
 *
 * @param {String} options.workspaceID
 * The workspace ID of the network to look up
 *
 * @param {String} options.token
 * The authorization token used for workspace lookup
 *
 * @param {String|Number} options.minHeight
 * A minimum height for the widget
 */
(function ($) {
    var URL_ROOT = "http://140.221.84.142/objects/coexpr_test/Networks";
    var WS_URL   = "http://kbase.us/services/workspace_service/";
    $.KBWidget({
        name: "ForceDirectedNetwork",
        version: "0.1.0",
        options: {
            minHeight: "300px",
            minStrength: 0.7
        },
        init: function(options) {
            this._super(options);
            this.render();
            return this;
        },
        render: function () {
            var self = this;
            KBVis.require(["renderers/network", "util/viewport", "underscore"],
            function (Network, Viewport, _) {
                self.minStrength = self.options.minStrength;
                var datasetFilter = function () { return true; };
                var goLink = _.template(
                    "http://www.ebi.ac.uk/QuickGO/GTerm?id=<%= id %>"
                );
                var viewport = new Viewport({
                    parent: self.$elem,
                    title: "Network",
                    maximize: true
                });
                viewport.css("min-height", "400px");
                var toolbox = viewport.toolbox();
                viewport.addTool($("<a/>", { href: "#" }).html("Click me!"));
                addSlider(toolbox, self);
                addSearch(toolbox, self);
                
                var fetchAjax = function () { return 1; };
                if (self.options.minHeight) {
                    self.$elem.css("min-height", self.options.minHeight);
                }
                if (self.options.workspaceID === undefined) {
                    fetchAjax = self.exampleData();
                } else if (self.options.token) {
                    var wsRegex = /^(\w+)\.(.+)/;
                    var wsid = wsRegex.exec(self.options.workspaceID);
                    if (wsid !== null && wsid[1] && wsid[2]) {
                        var kbws = new workspaceService(WS_URL);
                        fetchAjax = kbws.get_object({
                            auth: self.options.token,
                            workspace: wsid[1],
                            id: wsid[2],
                            type: 'Networks'
                        });
                    } else {
                        self.trigger("error", ["Cannot parse workspace ID " +
                            self.options.workspaceID ]);
                        return self;
                    }
                } else {
                    fetchAjax = $.ajax({
                        dataType: "json",
                        url: URL_ROOT + "/" +
                            encodeURIComponent(self.options.workspaceID) + ".json"
                    });
                }
                $.when(fetchAjax).done(function (result) {
                    var data = transformNetwork(result.data);
                    var minStrength = 0.7;
                    var network = new Network({
                        element: viewport,
                        dock: false,
                        nodeLabel: { type: "CLUSTER" },
                        infoOn: "hover",
                        edgeFilter: function (edge) {
                            return edge.source != edge.target &&
                                (edge.strength >= minStrength || edge.strength === 0) &&
                                datasetFilter(edge);
                        },
                        nodeInfo: function (node, makeRow) {
                            makeRow("Type", node.type);
                            makeRow("KBase ID", link(node.entityId, "#"));
                            if (node.type === "GENE" && node.userAnnotations !== undefined) {
                                var annotations = node.userAnnotations;
                                if (annotations.external_id !== undefined)
                                    makeRow("External ID", link(annotations.external_id, "#"));
                                if (annotations.functions !== undefined)
                                    makeRow("Function", annotations.functions);
                                if (annotations.ontologies !== undefined) {
                                    var goList = $("<ul/>");
                                    _.each(_.keys(annotations.ontologies), function (item) {
                                        goList.append($("<li/>")
                                            .append(link(item, goLink({ id: item }))));
                                    });
                                    makeRow("GO terms", goList);
                                }
                            }
                        },
                        searchTerms: function (node, indexMe) {
                            indexMe(node.entityId);
                            indexMe(node.kbid);
                            if (node.userAnnotations !== undefined) {
                                var annotations = node.userAnnotations;
                                if (annotations.functions !== undefined)
                                    indexMe(annotations.functions);
                            }
                        }
                    });
                    self.network = network;
                    viewport.renderer(network);
                    network.setData(data);
                    network.render();

                    addDatasetDropdown(toolbox, data, self);
                });
                return self;
            });
        },
        exampleData: function () {
            return {
                data: {
                    nodes: [
                        {
                            type: "GENE",
                            id: "kb|netnode.0",
                            userAnnotations: {
                                external_id: "Athaliana.TAIR10:AT2G15410",
                                functions: "transposable element gene.[Source:TAIR;Acc:AT2G15410]"
                            },
                            entityId: "kb|g.3899.locus.10011"
                        },
                        {
                            type: "GENE",
                            id: "kb|netnode.1",
                            userAnnotations: {
                                ontologies: {
                                    "GO:0006468": [{
                                        ec: "IEA",
                                        desc: "protein phosphorylation",
                                        domain: "biological_process"
                                    }]
                                },
                                external_id: "Athaliana.TAIR10:AT1G32320",
                                functions: "MAP kinase kinase 10 [Source:EMBL;Acc:AEE31463.1]"
                            },
                            entityId: "kb|g.3899.locus.3560"
                        },
                        {
                            type: "GENE",
                            id: "kb|netnode.2",
                            userAnnotations: {
                                external_id: "Athaliana.TAIR10:AT2G21600",
                                functions: "protein RER1B [Source:EMBL;Acc:AEC07201.1]"
                            },
                            entityId: "kb|g.3899.locus.10793"
                        },
                        {
                          type: "CLUSTER",
                          id: "kb|netnode.3",
                          userAnnotations: {},
                          entityId: "cluster.1\n"
                        },
                        {
                          type: "CLUSTER",
                          id: "kb|netnode.4",
                          userAnnotations: {},
                          entityId: "cluster.2\n"
                        }
                    ],
                    edges: [
                        {
                            nodeId2: "kb|netnode.0",
                            nodeId1: "kb|netnode.3",
                            id: "kb|netedge.0",
                            name: "interacting gene pair",
                            strength: "0.7",
                            datasetId: "kb|netdataset.ws//DataSet1",
                            directed: "false",
                            userAnnotations: {},
                        },
                        {
                            nodeId2: "kb|netnode.0",
                            nodeId1: "kb|netnode.4",
                            id: "kb|netedge.0",
                            name: "interacting gene pair",
                            strength: "1",
                            datasetId: "kb|netdataset.ws//DataSet1",
                            directed: "false",
                            userAnnotations: {},
                        },
                        {
                            nodeId2: "kb|netnode.1",
                            nodeId1: "kb|netnode.4",
                            id: "kb|netedge.0",
                            name: "interacting gene pair",
                            strength: "0.9",
                            datasetId: "kb|netdataset.ws//DataSet1",
                            directed: "false",
                            userAnnotations: {},
                        },
                        {
                            nodeId2: "kb|netnode.2",
                            nodeId1: "kb|netnode.4",
                            id: "kb|netedge.0",
                            name: "interacting gene pair",
                            strength: "0.85",
                            datasetId: "kb|netdataset.ws//DataSet1",
                            directed: "false",
                            userAnnotations: {},
                        },
                        {
                            nodeId2: "kb|netnode.1",
                            nodeId1: "kb|netnode.3",
                            id: "kb|netedge.0",
                            name: "interacting gene pair",
                            strength: "0.65",
                            datasetId: "kb|netdataset.ws//DataSet1",
                            directed: "false",
                            userAnnotations: {},
                        }
                    ],
                    datasets: [
                        {
                            properties: {
                                original_data_type: "workspace",
                                coex_net_args: "-i datafiltered.csv -o edge_list.csv -c 0.75 ",
                                original_data_id: "ws://DataSet1",
                                coex_filter_args: "-i data.csv -s sample.csv -o datafiltered.csv -m anova -n 100"
                            },
                            description: "Data Set description",
                            id: "kb|netdataset.ws//DataSet1",
                            name: "First Data Set",
                            taxons: [ "kb|g.3899" ],
                            sourceReference: "WORKSPACE",
                            networkType: "FUNCTIONAL_ASSOCIATION"
                        },
                    ]
                }
            };
        }
    });

    function addSlider($container, widget) {
        var tipTitle = "Minimum edge strength: ";
        var wrapper = $("<div/>", {
            id: "strength-slider",
            class: "btn btn-default tool"
        });
        var slider = $("<div/>", { style: "min-width:70px;margin-right:5px" });
        wrapper
            .append($("<div/>", { class: "btn-pad" })
                .append($("<i/>", { class: "icon-adjust" })))
            .append($("<div/>", { class: "btn-pad" })
                .append(slider));
        $container.prepend(wrapper);
        $("#strength-slider").tooltip({
           title: tipTitle + widget.minStrength.toFixed(2),
           placement: "bottom"
        });
        slider.slider({
            min: 0, max: 1, step: 0.01, value: 0.8,
            slide: function (event, ui) {
                widget.minStrength = ui.value;
                widget.network.update();
                $("#strength-slider").next().find(".tooltip-inner")
                    .text(tipTitle + widget.minStrength.toFixed(2));
            }
        });
    }

    function addSearch($container, widget) {
        var wrapper = $("<div/>", { class: "btn btn-default tool" });
        wrapper
            .append($("<div/>", { class: "btn-pad" })
                .append($("<input/>", {
                    id: "network-search", type: "text", class: " input-xs"
                })))
            .append($("<div/>", { class: "btn-pad" })
                .append($("<i/>", { class: "icon-search" })));
        $container.prepend(wrapper);
        $("#network-search").keyup(function () {
            widget.network.updateSearch($(this).val());
        });
    }

    function addDatasetDropdown($container, data, widget) {
        var wrapper = $("<div/>", { class: "btn-group tool" });
        var list = $("<ul/>", { class: "dropdown-menu", role: "menu" });
        list.append(dropdownLink("All data sets", "", "all"));
        _.each(data.datasets, function (ds) {
            var dsStr = ds.id.replace(/^kb.*\.ws\/\//, "");
            list.append(dropdownLink(dsStr, ds.description, ds.id));
        });
        list.find("a").on("click", function (event) {
            var id = $(this).data("value");
            list.find("li").removeClass("active");
            $(this).parent().addClass("active");
            if (id == "all")
                datasetFilter = function () { return true; };
            else
                datasetFilter = function (edge) {
                    return edge.datasetId == id;
                };
            widget.network.update();
        });
        var button = $("<div/>", {
            class: "btn btn-default btn-sm dropdown-toggle",
            "data-toggle": "dropdown"
        }).text("Data Set ").append($("<span/>", { class: "caret"}))
            .dropdown();
        wrapper.append(button).append(list);
        $container.prepend(wrapper);
    }
    
    function dropdownLink(linkText, title, value) {
        return $("<li/>")
            .append($("<a/>", {
                href: "#",
                "data-toggle": "tooltip",
                "data-container": "body",
                title: title,
                "data-original-title": title,
                "data-value": value
            }).html(linkText));
    }
    function link(content, href, attrs) {
        return $("<a/>", _.extend({ href: href }, attrs)).html(content);
    }

    function transformNetwork(networkJson) {
        var json = {};
        for (var property in networkJson) {
            json[property] = networkJson[property];
        }
        json.nodes = []; json.edges = [];
        var nodeMap = {};
        for (var i = 0; i < networkJson.nodes.length; i++) {
            var node = $.extend({}, networkJson.nodes[i]);
            nodeMap[node.id] = i;
            node.kbid = node.id;
            node.group = node.type;
            node.id = i;
            json.nodes.push(node);
        }
        for (var i = 0; i < networkJson.edges.length; i++) {
            var edge = $.extend({}, networkJson.edges[i]);
            edge.source = parseInt(nodeMap[edge.nodeId1], 0);
            edge.target = parseInt(nodeMap[edge.nodeId2], 0);
            edge.weight = 1;
            json.edges.push(edge);
        }
        for (var prop in networkJson) {
            if (!json.hasOwnProperty(prop)) {
                json[prop] = networkJson[prop];
            }
        }
        return json;
    }
})(jQuery);
