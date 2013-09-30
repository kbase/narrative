/**
 * @class ForceDirectedNetwork
 *
 * Implements a force-directed network widget
 * 
 * @extends KBWidget
 *
 * And here's an example:
 *
 *     @example
 *     var widget = $.ForceDirectedNetwork({
 *         workspaceID: "workspace.1",
 *     });
 */
(function ($) {
    var URL_ROOT = "http://140.221.84.142/objects/coexpr_test/Networks";
    $.KBWidget({
        name: "ForceDirectedNetwork",
        version: "0.1.0",
        options: {},
        init: function (options) {
            this._super(options);
            this.render();
/*
            requirejs.config({
                baseUrl: "../js-dev/datavis",
                shim: {
                    jquery:      { exports: ["$", "jQuery"] },
                    d3:          { exports: "d3"          },
                    underscore:  { exports: "_"           },
                },
            });
*/
            
            return this;
        },
        render: function () {
            var self = this;
            $.ajax({
                dataType: "json",
                url: URL_ROOT + "/" +
                    encodeURIComponent(this.options.workspaceID) + ".json"
            }).done(function (result) {
                var data = transformNetwork(result.data);
                datavis.require(["renderers/network"], function (Network) {
                    var network = new Network({
                        element: self.$elem,
                        dock: false,
                        nodeLabel: { type: "GENE" },
                    });
                    network.setData(data);
                    network.render();
                });
            })
            return self;
        }
    });

    function transformNetwork(networkJson) {
        var json = { nodes: [], edges: [] };
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

