

define (
	[
		'kbwidget',
		'bootstrap',
		'jquery',
		'kbaseAuthenticatedWidget',
		'kbaseHeatmap'
	], function(
		KBWidget,
		bootstrap,
		$,
		kbaseAuthenticatedWidget,
		kbaseHeatmap
	) {

    'use strict';

    return KBWidget({

	    name: "kbaseFigureObjectHeatmap",
	    parent : kbaseAuthenticatedWidget,

        version: "1.0.0",
        options: {
            numBins : 10,
            magicHeight : 10,
        },

        _accessors : [
            {name: 'dataset', setter: 'setDataset'},
            {name: 'barchartDataset', setter: 'setBarchartDataset'},
        ],

        transpose : function transpose(arr,arrLen) {
          for (var i = 0; i < arrLen; i++) {
            for (var j = 0; j <i; j++) {
              //swap element[i,j] and element[j,i]
              var temp = arr[i][j];
              arr[i][j] = arr[j][i];
              arr[j][i] = temp;
            }
          }
        },

        setDataset : function setDataset(newDataset, groupInfo) {

            var $self = this;

            this.data('loader').hide();

            if (newDataset.data.length == 0) {
                this.$elem.empty();
                this.$elem
                    .addClass('alert alert-danger')
                    .html("Empty heatmap");
            }
            else {

                var $heatElem = $.jqElem('div').css({width : 800, height : newDataset.column_labels.length * this.options.magicHeight});

                var $heatmap =
                     new kbaseHeatmap($heatElem, {
                            colors : ['#0000FF', '#FFFFFF', '#FF0000'],
                            xPadding : 170,
                        }
                    )
                ;
                this.data('heatmap', $heatmap);
                this.data('heatElem', $heatElem);

                this.$elem.append($heatElem);

                var invertedData = [];
                for (var i = 0; i < newDataset.column_labels.length; i++) {
                    invertedData[i] = [];
                    for (var j = 0; j < newDataset.row_labels.length; j++) {
                        invertedData[i][j] = newDataset.data[j][i];
                    }
                }

                this.data('heatmap').setDataset(
                    {
                        row_ids : newDataset.column_labels,
                        column_ids : newDataset.row_labels,
                        row_labels : newDataset.column_labels,
                        column_labels : newDataset.row_labels,
                        data : invertedData,//newDataset.data,
                    }
                );


                //okay now do some extra BS to add in grouping.

                var chartBounds = $heatmap.chartBounds();

//groupInfo.ygtick_labels = ['zero', 'alpha', 'bravo', 'charlie'];
//groupInfo.ygroup = [20,100,100,80];

                //this one assumes that all genes will always be in the dataset. They will not be.
                //var total_groups = groupInfo.ygroup.reduce(function(p,v) { return p + v} );

                //so, instead, we assign the total_groups to the length of the first row. Somewhat arbitrarily.
                var total_groups = newDataset.data[0].length;

                var groups = $heatmap.D3svg().select( $heatmap.region('xPadding') ).selectAll('.groupBox').data(groupInfo.ygtick_labels);

                var groupsEnter = groups.enter().insert('g', ':first-child');

                var yIdxFunc =
                    function(d,i) {

                        var prior = 0;

                        for (var j = 0; j < i; j++) {
                            prior += groupInfo.ygroup[j];
                        }
                        return chartBounds.size.height * (prior / total_groups);
                    }
                ;

                groupsEnter
                    .append('rect')
                        .attr('x', 0)
                        .attr('y', yIdxFunc )
                        .attr('width', $heatmap.xPaddingBounds().size.width)
                        .attr('height',
                            function (d, i) {
                                return chartBounds.size.height * (groupInfo.ygroup[i] / total_groups);
                            }
                        )
                        .attr('stroke', 'black')
                        .attr('fill', function (d, i) {return i % 2 ? '#EEEEEE' : 'none'} )
                        .attr('stroke-width', '.5px')
                        .attr('opacity',
                            function(d,i) {
                                var y = yIdxFunc(d,i);

                                return y < chartBounds.size.height
                                    ? 1
                                    : 0;
                            }
                        )
                ;
                groupsEnter
                    .append('text')
                        .attr('x', 0)
                        .attr('y', 0)
                        .text(function (d,i) { this.idx = i; return d })
                        .attr('opacity',
                            function(d,i) {
                                var y = yIdxFunc(d,i);

                                return y < chartBounds.size.height
                                    ? 1
                                    : 0;
                            }
                        )
                ;

                //gotta transform it after it's been inserted. Fun.
                //first thing we do is select the text, get the size, and see if it's > 60. If it is, then it wouldn't fit horizontally,
                //so we need to decrease its size. That way, in the next step when we select for the transform, we can properly place it.
                groups.selectAll('text')
                    .attr('font-size', function(d, i) {
                        var width = d3.select(this).node().getComputedTextLength();

                        var groupHeight = chartBounds.size.height * (groupInfo.ygroup[this.idx] / total_groups);

                        if (width > groupHeight && width > 60) {   //magic numbers abound in KBase!
                            this.tinySize = true;
                            return '9px';
                        }
                    });
                groups.selectAll('text')
                    .attr('transform',
                        function(d, i) {

                            var width = d3.select(this).node().getComputedTextLength();

                            var groupHeight = chartBounds.size.height * (groupInfo.ygroup[this.idx] / total_groups);

                            if (width < groupHeight) {

                                var vOffset = -2 - width;

                                if (this.idx > 0) {
                                    vOffset -= yIdxFunc(d,this.idx);
                                }


                                var hOffset = 12;//this.idx % 2 ? 30 : 12;
                                this.v = true;
                                return 'rotate(270) translate(' + vOffset + ',' + hOffset + ')'
                            }
                            else {
                                var box = this.getBBox();
                                vOffset = box.height + yIdxFunc(d,this.idx) + 1;
                                this.h = true;

                                if (this.tinySize) {
                                    vOffset -= 2;
                                }

                                return 'translate(1,' + vOffset + ')';
                            }
                        }
                    )
                    .each(function(d,i) {
                        var box = this.getBBox();
                        //magic width number! Ooo!
                        if (this.h && box.width > 70) {
                            var label = d3.select(this).text();
                            if (label.length > 10) {
                                d3.select(this).text(label.substring(0,7) + '...');
                                d3.select(this)
                                    .on('mouseover', function(d) {
                                        d3.select(this).attr('fill', $self.options.overColor);
                                        $self.data('heatmap').showToolTip(
                                            {
                                                label : label
                                            }
                                        );
                                    })
                                    .on('mouseout', function(d) {
                                        d3.select(this).attr('fill', 'black');
                                        $self.data('heatmap').hideToolTip();
                                    })
                            }
                        }
                    })

            }


        },

        load_data_ref : function(ws, dataset) {
          ws.get_objects([{ref : dataset.data_ref}]).then(function(b) {

              $self.setDataset(b[0].data, dataset);

          });
        },

        init : function init(options) {

            this._super(options);

            var $self = this;

            this.appendUI(this.$elem);

            var ws = new Workspace(window.kbconfig.urls.workspace, {token : $self.authToken()});
            //var ws = new Workspace('https://ci.kbase.us/services/ws', {token : $self.authToken()});

            var ws_params = {
                workspace : this.options.workspace,
                name : this.options.expression_object
            };

            ws.get_objects([ws_params]).then(function (d) {

                if (d[0].data.figure_obj) {
                  ws.get_objects([{ref : d[0].data.figure_obj}]).then(function(d) {
                    $self.load_data_ref(ws, d[0].data);
                  });
                }
                else {
                    $self.load_data_ref(ws, d[0].data);
                });
            }).fail(function(d) {

                $self.$elem.empty();
                $self.$elem
                    .addClass('alert alert-danger')
                    .html("Could not load object : " + d.error.message);
            })

            return this;
        },

        appendUI : function appendUI($elem) {

            var $me = this;


            $elem
                .append(
                    $.jqElem('div')
                        .attr('id', 'loader')
                        .append('<br>&nbsp;Loading data...<br>&nbsp;please wait...')
                        .append($.jqElem('br'))
                        .append(
                            $.jqElem('div')
                                .attr('align', 'center')
                                .append($.jqElem('i').addClass('fa fa-spinner').addClass('fa fa-spin fa fa-4x'))
                        )
                )
            ;


            this._rewireIds($elem, this);

        },

    });

} );
