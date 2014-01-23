/**
 * @class Manhattan
 *
 * Implements a manhattan plot widget
 *
 * And here's an example:
 *
 *     @example
 *     $("#div-id").Manhattan({
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
    var URL_ROOT = "http://140.221.84.142/objects/kbasetest_home/ExpressionDataSamplesMap";
    var WS_URL = "http://140.221.84.209:7058/";
    var GO_URL_TEMPLATE = "http://www.ebi.ac.uk/QuickGO/GTerm?id=<%= id %>";
    $.KBWidget({
        name: "Manhattan",
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
                var wsid = self.options.workspaceID;
                var goid = self.options.gwasObjectID;
                if (wsid !== null && wsid && goid) {
                    var kbws = new workspaceService(WS_URL);
                    fetchAjax = kbws.get_object({
                        auth: self.options.token,
                        workspace: wsid,
                        id: goid,
                        type: 'ExpressionDataSamplesMap'
                    });
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
            KBVis.require(["jquery", "underscore", "renderers/manhattan",
                    "util/viewport", "text!sample-data/network1.json",
                    "transformers/netindex", "util/slider", "util/progress",
                    "text!templates/checkbox.html",
                    "text!templates/error-alert.html",
                    "jquery-ui"
                ],
                function (
                    JQ, _, Manhattan, Viewport, Example, NetIndex, Slider,
                    Progress, CheckboxTemplate, ErrorTemplate
                ) {
                    Example = JSON.parse(Example);
                    var minStrength = 0.7;
                    var viewport = new Viewport({
                        parent: self.$elem,
                        title: "Manhattan",
                        maximize: true
                    });
                    viewport.css("min-height", "600px");
                    var datasetFilter = function () {
                        return true;
                    };
                    var goLink = _.template(GO_URL_TEMPLATE);
                    var manhattanPlot = new Manhattan({
                        element: viewport,
                    });
                    viewport.renderer(manhattanPlot);

                    var progress = new Progress({
                        type: Progress.SPIN,
                        element: viewport
                    });
                    progress.show();
                    JQ.when(fetchAjax).done(function (data) {
                        progress.dismiss();
                        try {
							data.data.maxscore = _.max(_.map(data.data.variations, function ( v ) { return v[2]; }));
							manhattanPlot.setData(data.data);
							

                        } catch (error) {
                        	console.log( error);
                        	
                            JQ(self.$elem)
                                .prepend(_.template(ErrorTemplate, error));
                            return;
                        }
                        manhattanPlot.render();
                    });
                });
            return self;
        },
        exampleData: function () {
            return {
                }
        }
    });
})(jQuery);
