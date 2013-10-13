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
    var WS_URL = "http://kbase.us/services/workspace_service/";
    var GO_URL_TEMPLATE = "http://www.ebi.ac.uk/QuickGO/GTerm?id=<%= id %>";
    $.KBWidget({
        name: "ForceDirectedNetwork",
        version: "0.1.0",
        options: {
            minHeight: "300px",
            minStrength: 0.7
        },
        init: function (options) {
            this._super(options);
            this.render();
            return this;
        },
        render: function () {
            var self = this;
            var fetchAjax = function () {
                return 1;
            };
            if (self.options.minHeight) {
                self.$elem.css("min-height", self.options.minHeight);
            }
            if (self.options.workspaceID === undefined) {
                fetchAjax = self.exampleData();
            } else if (self.options.token) {
                $.ajaxSetup({ cache: true });
                // parse into 3 parts: workspace <dot> objectid [<dot> version]
                var wsRegex = /^(\w+)\.([^#]+)(?:#(.+))?/;
                var wsid = wsRegex.exec(self.options.workspaceID);
                if (wsid !== null && wsid[1] && wsid[2]) {
                    var kbws = new workspaceService(WS_URL);
                    var params = { auth: self.options.token,    // auth
                        workspace: wsid[1], // workspace name
                        id: wsid[2],        // object id
                        type: 'Networks'};  // object type
                    if (wsid[3] !== undefined) {
                        params.instance = wsid[3]; // optional version
                    }
                    fetchAjax = kbws.get_object(params);
                } else {
                    self.trigger("error", ["Cannot parse workspace ID " +
                        self.options.workspaceID
                    ]);
                    return self;
                }
            } else {
                fetchAjax = $.ajax({
                    dataType: "json",
                    url: URL_ROOT + "/" + encodeURIComponent(self.options.workspaceID) + ".json"
                });
            }
            KBVis.require(["underscore", "renderers/network",
                    "util/viewport", "text!sample-data/network1.json",
                    "transformers/netindex", "util/slider", "util/progress",
                    "text!templates/checkbox.html",
                    "text!templates/error-alert.html",
                    "jquery-ui"
                ],
                function (
                    _, Network, Viewport, Example, NetIndex, Slider,
                    Progress, CheckboxTemplate, ErrorTemplate
                ) {
                    Example = JSON.parse(Example);
                    var minStrength = 0.7;
                    var viewport = new Viewport({
                        parent: self.$elem,
                        title: "Network",
                        maximize: true
                    });
                    viewport.css("min-height", "600px");
                    var datasetFilter = function () {
                        return true;
                    };
                    var goLink = _.template(GO_URL_TEMPLATE);
                    var network = new Network({
                        element: viewport,
                        dock: false,
                        infoOn: "hover",
                        edgeFilter: function (edge) {
                            return edge.source != edge.target &&
                                (edge.strength >= minStrength ||
                                edge.source.type === "CLUSTER" ||
                                edge.target.type === "CLUSTER") &&
                                datasetFilter(edge);
                        },
                        nodeInfo: function (node, makeRow) {
                            makeRow("Type", node.type);
                            makeRow("KBase ID", link(node.entityId, "#"));
                            if (node.type === "GENE" && node.userAnnotations !== undefined) {
                                var annotations = node.userAnnotations;
                                if (annotations["external_id"] !== undefined)
                                    makeRow("External ID",
                                        link(annotations["external_id"], "#"));
                                if (annotations["functions"] !== undefined)
                                    makeRow("Function", annotations["functions"]);
                                if (annotations.ontologies !== undefined) {
                                    var goList = $("<ul/>");
                                    _.each(_.keys(annotations.ontologies), function (item) {
                                        goList.append($("<li/>")
                                            .append(link(item, goLink({
                                                id: item
                                            }))));
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
                                if (annotations["functions"] !== undefined)
                                    indexMe(annotations["functions"]);
                            }
                        }
                    });
                    viewport.renderer(network);
                    forceSlider(viewport, "charge", "Node charge",
                        $("<i>", { class: "icon-magnet" }), 5);
                    forceSlider(viewport, "distance", "Edge distance",
                        $("<i>", { class: "icon-resize-horizontal" }));
                    forceSlider(viewport, "strength", "Edge strength",
                         $("<span>", { class: "glyphicon glyphicon-link" }),
                         0.015);
                    forceSlider(viewport, "gravity", "Gravity", "G", 0.012);
                    var toolbox = viewport.toolbox();
                    addSlider(toolbox);
                    addSearch(toolbox);

                    var progress = new Progress({
                        type: Progress.SPIN,
                        element: viewport
                    });
                    progress.show();
                    $.when(fetchAjax).done(function (result) {
                        var maxGenes = 300;
                        var geneCounter = 0;
                        var data = NetIndex(result.data, {
                            maxEdges: 100000
                        });
                        progress.dismiss();
                        try {
                            network.setData(data);
                        } catch (error) {
                            $(self.$elem)
                                .prepend(_.template(ErrorTemplate, error));
                            return;
                        }
                        network.render();
                        addDatasetDropdown(toolbox, data);
                        addClusterDropdown(toolbox, data);
                    });

                    function forceSlider(
                        viewport, property, title, label, factor) {
                        if (factor === undefined)
                            factor = 1;
                        viewport.addTool((new Slider({
                            title: title,
                            label: label,
                            value: 0,
                            min: -10,
                            max: 10,
                            step: 1,
                            slide: function (value) {
                                network.forceDelta(property, value * factor);
                                network.update();
                            }
                        })).element());
                    }

                    function addSlider($container) {
                        var slider = new Slider({
                            label: $("<i>", {
                                class: "icon-adjust"
                            }),
                            title: "Minimum edge strength",
                            min: 0,
                            max: 1,
                            step: 0.01,
                            value: 0.8,
                            slide: function (value) {
                                minStrength = value;
                                network.update();
                            }
                        });
                        $container.prepend($("<div>", {
                            class: "btn btn-default tool"
                        })
                        .append($("<div>", {
                                class: "btn-pad"
                            })
                            .append(slider.element())
                        ));
                    }

                    function addSearch($container) {
                        var wrapper = $("<div>", {
                            class: "btn btn-default tool"
                        });
                        wrapper
                            .append($("<div>", { class: "btn-pad" })
                                .append($("<input/>", {
                                    id: "network-search",
                                    type: "text",
                                    class: "input-xs"
                                }))
                            ).append($("<div/>", { class: "btn-pad" })
                                .append($("<i/>", { class: "icon-search" })));
                        $container.prepend(wrapper);
                        $("#network-search").keyup(function () {
                            network.updateSearch($(this).val());
                        });
                    }

                    function addClusterDropdown($container, data) {
                        var list = $("<fieldset>");
                        var menu = $("<ul>", {
                            class: "dropdown-menu",
                            role: "menu"
                        })
                            .append($("<li>").append(list));
                        var allClusters = dropdownCheckbox("all", "All clusters", true);
                        var allCheckbox = allClusters.find("input");
                        allClusters.css("background-color", "#666").css("color", "#fff");
                        list.append(allClusters);
                        var clusters = [];

                        // A bit of a Schwartzian Transform to sort by neighbors
                        _.map(
                            _.filter(data.nodes, function (n) {
                                return n.type === "CLUSTER";
                            }),
                            function (node) {
                                clusters.push({
                                    node: node,
                                    neighbors: network.neighbors(node).length
                                });
                            }
                        );
                        _.each(_.sortBy(clusters,
                                function (entry) {
                                    return -entry.neighbors;
                                }),
                            function (entry) {
                                var box = dropdownCheckbox(entry.node.id, "", true);
                                var labelDiv = $("<div>", {
                                    style: "min-width:120px"
                                })
                                    .append(
                                        $("<span>", {
                                            style: "float: left"
                                        })
                                        .html(entry.node.entityId)
                                ).append(
                                    $("<span>", {
                                        style: "float:right;color:#aaa"
                                    })
                                    .html("N:" + entry.neighbors)
                                );
                                box.children("label").first().append(labelDiv);
                                list.append(box);
                            }
                        );
                        list.find("label").click(function (event) {
                            event.preventDefault();
                        });
                        list.find("input[type='checkbox']").click(function (event) {
                            // Prevent menu from closing on checkbox
                            event.stopPropagation();
                            var box = $(this);
                            var id = box.val();
                            var checked = box.prop("checked");
                            var clSelect = "input[type='checkbox'][value!='all']";
                            if (id === "all") {
                                list.find(clSelect)
                                    .prop("checked", checked)
                                    .trigger("change");
                            } else {
                                if (list.find(clSelect + ":not(:checked)").length === 0)
                                    allCheckbox.prop("checked", true);
                                else
                                    allCheckbox.prop("checked", false);

                            }
                        }).change(function (event) {
                            var id = $(this).val();
                            var checked = $(this).prop("checked");
                            if (id === "all")
                                return;
                            var node = network.findNode(id);
                            if (node === null) {
                                self.$elem.prepend(_.template(ErrorTemplate, {
                                    message: "Could not find node " + id
                                }));
                                return;
                            }
                            network.pause();
                            if (checked) {
                                unhideCluster(node);
                            } else {
                                hideCluster(node);
                            }
                            network.resume();
                        });
                        var button = $("<div>", {
                            class: "btn btn-default btn-sm dropdown-toggle",
                            "data-toggle": "dropdown"
                        }).text("Clusters ").append($("<span/>", {
                            class: "caret"
                        }))
                            .dropdown();
                        $container.prepend($("<div>", {
                                class: "btn-group tool"
                            })
                            .append(button)
                            .append(menu)
                        );
                    }

                    function unhideCluster(cluster) {
                        network.unhideNode(cluster);
                        var neighbors = network.neighbors(cluster, null);
                        _.each(neighbors, function (nPair) {
                            var node = nPair[0];
                            if (node.type === 'GENE')
                                network.unhideNode(node);
                        });
                    }

                    function hideCluster(cluster) {
                        var neighbors = network.neighbors(cluster);
                        _.each(neighbors, function (nPair) {
                            var node = nPair[0];
                            if (node.type === 'GENE')
                                network.hideNode(node);
                        })
                        network.hideNode(cluster);
                    }

                    function addDatasetDropdown($container, data) {
                        var wrapper = $("<div>", {
                            class: "btn-group tool"
                        });
                        var list = $("<ul>", {
                            class: "dropdown-menu",
                            role: "menu"
                        });
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
                                datasetFilter = function () {
                                    return true;
                                };
                            else
                                datasetFilter = function (edge) {
                                    return edge.datasetId == id;
                                };
                            network.update();
                        });
                        var button = $("<div/>", {
                            class: "btn btn-default btn-sm dropdown-toggle",
                            "data-toggle": "dropdown"
                        }).text("Data Set ").append($("<span/>", {
                            class: "caret"
                        }))
                            .dropdown();
                        wrapper
                            .append(button)
                            .append(list);
                        $container.prepend(wrapper);
                    }

                    function dropdownLink(linkText, title, value) {
                        return $("<li>")
                            .append($("<a>", {
                                href: "#",
                                "data-toggle": "tooltip",
                                "data-container": "body",
                                "title": title,
                                "data-original-title": title,
                                "data-value": value
                            }).append(linkText));
                    }

                    function dropdownCheckbox(value, label, checked) {
                        return $("<div>", {
                            class: "dropdown-menu-item"
                        })
                            .append(_.template(CheckboxTemplate, {
                                label: label,
                                value: value,
                                checked: checked
                            }));
                    }

                    function link(content, href, attrs) {
                        return $("<a>", _.extend({
                            href: href
                        }, attrs)).html(content);
                    }
                });
            return self;
        },
        exampleData: function () {
            return {
                data: {
                    nodes: [{
                        type: "GENE",
                        id: "kb|netnode.0",
                        userAnnotations: {
                            external_id: "Athaliana.TAIR10:AT2G15410",
                            functions: "transposable element gene.[Source:TAIR;Acc:AT2G15410]"
                        },
                        entityId: "kb|g.3899.locus.10011"
                    }, {
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
                    }, {
                        type: "GENE",
                        id: "kb|netnode.2",
                        userAnnotations: {
                            external_id: "Athaliana.TAIR10:AT2G21600",
                            functions: "protein RER1B [Source:EMBL;Acc:AEC07201.1]"
                        },
                        entityId: "kb|g.3899.locus.10793"
                    }, {
                        type: "CLUSTER",
                        id: "kb|netnode.3",
                        userAnnotations: {},
                        entityId: "cluster.1\n"
                    }, {
                        type: "CLUSTER",
                        id: "kb|netnode.4",
                        userAnnotations: {},
                        entityId: "cluster.2\n"
                    }],
                    edges: [{
                        nodeId2: "kb|netnode.0",
                        nodeId1: "kb|netnode.3",
                        id: "kb|netedge.0",
                        name: "interacting gene pair",
                        strength: "0.7",
                        datasetId: "kb|netdataset.ws//DataSet1",
                        directed: "false",
                        userAnnotations: {},
                    }, {
                        nodeId2: "kb|netnode.0",
                        nodeId1: "kb|netnode.4",
                        id: "kb|netedge.0",
                        name: "interacting gene pair",
                        strength: "1",
                        datasetId: "kb|netdataset.ws//DataSet1",
                        directed: "false",
                        userAnnotations: {},
                    }, {
                        nodeId2: "kb|netnode.1",
                        nodeId1: "kb|netnode.4",
                        id: "kb|netedge.0",
                        name: "interacting gene pair",
                        strength: "0.9",
                        datasetId: "kb|netdataset.ws//DataSet1",
                        directed: "false",
                        userAnnotations: {},
                    }, {
                        nodeId2: "kb|netnode.2",
                        nodeId1: "kb|netnode.4",
                        id: "kb|netedge.0",
                        name: "interacting gene pair",
                        strength: "0.85",
                        datasetId: "kb|netdataset.ws//DataSet1",
                        directed: "false",
                        userAnnotations: {},
                    }, {
                        nodeId2: "kb|netnode.1",
                        nodeId1: "kb|netnode.3",
                        id: "kb|netedge.0",
                        name: "interacting gene pair",
                        strength: "0.65",
                        datasetId: "kb|netdataset.ws//DataSet1",
                        directed: "false",
                        userAnnotations: {},
                    }],
                    datasets: [{
                        properties: {
                            original_data_type: "workspace",
                            coex_net_args: "-i datafiltered.csv -o edge_list.csv -c 0.75 ",
                            original_data_id: "ws://DataSet1",
                            coex_filter_args: "-i data.csv -s sample.csv -o datafiltered.csv -m anova -n 100"
                        },
                        description: "Data Set description",
                        id: "kb|netdataset.ws//DataSet1",
                        name: "First Data Set",
                        taxons: ["kb|g.3899"],
                        sourceReference: "WORKSPACE",
                        networkType: "FUNCTIONAL_ASSOCIATION"
                    }, ]
                }
            };
        }
    });
})(jQuery);
