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
(function($) {
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
                var viewport = new Viewport({
                    parent: self.$elem,
                    title: "Network",
                    maximize: true
                });
                viewport.css("min-height", "700px");
                var toolbox = viewport.toolbox();
                viewport.addTool($("<a/>", { href: "#" }).html("Click me!"));
                addSlider(toolbox, self);
                addSearch(toolbox);
                
                var fetchAjax = function () { return 1; };
                if (self.options.minHeight) {
                    self.$elem.css("min-height", self.options.minHeight);
                }
                if (self.options.token) {
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
                        nodeLabel: { type: "GENE" },
                        infoOn: "hover",
                        edgeFilter: function (edge) {
                            return edge.source != edge.target &&
                            edge.strength >= minStrength;
                        }
                    });
                    self.network = network;
                    network.setData(data);
                    network.render();

                    addDatasetDropdown(toolbox, data);
                });
            });
            return self;
        }
    });

    function addSlider($container, widget) {
        var tipTitle = "Minimum edge strength: ";
        var wrapper = $("<div/>", {
            id: "strength-slider",
            class: "btn btn-default tool"
        });
        var slider = $("<div/>", { style: "min-width:70px" });
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
            min: 0, max: 1, step: 0.05, value: 0.8,
            slide: function (event, ui) {
                widget.minStrength = ui.value;
                widget.network.update();
                $("#strength-slider").next().find(".tooltip-inner")
                    .text(tipTitle + widget.minStrength.toFixed(2));
            }
        });
    }

    function addSearch($container) {
        var wrapper = $("<div/>", { class: "btn btn-default tool" });
        wrapper
            .append($("<div/>", { class: "btn-pad" })
                .append($("<input/>", { type: "text", class: " input-xs" })))
            .append($("<div/>", { class: "btn-pad" })
                .append($("<i/>", { class: "icon-search" })));
        $container.prepend(wrapper);
    }

    function addDatasetDropdown($container, data) {
        var wrapper = $("<div/>", { class: "btn-group tool" });
        var list = $("<ul/>", { class: "dropdown-menu", role: "menu" });
        _.each(data.datasets, function (ds) {
            var dsStr = ds.id.replace(/^kb.*\.ws\/\//, "");
            list.append($("<li/>")
                .append($("<a/>", {
                    href: "#",
                    "data-toggle": "tooltip",
                    "data-container": "body",
                    "title": ds.description,
                    "data-original-title": ds.description
                }).html(dsStr)));
        })
        wrapper
            .append($("<div/>", {
                class: "btn btn-default btn-sm dropdown-toggle",
                "data-toggle": "dropdown"
            }).text("Data Set ").append($("<span/>", { class: "caret"})))
            .append(list);
        $container.prepend(wrapper);
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
            edge.source = parseInt(nodeMap[edge.nodeId1]);
            edge.target = parseInt(nodeMap[edge.nodeId2]);
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
