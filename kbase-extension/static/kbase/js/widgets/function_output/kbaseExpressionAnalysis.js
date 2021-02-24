/**
 * Output view for KBaseFBA.FBAPathwayAnalysis objects.
 *
 * Fetches workspaces object, computes stats, and renders view for data using plotly.
 *
 * @param Takes a {type: <type>, ws: <workspace>, obj: <obj>}, where <type>
 * is a workspace type, and where <ws>/<obj> is a pair of workspace/object names or ids.
 *
 * @author nconrad <nconrad@anl.gov>
 * @public
 */

 define (
	[
		'kbwidget',
		'bootstrap',
		'jquery',
		'plotly',
		'kbaseAuthenticatedWidget',
		'KBModeling'
	], (
		KBWidget,
		bootstrap,
		$,
		Plotly,
		kbaseAuthenticatedWidget
		// KBModeling
	) => {

    return KBWidget({
        name: "kbaseExpressionAnalysis",
        parent : kbaseAuthenticatedWidget,
        version: "1.0.1",
        options: {},
        init: function(input) {
            const self = this;
            this._super(input);
            const container = this.$elem;

            // api helper
            const api = new KBModeling( self.authToken() ).kbapi;

            // accept workspace/object ids or strings
            if (isNaN(input.ws) && isNaN(input.obj) )
                var param = {workspace: input.ws, name: input.obj};
            else if (!isNaN(input.ws) && !isNaN(input.obj) )
                var param = {ref: input.ws+'/'+input.obj};


            // get data, format, and render data
            api('ws', 'get_objects', [param])
                .then((res) => {
                    const data = formatData(res[0].data);
                    render(data.values, data.y);
                })


            // takes KBaseFBA.FBAPathwayAnalysis data,
            // and returns data needed to render stacked bar chart
            function formatData(data) {
                const pathways = data.pathways;

                const y = [];
                const values = {
                    gpRxnsFluxP: [],
                    gsrFluxMExpM: [],
                    gsrFluxMExpP: [],
                    gsrFluxPExpN: [],
                    gsrFluxPExpP: []
                }

                let i = pathways.length;
                while (i--) {
                    const o = pathways[i];
                    y.push(o.pathwayName + ' ('+o.totalModelReactions+')');

                    const total = o.gpRxnsFluxP + o.gsrFluxMExpM + o.gsrFluxMExpP +
                                o.gsrFluxPExpN + o.gsrFluxPExpP;

                    values.gpRxnsFluxP.push( o.gpRxnsFluxP / total * 100);
                    values.gsrFluxMExpM.push(o.gsrFluxMExpM / total * 100 );
                    values.gsrFluxMExpP.push(o.gsrFluxMExpP / total * 100 );
                    values.gsrFluxPExpN.push(o.gsrFluxPExpN / total * 100 );
                    values.gsrFluxPExpP.push(o.gsrFluxPExpP / total * 100 );
                }

                return {values: values, y: y};
            }

            function render(values, y) {
                const basopts = {
                    x: null,
                    y: y,
                    name: null,
                    orientation: 'h',
                    marker: {
                        color: null,
                        width: 1
                    },
                    type: 'bar'
                };

                const trace1 = $.extend({}, basopts, {
                    x: values.gsrFluxPExpP,
                    name: 'GAR Active flux and expression',
                    marker: {
                        color: 'rgba(243, 13, 13, .7)'
                    }
                });

                const trace2 = $.extend({}, basopts, {
                    x: values.gsrFluxMExpM,
                    name: 'GAR No flux or expression',
                    marker: {
                        color: 'rgba(99, 78, 58,.8)'
                    }
                });

                const trace3 = $.extend({}, basopts, {
                    x: values.gsrFluxMExpP,
                    name: 'GAR No flux, but active expression',
                    marker: {
                        color: 'rgba(173, 169, 86, .7)'
                    }
                });

                const trace4 = $.extend({}, basopts, {
                    x: values.gsrFluxPExpN,
                    name: 'Active flux, but no expression',
                    marker: {
                        color: 'rgba(64, 153, 62, .8)'
                    }
                });

                const trace5 = $.extend({}, basopts, {
                    x: values.gpRxnsFluxP,
                    name: 'Active gapfilled reactions',
                    marker: {
                        color: 'rgba(33, 150, 243, .8)'
                    }
                });

                const data = [trace1, trace2, trace3, trace4, trace5]

                const layout = {
                    title: 'Flux Balance Analysis Against Gene Expression',
                    barmode: 'stack',
                    margin: {
                       l: 350
                    },
                    height: 1000,
                    xaxis: {
                        title: 'Percent of each category',
                        titlefont: {
                            color: '#7f7f7f'
                        }
                    }
                };

                // add container
                const vizContainer = $('<div>').uniqueId();
                container.append(vizContainer);
                const id = vizContainer.attr('id');

                // render
                Plotly.newPlot(id, data, layout);

            }

            return this;
        },
    })

})
