

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
            minHeight : 300,
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

                var calculatedHeight = newDataset.column_labels.length * this.options.magicHeight;

                var heatHeight = Math.max(calculatedHeight, this.options.minHeight);

                var $heatElem = $.jqElem('div').css({width : 800, height : heatHeight});

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

                // can I whistle and dance while I work? I sure want to!
                //
                // Okay, here's what we gotta do. The clusters come back in some sort of arbitrary order, and they should be sorted into
                // ascending order. Meaning that Cluster_0 (which is really Cluster_1 after we re-name it down below) should always come first.
                // and then increase after that.
                //
                // But...
                // There isn't anything that directly connects cluster info to the rows. We have a label and a count. So the first thing we need to do
                // is invert the input data, because of course it comes in inverted. Then we can iterate over the resulting data structure and
                // peel them out in order and stuff 'em into a key based on their label. Then we'll sort by key and re-assemble the data.
                //
                // BUT WAIT THERE'S MORE!
                //
                // Some of the rows contain all null values. Which means they should be filtered out and not displayed.
                // Which in turn means that the cluster row counts need to be updated.
                //
                // Oh! And the labels need to be pruned.
                // And what's the relationship between label and row? That's right! The index alone! So the labels and rows need
                // to be more tightly linked before the pruning. Fun! Plus, the labels need to be sorted by the same technique.
                //
                // Oh oh oh! Which also means that a cluster could, in theory, be filtered out to not exist, which would screw up the numbering since
                // one in the middle would be skipped entirely and we'd go straight from Cluster_1 -> Cluster_3! I'm not going to deal with that edge
                // case until I am made to, though!
                //
                // http://dilbert.com/strip/2012-12-05

                var invertedData = [];
                for (var i = 0; i < newDataset.column_labels.length; i++) {
                    invertedData[i] = [];
                    for (var j = 0; j < newDataset.row_labels.length; j++) {
                        invertedData[i][j] = newDataset.data[j][i];
                    }
                }

                var rows_by_cluster = {};
                var groupStartIdx = 0;
                for (var i = 0; i < groupInfo.ygroup.length; i++) {
                  var label = groupInfo.ygtick_labels[i];
                  var count = groupInfo.ygroup[i];
                  var groupEndIdx = groupStartIdx + count;
                  if (rows_by_cluster[label] === undefined) {
                    rows_by_cluster[label] = { };
                  }

                  // side effects are the best! We need to filter out rows if they have only null values, but we also need
                  // to filter out the label associated with that row, which is in a different array and associated solely by index.
                  // So here we keep track of all of the indexes we've filtered out while iterating over the data, so we can use that
                  // to filter the sliced array of labels later.
                  var filteredIndexes = {};

                  //okay, now we slice out the rows associated with this cluster.
                  rows_by_cluster[label].data   = invertedData.slice(groupStartIdx, groupEndIdx)
                    .filter( function(r, i) {
                      //here's where we filter. We take a row and iterate through it, if all of the values are null it gets tossed.
                      var keep_this_row = r.reduce( function (keep_this_row, v) {
                        return keep_this_row || v !== null;
                      }, false);

                      if ( !keep_this_row ) {
                        filteredIndexes[i] = true;
                      }
                      return keep_this_row;
                    });

                  //peel out the appropriate subarray of labels, filtering out the indexes we removed up above.
                  rows_by_cluster[label].labels = newDataset.column_labels.slice(groupStartIdx, groupEndIdx)
                    .filter(function(l, i) { return ! filteredIndexes[i] });

                  //next group starts where ours left off
                  groupStartIdx = groupEndIdx;
                }

                // now we've built up lists of filtered rows, grouped by cluster. Next step is easy - we just sort
                // the cluster keys and stitch their related arrays back onto a bigger sorted list.
                //
                // This is where I'd love to use the spread syntax on the push, but since I wasn't sure our environment supported it
                // I went old school.
                var sortedRows   = [];
                var sortedLabels = [];
                Object.keys(rows_by_cluster).sort().forEach( function(label) {
                  var clusterRows = rows_by_cluster[label].data;
                  sortedRows.push.apply(sortedRows, clusterRows);

                  var clusterLabels = rows_by_cluster[label].labels;
                  sortedLabels.push.apply(sortedLabels, clusterLabels);
                });

                var heatmap_dataset = {
                    row_ids : sortedLabels,
                    column_ids : newDataset.row_labels,
                    row_labels : sortedLabels,
                    column_labels : newDataset.row_labels,
                    data : sortedRows,//invertedData,//newDataset.data,
                };

                this.data('heatmap').setDataset(
                  heatmap_dataset
                );


                //okay now do some extra BS to add in grouping.

                var chartBounds = $heatmap.chartBounds();

                //this one assumes that all genes will always be in the dataset. They will not be.
                //var total_groups = groupInfo.ygroup.reduce(function(p,v) { return p + v} );

                // the ygtick_labels which are returned from the server are wrong. They are indexed starting at 1, but we want them indexed
                // starting at 0. We're not going to update the server code because of reasons.

                // First thing we're going to do is a little bit of bounds checking and see if we actually need to decrement at all.

                var needs_decrement = Object.keys(rows_by_cluster).reduce( function(needs_it, label) {
                  if (label === 'Cluster_0') { needs_it = false };
                  return needs_it;
                }, true);

                var ygtick_labels = Object.keys(rows_by_cluster).sort().map( function(label) {
                  // yes, I know that I don't need to loop and map to nothing if needs_decrement is false.
                  // I'm mapping invalid data from the server anyway. I put in the bounds check at all.
                  // Let me have this little protest.
                  if (needs_decrement) {
                    label = label.replace(/(\d+)$/, function(m,d) { return d - 1 });
                  }
                  return label;
                });

                // it's a maxim in CS that side-effects are wonderful and should always be used as much as possible, right?
                // in this case, we need to find out the total number of groups. While we're iterating over our list of groups
                // to get each group's count, we just peel that off into a running total.
                var total_groups = 0;

                // Super. We've got our labels in sorted order. Now we peel out our new counts in sorted order.
                var ygroup = Object.keys(rows_by_cluster).sort().map( function(label) {
                  total_groups += rows_by_cluster[label].labels.length;
                  return rows_by_cluster[label].labels.length;
                });

                // finally, also just note that the "Results" tab of View Multi-Cluster Heatmap will, of course, still display the ygtick_labels
                // as they were originally generated on the server, and so will not be in sync with the data in the heatmap itself.

                var groups = $heatmap.D3svg().select( $heatmap.region('xPadding') ).selectAll('.groupBox').data(ygtick_labels);

                var groupsEnter = groups.enter().insert('g', ':first-child');

                var yIdxFunc =
                    function(d,i) {

                        var prior = 0;

                        for (var j = 0; j < i; j++) {
                            prior += ygroup[j];
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
                                return chartBounds.size.height * (ygroup[i] / total_groups);
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

                        var groupHeight = chartBounds.size.height * (ygroup[this.idx] / total_groups);

                        if (width > groupHeight && width > 60) {   //magic numbers abound in KBase!
                            this.tinySize = true;
                            return '9px';
                        }
                    });
                groups.selectAll('text')
                    .attr('transform',
                        function(d, i) {

                            var width = d3.select(this).node().getComputedTextLength();

                            var groupHeight = chartBounds.size.height * (ygroup[this.idx] / total_groups);

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
          var $self = this;
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
                }
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
