/*

     new kbaseRNASeqPie($('#piechart'), {
            workspace : "name of workspace",

            output : "name of object"
            OR
            ws_alignment_sample_id : "name of object"
        }
    );

    The loaded object should have the following fields populated, with some sort of integer/floating point value:


    {
        mapped_reads            : 5,
        unmapped_reads          : 10,
        //total_reads is implied to be 15
        multiple_alignments     : 700,
        singletons              : 800,
        alignment_rate          : 900,

        //optional fields to expand mapped_reads
        exons                   : 1,
        splice_junctions        : 2,
        introns                 : 3,
        intergenic_regions      : 4
    }

*/

define (
	[
		'kbwidget',
		'bootstrap',
		'jquery',
		'colorbrewer',
		'd3',
		'kbasePiechart',
		'kbaseTable',
		'kbaseAuthenticatedWidget',
		'kbaseTabs'
	], function(
		KBWidget,
		bootstrap,
		$,
		colorbrewer,
		d3,
		kbasePiechart,
		kbaseTable,
		kbaseAuthenticatedWidget,
		kbaseTabs
	) {

    'use strict';

    return KBWidget({

	    name: "kbaseRNASeqPie",
	    parent : kbaseAuthenticatedWidget,

        version: "1.0.0",
        options: {
            pieWedges : ['mapped_reads', 'unmapped_reads'],
            overviewItems : ['total_reads', 'unmapped_reads', 'mapped_reads', 'multiple_alignments', 'singletons', 'alignment_rate'],
            mapped_reads_Wedges : ['exons', 'splice_junctions', 'introns', 'intergenic_regions'],
            gradients : [
                Array.prototype.slice.call(colorbrewer.Blues[9]).reverse(),
                Array.prototype.slice.call(colorbrewer.Oranges[9]).reverse(),
                Array.prototype.slice.call(colorbrewer.RdPu[9]).reverse(),
                Array.prototype.slice.call(colorbrewer.YlGn[9]).reverse()
            ],
            magicPieSize : 425,
            methodName : 'KBaseRNASeq/view_alignment_statistics',
        },

        value_for_wedge : function(val) {
            if ($.isPlainObject(val)) {
                var total = 0;
                for (var key in val) {
                    total += this.value_for_wedge(val[key]);
                }
                return total;
            }
            else {
                return val || 0;
            }
        },

        label_for_key : function(key, val) {
            var label = key.replace(/_/g, ' ');
                label = label.replace(/^([a-z])/, function up (l) { return       l.toUpperCase()});
                label = label.replace(/ ([a-z])/, function up (l) { return ' ' + l.toUpperCase()});

            if (val != undefined) {
                label = label + ' : ' + this.value_for_wedge(val);
            }

            return label;
        },

        _accessors : [
            {name: 'dataset', setter: 'setDataset'},
        ],

        keysForWedge : function keysForWedge(key, obj) {
            return this.options[key + '_Wedges'] || Object.keys(obj);
        },

        setDataset : function setDataset(newDataset) {

            var gradients = this.options.gradients;

            //hack to allow two separate keys - mapped_reads or mapped_sections.
            if (newDataset['mapped_sections'] != undefined) {
                newDataset['mapped_reads'] = newDataset['mapped_sections'];
            }

            this.setValueForKey('dataset', newDataset);

            newDataset['total_reads'] = this.value_for_wedge(newDataset['mapped_reads']) + this.value_for_wedge(newDataset['unmapped_reads']);

            if (this.data('container')) {

                this.data('container').removeTab('Overview');
                //this.data('container').removeTab('Pie chart');

                var $tableElem = $.jqElem('div');

                var keys = [];
                var overViewValues = {};
                for (var i = 0; i < this.options.overviewItems.length; i++) {

                    var key = this.options.overviewItems[i];

                    var value = this.value_for_wedge(newDataset[key]);

                    //skip all falsy values
                    if (!!value == false) {
                      continue;
                    }

                    keys.push( { value : key, label : this.label_for_key(key) } );
                    overViewValues[key] = value;

                    if ($.isPlainObject(newDataset[key])) {
                        for (var k in newDataset[key]) {
                            keys.push({value : k, label : '&nbsp;&nbsp;&nbsp;' + this.label_for_key(k)});
                            overViewValues[k] = newDataset[key][k];
                        }
                    }

                }

                var $table =  new kbaseTable($tableElem, {
                        structure : {
                            keys : keys,
                            rows : overViewValues
                        }

                    }
                );

                this.data('container').addTab(
                    {
                        tab : 'Overview',
                        content : $tableElem
                    }
                );


                //var $pieElem = $.jqElem('div').css({width : this.$elem.width(), height : this.$elem.height() * .9});
                var $pieElem = $.jqElem('div').css({width : this.options.magicPieSize * 1.5, height : this.options.magicPieSize * .9});

                var pieData = [];
                for (var i = 0; i < this.options.pieWedges.length; i++) {
                    var wedge = this.options.pieWedges[i];

                    if (newDataset[wedge] === undefined) {
                        continue;
                    }

                    pieData.push(
                        {
                            value   : this.value_for_wedge(newDataset[wedge]),
                            label   : this.label_for_key(wedge, newDataset[wedge]),
                            color   : gradients[i % gradients.length][1]
                        }
                    );
                }

                var minEdge = Math.min($pieElem.width(), $pieElem.height()) / 2 - 20;

                var $pie =  new kbasePiechart($pieElem, {
                        scaleAxes   : true,
                        useUniqueID : false,
                        gradient : true,
                        outsideLabels : true,
                        draggable : false,

                        dataset : pieData,

                        outerRadius : minEdge - 30,
                        tooltips : false,

                    }
                );

                var wedgeTotal = 0;
                var gIdx = 0;
                var donutData = [];
                var wedgeOffset = 0;

                for (var wIdx = 0; wIdx < this.options.pieWedges.length; wIdx++) {
                    wedgeTotal += this.value_for_wedge(newDataset[ this.options.pieWedges[wIdx] ]);
                }

                for (var wIdx = 0; wIdx < this.options.pieWedges.length; wIdx++) {

                    var wedge       = this.options.pieWedges[wIdx];
                    var wedgeValue  = this.value_for_wedge(newDataset[wedge]);

                    if ( $.isPlainObject(newDataset[wedge]) ) {

                        var idx = 0;

                        var wedgeConstant = 1 / wedgeTotal;

                        var grad = gradients[gIdx];

                        var wedge_keys = this.keysForWedge(wedge, newDataset[wedge]);

                        for (var wIdx = 0; wIdx < wedge_keys.length; wIdx++) {

                            var key = wedge_keys[wIdx];

                            if (newDataset[wedge][key] == 0) {
                                continue;
                            }

                            donutData.push(
                                {
                                    value : newDataset[wedge][key] * wedgeConstant,
                                    label : this.label_for_key(key, newDataset[wedge][key]),
                                    color : grad[idx++]
                                }
                            );
                        }

                    }
                    else {
                        wedgeOffset += wedgeValue;
                        donutData.push(
                            {
                                value   : wedgeValue / wedgeTotal,
                                label   : '',
                                color   : 'white',
                                gap     : true,
                            }
                        )
                    }

                    gIdx = ++gIdx % gradients.length;

                }


                if (donutData.length) {
                    var $donut =  new kbasePiechart($.jqElem('div'), {
                            parent : $pie,
                            dataset : donutData,
                            innerRadius : $pie.outerRadius(),
                            outerRadius : $pie.outerRadius() + 30,
                            outsideLabels : true,
                            autoEndAngle : true,
                            draggable : false,
                            tooltips : false,
                        }
                    );
                }

                /*this.data('container').addTab(
                    {
                        tab : 'Pie chart',
                        content : $pieElem
                    }
                );*/

                this.data('container').showTab('Overview');

            }
        },



        init : function init(options) {

            var $pie = this;

            this._super(options);

            if (this.options.dataset) {
                this.setDataset(this.options.dataset);
            }
            else {

                var ws = new Workspace(window.kbconfig.urls.workspace, {token : $pie.authToken()});

                var ws_key = 'workspace';
                var ws_id_key = undefined;
                var obj_key = 'output';

                var ws_params = {
                    workspace : $pie.options[ws_key] || $pie.options.workspaceName,
                    name : $pie.options[obj_key] || $pie.options.ws_alignment_sample_id,
                };

                ws.get_objects([ws_params]).then(function (d) {
                    $pie.setDataset(d[0].data);
                })
                .fail(function(d) {

                    $pie.$elem.empty();
                    $pie.$elem
                        .addClass('alert alert-danger')
                        .html("Could not load object : " + d.error.message);
                })
            }



            this.appendUI(this.$elem);

            return this
        },

        appendUI : function appendUI($elem) {

            var $rnaseq = this;

            var $containerElem = $.jqElem('div').attr('id', 'containerElem');

            var $container =  new kbaseTabs($containerElem, {
                    tabs : [
                        {
                            tab : 'Overview',
                            content : 'Loading...'
                        },
                        /*{
                            tab : 'Pie chart',
                            content : 'Loading...'
                        }*/
                    ]
                }
            )

            this._rewireIds($containerElem, this);
            this.data('container', $container);

            $elem.append($containerElem);

        },

    });

} );
