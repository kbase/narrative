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
(function($) {
    var URL_ROOT = "http://140.221.84.142/objects/coexpr_test/Networks";
    var WS_URL   = "http://kbase.us/services/workspace_service/";
    $.KBWidget({
        name: "ForceDirectedNetwork",
        version: "0.1.0",
        options: {},
        init: function(options) {
            this._super(options);
            this.render();
            return this;
        },
        render: function () {
            var self = this;
            var fetchAjax = function () { return 1; };
            if (this.options.token) {
                var wsRegex = /^(\w+)\.(.+)/;
                var wsid = wsRegex.exec(this.options.workspaceID);
                if (wsid !== null && wsid[1] && wsid[2]) {
                    var kbws = new workspaceService(WS_URL);
                    fetchAjax = kbws.get_object({
                        auth: this.options.token,
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
                        encodeURIComponent(this.options.workspaceID) + ".json"
                });
            }
            $.when(fetchAjax).done(function (result) {
                var data = transformNetwork(result.data);
                KBVis.require(["renderers/network"], function (Network) {
                    var network = new Network({
                        element: self.$elem,
                        dock: false,
                        nodeLabel: { type: "GENE" }
                    });
                    network.setData(data);
                    network.render();
                });
            });
            return self;
        }
    });

    function transformNetwork(networkJson) {
        var json = {
            nodes: [],
            edges: []
        };
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
