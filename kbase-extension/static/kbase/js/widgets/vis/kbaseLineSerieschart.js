/*

*/

define (
	[
		'kbwidget',
		'bootstrap',
		'jquery',
		'd3',
		'kbaseLinechart',
		'RGBColor',
		'geometry_rectangle',
		'geometry_point',
		'geometry_size'
	], (
		KBWidget,
		bootstrap,
		$,
		d3,
		kbaseLinechart,
		RGBColor,
		geometry_rectangle,
		geometry_point,
		geometry_size
	) => {

    return KBWidget({

	    name: "kbaseLineSerieschart",
	  parent : kbaseLinechart,

        version: "1.0.0",
        options: {

        },

        _accessors : [
            'labels',
        ],

        xTickValues : function() {

            const $ls = this;

            let m = d3.merge(
                this.dataset().map( (d) => {
                    return d.values.map((l) => { return l.x })
                } )
            );

            m = d3.set(m).values();

            return m;
        },

        xTickLabel : function(val) {
            if (this.labels() != undefined) {
                return this.labels()[val];
            }
            else {
                return val;
            }
        },
    });

} );
