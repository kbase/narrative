/*

*/

define (
	[
		'kbwidget',
		'bootstrap',
		'jquery',
		'd3',
		'kbaseVisWidget',
		'geometry_rectangle',
		'geometry_point',
		'geometry_size'
	], function(
		KBWidget,
		bootstrap,
		$,
		d3,
		kbaseVisWidget,
		geometry_rectangle,
		geometry_point,
		geometry_size
	) {

    return KBWidget({

	    name: "kbaseVisMatrix",
	  parent : kbaseVisWidget,

        version: "1.0.0",
        options: {

        },

        _accessors : [

        ],

        init : function init(options) {
            this._super(options);

            var $vis = this;

            if (this.options.matrix_class == undefined) {
                this.$elem.append(
                    $.jqElem('div')
                        .addClass('alert alert-danger')
                        .append('Cannot create vis matrix w/o matrix_class')
                );
            }
            else {
                require(this.options.matrix_class, function() {

                    var total_children = $vis.options.child_data.length;
                    var kids_per_row = Math.floor(Math.sqrt(total_children));

                    var bounds = $vis.chartBounds();

                    var childSize = new Size(bounds.size.width / kids_per_row, bounds.size.height / kids_per_row);

                    var row = 0;
                    var col = 0;

                    //$vis.$elem.empty();


                    for (var idx = 0; idx < $vis.options.child_data.length; idx++) {
                        var child_data = $vis.options.child_data[idx];

                        var childOptions = $.extend(
                            {},
                            $vis.options.childOptions,
                            child_data,
                            {
                                parent : $vis,
                                rootRegion : {
                                    translate : {
                                        x : col * childSize.width + $vis.options.xPadding,
                                        y : row * childSize.height + $vis.options.yGutter,
                                    },
                                    scale : { width : childSize.width / $vis.$elem.width(), height : childSize.height / $vis.$elem.height() }
                                    //scale : { width : childSize.width / bounds.size.width, height : childSize.height / bounds.size.height }
                                },
                            }
                        );

                        var $child1 = $.jqElem('div').css({width : $vis.$elem.width(), height : $vis.$elem.height()});
                        //$vis.$elem.append($child1);

                        $child1[$vis.options.matrix_class](
                            childOptions
                        );

                        if (++col % kids_per_row == 0) {
                            col = 0;
                            row++;
                        }
                    }

                });
            }

            return this;

        },


    });

} );
